// mongoose는 mock 없이 import (DB 연결 없이도 Schema/methods 정의는 동작)
import User from '../models/user';

// Schema methods를 plain object에 바인딩해서 테스트
const recordStudy = (User as any).schema.methods.recordStudy as Function;

// 한국 시간 2026-10-24 12:00 (UTC 03:00)
const NOW = new Date('2026-10-24T03:00:00Z');

const makeDoc = (stats: Partial<{ lastStudyDate: string; currentStreak: number; longestStreak: number; studyDaysCount: number; todayCount: number }> = {}, lastActiveAt?: Date) => ({
  statistics: {
    totalWordsStudied: 0,
    totalTimeSpent: 0,
    currentStreak: 0,
    longestStreak: 0,
    studyDaysCount: 0,
    todayCount: 0,
    ...stats,
  } as Record<string, any>,
  profile: { lastActiveAt } as Record<string, any>,
});

beforeEach(() => {
  jest.useFakeTimers('modern');
  jest.setSystemTime(NOW);
});

afterEach(() => jest.useRealTimers());

describe('recordStudy', () => {
  it('첫 학습 → 연속 1일, 학습일 1, 응답 수·시간 누적', () => {
    const doc = makeDoc();
    recordStudy.call(doc, 7);
    expect(doc.statistics).toEqual(expect.objectContaining({
      currentStreak: 1, longestStreak: 1, studyDaysCount: 1, totalWordsStudied: 1, totalTimeSpent: 7, lastStudyDate: '2026-10-24', todayCount: 1,
    }));
    expect(doc.profile.lastActiveAt).toEqual(NOW);
  });

  it('오늘 이미 학습함 → 연속 일수·학습일은 그대로, 응답 수·오늘 응답 수만 증가', () => {
    const doc = makeDoc({ lastStudyDate: '2026-10-24', currentStreak: 3, longestStreak: 5, studyDaysCount: 10, todayCount: 4 });
    recordStudy.call(doc, 0);
    expect(doc.statistics).toEqual(expect.objectContaining({ currentStreak: 3, studyDaysCount: 10, totalWordsStudied: 1, todayCount: 5 }));
  });

  it('날이 바뀌면 오늘 응답 수는 1부터 다시 센다', () => {
    const doc = makeDoc({ lastStudyDate: '2026-10-23', currentStreak: 1, longestStreak: 1, studyDaysCount: 1, todayCount: 40 });
    recordStudy.call(doc, 0);
    expect(doc.statistics.todayCount).toBe(1);
  });

  it('어제 학습함 → 연속 +1, 학습일 +1', () => {
    const doc = makeDoc({ lastStudyDate: '2026-10-23', currentStreak: 3, longestStreak: 5, studyDaysCount: 10 });
    recordStudy.call(doc, 0);
    expect(doc.statistics).toEqual(expect.objectContaining({ currentStreak: 4, studyDaysCount: 11, lastStudyDate: '2026-10-24' }));
  });

  it('이틀 이상 공백 → 연속 1로 리셋, 최장 기록은 유지', () => {
    const doc = makeDoc({ lastStudyDate: '2026-10-20', currentStreak: 10, longestStreak: 20, studyDaysCount: 30 });
    recordStudy.call(doc, 0);
    expect(doc.statistics).toEqual(expect.objectContaining({ currentStreak: 1, longestStreak: 20, studyDaysCount: 31 }));
  });

  it('연속 일수가 최장 기록을 넘으면 최장 기록도 갱신', () => {
    const doc = makeDoc({ lastStudyDate: '2026-10-23', currentStreak: 7, longestStreak: 7 });
    recordStudy.call(doc, 0);
    expect(doc.statistics).toEqual(expect.objectContaining({ currentStreak: 8, longestStreak: 8 }));
  });

  it('오늘 로그인만 했어도(lastActiveAt = 오늘) 어제 학습했다면 연속으로 센다', () => {
    const doc = makeDoc({ lastStudyDate: '2026-10-23', currentStreak: 2, longestStreak: 2, studyDaysCount: 2 }, NOW);
    recordStudy.call(doc, 0);
    expect(doc.statistics).toEqual(expect.objectContaining({ currentStreak: 3, studyDaysCount: 3 }));
  });

  it('날짜 경계는 한국 시간 — UTC 15:30은 한국의 다음 날 00:30이다', () => {
    jest.setSystemTime(new Date('2026-10-23T15:30:00Z'));
    const doc = makeDoc({ lastStudyDate: '2026-10-23', currentStreak: 1, longestStreak: 1, studyDaysCount: 1 });
    recordStudy.call(doc, 0);
    expect(doc.statistics).toEqual(expect.objectContaining({ currentStreak: 2, lastStudyDate: '2026-10-24' }));
  });

  it('lastStudyDate 도입 전 사용자: 마지막 접속이 어제면 연속을 이어받는다', () => {
    const doc = makeDoc({ currentStreak: 4, longestStreak: 4, studyDaysCount: 4 }, new Date('2026-10-23T03:00:00Z'));
    recordStudy.call(doc, 0);
    expect(doc.statistics).toEqual(expect.objectContaining({ currentStreak: 5, studyDaysCount: 5, lastStudyDate: '2026-10-24' }));
  });

  it('lastStudyDate 도입 전 사용자: 오늘 이미 접속했다면 연속 일수를 유지한다', () => {
    const doc = makeDoc({ currentStreak: 4, longestStreak: 4, studyDaysCount: 4 }, new Date('2026-10-24T01:00:00Z'));
    recordStudy.call(doc, 0);
    expect(doc.statistics).toEqual(expect.objectContaining({ currentStreak: 4, studyDaysCount: 4, lastStudyDate: '2026-10-24' }));
  });
});

describe('getCurrentStreak · getTodayCount', () => {
  const getCurrentStreak = (User as any).schema.methods.getCurrentStreak as Function;
  const getTodayCount = (User as any).schema.methods.getTodayCount as Function;

  it('어제까지 학습했으면 연속 일수가 살아 있고, 그 전이면 0', () => {
    expect(getCurrentStreak.call(makeDoc({ lastStudyDate: '2026-10-23', currentStreak: 5 }), NOW)).toBe(5);
    expect(getCurrentStreak.call(makeDoc({ lastStudyDate: '2026-10-24', currentStreak: 5 }), NOW)).toBe(5);
    expect(getCurrentStreak.call(makeDoc({ lastStudyDate: '2026-10-21', currentStreak: 5 }), NOW)).toBe(0);
    expect(getCurrentStreak.call(makeDoc(), NOW)).toBe(0);
  });

  it('오늘 응답 수는 마지막 학습일이 오늘일 때만', () => {
    expect(getTodayCount.call(makeDoc({ lastStudyDate: '2026-10-24', todayCount: 9 }), NOW)).toBe(9);
    expect(getTodayCount.call(makeDoc({ lastStudyDate: '2026-10-23', todayCount: 9 }), NOW)).toBe(0);
  });
});
