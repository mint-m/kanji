import mongoose from "mongoose";
import { UserDocument, UserModel } from "../interfaces/user";

const UserSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: false },
    learningCheckpoint: { type: Object, required: false },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model<UserDocument, UserModel>("User", UserSchema, "user");

export default User;