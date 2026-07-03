import { FC, useCallback, useEffect, useState } from 'react';
import * as kanjiActions from 'store/modules/kanji';
import { useDispatch, useSelector } from 'react-redux';
import kanjiDataFilter from './kanjiDataFilter';
import { RootState } from 'store';
import * as styles from './OriginWord.css';

interface KanjiCharacterProps {
  kanji: string;
}

const KanjiCharacter: FC<KanjiCharacterProps> = ({ kanji }) => {
  const dispatch = useDispatch();
  const kanjis = useSelector((state: RootState) => state.kanji.kanjis);
  const [kanjiData, setKanjiData] = useState<kanjiActions.KanjiDataType | null>(null);
  const [lookupDone, setLookupDone] = useState(false);

  const isKanjiIncluded = useCallback((k: string): boolean => {
    return kanjis?.map((item) => item.kanji).includes(k) ?? false;
  }, [kanjis]);

  useEffect(() => {
    const controller = new AbortController();
    setLookupDone(false);
    // 글자가 바뀌면 이전 조회 결과를 즉시 비운다 — 새 fetch 완료 전 클릭 시 이전 한자가 추가되는 것 방지
    setKanjiData(null);

    kanjiDataFilter(kanji, controller.signal)
      .then((data) => {
        setKanjiData(data);
        setLookupDone(true);
      })
      .catch((err) => {
        if (!controller.signal.aborted) console.log(err);
      });

    return () => controller.abort();
  }, [kanji]);

  const handleOnClick = useCallback(() => {
    if (kanjiData && !isKanjiIncluded(kanjiData.kanji)) {
      dispatch(kanjiActions.addKanji(kanjiData));
    }
  }, [dispatch, kanjiData, isKanjiIncluded]);

  const charClass = kanjiData
    ? styles.kanjiChar
    : lookupDone
      ? styles.notFoundChar
      : styles.plainChar;

  return (
    <div
      className={charClass}
      onClick={handleOnClick}
      title={lookupDone && !kanjiData ? '한자 정보 없음' : undefined}
    >
      {kanji}
    </div>
  );
};

export default KanjiCharacter;
