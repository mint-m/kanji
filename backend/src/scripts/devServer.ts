/**
 * 로컬 개발 서버 — 메모리 MongoDB + 샘플 단어
 * 사용법: yarn dev:memory   (루트에서 프론트까지 함께: yarn start:memory)
 *
 * 운영 Atlas에 접속하지 않고 백엔드 전체를 띄운다. .env의 MONGO_URI는 쓰지 않으며, 종료하면 데이터도 사라진다.
 * .env에 Google·카카오 키가 있으면 로그인도 그대로 동작하고(사용자는 메모리 DB에 생긴다),
 * 키가 없어도 시작 시 출력되는 개발용 토큰으로 바로 로그인할 수 있다.
 */
import dotenv from 'dotenv';
import path from 'path';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// validateEnv 대상이지만 로컬에서는 값이 없어도 되는 항목
const DEV_DEFAULTS: Record<string, string> = {
  JWT_SECRET: 'local-dev-secret',
  GOOGLE_CLIENT_ID: 'local-dev',
  GOOGLE_CLIENT_SECRET: 'local-dev',
  GOOGLE_REDIRECT_URI: 'http://localhost:4200/auth/google/callback',
};

async function main() {
  const mongo = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongo.getUri('kanji');
  for (const [key, value] of Object.entries(DEV_DEFAULTS)) process.env[key] ||= value;

  // config가 import 시점에 env를 읽으므로 env를 채운 뒤에 앱을 불러온다
  const { default: mongoose } = await import('mongoose');
  const { default: app } = await import('../app');
  const { default: Word } = await import('../models/word');
  const { default: User } = await import('../models/user');
  const { generateToken } = await import('../services/auth');
  const { SAMPLE_WORDS } = await import('./sampleWords');

  await mongoose.connect(process.env.MONGO_URI);
  await Word.insertMany(SAMPLE_WORDS);
  const user = await User.create({
    type: 'google',
    email: 'dev@kanji.local',
    name: '개발자',
    authProviders: [{ provider: 'google', providerId: 'local-dev' }],
    emailVerified: true,
  });
  const storedUser = { _id: user._id, email: user.email, name: user.name, type: user.type, activeProgressType: null, authProviders: ['google'] };
  const login = `localStorage.setItem('token', '${generateToken(user)}'); localStorage.setItem('user', '${JSON.stringify(storedUser)}'); location.reload();`;

  const port = Number(process.env.PORT) || 8000;
  app.listen(port, () => {
    console.log(`\n메모리 MongoDB로 API 실행 중: http://localhost:${port} (샘플 단어 ${SAMPLE_WORDS.length}개 — N5 1~10스텝, daily 1~3스텝)`);
    console.log('개발용 로그인 — http://localhost:4200 의 브라우저 콘솔에 붙여넣기:\n');
    console.log(`${login}\n`);
  });

  const shutdown = async () => {
    await mongoose.disconnect();
    await mongo.stop();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
