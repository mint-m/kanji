import { Document, Model } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserModel extends Model<IUser> {}

export default IUserModel;
