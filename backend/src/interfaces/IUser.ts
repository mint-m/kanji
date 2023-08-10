import { Document, Model } from 'mongoose';

export interface IUser extends Document {
  type: 'google' | 'kakao' | 'local',
  email: string,
  name: string,
  learningCheckpoint: { level: number, step: number },
}

export interface IUserModel extends Model<IUser> { }

export default IUserModel;
