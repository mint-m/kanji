import { api } from '../services/apiClient';
import { lookupKanji } from '../components/OriginWord/kanjiDataFilter';

jest.mock('../services/apiClient', () => ({ api: { get: jest.fn() } }));

const NAVER = {
  searchResult: [{
    handleEntry: '学', expAudioRead: 'ガク', expMeaningRead: 'まなぶ', expKoreanPron: '배울 학',
    frequencyAdd: 'JLPT 5^', meansCollector: [{ means: [] }],
  }],
};

describe('lookupKanji', () => {
  beforeEach(() => jest.clearAllMocks());

  it('같은 한자는 한 번만 조회한다', async () => {
    (api.get as jest.Mock).mockResolvedValue(NAVER);
    const first = await lookupKanji('学');
    const second = await lookupKanji('学');
    expect(first).toEqual(expect.objectContaining({ kanji: '学', koreanPron: '배울 학', level: '5' }));
    expect(second).toBe(first);
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it('조회에 실패하면 기억하지 않고 다음에 다시 묻는다', async () => {
    (api.get as jest.Mock).mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(NAVER);
    expect(await lookupKanji('生')).toBeNull();
    expect(await lookupKanji('生')).toEqual(expect.objectContaining({ kanji: '学' }));
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it('사전에 없는 한자 → null', async () => {
    (api.get as jest.Mock).mockResolvedValue({ searchResult: [] });
    expect(await lookupKanji('鬱')).toBeNull();
  });
});
