import React, { useEffect } from 'react';
import KanjiExample from './KanjiExample';
import KanjiEnter from './KanjiCard';
import { RootState } from 'store';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { reset } from 'store/modules/kanji';

const Kanji = () => {
  const dispatch = useDispatch();
  const kanjiData = useSelector((state: RootState) => state.kanji.kanjis);

  // 컴포넌트 언마운트 시 kanji 데이터 초기화
  useEffect(() => {
    // 컴포넌트가 언마운트될 때 실행되는 클린업 함수
    return () => {
      dispatch(reset());
    };
  }, [dispatch]);

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
    <KanjisWarp>
      {kanjis}
    </KanjisWarp>
  );
};

export default Kanji;

const KanjisWarp = styled.div`
  margin-top: 4rem;
  width: 100%;
  align-self: start;
`