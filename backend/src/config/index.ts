import dotenv from 'dotenv';
dotenv.config();

export default {
  MONGO_URI: process.env.MONGO_URI,
  PORT: process.env.PORT,
  SESSION_SECRET: process.env.SESSION_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRY: process.env.JWT_EXPIRY || '1d',
};
