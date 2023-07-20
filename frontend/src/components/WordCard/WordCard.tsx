import React from 'react';
import styled from 'styled-components';
import OriginWord from 'components/OriginWord';
import ControlPanel from 'components/ControlPanel';

export interface ShowType {
  type: 'Mean' | 'Hiragana';
}

export interface Word {
  tryNum?: number;
  pron: string;
  means: string[];
  entry: string;
}

interface WordCardProps {
  onKnowClick: (know: boolean) => void;
  onShowClick: (type: ShowType['type']) => void;
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
        <Hiragana $isVisible={showHiragana}>{word.entry}</Hiragana>
        <OriginWord word={word.pron} />
        {word.means.map((mean, index) => (
          <WordMean key={index} $isVisible={showMean}>
            {mean}
          </WordMean>
        ))}
      </WordContainer>
      <ControlPanel
        onShowClick={onShowClick}
        onKnowClick={onKnowClick}
        showMean={!showMean}
        showHiragana={!showHiragana}
      />
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

const Hiragana = styled.div<StyledVisibleProps>`
  font-size: 2rem;
  visibility: ${props => (props.$isVisible ? 'visible' : 'hidden')};
`;

const WordMean = styled.div<StyledVisibleProps>`
  font-size: 1.5rem;
  visibility: ${props => (props.$isVisible ? 'visible' : 'hidden')};
`;
