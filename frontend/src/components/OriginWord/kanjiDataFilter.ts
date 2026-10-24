import { api } from 'services/apiClient';
import { KanjiDataType, Mean } from 'store/modules/kanji';

const fetchKanji = async (kanji: string): Promise<KanjiDataType | null> => {
  const { searchResult } = await api.get('/api/words/kanjiSearch', { params: { kanji } });
  if (!searchResult?.length) return null;

  const kanjiData = searchResult[0];
  return {
    kanji: kanjiData.handleEntry,
    onRead: kanjiData.expAudioRead,
    kunRead: kanjiData.expMeaningRead,
    koreanPron: kanjiData.expKoreanPron,
    level: (kanjiData.frequencyAdd as string | undefined)?.substring(5, 6) ?? '',
    means:
      kanjiData.meansCollector?.[0]?.means.map((mean: Mean) => ({
        value: mean.value,
        exampleOri: mean.exampleOri,
        exampleTrans: mean.exampleTrans,
      })) || [],
  };
};

// 한자 풀이는 누를 때만 조회하고, 같은 한자는 다시 묻지 않는다.
// 예전에는 카드에 나온 한자마다 곧바로 조회해 카드 한 장에 외부 사전 요청이 한자 수만큼 나갔다
const cache = new Map<string, Promise<KanjiDataType | null>>();

export const lookupKanji = (kanji: string): Promise<KanjiDataType | null> => {
  const cached = cache.get(kanji);
  if (cached) return cached;
  const request = fetchKanji(kanji).catch(() => {
    cache.delete(kanji); // 실패는 기억하지 않는다 — 다음에 누르면 다시 묻는다
    return null;
  });
  cache.set(kanji, request);
  return request;
};
