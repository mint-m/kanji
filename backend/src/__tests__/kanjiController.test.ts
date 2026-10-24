jest.mock('axios', () => ({
  __esModule: true,
  default: { get: jest.fn(), isCancel: jest.fn(() => false), isAxiosError: jest.fn(() => false) },
}));
jest.mock('../models/kanji', () => ({ __esModule: true, default: { findOne: jest.fn() } }));
jest.mock('../models/word', () => ({ __esModule: true, default: { findOne: jest.fn() } }));

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

describe('searchKanji', () => {
  beforeEach(() => jest.clearAllMocks());

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
});
