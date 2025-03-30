import axios from "axios";
import { KanjiDataType, Mean } from "store/modules/kanji";

const kanjiDataFilter = async (
  kanji: string
): Promise<KanjiDataType | null> => {
  try {
    // 수정된 API 경로 사용
    const response = await axios.get("api/words/kanjiSearch", { params: { kanji } });
    const { searchResult } = response.data;

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
    console.log(error);
    return null;
  }
};

export default kanjiDataFilter;