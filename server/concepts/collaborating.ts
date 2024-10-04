import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotFoundError } from "./errors";

export interface CollaborateDoc extends BaseDoc {
  object: ObjectId;
  user: ObjectId;
}

/**
 * concept: Collaborating [Object]
 */
export default class CollaboratingConcept {
  public readonly collaborations: DocCollection<CollaborateDoc>;

  /**
   * Make an instance of Collaborating.
   */
  constructor(collectionName: string) {
    this.collaborations = new DocCollection<CollaborateDoc>(collectionName);
  }

  async addColab(user: ObjectId, object: ObjectId) {
    const _id = await this.collaborations.createOne({ user, object });
    return { msg: "User added to colab!", colab: await this.collaborations.readOne({ _id }) };
  }

  async removeColab(user: ObjectId, object: ObjectId) {
    const colab = await this.collaborations.readOne({ user: user, object: object });
    if (colab == null) {
      throw new NotFoundError(`Collaboration for ${user} does not exist!`);
    }
    const _id = colab._id;
    await this.collaborations.deleteOne({ _id });
    return { msg: "Colab removed successfully!" };
  }

  async checkColab(user: ObjectId, object: ObjectId) {
    const colab = await this.collaborations.readOne({ reciever: user, object: object });
    if (colab == null) {
      return false;
    }
    return true;
  }
}
