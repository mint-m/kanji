import jwt from 'jsonwebtoken';
import { IUser } from '../interfaces/IUser';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret';

export const generateToken = (user: IUser): string => {
  return jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '4h' });
};

export const verifyToken = (token: string): string | object => {
  return jwt.verify(token, JWT_SECRET);
};
