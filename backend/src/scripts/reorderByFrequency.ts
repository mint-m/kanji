/**
 * 빈도 기반 스텝 균등 배분 스크립트
 * 사용법: yarn reorder:frequency [--dry-run] [--level=N5]
 *
 * 알고리즘 (라운드로빈 인터리빙):
 *   1. 레벨 내 단어를 frequency 오름차순 정렬
 *   2. 목표 스텝 수 = ceil(단어 수 / WORDS_PER_STEP)
 *   3. 라운드로빈으로 step 배정:
 *      rank1→step1, rank2→step2, ..., rankS→stepS, rankS+1→step1, ...
 *
 * 결과: 각 스텝이 고빈도~저빈도 단어를 균등하게 포함
 *       → 스텝 간 평균 학습 난이도 동일
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Word from '../models/word';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DRY_RUN = process.argv.includes('--dry-run');
const WORDS_PER_STEP = 20;

// --level=N5 형태로 특정 레벨만 처리 가능
const levelArg = process.argv.find(a => a.startsWith('--level='));
const TARGET_LEVEL = levelArg ? levelArg.split('=')[1] : null;

async function reorderLevel(level: string): Promise<void> {
  // frequency 누락/null 문서가 DB 정렬에서 최상위로 오면 고빈도로 오인되므로 JS에서 기본값 9999로 정렬
  const words = await Word.find({ level }, { _id: 1, entry: 1, frequency: 1 }).lean();
  words.sort((a, b) => {
    const freqA = a.frequency ?? 9999;
    const freqB = b.frequency ?? 9999;
    if (freqA !== freqB) return freqA - freqB;
    return a.entry.localeCompare(b.entry);
  });

  if (words.length === 0) {
    console.log(`  [${level}] 단어 없음 — 건너뜀`);
    return;
  }

  const totalSteps = Math.ceil(words.length / WORDS_PER_STEP);

  // 라운드로빈: i번째 단어 → step (i % totalSteps) + 1
  const bulkOps = words.map((word, i) => ({
    updateOne: {
      filter: { _id: word._id },
      update: { $set: { step: (i % totalSteps) + 1 } },
    },
  }));

  // 검증: 스텝별 frequency 분포 출력
  const stepFreqMap = new Map<number, number[]>();
  words.forEach((word, i) => {
    const step = (i % totalSteps) + 1;
    if (!stepFreqMap.has(step)) stepFreqMap.set(step, []);
    stepFreqMap.get(step)!.push(word.frequency);
  });

  const sampleSteps = [1, Math.ceil(totalSteps / 2), totalSteps].filter(
    (v, i, a) => a.indexOf(v) === i,
  );
  const avgFreq = (freqs: number[]) =>
    (freqs.reduce((s, f) => s + f, 0) / freqs.length).toFixed(1);

  console.log(`  [${level}] 단어 ${words.length}개 → ${totalSteps}스텝 (${WORDS_PER_STEP}개/스텝)`);
  for (const step of sampleSteps) {
    const freqs = stepFreqMap.get(step) || [];
    console.log(
      `    step${step}: min=${Math.min(...freqs)} max=${Math.max(...freqs)} avg=${avgFreq(freqs)}`,
    );
  }

  if (!DRY_RUN) {
    const CHUNK = 1000;
    for (let i = 0; i < bulkOps.length; i += CHUNK) {
      await Word.bulkWrite(bulkOps.slice(i, i + CHUNK));
    }
    console.log(`    → DB 업데이트 완료`);
  }
}

async function reorderByFrequency() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) { console.error('MONGO_URI 환경변수 필요'); process.exit(1); }

  await mongoose.connect(mongoUri);
  console.log(`MongoDB 연결됨 ${DRY_RUN ? '[DRY RUN]' : ''}`);
  console.log(`스텝당 단어 수: ${WORDS_PER_STEP}`);

  const levelsToProcess = TARGET_LEVEL
    ? [TARGET_LEVEL]
    : ['N5', 'N4', 'N3', 'N2', 'N1', 'daily'];

  console.log(`\n처리 레벨: ${levelsToProcess.join(', ')}\n`);

  for (const level of levelsToProcess) {
    await reorderLevel(level);
  }

  if (DRY_RUN) console.log('\n[DRY RUN] 실제 DB 변경 없음');
  console.log('\n=== 완료 ===');

  await mongoose.disconnect();
}

reorderByFrequency().catch((err) => {
  console.error(err);
  process.exit(1);
});
