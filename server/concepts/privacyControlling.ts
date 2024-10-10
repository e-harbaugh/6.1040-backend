import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotFoundError } from "./errors";

export interface PrivacyAttributeDoc extends BaseDoc {
  thing: ObjectId;
  attributeName: string;
}

export interface AtrributeValueDoc extends BaseDoc {
  privacyAttribute: ObjectId;
  value: string;
}

/**
 * concept: privacyControlling [User]
 */
export default class PrivacyControllingConcept {
  public readonly privacyAttributes: DocCollection<PrivacyAttributeDoc>;
  public readonly attributeValues: DocCollection<AtrributeValueDoc>;

  /**
   * Make an instance of Friending.
   */
  constructor(collectionName: string) {
    this.privacyAttributes = new DocCollection<PrivacyAttributeDoc>(collectionName);
    this.attributeValues = new DocCollection<AtrributeValueDoc>(collectionName);
  }

  async createAttribute(thing: ObjectId, attributeName: string) {
    const _id = await this.privacyAttributes.createOne({ thing, attributeName });
    return { msg: "Attribute Created!", attribute: await this.privacyAttributes.readOne({ _id }) };
  }

  async assignAttribute(thing: ObjectId, attributeName: string, value: string) {
    const attribute = await this.privacyAttributes.readOne({ thing: thing, attributeName });
    if (attribute == null) {
      throw new NotFoundError(attributeName);
    }
    const oid = attribute._id;
    await this.attributeValues.createOne({ privacyAttribute: oid, value });
    return { msg: "Attribute Assigned!" };
  }

  async valueSatisfies(thing: ObjectId, attributeName: string, value: string) {
    const attribute = await this.privacyAttributes.readOne({ thing, attributeName });
    if (attribute == null) {
      throw new NotFoundError(attributeName);
    }
    const oid = attribute._id;
    const curAttributeValues = await this.attributeValues.readMany({ privacyAttribute: oid });
    let found = false;
    for (let i = 0; i < curAttributeValues.length; i++) {
      if (value === curAttributeValues[i].value) {
        found = true;
      }
    }
    return { msg: "Values Checked!", satisfies: found };
  }

  async deleteAttribute(thing: ObjectId, attributeName: string) {
    await this.privacyAttributes.deleteOne({ thing, attributeName });
    return { msg: "Attribute Deleted!" };
  }

  async getAttributes(thing: ObjectId) {
    const attributes = await this.privacyAttributes.readMany({ thing });
    return { msg: "Attributes Queried", attributes: attributes };
  }

  async getAttributeValues(thing: ObjectId, attributeName: string) {
    const attribute = await this.privacyAttributes.readOne({ thing, attributeName });
    if (attribute == null) {
      throw new NotFoundError(attributeName);
    }
    const oid = attribute._id;
    const attributeValues = await this.attributeValues.readMany({ privacyAttribute: oid });
    return { msg: "attributes Queried!", attributeValues: attributeValues };
  }
}
