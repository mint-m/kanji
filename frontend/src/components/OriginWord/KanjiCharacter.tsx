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

  const isKanjiIncluded = useCallback((k: string): boolean => {
    return kanjis?.map((item) => item.kanji).includes(k) ?? false;
  }, [kanjis]);

  useEffect(() => {
    kanjiDataFilter(kanji)
      .then(setKanjiData)
      .catch(console.log);
  }, [kanji]);

  const handleOnClick = useCallback(() => {
    if (kanjiData && !isKanjiIncluded(kanjiData.kanji)) {
      dispatch(kanjiActions.addKanji(kanjiData));
    }
  }, [dispatch, kanjiData, isKanjiIncluded]);

  return (
    <div
      className={kanjiData ? styles.kanjiChar : styles.plainChar}
      onClick={handleOnClick}
    >
      {kanji}
    </div>
  );
};

export default KanjiCharacter;
