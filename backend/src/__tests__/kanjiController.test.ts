jest.mock('axios', () => ({
  __esModule: true,
  default: { get: jest.fn(), isCancel: jest.fn(() => false), isAxiosError: jest.fn(() => false) },
}));
jest.mock('../models/kanji', () => ({ __esModule: true, default: { findOne: jest.fn() } }));

import { Request, Response } from 'express';
import axios from 'axios';
import Kanji from '../models/kanji';
import { searchKanji } from '../controllers/kanjiController';

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};
const search = async (kanji: string) => {
  const res = makeRes();
  await searchKanji({ query: { kanji } } as unknown as Request, res, jest.fn());
  return (res.json as jest.Mock).mock.calls[0][0];
};

const NAVER = { searchResult: [{ handleEntry: '学' }] };
const KANJIDIC = { character: '楽', onRead: 'ガク·ラク', kunRead: 'たの.しい', koreanPron: '락, 악, 요', jlptLevel: 'N4', meanings: ['music'] };

describe('searchKanji', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('찾은 결과는 기억해 같은 한자로 외부 사전을 다시 부르지 않는다', async () => {
    (axios.get as jest.Mock).mockResolvedValue({ data: NAVER });
    expect(await search('学')).toEqual(NAVER);
    expect(await search('学')).toEqual(NAVER);
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it('외부 사전·DB 모두 없으면 빈 결과, 기억하지 않는다', async () => {
    (axios.get as jest.Mock).mockResolvedValue({ data: { searchResult: [] } });
    (Kanji.findOne as jest.Mock).mockResolvedValue(null);
    expect(await search('鬱')).toEqual({ searchResult: [] });
    expect(await search('鬱')).toEqual({ searchResult: [] });
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it('외부 사전 장애 시 DB 대체 결과는 한국 한자음만 — 이 한자가 든 다른 단어의 뜻을 훈으로 붙이지 않는다', async () => {
    (axios.get as jest.Mock).mockRejectedValue(new Error('network'));
    (Kanji.findOne as jest.Mock).mockResolvedValue(KANJIDIC);
    const [entry] = (await search('楽')).searchResult;
    expect(entry.handleEntry).toBe('楽');
    expect(entry.expKoreanPron).toBe('락, 악, 요');
    expect(entry.frequencyAdd).toBe('JLPT 4^');
  });

  it('DB 대체 결과는 기억하지 않는다 — 외부 사전이 회복되면 그쪽 풀이를 보여 준다', async () => {
    (axios.get as jest.Mock).mockRejectedValueOnce(new Error('network'));
    (Kanji.findOne as jest.Mock).mockResolvedValue({ ...KANJIDIC, character: '音' });
    expect((await search('音')).searchResult[0].expKoreanPron).toBe('락, 악, 요');

    const recovered = { searchResult: [{ handleEntry: '音', expKoreanPron: '소리 음' }] };
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: recovered });
    expect(await search('音')).toEqual(recovered);
    expect(axios.get).toHaveBeenCalledTimes(2);
  });
});
