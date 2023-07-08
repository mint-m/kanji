import React from 'react';
import styled from 'styled-components';

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
  return (
    <CardContainer>
      <WordContainer>
        <Hiragana $isVisible={showHiragana}>{word.hiragana}</Hiragana>
        <OriginWord>{word.targetWord}</OriginWord>
        <WordMean $isVisible={showMean}>{word.wordMean}</WordMean>
      </WordContainer>
      <ControlPanel>
        <VisibleButton $isVisible={!showMean} onClick={() => onShowClick('Mean')}>
          한글 뜻
        </VisibleButton>
        <VisibleButton $isVisible={!showHiragana} onClick={() => onShowClick('Hiragana')}>
          요미가미
        </VisibleButton>
        <VisibleButton $isVisible={true} onClick={() => onKnowClick(false)}>
          공부하겠습니다
        </VisibleButton>
        <VisibleButton $isVisible={true} onClick={() => onKnowClick(true)}>
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
  height: 100vh;
`;

const WordContainer = styled.div`
  width: 20rem;
  height: 20rem;
  margin: 0 auto;
  padding: 4rem;
  border: 1px solid;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
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
  font-size: 2rem;
  visibility: ${props => (props.$isVisible ? 'visible' : 'hidden')};
`;

const OriginWord = styled.div`
  font-size: 6rem;
`;

const WordMean = styled.div<StyledVisibleProps>`
  font-size: 1.5rem;
  visibility: ${props => (props.$isVisible ? 'visible' : 'hidden')};
`;
