import dotenv from 'dotenv';
dotenv.config();

// 필수 환경변수 목록
const REQUIRED_ENV_VARS = [
  'MONGO_URI',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',
  'JWT_SECRET',
] as const;

// 서버 시작 시 환경변수 일괄 검증
export const validateEnv = (): void => {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ 필수 환경변수 누락:');
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error('\n.env 파일을 확인하세요.');
    process.exit(1);
  }
};

export default {
  MONGO_URI: process.env.MONGO_URI as string,
  PORT: process.env.PORT || '8000',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_EXPIRY: process.env.JWT_EXPIRY || '1d',
  KAKAO_REST_API_KEY: process.env.KAKAO_REST_API_KEY as string,
};
