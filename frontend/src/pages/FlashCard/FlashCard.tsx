import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import WordCardContainer from 'components/WordCardContainer';
import { useSelector } from 'react-redux';
import { RootState } from 'store';
import axios from 'axios';
import { WordType } from 'store/modules/deck';

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
  const [deck, setDeck] = useState<WordType[] | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`api/word/all`);
        setDeck(response.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, [level]);

  return (
    <Container>
      <h2>JLPT{level} / {step}</h2>
      {deck && <WordCardContainer deck={deck} />}
    </Container>
  );
};

export default FlashCard;
