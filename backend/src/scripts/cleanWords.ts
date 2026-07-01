/**
 * 학습 데이터 정제 스크립트
 * 사용법: yarn clean:words [--dry-run]
 *
 * 제거 대상:
 *  A. 리다이렉트 단어 (means가 1개이고 '→'로 시작)
 *  B. 학습 가치 없는 순수 감탄사 목록
 *  C. 완전 중복 (entry + pron + level 모두 동일) — 최신 것 제외 삭제
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Word from '../models/word';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DRY_RUN = process.argv.includes('--dry-run');

// 학습 가치 없는 순수 감탄사 (부호·소리·단순 반응)
const JUNK_INTERJECTIONS = new Set([
  'さ', 'おおい', 'いざ', 'はあ', 'やや', 'おお',
  'うん', 'あ', 'ああ', 'え', 'ええと', 'サンキュー', 'なになに',
]);

async function cleanWords() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) { console.error('MONGO_URI 환경변수 필요'); process.exit(1); }

  await mongoose.connect(mongoUri, { dbName: 'kanji-db' });
  console.log(`MongoDB 연결됨 ${DRY_RUN ? '[DRY RUN]' : ''}`);

  // ── A. 리다이렉트 단어 ──────────────────────────────────────────────────
  const redirects = await Word.find({
    means: { $size: 1 },
    'means.0': { $regex: '^→' },
  }).lean();

  console.log(`\nA. 리다이렉트 단어: ${redirects.length}개`);
  redirects.slice(0, 10).forEach(w =>
    console.log(`  ${w.entry} → ${w.means[0]}`),
  );
  if (redirects.length > 10) console.log(`  ... 외 ${redirects.length - 10}개`);

  if (!DRY_RUN && redirects.length > 0) {
    await Word.deleteMany({ _id: { $in: redirects.map(w => w._id) } });
    console.log(`  → ${redirects.length}개 삭제 완료`);
  }

  // ── B. 학습가치 없는 순수 감탄사 ────────────────────────────────────────
  const junkWords = await Word.find({
    parts: { $all: ['감동사'], $size: 1 },
    entry: { $in: Array.from(JUNK_INTERJECTIONS) },
  }).lean();

  console.log(`\nB. 쓸모없는 감탄사: ${junkWords.length}개`);
  junkWords.forEach(w =>
    console.log(`  ${w.entry} (${w.pron || '-'}) — ${w.means[0]} [${w.level}]`),
  );

  if (!DRY_RUN && junkWords.length > 0) {
    await Word.deleteMany({ _id: { $in: junkWords.map(w => w._id) } });
    console.log(`  → ${junkWords.length}개 삭제 완료`);
  }

  // ── C. 완전 중복 (entry + pron + level 모두 동일) ───────────────────────
  const dupGroups = await Word.aggregate([
    {
      $group: {
        _id: { entry: '$entry', pron: { $ifNull: ['$pron', ''] }, level: '$level' },
        count: { $sum: 1 },
        ids: { $push: '$_id' },
        createdAts: { $push: '$createdAt' },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]);

  let dupRemoveCount = 0;
  const dupRemoveIds: mongoose.Types.ObjectId[] = [];

  for (const group of dupGroups) {
    // createdAt 기준 내림차순 정렬 후 최신 1개 제외하고 나머지 제거
    const mapped = (group.ids as mongoose.Types.ObjectId[]).map((id, i) => ({
      id,
      createdAt: new Date(group.createdAts[i]),
    }));
    mapped.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const [, ...toRemove] = mapped.map(item => item.id);
    dupRemoveIds.push(...toRemove);
    dupRemoveCount += toRemove.length;
  }

  console.log(`\nC. 완전 중복 그룹: ${dupGroups.length}개, 제거 대상: ${dupRemoveCount}개`);
  dupGroups.slice(0, 5).forEach((g: any) =>
    console.log(`  ${g._id.entry} (${g._id.pron || '-'}) [${g._id.level}] × ${g.count}`),
  );

  if (!DRY_RUN && dupRemoveIds.length > 0) {
    await Word.deleteMany({ _id: { $in: dupRemoveIds } });
    console.log(`  → ${dupRemoveCount}개 삭제 완료`);
  }

  // ── 최종 통계 ───────────────────────────────────────────────────────────
  const totalRemoved = redirects.length + junkWords.length + dupRemoveCount;
  console.log('\n=== 정제 결과 ===');
  console.log(`리다이렉트: ${redirects.length}개`);
  console.log(`쓸모없는 감탄사: ${junkWords.length}개`);
  console.log(`완전 중복: ${dupRemoveCount}개`);
  console.log(`총 제거 대상: ${totalRemoved}개`);
  if (DRY_RUN) console.log('[DRY RUN] 실제 DB 변경 없음');

  await mongoose.disconnect();
}

cleanWords().catch((err) => {
  console.error(err);
  process.exit(1);
});
