import mongoose from 'mongoose';
import { IUser } from '../interfaces/IUser';

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

UserSchema.methods.comparePassword = function(inputPassword: string, cb: any) {
    if (inputPassword === this.password) {
      cb(null, true);
    } else {
      cb('error');
    }
  };

const User = mongoose.model<IUser>('User', UserSchema, 'user');

export default User;
