import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'store';
import axios from 'axios';
import { WordType } from 'store/modules/deck';
import Kanji from 'components/Kanji';
import HeaderSection from 'components/HeaderSection';
import FlashCardContainer from 'components/FlashCardContainer';
import styled from 'styled-components';
import CenterDiv from 'components/CommonStyled/CenterDiv';

const FlashCardPage = () => {
  const level = useSelector((state: RootState) => state.user.learningCheckpoint.level);
  const step = useSelector((state: RootState) => state.user.learningCheckpoint.step);
  const [deck, setDeck] = useState<WordType[] | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`api/word/level/4`);
        setDeck(response.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, [level]);

  return (
    <FlashCardWrap>
      <Kanji />
      <CenterDiv2>
        <HeaderSection title={level} subtitle={`${step.min} ~ ${step.max}`} />
        {deck && <FlashCardContainer deck={deck} />}
      </CenterDiv2>
    </FlashCardWrap>
  );
};

export default FlashCardPage;

const FlashCardWrap = styled.div`
  display: grid;
  height: 100vh;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
`;

const CenterDiv2 = styled(CenterDiv)`
  align-items: flex-start;
`