// src/services/auth.ts
import jwt, { Secret } from "jsonwebtoken";
import { UserDocument } from "../interfaces/user";
import config from "../config";

const { JWT_SECRET, JWT_EXPIRY } = config;

// 기본 만료 시간 설정 (1일)
const DEFAULT_EXPIRY = "1d";

// JWT 토큰 생성
export const generateToken = (user: UserDocument): string => {
  const payload = {
    userId: user._id,
    email: user.email,
    type: user.type
  };

  return jwt.sign(
    payload, 
    JWT_SECRET as Secret, 
    { expiresIn: JWT_EXPIRY || DEFAULT_EXPIRY }
  );
};

// JWT 토큰 검증 (추가 기능으로 사용 가능)
export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET as Secret);
};