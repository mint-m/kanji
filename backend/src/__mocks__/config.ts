export const validateEnv = jest.fn();

export default {
  MONGO_URI: 'mongodb://localhost/test',
  PORT: '8000',
  SESSION_SECRET: 'test-secret',
  GOOGLE_CLIENT_ID: 'test-google-client-id',
  GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
  GOOGLE_REDIRECT_URI: 'http://localhost:4200/auth/google/callback',
  JWT_SECRET: 'test-jwt-secret',
  JWT_EXPIRY: '1d',
  KAKAO_REST_API_KEY: 'test-kakao-key',
};
