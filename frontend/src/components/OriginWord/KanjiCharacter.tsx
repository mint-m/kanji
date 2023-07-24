import React, { useEffect, useState } from 'react';
import { styled } from 'styled-components';
import * as kanjiActions from 'store/modules/kanji';
import { useDispatch } from 'react-redux';
import kanjiFilter from './kanjiDataFilter';

interface KanjiCharacterProps {
  kanji: string;
}

const KanjiCharacter: React.FC<KanjiCharacterProps> = (props) => {
  const dispatch = useDispatch();
  const [kanjiData, setKanjiData] = useState<kanjiActions.KanjiDataType | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await kanjiFilter(props.kanji);
        setKanjiData(data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchData();
  }, [props.kanji]);

  const handleOnClick = React.useCallback((kanji: string) => {
    kanjiData && dispatch(kanjiActions.setKanji(kanjiData));
  }, [dispatch, kanjiData]);

  return (
    kanjiData && <KanjiDiv onClick={() => handleOnClick(kanjiData.kanji)}>
      {props.kanji}
    </KanjiDiv>
  )
};

export default KanjiCharacter;

const KanjiDiv = styled.div`
  cursor: pointer;
`;
