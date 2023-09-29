import React from 'react';
import styled from 'styled-components';
import OriginWord from 'components/OriginWord';

export interface ShowType {
  type: 'Mean' | 'Hiragana';
}

export interface Word {
  tryNum?: number;
  pron: string;
  means: string[];
  entry: string;
}

interface FlashCardProps {
  word: Word;
  showHiragana: boolean;
  showMean: boolean;
}

interface StyledVisibleProps {
  $isVisible: boolean;
}

const FlashCard = React.memo((props: FlashCardProps) => {
  const { word, showHiragana, showMean } = props;

  const means = word.means.map((mean, index) => (
    <WordMean key={index} $isVisible={showMean}>
      {mean}
    </WordMean>
  ))


  return (
    <CardContainer>
      <Hiragana $isVisible={showHiragana}>{word.entry}</Hiragana>
      {<OriginWord word={word.pron ? word.pron : word.entry} />}
      <div>
        {means}
      </div>
    </CardContainer>
  );
});

export default FlashCard;

const CardContainer = styled.div`
  width: 30rem;
  height: 30rem;
  text-align: center;

  display: flex;
  flex-direction: column;

  border-radius: 0.5rem;
  ${props => props.theme.innerShadow}
`;

const Hiragana = styled.div<StyledVisibleProps>`
  height: 35%;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  font-size: 2rem;
  visibility: ${props => (props.$isVisible ? 'visible' : 'hidden')};
`;

const WordMean = styled.div<StyledVisibleProps>`
  font-size: 1.5rem;
  visibility: ${props => (props.$isVisible ? 'visible' : 'hidden')};
`;
