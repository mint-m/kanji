import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import Kanji from '../models/kanji';
import { InternalServerError } from '../utils/errors';

const NAVER_KANJI_URL = 'https://ja.dict.naver.com/api3/jako/search/hanja';

const toHiragana = (str: string): string =>
  str.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

// 네이버는 옛 JLPT 등급(1~4, 4가 가장 쉽다)을 준다 — DB(seedKanji의 JLPT_MAP)와 같은 새 등급 숫자로 옮긴다.
// 그대로 두면 화면이 'N'을 붙여 生·行 같은 N5 한자를 N4로 보인다
const NEW_JLPT: Record<string, string> = { '4': '5', '3': '4', '2': '2', '1': '1' };
const toNewJlpt = (frequencyAdd: string) =>
  frequencyAdd.replace(/^JLPT (\d)/, (match, old: string) => (NEW_JLPT[old] ? `JLPT ${NEW_JLPT[old]}` : match));

const fetchFromNaver = async (kanji: string): Promise<object | null> => {
  try {
    const result = await axios.get(NAVER_KANJI_URL, {
      params: { query: kanji },
      timeout: 3000,
    });
    const entries: { frequencyAdd?: unknown }[] | undefined = result.data?.searchResult;
    if (!entries?.length) return null;
    entries.forEach((entry) => {
      if (typeof entry.frequencyAdd === 'string') entry.frequencyAdd = toNewJlpt(entry.frequencyAdd);
    });
    return result.data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.warn('Naver API request cancelled');
    } else if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
      console.warn('Naver API timeout, falling back to DB');
    } else {
      console.warn('Naver API unavailable, falling back to DB');
    }
    return null;
  }
};

const fetchFromDB = async (kanji: string): Promise<object | null> => {
  const doc = await Kanji.findOne({ character: kanji });
  if (!doc) return null;

  const levelNum = doc.jlptLevel?.replace('N', '') ?? '';

  return {
    searchResult: [{
      handleEntry: doc.character,
      expAudioRead: toHiragana(doc.onRead ?? ''),
      expMeaningRead: doc.kunRead ?? '',
      // KANJIDIC2에는 한국어 훈이 없어 한국 한자음만 보낸다 — 이 한자가 든 단어의 뜻을 붙이면 훈이 틀린다(学 → '대학 학')
      expKoreanPron: doc.koreanPron ?? '',
      frequencyAdd: levelNum ? `JLPT ${levelNum}^` : '',
      meansCollector: [{ means: (doc.meanings ?? []).map((m) => ({ value: m, exampleOri: null, exampleTrans: null })) }],
    }],
  };
};

// 한자 풀이는 바뀌지 않으므로 찾은 결과를 기억해 같은 한자로 외부 사전을 다시 부르지 않는다
const CACHE_LIMIT = 2000;
const cache = new Map<string, object>();

const remember = (kanji: string, result: object) => {
  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
  cache.set(kanji, result);
};

export const searchKanji = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const kanji = req.query.kanji as string;
    const cached = cache.get(kanji);
    if (cached) {
      res.json(cached);
      return;
    }
    const fromNaver = await fetchFromNaver(kanji);
    // 외부 사전 결과만 기억한다 — DB 대체 결과는 외부 장애 중에 나오므로 기억하면 회복된 뒤에도 그 풀이가 남는다
    if (fromNaver) remember(kanji, fromNaver);
    res.json(fromNaver ?? await fetchFromDB(kanji) ?? { searchResult: [] });
  } catch (error) {
    next(new InternalServerError('Failed to search kanji'));
  }
};
