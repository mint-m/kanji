import React from 'react';
import KanjiExample from './KanjiExample';
import KanjiEnter from './KanjiEnter';
import { styled } from 'styled-components';
import { RootState } from 'store';
import { useSelector } from 'react-redux';

const Kanji = () => {
  const kanjiData = useSelector((state: RootState) => state.kanji.kanji);

  return (
    <KanjiStyle>
      {kanjiData && (
        <KanjiEnter
          kanji={kanjiData.kanji}
          grade={kanjiData.grade}
          koreanPron={kanjiData.koreanPron}
          onRead={kanjiData.onRead}
          kunRead={kanjiData.kunRead}
        >
          <KanjiExample />
        </KanjiEnter>
      )}
    </KanjiStyle>
  );
};

export default Kanji;

const KanjiStyle = styled.div`
`;
