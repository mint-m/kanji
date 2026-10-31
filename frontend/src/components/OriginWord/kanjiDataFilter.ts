import type { Dispatch } from '@reduxjs/toolkit';
import { api } from 'services/apiClient';
import { addKanji, KanjiDataType, Mean } from 'store/modules/kanji';

const fetchKanji = async (kanji: string): Promise<KanjiDataType | null> => {
  const { searchResult } = await api.get('/api/words/kanjiSearch', { params: { kanji } });
  if (!searchResult?.length) return null;

  const kanjiData = searchResult[0];
  return {
    kanji: kanjiData.handleEntry,
    onRead: kanjiData.expAudioRead,
    kunRead: kanjiData.expMeaningRead,
    koreanPron: kanjiData.expKoreanPron,
    // 'JLPT 5^GRADE 1^…'(서버가 새 등급으로 옮겨 준다). JLPT에 없는 한자(鬱)는 'GRADE …'로 시작해 등급을 비운다
    level: /^JLPT (\d)/.exec(kanjiData.frequencyAdd ?? '')?.[1] ?? '',
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

// 한자를 눌렀을 때와 K 단축키가 함께 쓴다. 풀이가 없어도 패널에 알린다 — 예전에는 글자 모양만 바뀌어 고장 난 것처럼 보였다(蕎)
// 조회는 순서대로 패널에 넣는다 — 연달아 누르면 먼저 끝난 조회가 앞에 오던 것을 막는다
let showQueue: Promise<void> = Promise.resolve();
export const showKanji = (kanji: string, dispatch: Dispatch): Promise<void> => {
  const lookup = lookupKanji(kanji);
  showQueue = showQueue.then(async () => {
    const data = await lookup;
    dispatch(addKanji(data ?? { kanji, level: '', koreanPron: '', means: [], missing: true }));
  });
  return showQueue;
};
