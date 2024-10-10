import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotFoundError } from "./errors";

export interface CommunityDoc extends BaseDoc {
  communityName: string;
}

export interface CommunityPostsDoc extends BaseDoc {
  community: ObjectId;
  post: ObjectId;
}

/**
 * concept: Content Communitying [Object]
 */
export default class ContentCommunityingConcept {
  public readonly communities: DocCollection<CommunityDoc>;
  public readonly communityPosts: DocCollection<CommunityPostsDoc>;

  /**
   * Make an instance of Friending.
   */
  constructor(collectionName: string) {
    this.communities = new DocCollection<CommunityDoc>(collectionName);
    this.communityPosts = new DocCollection<CommunityPostsDoc>(collectionName);
  }

  async createCommunity(thing: ObjectId, communityName: string) {
    const _id = await this.communities.createOne({ communityName });
    return { msg: "community Created!", community: await this.communities.readOne({ _id }) };
  }

  async addPost(communityName: string, post: ObjectId) {
    const community = await this.communities.readOne({ communityName });
    if (community == null) {
      throw new NotFoundError(communityName);
    }
    const oid = community._id;
    await this.communityPosts.createOne({ community: oid, post: post });
    return { msg: "Posted to community!" };
  }

  async deleteCommunity(communityName: string) {
    await this.communities.deleteOne({ communityName });
    return { msg: "Community Deleted!" };
  }

  async deletePost(communityName: string, post: ObjectId) {
    await this.communityPosts.deleteOne({ communityName, post });
    return { msg: "Post Deleted!" };
  }

  async getCommunities() {
    const communitys = await this.communities.readMany({});
    return { msg: "communitys Queried", communitys: communitys };
  }

  async getCommunityPosts(communityName: string) {
    const community = await this.communities.readOne({ communityName });
    if (community == null) {
      throw new NotFoundError(communityName);
    }
    const oid = community._id;
    const communityPosts = await this.communityPosts.readMany({ community: oid });
    return { msg: "communitys Queried!", communityPosts: communityPosts };
  }
}
