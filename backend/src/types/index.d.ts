import { UserDocument } from "../interfaces/user";
declare module 'passport' {
  interface Authenticator {
    serializeUser<TID>(fn: (user: UserDocument, done: (err: any, id?: TID) => void) => void): void;
  }
}