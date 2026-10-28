// 라우트 검증 레이어 테스트: 프론트가 실제로 보내는 쿼리가 express-validator를 통과하는지 확인한다
const MockWordProgress = { aggregate: jest.fn().mockResolvedValue([]) };

jest.mock('../models/wordProgress', () => ({ __esModule: true, default: MockWordProgress }));

import http from 'http';
import { AddressInfo } from 'net';
import express from 'express';
import bookmarkRoutes from '../routes/bookmarkRoutes';
import { BOOKMARK_LIMIT } from '../controllers/bookmarkController';

let server: http.Server;
let baseUrl: string;

beforeAll((done) => {
  const app = express();
  // 인증은 상위 라우터(userRoutes)에서 적용되므로 여기서는 사용자만 주입
  app.use((req, _res, next) => {
    req.user = { _id: 'user-id-123' as any, email: 'test@example.com', name: 'tester', type: 'google' };
    next();
  });
  app.use('/', bookmarkRoutes);
  server = app.listen(0, () => {
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    done();
  });
});

afterAll((done) => {
  server.close(done);
});

const getStatus = (path: string) =>
  new Promise<number>((resolve, reject) => {
    http
      .get(`${baseUrl}${path}`, (res) => {
        res.resume();
        resolve(res.statusCode ?? 0);
      })
      .on('error', reject);
  });

describe('GET /bookmarks 쿼리 검증', () => {
  it('북마크 복습 페이지 요청(BookmarkStudyPage: limit=150, sortBy=recent→last_studied_at)을 허용한다', async () => {
    expect(await getStatus('/?limit=150&sortBy=last_studied_at')).toBe(200);
  });

  it('북마크 최대 개수를 넘는 limit은 400', async () => {
    expect(await getStatus(`/?limit=${BOOKMARK_LIMIT + 1}`)).toBe(400);
  });
});
