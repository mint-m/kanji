/**
 * '일상' 레벨 생성 스크립트
 * 사용법: yarn create:daily [--dry-run]
 *
 * A. 기존 DB에서 이동:
 *    순수 감동사(인사말·기초회화) → level을 'daily'로 변경 (Korean 뜻 보존)
 *
 * B. JMdict에서 신규 추가:
 *    frequency ≤ 12이고 기존 N1-N5에 없는 고빈도 어휘
 *    Korean 뜻: 기존 DB 매칭 시 보존, 없으면 JMdict 영어 의미 사용
 */

import axios from 'axios';
import { createGunzip } from 'zlib';
import { parseStringPromise } from 'xml2js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Word from '../models/word';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const JMDICT_URL = 'https://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz';
const DRY_RUN = process.argv.includes('--dry-run');

// 기존 DB에서 'daily'로 이동할 순수 감동사 (실생활 필수 인사/표현)
const DAILY_INTERJECTIONS = new Set([
  'おはよう', 'ありがとう', 'もしもし', 'ごちそうさま', 'おめでとう',
  'ごくろうさま', 'おまちどおさま', 'よし', 'いやいや', 'いえ',
  'おや', 'さあ', 'ええ', 'あの', 'いいえ', 'はい', 'どうも',
  'しめた', 'おい',
]);

function calcFrequency(priTags: string[]): number {
  let best = 9999;
  for (const tag of priTags) {
    const nfMatch = tag.match(/^nf(\d{2})$/);
    if (nfMatch) { best = Math.min(best, parseInt(nfMatch[1], 10)); continue; }
    if (['news1', 'ichi1', 'spec1', 'gai1'].includes(tag)) best = Math.min(best, 1);
    else if (['news2', 'ichi2', 'spec2', 'gai2'].includes(tag)) best = Math.min(best, 24);
  }
  return best;
}

async function downloadAndParse(): Promise<any> {
  console.log('JMdict 다운로드 중...');
  const response = await axios.get(JMDICT_URL, { responseType: 'stream', timeout: 120000 });
  return new Promise((resolve, reject) => {
    const gunzip = createGunzip();
    const chunks: Uint8Array[] = [];
    response.data.on('error', reject);
    response.data.pipe(gunzip);
    gunzip.on('data', (chunk: Uint8Array) => chunks.push(chunk));
    gunzip.on('end', async () => {
      console.log('XML 파싱 중...');
      try {
        const xml = Buffer.concat(chunks).toString('utf8');
        resolve(await parseStringPromise(xml, { explicitArray: true }));
      } catch (err) {
        reject(err);
      }
    });
    gunzip.on('error', reject);
  });
}

async function createDailyWords() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) { console.error('MONGO_URI 환경변수 필요'); process.exit(1); }

  await mongoose.connect(mongoUri);
  console.log(`MongoDB 연결됨 ${DRY_RUN ? '[DRY RUN]' : ''}`);

  // ── A. 기존 감동사 → daily 이동 ────────────────────────────────────────
  const interjectionsToMove = await Word.find({
    parts: { $all: ['감동사'], $size: 1 },
    entry: { $in: Array.from(DAILY_INTERJECTIONS) },
  }).lean();

  console.log(`\nA. daily로 이동할 감동사: ${interjectionsToMove.length}개`);
  interjectionsToMove.forEach(w =>
    console.log(`  [이동] ${w.entry} (${w.pron || '-'}) — ${w.means[0]}`),
  );

  if (!DRY_RUN && interjectionsToMove.length > 0) {
    const ids = interjectionsToMove.map(w => w._id);
    await Word.updateMany({ _id: { $in: ids } }, { $set: { level: 'daily' } });
    console.log(`  → ${interjectionsToMove.length}개 level='daily'로 업데이트 완료`);
  }

  // ── B. JMdict 고빈도 신규 단어 추가 ────────────────────────────────────
  const data = await downloadAndParse();
  const entries: any[] = data.JMdict?.entry || [];
  console.log(`\nJMdict 엔트리 수: ${entries.length}`);

  // 기존 DB의 entry+pron 세트 및 origin_entry_id 세트 (중복 방지)
  const existingWords = await Word.find({}, { entry: 1, pron: 1, origin_entry_id: 1 }).lean();
  const existingSet = new Set(existingWords.map(w => `${w.entry}||${w.pron ?? ''}`));
  const existingIdSet = new Set(existingWords.map(w => w.origin_entry_id).filter(Boolean));

  const newDailyWords: any[] = [];

  for (const entry of entries) {
    try {
      const priTags: string[] = [];
      const kElems: any[] = entry.k_ele || [];
      const rElems: any[] = entry.r_ele || [];

      for (const ke of kElems) {
        (ke.ke_pri || []).forEach((p: any) => priTags.push(typeof p === 'string' ? p : p._));
      }
      for (const re of rElems) {
        (re.re_pri || []).forEach((p: any) => priTags.push(typeof p === 'string' ? p : p._));
      }

      const frequency = calcFrequency(priTags);
      if (frequency > 12) continue; // 고빈도만

      const kanji = kElems.map((ke: any) => ke.keb?.[0]).filter(Boolean) as string[];
      const kana = rElems.map((re: any) => re.reb?.[0]).filter(Boolean) as string[];

      const pronVal = kanji[0] ?? null;
      const entryVal = kana[0];
      if (!entryVal) continue;

      const key = `${entryVal}||${pronVal ?? ''}`;
      if (existingSet.has(key)) continue; // 이미 DB에 있음

      const senseElems: any[] = entry.sense || [];
      const posSet = new Set<string>();
      const meanings: string[] = [];

      for (const sense of senseElems) {
        const posList: any[] = sense.pos || [];
        posList.forEach((p: any) => {
          const raw = typeof p === 'string' ? p : p._;
          if (raw) posSet.add(raw);
        });
        const glossList: any[] = sense.gloss || [];
        for (const g of glossList) {
          const text = typeof g === 'string' ? g : g._;
          if (text) meanings.push(text);
        }
      }

      if (meanings.length === 0) continue;

      const entryId = `jmdict_daily_${entry.ent_seq?.[0] ?? entryVal}`;
      if (existingIdSet.has(entryId)) continue;

      newDailyWords.push({
        origin_entry_id: entryId,
        entry: entryVal,
        pron: pronVal || '',
        level: 'daily',
        step: 1, // reorderByFrequency.ts가 재배치
        frequency,
        means: meanings.slice(0, 5), // 최대 5개
        parts: posSet.size > 0 ? Array.from(posSet) : ['기타'],
      });

      existingSet.add(key);
      existingIdSet.add(entryId);
    } catch {
      continue;
    }
  }

  console.log(`\nB. JMdict 신규 daily 단어: ${newDailyWords.length}개`);
  newDailyWords.slice(0, 10).forEach(w =>
    console.log(`  [신규] ${w.entry} (${w.pron || '-'}) freq=${w.frequency} — ${w.means[0]}`),
  );

  if (!DRY_RUN && newDailyWords.length > 0) {
    const CHUNK = 500;
    let inserted = 0;
    for (let i = 0; i < newDailyWords.length; i += CHUNK) {
      try {
        await Word.insertMany(newDailyWords.slice(i, i + CHUNK), { ordered: false });
      } catch (err: any) {
        const isDupOnly = err?.code === 11000 ||
          (err?.writeErrors?.length && err.writeErrors.every((e: any) => e.code === 11000));
        if (!isDupOnly) throw err;
      }
      inserted += Math.min(CHUNK, newDailyWords.length - i);
      process.stdout.write(`\r  삽입 중: ${inserted} / ${newDailyWords.length}`);
    }
    console.log(`\n  → ${newDailyWords.length}개 daily 단어 추가 완료`);
  }

  console.log('\n=== 완료 ===');
  console.log(`감동사 이동: ${interjectionsToMove.length}개`);
  console.log(`신규 daily 추가: ${newDailyWords.length}개`);
  if (DRY_RUN) console.log('[DRY RUN] 실제 DB 변경 없음');

  await mongoose.disconnect();
}

createDailyWords().catch((err) => {
  console.error(err);
  process.exit(1);
});
