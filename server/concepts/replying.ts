import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotFoundError } from "./errors";

export interface ReplyDoc extends BaseDoc {
  content: string;
  isImage: boolean;
}

export interface ObjectRepliesDoc extends BaseDoc {
  object: ObjectId;
  reply: ObjectId;
}

/**
 * concept: Replying [Object]
 */
export default class ReplyingConcept {
  public readonly replies: DocCollection<ReplyDoc>;
  public readonly objectReplies: DocCollection<ObjectRepliesDoc>;

  /**
   * Make an instance of Friending.
   */
  constructor(collectionName: string) {
    this.replies = new DocCollection<ReplyDoc>(collectionName);
    this.objectReplies = new DocCollection<ObjectRepliesDoc>(collectionName);
  }

  async createReply(content: string, isImage = false) {
    const _id = await this.replies.createOne({ content, isImage });
    return { msg: "Reply Created!", attribute: await this.replies.readOne({ _id }) };
  }

  async deleteReply(reply: ObjectId) {
    await this.replies.deleteOne({ reply });
    return { msg: "Reply Deleted!" };
  }

  async assignReply(object: ObjectId, reply: ObjectId) {
    const postReply = await this.replies.readOne({ reply });
    if (postReply == null) {
      throw new NotFoundError(reply.toString());
    }
    await this.objectReplies.createOne({ object: object, reply: reply });
    return { msg: "Reply Assigned!" };
  }

  async removeReply(object: ObjectId, reply: ObjectId) {
    await this.objectReplies.deleteOne({ object: object, reply: reply });
    return { msg: "Reply Deleted!" };
  }
}
