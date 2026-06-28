/**
 * KANJIDIC2 시드 스크립트
 * 사용법: yarn seed:kanji
 *
 * KANJIDIC2 (http://www.edrdg.org/wiki/index.php/KANJIDIC_Project) 데이터를
 * 다운로드해 MongoDB kanji 컬렉션에 저장합니다.
 *
 * KANJIDIC2 JLPT 레벨 매핑 (구버전 형식):
 *   4 → N5, 3 → N4, 2 → N3, 1 → N2
 *   (N1은 별도 구분 없음 — N2로 처리)
 */

import axios from 'axios';
import { createGunzip } from 'zlib';
import { parseStringPromise } from 'xml2js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Kanji from '../models/kanji';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const KANJIDIC2_URL = 'https://www.edrdg.org/kanjidic/kanjidic2.xml.gz';

const JLPT_MAP: Record<string, string> = {
  '4': 'N5',
  '3': 'N4',
  '2': 'N3',
  '1': 'N2',
};

async function downloadAndParse(): Promise<any> {
  console.log('KANJIDIC2 다운로드 중...');
  const response = await axios.get(KANJIDIC2_URL, { responseType: 'stream', timeout: 60000 });

  return new Promise((resolve, reject) => {
    const gunzip = createGunzip();
    const chunks: Uint8Array[] = [];

    response.data.pipe(gunzip);
    gunzip.on('data', (chunk: Uint8Array) => chunks.push(chunk));
    gunzip.on('end', async () => {
      console.log('XML 파싱 중...');
      const xml = Buffer.concat(chunks).toString('utf8');
      const result = await parseStringPromise(xml, { explicitArray: true });
      resolve(result);
    });
    gunzip.on('error', reject);
  });
}

function extractKanjiDoc(character: any): object | null {
  try {
    const literal: string = character.literal[0];
    const misc = character.misc?.[0] || {};
    const readingMeaning = character.reading_meaning?.[0];

    if (!readingMeaning) return null;

    const rmgroup = readingMeaning.rmgroup?.[0] || {};
    const readings: any[] = rmgroup.reading || [];
    const meanings: any[] = rmgroup.meaning || [];

    const onRead = readings
      .filter((r) => r.$?.r_type === 'ja_on')
      .map((r) => r._)
      .join('·');

    const kunRead = readings
      .filter((r) => r.$?.r_type === 'ja_kun')
      .map((r) => r._)
      .join('·');

    const koreanPron = readings
      .filter((r) => r.$?.r_type === 'korean_h')
      .map((r) => r._)
      .join(', ');

    // m_lang 속성 없는 meaning 요소 = 영어 의미
    const englishMeanings = meanings
      .filter((m) => typeof m === 'string' || !m.$?.['m_lang'])
      .map((m) => (typeof m === 'string' ? m : m._))
      .filter(Boolean);

    const jlptRaw: string = misc.jlpt?.[0] || '';
    const jlptLevel = JLPT_MAP[jlptRaw] || '';

    return { character: literal, onRead, kunRead, koreanPron, jlptLevel, meanings: englishMeanings };
  } catch {
    return null;
  }
}

async function seedKanji() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI 환경변수가 필요합니다');
    process.exit(1);
  }

  await mongoose.connect(mongoUri, { dbName: 'kanji-db' });
  console.log('MongoDB 연결됨');

  const data = await downloadAndParse();
  const characters: any[] = data.kanjidic2.character;
  console.log(`총 ${characters.length}개 한자 발견`);

  await Kanji.deleteMany({});
  console.log('기존 데이터 삭제 완료');

  const BATCH = 500;
  let inserted = 0;

  for (let i = 0; i < characters.length; i += BATCH) {
    const batch = characters.slice(i, i + BATCH);
    const docs = batch.map(extractKanjiDoc).filter(Boolean);
    await Kanji.insertMany(docs, { ordered: false });
    inserted += docs.length;
    process.stdout.write(`\r진행: ${Math.min(i + BATCH, characters.length)} / ${characters.length}`);
  }

  console.log(`\n완료: ${inserted}개 한자 저장`);
  await mongoose.disconnect();
}

seedKanji().catch((err) => {
  console.error(err);
  process.exit(1);
});
