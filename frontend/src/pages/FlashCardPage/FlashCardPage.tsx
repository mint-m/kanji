import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'store';
import axios from 'axios';
import { WordType } from 'store/modules/deck';
import Kanji from 'components/Kanji';
import HeaderSection from 'components/HeaderSection';
import FlashCardContainer from 'components/FlashCardContainer';

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
    <div>
      <HeaderSection title={level} subtitle={`${step.min} ~ ${step.max}`} />
      <Kanji />
      {deck && <FlashCardContainer deck={deck} />}
    </div>
  );
};

export default FlashCardPage;