import React from 'react';
import styled, { css } from 'styled-components';

export interface WordType {
  type: 'Mean' | 'Hiragana';
}

export interface Word {
  tryNum: number;
  targetWord: string;
  wordMean: string;
  hiragana: string;
}

interface WordCardProps {
  onKnowClick: (know: boolean) => void;
  onShowClick: (type: WordType['type']) => void;
  word: Word;
  showHiragana: boolean;
  showMean: boolean;
}

interface StyledVisibleProps {
  $isVisible: boolean;
}

const WordCard = React.memo((props: WordCardProps) => {
  const { word, showHiragana, showMean, onShowClick, onKnowClick } = props;

  const handleShowClick = (type: WordType['type']) => {
    onShowClick(type);
  };

  const handleKnowClick = (know: boolean) => {
    onKnowClick(know);
  };

  return (
    <CardContainer>
      <WordContainer>
        <Hiragana $isVisible={showHiragana}>{word.hiragana}</Hiragana>
        <OriginWord>{word.targetWord}</OriginWord>
        <WordMean $isVisible={showMean}>{word.wordMean}</WordMean>
      </WordContainer>
      <ControlPanel>
        <VisibleButton $isVisible={!showMean} onClick={() => handleShowClick('Mean')}>
          한글 뜻
        </VisibleButton>
        <VisibleButton $isVisible={!showHiragana} onClick={() => handleShowClick('Hiragana')}>
          요미가미
        </VisibleButton>
        <VisibleButton $isVisible={true} onClick={() => handleKnowClick(false)}>
          공부하겠습니다
        </VisibleButton>
        <VisibleButton $isVisible={true} onClick={() => handleKnowClick(true)}>
          외웠습니다
        </VisibleButton>
      </ControlPanel>
    </CardContainer>
  );
});

export default WordCard;

const CardContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const WordContainer = styled.div`
  width: 30rem;
  height: 30rem;
  margin: 0 auto;
  padding: 4rem;
  border: 1px solid;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const ControlPanel = styled.div`
  margin: 0 auto;
  padding: 1rem;
  display: grid;
  grid-template-columns: 2fr 2fr;
`;

const StyledButton = styled.button`
  display: flex;
  margin: 1rem;
  padding: 0.5rem 1rem;
  border: solid 1px #6495ED;
  border-radius: 0.5rem;
  justify-content: center;
  font-size: 1rem;
  background-color: aliceblue;
`;

const VisibleButton = styled(StyledButton) <StyledVisibleProps>`
  visibility: ${props => (props.$isVisible ? 'visible' : 'hidden')};
`;

const Hiragana = styled.div<StyledVisibleProps>`
  visibility: ${props => (props.$isVisible ? 'visible' : 'hidden')};
`;

const OriginWord = styled.div`
  font-size: 6rem;
`;

const WordMean = styled.div<StyledVisibleProps>`
  height: 4rem;
  visibility: ${props => (props.$isVisible ? 'visible' : 'hidden')};
`;
