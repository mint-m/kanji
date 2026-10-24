import mongoose from 'mongoose';
import WordReview, { REVIEW_INTERVAL_DAYS } from '../models/wordReview';

// DB 연결 없이 문서 인스턴스의 메서드만 검증한다
// 한국 시간 2026-10-24 21:00 (UTC 12:00)
const NOW = new Date('2026-10-24T12:00:00Z');
const kstMidnight = (ymd: string) => new Date(`${ymd}T00:00:00+09:00`);

const makeReview = (stage: number, nextReviewAt: Date) =>
  new WordReview({
    user_id: new mongoose.Types.ObjectId(),
    word_id: new mongoose.Types.ObjectId(),
    stage,
    next_review_at: nextReviewAt,
  });

describe('WordReview.applyAnswer', () => {
  it('알아요 → 다음 단계, 그 간격 뒤 한국 자정에 다시 나온다', () => {
    const review = makeReview(1, NOW);
    expect(review.applyAnswer(true, NOW)).toBe(true);
    expect(review.stage).toBe(2);
    // 2단계 = 3일 → 10-27 00:00 KST
    expect(review.next_review_at).toEqual(kstMidnight('2026-10-27'));
    expect(review.review_count).toBe(1);
  });

  it('간격은 1·3·7·14·30·60일이고 마지막 단계에서는 60일을 반복한다', () => {
    expect(REVIEW_INTERVAL_DAYS.slice(1)).toEqual([1, 3, 7, 14, 30, 60]);
    const review = makeReview(6, NOW);
    review.applyAnswer(true, NOW);
    expect(review.stage).toBe(6);
    expect(review.next_review_at).toEqual(new Date(kstMidnight('2026-10-24').getTime() + 60 * 86_400_000));
  });

  it('몰라요 → 0단계로 바로 다시, 잊은 횟수 +1', () => {
    const review = makeReview(4, NOW);
    review.applyAnswer(false, NOW);
    expect(review.stage).toBe(0);
    expect(review.next_review_at).toEqual(NOW);
    expect(review.lapse_count).toBe(1);
  });

  it('0단계에서 또 몰라요 → 잊은 횟수는 한 번만 센다', () => {
    const review = makeReview(0, NOW);
    review.applyAnswer(false, NOW);
    expect(review.lapse_count).toBe(0);
  });

  it('0단계에서 알아요 → 1단계, 다음 날 아침', () => {
    const review = makeReview(0, NOW);
    review.applyAnswer(true, NOW);
    expect(review.stage).toBe(1);
    expect(review.next_review_at).toEqual(kstMidnight('2026-10-25'));
  });

  it('아직 기한 전이면(재전송) 아무것도 바꾸지 않는다', () => {
    const review = makeReview(2, kstMidnight('2026-10-27'));
    expect(review.applyAnswer(true, NOW)).toBe(false);
    expect(review.stage).toBe(2);
    expect(review.review_count).toBe(0);
  });
});
