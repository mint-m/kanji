import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import WordCardContainer from 'components/WordCardContainer';
import { useSelector } from 'react-redux';
import { RootState } from 'store';
import axios from 'axios';
import { WordType } from 'store/modules/deck';
import Kanji from 'components/Kanji';

const FlashCard = () => {
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
      <Title>{level} / {step.min} ~ {step.max}</Title>
      <Kanji />
      {deck && <WordCardContainer deck={deck} />}
    </FlashCardWrap>
  );
};

export default FlashCard;

const FlashCardWrap = styled.div`
  display: grid;
  height: 100vh;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr) ;
`;

const Title = styled.h1`
  grid-column-start: 1;
  grid-column-end: 4;
  text-align: center;
`;
