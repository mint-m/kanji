import axios from 'axios';
import { api } from 'services/apiClient';
import { KanjiDataType, Mean } from 'store/modules/kanji';

const kanjiDataFilter = async (kanji: string, signal?: AbortSignal): Promise<KanjiDataType | null> => {
  try {
    const data = await api.get('/api/words/kanjiSearch', { params: { kanji }, signal });
    const { searchResult } = data;

    if (searchResult.length > 0) {
      const kanjiData = searchResult[0];

      const extractedData: KanjiDataType = {
        kanji: kanjiData.handleEntry,
        onRead: kanjiData.expAudioRead,
        kunRead: kanjiData.expMeaningRead,
        koreanPron: kanjiData.expKoreanPron,
        level: (kanjiData.frequencyAdd as string).substring(5, 6),
        means:
          kanjiData.meansCollector?.[0]?.means.map((mean: Mean) => ({
            value: mean.value,
            exampleOri: mean.exampleOri,
            exampleTrans: mean.exampleTrans,
          })) || [],
      };

      return extractedData;
    }

    return null;
  } catch (error) {
    if (axios.isCancel(error)) throw error;
    console.log(error);
    return null;
  }
};

export default kanjiDataFilter;
