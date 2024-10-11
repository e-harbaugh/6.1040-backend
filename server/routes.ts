import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Authing, Friending, Posting, PrivacyControlling, Relationshipping, Replying, Sessioning } from "./app";
import { PostOptions } from "./concepts/posting";
import { SessionDoc } from "./concepts/sessioning";
import Responses from "./responses";

import { z } from "zod";
import { RelationshipDoc } from "./concepts/relationshipping";

/**
 * Web server routes for the app. Implements synchronizations between concepts.
 */
class Routes {
  // Synchronize the concepts from `app.ts`.
  @Router.post("/users/relations")
  async createRelationship(session: SessionDoc, name: string) {
    const user = Sessioning.getUser(session);
    const created = await Relationshipping.createRelationship(user, name);
    return { msg: created.msg, get: created.relation };
  }
  @Router.get("/users/relations")
  async getRelationships(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    const relations = await Relationshipping.getRelationships(user);
    return { msg: relations.msg, get: relations.relations };
  }
  @Router.delete("/users/relations")
  async deleteRelationship(session: SessionDoc, relationship: string) {
    const user = Sessioning.getUser(session);
    const msg = await Relationshipping.deleteRelationship(user, relationship);
    return { msg: msg.msg };
  }
  @Router.post("/users/relations/:relation")
  async relate(session: SessionDoc, target: string, relation: string) {
    const user = Sessioning.getUser(session);
    const target_id = (await Authing.getUserByUsername(target))._id;
    const created = await Relationshipping.relate(user, target_id, relation);
    return { msg: created.msg };
  }
  @Router.get("/users/relations/:relation")
  async getRelatedUsers(session: SessionDoc, relation: string) {
    const user = Sessioning.getUser(session);
    const relations = await Relationshipping.getRelatedUsers(user, relation);
    return { msg: relations.msg, get: relations.relatedUsers };
  }
  @Router.delete("/users/relations/:relation")
  async unrelate(session: SessionDoc, target: string, relation: string) {
    const user = Sessioning.getUser(session);
    const target_id = (await Authing.getUserByUsername(target))._id;
    const msg = await Relationshipping.unrelate(user, target_id, relation);
    return { msg: msg.msg };
  }
  @Router.post("/posts/:id/replies")
  async reply(session: SessionDoc, id: string, content: string, isImage?: boolean) {
    //We need to check if the user is allowed to post a reply by the poster's settings
    this.checkRelationPermission(session, id, "reply");

    //Now Start Reply
    const post = await Posting.getPostByID(id);
    const replyMsg = await Replying.createReply(content, isImage);
    const msg = await Replying.assignReply(post.post._id, replyMsg.reply_id);
    return { msg: msg.msg };
  }
  @Router.get("/posts/:id/replies")
  async getReplies(session: SessionDoc, id: string) {
    //We need to check if the user is allowed to by the poster's settings
    this.checkRelationPermission(session, id, "readReplies");

    //Now Start Reply
    const replies = await Replying.getReplyByObject(new ObjectId(id));
    return { msg: replies.msg, replies: replies.replies };
  }
  @Router.delete("/posts/:id/replies/:replyid")
  async deleteReply(session: SessionDoc, id: string, replyid: string) {
    //Here the settings actually depend on the reply's permissions
    this.checkRelationPermission(session, replyid, "delete");
  }
  @Router.post("/posts/:id/collaborators")
  @Router.get("/posts/:id/collaborators")
  @Router.delete("/posts/:id/collaborators")
  @Router.post("/users/:username/invites")
  @Router.get("/users/:username/invites")
  @Router.delete("/users/:username/invites")
  @Router.post("/communities")
  @Router.get("/communities")
  @Router.delete("/communities")
  @Router.post("/communities/users")
  @Router.get("/communities/users")
  @Router.delete("/communities/users")
  @Router.get("/session")
  async getSessionUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await Authing.getUsers();
  }

  @Router.get("/users/:username")
  @Router.validate(z.object({ username: z.string().min(1) }))
  async getUser(username: string) {
    return await Authing.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: SessionDoc, username: string, password: string) {
    Sessioning.isLoggedOut(session);
    return await Authing.create(username, password);
  }

  @Router.patch("/users/username")
  async updateUsername(session: SessionDoc, username: string) {
    const user = Sessioning.getUser(session);
    return await Authing.updateUsername(user, username);
  }

  @Router.patch("/users/password")
  async updatePassword(session: SessionDoc, currentPassword: string, newPassword: string) {
    const user = Sessioning.getUser(session);
    return Authing.updatePassword(user, currentPassword, newPassword);
  }

  @Router.delete("/users")
  async deleteUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    Sessioning.end(session);
    return await Authing.delete(user);
  }

  @Router.post("/login")
  async logIn(session: SessionDoc, username: string, password: string) {
    const u = await Authing.authenticate(username, password);
    Sessioning.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: SessionDoc) {
    Sessioning.end(session);
    return { msg: "Logged out!" };
  }

  @Router.get("/posts")
  @Router.validate(z.object({ author: z.string().optional() }))
  async getPosts(author?: string) {
    let posts;
    if (author) {
      const id = (await Authing.getUserByUsername(author))._id;
      posts = await Posting.getByAuthor(id);
    } else {
      posts = await Posting.getPosts();
    }
    return Responses.posts(posts);
  }

  @Router.post("/posts")
  async createPost(session: SessionDoc, content: string, options?: PostOptions) {
    const user = Sessioning.getUser(session);
    const created = await Posting.create(user, content, options);
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/posts/:id")
  async updatePost(session: SessionDoc, id: string, content?: string, options?: PostOptions) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertAuthorIsUser(oid, user);
    return await Posting.update(oid, content, options);
  }

  @Router.delete("/posts/:id")
  async deletePost(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertAuthorIsUser(oid, user);
    return Posting.delete(oid);
  }

  @Router.get("/friends")
  async getFriends(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.idsToUsernames(await Friending.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: SessionDoc, friend: string) {
    const user = Sessioning.getUser(session);
    const friendOid = (await Authing.getUserByUsername(friend))._id;
    return await Friending.removeFriend(user, friendOid);
  }

  @Router.get("/friend/requests")
  async getRequests(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Responses.friendRequests(await Friending.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: SessionDoc, to: string) {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    return await Friending.sendRequest(user, toOid);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: SessionDoc, to: string) {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    return await Friending.removeRequest(user, toOid);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: SessionDoc, from: string) {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    return await Friending.acceptRequest(fromOid, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: SessionDoc, from: string) {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    return await Friending.rejectRequest(fromOid, user);
  }

  async checkRelationPermission(session: SessionDoc, object_id: string, checkPrivacyAttribute: string) {
    const user = Sessioning.getUser(session);
    const post = await Posting.getPostByID(object_id);
    const poster = post.post.author;
    const relations = await Relationshipping.getRelationship(poster, user);
    const relationNames = relations.relations.map((x: RelationshipDoc) => x.relationName);
    PrivacyControlling.assertAnyValueSatisfies(post.post._id, checkPrivacyAttribute, relationNames);
  }
}

/** The web app. */
export const app = new Routes();

/** The Express router. */
export const appRouter = getExpressRouter(app);
