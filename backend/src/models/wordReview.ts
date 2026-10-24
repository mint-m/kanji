import mongoose from 'mongoose';
import { WordReviewDocument, WordReviewModel } from '../interfaces/wordReview';
import { kstMidnightAfter } from '../utils/date';

// 간격 복습(Leitner) — 단계별 다음 복습까지의 일수. 0단계는 "바로 다시", 마지막 단계는 그 간격을 반복한다
export const REVIEW_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30, 60];
const MAX_STAGE = REVIEW_INTERVAL_DAYS.length - 1;
// 14일 간격 이상을 통과한 단어 = 장기 기억
export const LONG_TERM_STAGE = 4;

const wordReviewSchema = new mongoose.Schema<WordReviewDocument>(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    word_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Word' },
    stage: { type: Number, required: true, default: 1, min: 0, max: MAX_STAGE },
    next_review_at: { type: Date, required: true },
    review_count: { type: Number, required: true, default: 0, min: 0 },
    lapse_count: { type: Number, required: true, default: 0, min: 0 },
    last_reviewed_at: { type: Date },
  },
  {
    // 처음 익힌 시각 = 복습에 등록된 시각
    timestamps: { createdAt: 'learned_at', updatedAt: false },
  }
);

// 사용자·단어당 하나 — 세션(main/sub)과 무관하게 단어의 기억 상태는 하나다
wordReviewSchema.index({ user_id: 1, word_id: 1 }, { unique: true });
wordReviewSchema.index({ user_id: 1, next_review_at: 1 });

wordReviewSchema.methods.isDue = function (this: WordReviewDocument, now: Date = new Date()): boolean {
  return this.next_review_at <= now;
};

// 복습 응답을 반영한다. 아직 복습할 때가 아니면(같은 응답의 재전송 등) 아무것도 바꾸지 않고 false
wordReviewSchema.methods.applyAnswer = function (
  this: WordReviewDocument,
  isCorrect: boolean,
  now: Date = new Date()
): boolean {
  if (!this.isDue(now)) return false;

  this.review_count += 1;
  this.last_reviewed_at = now;
  if (isCorrect) {
    this.stage = Math.min(this.stage + 1, MAX_STAGE);
    this.next_review_at = kstMidnightAfter(now, REVIEW_INTERVAL_DAYS[this.stage]);
  } else {
    // 잊은 단어는 0단계에서 다시 — 이번 복습에서 맞히면 1일 간격부터 시작한다
    if (this.stage > 0) this.lapse_count += 1;
    this.stage = 0;
    this.next_review_at = now;
  }
  return true;
};

// 진도·집중 학습에서 처음 "알아요"를 누른 단어를 내일부터 복습하도록 등록한다. 이미 있으면 그대로 둔다
wordReviewSchema.statics.enroll = async function (
  userId: mongoose.Types.ObjectId,
  wordId: mongoose.Types.ObjectId,
  now: Date = new Date()
): Promise<void> {
  try {
    await this.updateOne(
      { user_id: userId, word_id: wordId },
      { $setOnInsert: { stage: 1, next_review_at: kstMidnightAfter(now, REVIEW_INTERVAL_DAYS[1]), learned_at: now } },
      { upsert: true }
    );
  } catch (error) {
    // 같은 단어의 동시 등록 — 다른 요청이 이미 만들었다
    if ((error as { code?: number }).code !== 11000) throw error;
  }
};

// 아직 기한이 안 된 복습 중 가장 이른 시각 — "다음 복습은 언제"
wordReviewSchema.statics.findNextDueAt = async function (
  userId: mongoose.Types.ObjectId,
  now: Date = new Date()
): Promise<Date | null> {
  const next = await this.findOne({ user_id: userId, next_review_at: { $gt: now } })
    .sort({ next_review_at: 1 })
    .select('next_review_at')
    .lean();
  return next?.next_review_at ?? null;
};

wordReviewSchema.statics.countDue = function (userId: mongoose.Types.ObjectId, now: Date = new Date()): Promise<number> {
  return this.countDocuments({ user_id: userId, next_review_at: { $lte: now } });
};

const WordReview = mongoose.model<WordReviewDocument, WordReviewModel>('WordReview', wordReviewSchema, 'word_review');

export default WordReview;
