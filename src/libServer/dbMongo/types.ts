import { ObjectId } from 'mongodb';

export class MongoSpecialPropsClass {
  _id?: ObjectId;
  __v?: any;
  createdAt?: Date;
  updatedAt?: Date;
}
