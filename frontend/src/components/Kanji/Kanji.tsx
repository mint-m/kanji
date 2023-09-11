import React from 'react';
import KanjiExample from './KanjiExample';
import KanjiEnter from './KanjiEnter';
import { RootState } from 'store';
import { useSelector } from 'react-redux';

const Kanji = () => {
  const kanjiData = useSelector((state: RootState) => state.kanji.kanji);

  return (
    <div>
      {kanjiData && (
        <KanjiEnter
          kanji={kanjiData.kanji}
          level={kanjiData.level}
          koreanPron={kanjiData.koreanPron}
          onRead={kanjiData.onRead}
          kunRead={kanjiData.kunRead}
        >
          <KanjiExample />
        </KanjiEnter>
      )}
    </div>
  );
};

export default Kanji;
