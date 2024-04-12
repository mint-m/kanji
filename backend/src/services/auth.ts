import jwt from 'jsonwebtoken';
import { IUser } from '../interfaces/IUser';

const JWT_SECRET = process.env.JWT_SECRET!;

export const generateToken = (user: IUser): string => {
  return jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '4h' });
};

// 추후 개발 필요
export const refreshToken = (token: string) => {
};

export const verifyToken = (token: string): string | object => {
  return jwt.verify(token, JWT_SECRET);
};
