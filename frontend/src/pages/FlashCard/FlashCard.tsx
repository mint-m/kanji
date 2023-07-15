import React from 'react';
import styled from 'styled-components';
import WordCardContainer from 'components/WordCardContainer';
import { useSelector } from 'react-redux';
import { RootState } from 'store';
import Kanji from 'components/Kanji';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
`;

const FlashCard = () => {
  const level = useSelector((state: RootState) => state.level.level);
  const step = useSelector((state: RootState) => state.level.step);

  return (
    <Container>
      <h2>{level} / {step}</h2>
      <WordCardContainer />
      <Kanji kanji='昔' />
    </Container>
  );
};

export default FlashCard;
