import React from 'react';
import KanjiExample from './KanjiExample';
import KanjiEnter from './KanjiEnter';
import { RootState } from 'store';
import { useSelector } from 'react-redux';

const Kanji = () => {
  const kanjiData = useSelector((state: RootState) => state.kanji.kanjis);

  const kanjis = kanjiData?.map((kanji, index) => {
    return (
      <KanjiEnter
        key={index}
        kanji={kanji.kanji}
        level={kanji.level}
        koreanPron={kanji.koreanPron}
        onRead={kanji.onRead}
        kunRead={kanji.kunRead}
      >
        <KanjiExample />
      </KanjiEnter>
    )
  })

  return (
    <div>
      {kanjis}
    </div>
  );
};

export default Kanji;
