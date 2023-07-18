import React from 'react';
import styled from 'styled-components';
import WordCardContainer from 'components/WordCardContainer';
import { useSelector } from 'react-redux';
import { RootState } from 'store';
import KanjiMean from 'components/KanjiMean';

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
    </Container>
  );
};

export default FlashCard;
