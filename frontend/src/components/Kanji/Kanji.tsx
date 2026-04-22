import { useEffect } from 'react';
import KanjiExample from './KanjiExample';
import KanjiCard from './KanjiCard';
import { RootState } from 'store';
import { useSelector, useDispatch } from 'react-redux';
import { reset } from 'store/modules/kanji';
import { kanjiList } from './Kanji.css';

const Kanji = () => {
  const dispatch = useDispatch();
  const kanjiData = useSelector((state: RootState) => state.kanji.kanjis);

  useEffect(() => {
    return () => { dispatch(reset()); };
  }, [dispatch]);

  return (
    <div className={kanjiList}>
      {kanjiData?.map((kanji, index) => (
        <KanjiCard
          key={index}
          kanji={kanji.kanji}
          level={kanji.level}
          koreanPron={kanji.koreanPron}
          onRead={kanji.onRead}
          kunRead={kanji.kunRead}
        >
          <KanjiExample />
        </KanjiCard>
      ))}
    </div>
  );
};

export default Kanji;
