// 학습 플로우 통합 테스트 — 메모리 MongoDB + 실제 라우터·모델·집계 쿼리로 확인한다.
// 컨트롤러 단위 테스트는 모델을 mock해 distinct·updateMany·$lookup과 윈도우 전환 전체를 검증하지 못한다.
jest.mock('../config');

import http from 'http';
import { AddressInfo } from 'net';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app';
import Word from '../models/word';
import User from '../models/user';
import UserCheckpoint from '../models/userCheckpoint';
import WordProgress from '../models/wordProgress';
import WordReview from '../models/wordReview';
import { generateToken } from '../services/auth';
import { SAMPLE_WORDS } from '../scripts/sampleWords';

jest.setTimeout(60_000);

let mongo: MongoMemoryServer;
let server: http.Server;
let baseUrl: string;
let token: string;

type Res = { status: number; body: any };

const request = (method: string, path: string, body?: object) =>
  new Promise<Res>((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const req = http.request(
      `${baseUrl}${path}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(payload && { 'Content-Length': Buffer.byteLength(payload) }),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body: data ? JSON.parse(data) : null }));
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });

const startSession = (progressType: 'main' | 'sub', level: string, steps: { start: number; end: number }) =>
  request('PATCH', '/api/users/me/checkpoint', { progressType, level, steps });

const getDeck = async (type: 'main' | 'sub') => (await request('GET', `/api/users/me/progress/${type}/current`)).body.data;

// 현재 패스를 끝까지 답한다. knows(word)가 false인 단어는 "모름"
const answerPass = async (type: 'main' | 'sub', knows: (word: any) => boolean) => {
  const deck = await getDeck(type);
  let last: Res | null = null;
  for (let index = deck.currentIndex; index < deck.words.length; index++) {
    const word = deck.words[index];
    last = await request('POST', `/api/users/me/progress/${type}/complete-word`, { wordId: word._id, isCorrect: knows(word), index });
    expect(last.status).toBe(200);
  }
  return last!.body.data;
};

const all = () => true;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri('kanji-test'));
  await Promise.all([Word.init(), UserCheckpoint.init(), WordProgress.init(), WordReview.init()]);
  await Word.insertMany(SAMPLE_WORDS);
  const user = await User.create({
    type: 'google',
    email: 'flow@test.local',
    name: 'flow',
    authProviders: [{ provider: 'google', providerId: 'flow' }],
  });
  token = generateToken(user);
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await Promise.all([
    UserCheckpoint.deleteMany({}),
    WordProgress.deleteMany({}),
    WordReview.deleteMany({}),
    // 사용자 문서는 테스트 사이에 남으므로 학습 기록만 처음 상태로 돌린다
    User.updateMany({}, { $set: { 'statistics.todayCount': 0, 'statistics.currentStreak': 0 }, $unset: { 'statistics.lastStudyDate': 1, 'profile.lastActiveAt': 1 } }),
  ]);
});

describe('메인 세션 — 윈도우·패스', () => {
  it('세션을 만들면 3스텝 단어 전체가 섞인 덱이 나온다', async () => {
    expect((await startSession('main', 'N5', { start: 1, end: 3 })).status).toBe(200);
    const deck = await getDeck('main');
    expect(deck.words).toHaveLength(30);
    expect(new Set(deck.words.map((w: any) => w.step))).toEqual(new Set([1, 2, 3]));
    expect(deck.currentIndex).toBe(0);
  });

  it('같은 타입 세션을 동시에 만들면 하나만 성공한다 (고유 인덱스)', async () => {
    const results = await Promise.all([
      startSession('main', 'N5', { start: 1, end: 3 }),
      startSession('main', 'N5', { start: 1, end: 3 }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(await UserCheckpoint.countDocuments({ progress_type: 'main' })).toBe(1);
  });

  it('모름이 남은 패스 → 모름 단어만 다시 섞은 새 패스', async () => {
    await startSession('main', 'N5', { start: 1, end: 3 });
    const unknown = new Set(['みず', 'たべる']);
    const result = await answerPass('main', (w) => !unknown.has(w.entry));
    expect(result).toEqual(expect.objectContaining({ passComplete: true, windowComplete: false, nextPassSize: 2 }));

    const deck = await getDeck('main');
    expect(deck.words.map((w: any) => w.entry).sort()).toEqual(['たべる', 'みず']);
    expect(deck.currentIndex).toBe(0);
  });

  it('덱과 세션 요약이 윈도우 전체 기준 진행(익힘/전체)을 알려준다', async () => {
    await startSession('main', 'N5', { start: 1, end: 3 });
    const deck = await getDeck('main');
    for (let index = 0; index < 5; index++) {
      await request('POST', '/api/users/me/progress/main/complete-word', { wordId: deck.words[index]._id, isCorrect: index !== 0, index });
    }
    expect((await getDeck('main')).window).toEqual({ total: 30, known: 4 });

    const summary = await request('GET', '/api/users/me/progress');
    expect(summary.body.data.sessions[0]).toEqual(expect.objectContaining({ type: 'main', window: { total: 30, known: 4 } }));
  });

  it('위치가 어긋난 응답은 409이고 아무것도 기록하지 않는다', async () => {
    await startSession('main', 'N5', { start: 1, end: 3 });
    const deck = await getDeck('main');
    const res = await request('POST', '/api/users/me/progress/main/complete-word', {
      wordId: deck.words[1]._id, isCorrect: true, index: 1,
    });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('PROGRESS_OUT_OF_SYNC');
    expect(await WordProgress.countDocuments({})).toBe(0);
  });

  it('윈도우 완료 → complete-deck이 다음 윈도우(2-4)를 만들고, 겹치는 스텝 단어는 모름에서 시작한다', async () => {
    await startSession('main', 'N5', { start: 1, end: 3 });
    expect(await answerPass('main', all)).toEqual(expect.objectContaining({ passComplete: true, windowComplete: true }));

    const done = await request('POST', '/api/users/me/progress/main/complete-deck');
    expect(done.status).toBe(200);
    expect(done.body.data).toEqual(expect.objectContaining({
      canGenerateNext: true, isSubLoop: false, nextWindow: expect.objectContaining({ steps: { start: 2, end: 4 }, deckSize: 30 }),
    }));

    const deck = await getDeck('main');
    expect(deck.steps).toEqual({ start: 2, end: 4 });
    expect(deck.words.every((w: any) => w.isWindowCompleted === false)).toBe(true);

    // 중복 호출은 400 (윈도우가 이미 넘어갔다)
    expect((await request('POST', '/api/users/me/progress/main/complete-deck')).status).toBe(400);
  });

  it('레벨의 마지막 윈도우(10-2, 순환)를 마치면 다음 윈도우가 없다', async () => {
    await startSession('main', 'N5', { start: 10, end: 2 });
    const deck = await getDeck('main');
    expect(new Set(deck.words.map((w: any) => w.step))).toEqual(new Set([10, 1, 2]));
    await answerPass('main', all);

    const done = await request('POST', '/api/users/me/progress/main/complete-deck');
    expect(done.body.data).toEqual(expect.objectContaining({ nextWindow: null, canGenerateNext: false }));
  });
});

describe('서브 세션 — 집중 루프', () => {
  it('여러 패스 끝에 완료해도 "다시 학습하기"는 스텝 단어 전체로 돌아간다', async () => {
    await startSession('sub', 'N5', { start: 2, end: 2 });
    const unknown = new Set(['みる', 'いく', 'くる']);
    expect(await answerPass('sub', (w) => !unknown.has(w.entry))).toEqual(expect.objectContaining({ nextPassSize: 3 }));
    expect(await answerPass('sub', all)).toEqual(expect.objectContaining({ windowComplete: true }));

    const done = await request('POST', '/api/users/me/progress/sub/complete-deck');
    expect(done.body.data).toEqual(expect.objectContaining({ isSubLoop: true, nextWindow: expect.objectContaining({ deckSize: 10 }) }));

    const deck = await getDeck('sub');
    expect(deck.words).toHaveLength(10);
    expect(deck.words.every((w: any) => w.isWindowCompleted === false)).toBe(true);
  });
});

describe('북마크', () => {
  it('북마크 목록이 word 컬렉션을 $lookup해 단어를 함께 돌려준다', async () => {
    await startSession('main', 'N5', { start: 1, end: 3 });
    const deck = await getDeck('main');
    await request('POST', '/api/users/me/bookmarks/toggle', { wordId: deck.words[0]._id, progressType: 'main' });

    const res = await request('GET', '/api/users/me/bookmarks?limit=150&sortBy=bookmarked_at');
    expect(res.status).toBe(200);
    expect(res.body.data.bookmarks).toHaveLength(1);
    expect(res.body.data.bookmarks[0].word.entry).toBe(deck.words[0].entry);
  });
});

describe('간격 복습', () => {
  // 시간이 지난 것처럼 모든 복습 기한을 과거로 당긴다
  const makeAllDue = () => WordReview.updateMany({}, { next_review_at: new Date(Date.now() - 1000) });

  it('처음 알아요를 누른 단어만 내일부터 복습에 등록된다', async () => {
    await startSession('main', 'N5', { start: 1, end: 3 });
    await answerPass('main', (w) => w.entry !== 'みず');

    expect(await WordReview.countDocuments({})).toBe(29);
    // 등록 직후에는 오늘 복습할 단어가 없다 (내일 한국 자정부터)
    const due = await request('GET', '/api/users/me/reviews/due');
    expect(due.status).toBe(200);
    expect(due.body.data).toEqual({ words: [], dueCount: 0 });
  });

  it('기한이 된 단어를 알아요 → 다음 간격, 재전송은 반영하지 않음 / 몰라요 → 바로 다시', async () => {
    await startSession('sub', 'N5', { start: 4, end: 4 });
    await answerPass('sub', all);
    await makeAllDue();

    const due = await request('GET', '/api/users/me/reviews/due?limit=5');
    expect(due.body.data.dueCount).toBe(10);
    expect(due.body.data.words).toHaveLength(5);
    const [first, second] = due.body.data.words;
    expect(first).toEqual(expect.objectContaining({ entry: expect.any(String), means: expect.any(Array), stage: 1 }));

    const known = await request('POST', '/api/users/me/reviews/answer', { wordId: first._id, isCorrect: true });
    expect(known.body.data).toEqual(expect.objectContaining({ applied: true, stage: 2 }));
    expect(new Date(known.body.data.nextReviewAt).getTime()).toBeGreaterThan(Date.now());

    const retry = await request('POST', '/api/users/me/reviews/answer', { wordId: first._id, isCorrect: true });
    expect(retry.body.data).toEqual(expect.objectContaining({ applied: false, stage: 2 }));

    const forgot = await request('POST', '/api/users/me/reviews/answer', { wordId: second._id, isCorrect: false });
    expect(forgot.body.data).toEqual(expect.objectContaining({ applied: true, stage: 0 }));
    expect((await request('GET', '/api/users/me/reviews/due')).body.data.dueCount).toBe(9);
  });

  it('복습에 없는 단어에 답하면 404', async () => {
    const word = await Word.findOne({});
    const res = await request('POST', '/api/users/me/reviews/answer', { wordId: word!._id, isCorrect: true });
    expect(res.status).toBe(404);
  });
});

describe('학습 기록', () => {
  it('익힌 단어·장기 기억·복습 대기·오늘 학습량이 실제 기록과 맞는다', async () => {
    await startSession('main', 'N5', { start: 1, end: 3 });
    await answerPass('main', (w) => w.entry !== 'みず');
    // 3개를 장기 기억(4단계)으로, 2개를 기한 지남으로 만든다
    const reviews = await WordReview.find({}).limit(5);
    await WordReview.updateMany({ _id: { $in: reviews.slice(0, 3).map((r) => r._id) } }, { stage: 4 });
    await WordReview.updateMany({ _id: { $in: reviews.slice(3).map((r) => r._id) } }, { next_review_at: new Date(Date.now() - 1000) });

    const res = await request('GET', '/api/users/me/stats');
    expect(res.status).toBe(200);
    const { data } = res.body;
    expect(data.learned).toEqual({ total: 29, longTerm: 3 });
    expect(data.levels.find((l: any) => l.level === 'N5')).toEqual({ level: 'N5', total: 100, learned: 29, longTerm: 3 });
    expect(data.review.due).toBe(2);
    expect(data.today.count).toBe(30);
    expect(data.streak.current).toBe(1);
  });
});
