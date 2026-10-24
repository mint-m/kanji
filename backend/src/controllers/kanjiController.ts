import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import Kanji from '../models/kanji';
import Word from '../models/word';
import { InternalServerError } from '../utils/errors';
import { escapeRegex } from '../utils/regex';

const NAVER_KANJI_URL = 'https://ja.dict.naver.com/api3/jako/search/hanja';

const toHiragana = (str: string): string =>
  str.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

const fetchFromNaver = async (kanji: string): Promise<object | null> => {
  try {
    const result = await axios.get(NAVER_KANJI_URL, {
      params: { query: kanji },
      timeout: 3000,
    });
    return result.data?.searchResult?.length > 0 ? result.data : null;
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
  const wordWithKanji = await Word.findOne({ pron: { $regex: escapeRegex(kanji) } });
  const koreanMeaning = wordWithKanji?.means[0] ?? '';
  const expKoreanPron = [koreanMeaning, doc.koreanPron].filter(Boolean).join(' ');

  return {
    searchResult: [{
      handleEntry: doc.character,
      expAudioRead: toHiragana(doc.onRead ?? ''),
      expMeaningRead: doc.kunRead ?? '',
      expKoreanPron,
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
    const result = await fetchFromNaver(kanji) ?? await fetchFromDB(kanji);
    // 못 찾은 결과는 일시적인 외부 장애일 수 있어 기억하지 않는다
    if (result) remember(kanji, result);
    res.json(result ?? { searchResult: [] });
  } catch (error) {
    next(new InternalServerError('Failed to search kanji'));
  }
};
