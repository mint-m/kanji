import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import Kanji from '../models/kanji';
import Word from '../models/word';
import { NotFoundError, InternalServerError } from '../utils/errors';

const NAVER_KANJI_URL = 'https://ja.dict.naver.com/api3/jako/search/hanja?query=';

const toHiragana = (str: string): string =>
  str.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

const fetchFromNaver = async (kanji: string): Promise<object | null> => {
  try {
    const result = await axios.get(NAVER_KANJI_URL + kanji);
    return result.data.searchResult?.length > 0 ? result.data : null;
  } catch {
    return null;
  }
};

const fetchFromDB = async (kanji: string): Promise<object | null> => {
  const doc = await Kanji.findOne({ character: kanji });
  if (!doc) return null;

  const levelNum = doc.jlptLevel.replace('N', '');
  const wordWithKanji = await Word.findOne({ pron: { $regex: kanji } });
  const koreanMeaning = wordWithKanji?.means[0] ?? '';
  const expKoreanPron = koreanMeaning ? `${koreanMeaning} ${doc.koreanPron}` : doc.koreanPron;

  return {
    searchResult: [{
      handleEntry: doc.character,
      expAudioRead: toHiragana(doc.onRead),
      expMeaningRead: doc.kunRead,
      expKoreanPron,
      frequencyAdd: levelNum ? `JLPT ${levelNum}^` : '',
      meansCollector: [{ means: doc.meanings.map((m) => ({ value: m, exampleOri: null, exampleTrans: null })) }],
    }],
  };
};

export const searchKanji = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const kanji = req.query.kanji as string;
    if (!kanji) return next(new NotFoundError('Kanji query parameter is required'));

    const result = await fetchFromNaver(kanji) ?? await fetchFromDB(kanji);
    res.json(result ?? { searchResult: [] });
  } catch (error) {
    next(new InternalServerError('Failed to search kanji'));
  }
};
