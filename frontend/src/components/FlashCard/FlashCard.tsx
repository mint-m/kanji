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

  return (
    <Container>
      <CardContainer>
        <Hiragana $isVisible={showHiragana}>{word.entry}</Hiragana>
        {<OriginWord word={word.pron ? word.pron : word.entry} />}
        {word.means.map((mean, index) => (
          <WordMean key={index} $isVisible={showMean}>
            {mean}
          </WordMean>
        ))}
      </CardContainer>
    </Container>
  );
});

export default FlashCard;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const CardContainer = styled.div`
  width: 24rem;
  height: 24rem;
  padding: 4rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;

  border-radius: 0.5rem;
  ${props => props.theme.innerShadow}
`;

const Hiragana = styled.div<StyledVisibleProps>`
  font-size: 2rem;
  visibility: ${props => (props.$isVisible ? 'visible' : 'hidden')};
`;

const WordMean = styled.div<StyledVisibleProps>`
  font-size: 1.5rem;
  visibility: ${props => (props.$isVisible ? 'visible' : 'hidden')};
`;
