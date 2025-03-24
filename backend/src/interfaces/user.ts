import { Document, Model } from 'mongoose';

// 사용자 인증 타입
export type UserAuthType = 'google' | 'kakao' | 'local';

// 사용자 학습 체크포인트 인터페이스
export interface LearningCheckpoint {
  level: number;
  step: number;
}

// 사용자 문서 인터페이스
export interface UserDocument extends Document {
  type: UserAuthType;
  _id: string;
  email: string;
  name: string;
  learningCheckpoint: LearningCheckpoint;
}

// 사용자 모델 인터페이스
export interface UserModel extends Model<UserDocument> { }

export default UserModel;