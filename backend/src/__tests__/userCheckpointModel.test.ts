import mongoose from 'mongoose';
import UserCheckpoint from '../models/userCheckpoint';

// DB 연결 없이 문서 인스턴스의 메서드만 검증한다
describe('UserCheckpoint.isAtWord', () => {
  const first = new mongoose.Types.ObjectId();
  const second = new mongoose.Types.ObjectId();

  const makeCheckpoint = (currentIndex: number) =>
    new UserCheckpoint({
      user_id: new mongoose.Types.ObjectId(),
      progress_type: 'main',
      current_level: 'N5',
      steps: { start: 1, end: 3 },
      shuffled_order: [first, second],
      current_index: currentIndex,
    });

  it('index와 단어가 모두 현재 위치와 같으면 true', () => {
    expect(makeCheckpoint(1).isAtWord(1, second)).toBe(true);
  });

  it('이미 지나간 위치의 재시도는 false', () => {
    expect(makeCheckpoint(1).isAtWord(0, first)).toBe(false);
  });

  it('index는 같아도 단어가 다르면 false', () => {
    expect(makeCheckpoint(1).isAtWord(1, first)).toBe(false);
  });

  it('패스가 끝난 뒤(인덱스 = 덱 길이)는 false', () => {
    expect(makeCheckpoint(2).isAtWord(2, second)).toBe(false);
  });
});
