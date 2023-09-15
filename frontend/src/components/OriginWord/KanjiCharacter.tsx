import React, { useEffect, useState } from 'react';
import { styled } from 'styled-components';
import * as kanjiActions from 'store/modules/kanji';
import { useDispatch, useSelector } from 'react-redux';
import kanjiFilter from './kanjiDataFilter';
import { RootState } from 'store';

interface KanjiCharacterProps {
  kanji: string;
}

const KanjiCharacter: React.FC<KanjiCharacterProps> = (props) => {
  const dispatch = useDispatch();
  const kanjis = useSelector((state: RootState) => state.kanji.kanjis);
  const [kanjiData, setKanjiData] = useState<kanjiActions.KanjiDataType | null>(null);

  const isKanjiIncluded = React.useCallback((kanji: string): boolean => {
    const kanjiList = kanjis?.map((item) => item.kanji);
    return kanjiList.includes(kanji);
  }, [kanjis]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await kanjiFilter(props.kanji);
        setKanjiData(data);
      } catch (err) {
        console.log(err);
      }
    };

    if (kanjiData === null) {
      fetchData();
    }
  }, [props.kanji, kanjiData]);

  const handleOnClick = React.useCallback(() => {
    if (kanjiData && !isKanjiIncluded(kanjiData.kanji)) {
      dispatch(kanjiActions.addKanji(kanjiData));
    }
  }, [dispatch, kanjiData, isKanjiIncluded]);

  return (
    kanjiData && (
      <KanjiDiv onClick={handleOnClick}>
        {props.kanji}
      </KanjiDiv>
    )
  )
};

export default KanjiCharacter;

const KanjiDiv = styled.div`
  cursor: pointer;
`;
