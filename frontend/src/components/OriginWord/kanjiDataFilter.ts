import axios from "axios";
import { KanjiDataType, Mean } from "store/modules/kanji";

const kanjiFilter = async (kanji: string): Promise<KanjiDataType | null> => {
  try {
    const response = await axios.get("api/kanji", { params: { kanji } });
    const { searchResult } = response.data;

    if (searchResult.length > 0) {
      const kanjiData = searchResult[0];

      const extractedData: KanjiDataType = {
        kanji: kanjiData.handleEntry,
        onRead: kanjiData.expAudioRead,
        kunRead: kanjiData.expMeaningRead,
        koreanPron: kanjiData.expKoreanPron,
        grade: (kanjiData.frequencyAdd as string).substring(5, 6),
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

export default kanjiFilter;
