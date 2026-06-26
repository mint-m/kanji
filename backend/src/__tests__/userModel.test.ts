// mongoose는 mock 없이 import (DB 연결 없이도 Schema/methods 정의는 동작)
import User from '../models/user';

// Schema methods를 plain object에 바인딩해서 테스트
const method = (User as any).schema.methods.updateDailyStreak as Function;

const makeDoc = (lastActiveAt?: Date, currentStreak = 0, longestStreak = 0, studyDaysCount = 0) => ({
  statistics: { currentStreak, longestStreak, studyDaysCount },
  profile: { lastActiveAt },
});

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
};

describe('updateDailyStreak', () => {
  it('첫 학습(lastActiveAt 없음) → streak 1, studyDaysCount 1', () => {
    const doc = makeDoc(undefined, 0, 0, 0);
    method.call(doc);
    expect(doc.statistics.currentStreak).toBe(1);
    expect(doc.statistics.studyDaysCount).toBe(1);
    expect(doc.profile.lastActiveAt).toBeDefined();
  });

  it('오늘 이미 학습함 → streak/studyDaysCount 변화 없음', () => {
    const doc = makeDoc(new Date(), 3, 5, 10);
    method.call(doc);
    expect(doc.statistics.currentStreak).toBe(3);
    expect(doc.statistics.studyDaysCount).toBe(10);
  });

  it('어제 학습함 → streak +1, studyDaysCount +1', () => {
    const doc = makeDoc(daysAgo(1), 3, 5, 10);
    method.call(doc);
    expect(doc.statistics.currentStreak).toBe(4);
    expect(doc.statistics.studyDaysCount).toBe(11);
  });

  it('2일 이상 공백 → streak 1로 리셋, studyDaysCount +1', () => {
    const doc = makeDoc(daysAgo(3), 5, 10, 15);
    method.call(doc);
    expect(doc.statistics.currentStreak).toBe(1);
    expect(doc.statistics.studyDaysCount).toBe(16);
  });

  it('streak이 longestStreak 초과 → longestStreak 갱신', () => {
    const doc = makeDoc(daysAgo(1), 7, 7, 10);
    method.call(doc);
    expect(doc.statistics.currentStreak).toBe(8);
    expect(doc.statistics.longestStreak).toBe(8);
  });

  it('streak 리셋 후 longestStreak은 유지', () => {
    const doc = makeDoc(daysAgo(5), 10, 20, 30);
    method.call(doc);
    expect(doc.statistics.currentStreak).toBe(1);
    expect(doc.statistics.longestStreak).toBe(20);
  });

  it('lastActiveAt이 오늘 날짜로 갱신됨', () => {
    const doc = makeDoc(daysAgo(1), 1, 1, 5);
    method.call(doc);
    expect(doc.profile.lastActiveAt?.toDateString()).toBe(new Date().toDateString());
  });
});
