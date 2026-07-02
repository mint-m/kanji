/**
 * JMdict 빈도 데이터 주입 스크립트
 * 사용법: yarn augment:frequency
 *
 * JMdict XML에서 ke_pri / r_pri 빈도 태그를 읽어
 * 현재 word 컬렉션의 frequency 필드를 업데이트합니다.
 *
 * 빈도 점수 계산:
 *   nf01~nf48 → frequency = 해당 숫자 (nf01=1, nf48=48)
 *   news1 / ichi1 / spec1 / gai1 → frequency = 1
 *   news2 / ichi2 / spec2 / gai2 → frequency = 24
 *   없음 → frequency = 9999 (기본값 유지)
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

function calcFrequency(priTags: string[]): number {
  let best = 9999;
  for (const tag of priTags) {
    const nfMatch = tag.match(/^nf(\d{2})$/);
    if (nfMatch) {
      best = Math.min(best, parseInt(nfMatch[1], 10));
      continue;
    }
    if (['news1', 'ichi1', 'spec1', 'gai1'].includes(tag)) {
      best = Math.min(best, 1);
    } else if (['news2', 'ichi2', 'spec2', 'gai2'].includes(tag)) {
      best = Math.min(best, 24);
    }
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

function extractEntry(entry: any): { kanji: string[]; kana: string[]; frequency: number } | null {
  try {
    const priTags: string[] = [];

    const kElems: any[] = entry.k_ele || [];
    for (const ke of kElems) {
      const kePri: string[] = (ke.ke_pri || [])
        .map((p: any) => (typeof p === 'string' ? p : p?._))
        .filter(Boolean);
      priTags.push(...kePri);
    }

    const rElems: any[] = entry.r_ele || [];
    for (const re of rElems) {
      const rePri: string[] = (re.re_pri || [])
        .map((p: any) => (typeof p === 'string' ? p : p?._))
        .filter(Boolean);
      priTags.push(...rePri);
    }

    const frequency = calcFrequency(priTags);

    const kanji = kElems
      .map((ke: any) => (ke.keb ? ke.keb[0] : null))
      .filter(Boolean) as string[];

    const kana = rElems
      .map((re: any) => (re.reb ? re.reb[0] : null))
      .filter(Boolean) as string[];

    return { kanji, kana, frequency };
  } catch {
    return null;
  }
}

async function augmentFrequency() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI 환경변수가 필요합니다');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('MongoDB 연결됨');

  const data = await downloadAndParse();
  const entries: any[] = data.JMdict?.entry || [];
  console.log(`JMdict 엔트리 수: ${entries.length}`);

  const kanjiMap = new Map<string, number>();
  const kanaMap = new Map<string, number>();

  for (const entry of entries) {
    const extracted = extractEntry(entry);
    if (!extracted || extracted.frequency === 9999) continue;

    const { kanji, kana, frequency } = extracted;
    for (const k of kanji) {
      const existing = kanjiMap.get(k);
      if (existing === undefined || frequency < existing) kanjiMap.set(k, frequency);
    }
    for (const k of kana) {
      const existing = kanaMap.get(k);
      if (existing === undefined || frequency < existing) kanaMap.set(k, frequency);
    }
  }

  console.log(`한자 맵 크기: ${kanjiMap.size}, 히라가나 맵 크기: ${kanaMap.size}`);

  const words = await Word.find({}, { _id: 1, entry: 1, pron: 1 }).lean();
  console.log(`DB 단어 수: ${words.length}`);

  const bulkOps: any[] = [];
  let matched = 0;
  let unmatched = 0;

  for (const word of words) {
    let freq: number | undefined;

    // 1순위: pron(한자) 매칭
    if (word.pron && kanjiMap.has(word.pron)) {
      freq = kanjiMap.get(word.pron);
    }
    // 2순위: entry(히라가나) 매칭
    if (freq === undefined && kanaMap.has(word.entry)) {
      freq = kanaMap.get(word.entry);
    }

    if (freq !== undefined) {
      bulkOps.push({
        updateOne: {
          filter: { _id: word._id },
          update: { $set: { frequency: freq } },
        },
      });
      matched++;
    } else {
      // 매칭 실패해도 명시적으로 9999를 저장해야 reorderByFrequency 정렬에서 null로 취급되어 앞에 오는 버그 방지
      bulkOps.push({
        updateOne: {
          filter: { _id: word._id },
          update: { $set: { frequency: 9999 } },
        },
      });
      unmatched++;
    }
  }

  if (bulkOps.length > 0) {
    const CHUNK = 1000;
    for (let i = 0; i < bulkOps.length; i += CHUNK) {
      await Word.bulkWrite(bulkOps.slice(i, i + CHUNK));
      process.stdout.write(`\r업데이트 중: ${Math.min(i + CHUNK, bulkOps.length)} / ${bulkOps.length}`);
    }
    console.log('');
  }

  console.log(`\n=== 완료 ===`);
  console.log(`매칭 성공: ${matched}개 (${((matched / words.length) * 100).toFixed(1)}%)`);
  console.log(`매칭 실패(frequency=9999 유지): ${unmatched}개`);

  await mongoose.disconnect();
}

augmentFrequency().catch((err) => {
  console.error(err);
  process.exit(1);
});
