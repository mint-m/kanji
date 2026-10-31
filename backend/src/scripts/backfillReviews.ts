/**
 * 간격 복습 백필 — 리뉴얼(v5) 배포 후 1회 실행
 * 사용법: yarn backfill:reviews          (변경 없이 몇 건을 만들지 보기)
 *        yarn backfill:reviews --apply  (실제로 등록)
 *
 * 리뉴얼 전에 "알았음"을 받은 단어(word_progress.correct_count ≥ 1)를 word_review에 등록한다.
 * 그대로 두면 기존 사용자의 "익힌 단어"가 0에서 다시 시작한다.
 * - 단계: 맞힌 횟수만큼(최대 3단계 = 7일 간격) — 여러 윈도우에서 맞힌 단어일수록 간격을 넓게 시작
 * - 첫 복습: 배포 다음 날부터 7일에 걸쳐 나눠서 — 첫날 복습이 수백 개 쌓이지 않게
 * - 이미 등록된 단어는 건드리지 않는다 (여러 번 실행해도 같은 결과)
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import WordProgress from '../models/wordProgress';
import WordReview from '../models/wordReview';
import { kstMidnightAfter } from '../utils/date';

const SPREAD_DAYS = 7;
const MAX_START_STAGE = 3;

interface Learned {
  _id: { user_id: mongoose.Types.ObjectId; word_id: mongoose.Types.ObjectId };
  correct: number;
  firstStudiedAt?: Date;
}

export const backfillReviews = async (now: Date, apply: boolean): Promise<{ candidates: number; created: number }> => {
  // 세션(main/sub)별 기록을 사용자·단어 하나로 합친다
  const learned = await WordProgress.aggregate<Learned>([
    { $match: { correct_count: { $gte: 1 } } },
    {
      $group: {
        _id: { user_id: '$user_id', word_id: '$word_id' },
        correct: { $sum: '$correct_count' },
        firstStudiedAt: { $min: '$first_studied_at' },
      },
    },
  ]);

  if (!apply) return { candidates: learned.length, created: 0 };

  const operations = learned.map((row, index) => ({
    updateOne: {
      filter: { user_id: row._id.user_id, word_id: row._id.word_id },
      update: {
        $setOnInsert: {
          stage: Math.min(row.correct, MAX_START_STAGE),
          next_review_at: kstMidnightAfter(now, 1 + (index % SPREAD_DAYS)),
          review_count: 0,
          lapse_count: 0,
          learned_at: row.firstStudiedAt ?? now,
        },
      },
      upsert: true,
    },
  }));

  const result = operations.length ? await WordReview.bulkWrite(operations, { ordered: false }) : null;
  return { candidates: learned.length, created: result?.upsertedCount ?? 0 };
};

async function main() {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
  const apply = process.argv.includes('--apply');
  await mongoose.connect(process.env.MONGO_URI as string);
  const { candidates, created } = await backfillReviews(new Date(), apply);
  console.log(apply
    ? `복습 등록: 대상 ${candidates}건 중 새로 ${created}건 (이미 있던 건 그대로)`
    : `미리 보기: 대상 ${candidates}건 — 실제로 등록하려면 --apply`);
  await mongoose.disconnect();
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
