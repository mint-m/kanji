import { IUser } from "../interfaces/IUser";
declare module 'passport' {
  interface Authenticator {
    serializeUser<TID>(fn: (user: IUser, done: (err: any, id?: TID) => void) => void): void;
  }
}