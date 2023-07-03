import React, { useCallback } from 'react';
import styled, { css } from 'styled-components';

export interface WordType {
  type: 'Mean' | 'Hiragana';
}

export interface IWord {
  tryNum: number;
  targetWord: string;
  wordMean: string;
  hiragana: string;
}

interface WordCardProps {
  onKnowClick: (know: boolean) => void;
  onShowClick: (type: WordType['type']) => void;
  word: {
    hiragana: string;
    targetWord: string;
    wordMean: string;
    tryNum: number;
  };
  showHiragana: boolean;
  showMean: boolean;
}

interface StyledVisibleProps {
  $isVisible: boolean;
}

const WordCard = React.memo((props: WordCardProps) => {
  const handleKnowClick = useCallback((know: boolean) => {
    props.onKnowClick(know);
  }, [props]);

  const handleShowClick = useCallback((type: WordType['type']) => {
    props.onShowClick(type);
  }, [props]);

  return (
    <div>
      <WordDiv>
        <Hiragana $isVisible={props.showHiragana}>{props.word.hiragana}</Hiragana>
        <OriginWord>{props.word.targetWord}</OriginWord>
        <WordMean $isVisible={props.showMean}>{props.word.wordMean}</WordMean>
      </WordDiv>
      <ControlPanel>
        <VisibleButton $isVisible={!props.showMean} onClick={() => props.onShowClick('Mean')}>
          한글 뜻
        </VisibleButton>
        <VisibleButton $isVisible={!props.showHiragana} onClick={() => props.onShowClick('Hiragana')}>
          요미가미
        </VisibleButton>
        <VisibleButton $isVisible={true} onClick={() => props.onKnowClick(false)}>
          공부하겠습니다
        </VisibleButton>
        <VisibleButton $isVisible={true} onClick={() => props.onKnowClick(true)}>
          외웠습니다
        </VisibleButton>
      </ControlPanel>
    </div>
  );
});

export default WordCard;

const Word = styled.div`
  /* 공통 스타일 */
  ${css`
    display: flex;
    justify-content: center;
    padding: 0rem 1rem 1rem 1rem;
    font-size: 2rem;
  `}
`;

const Hiragana = styled(Word) <StyledVisibleProps>`
  visibility: ${props => (props.$isVisible ? 'visible' : 'hidden')};
`;

const OriginWord = styled(Word)`
  /* 추가 스타일 */
  ${css`
    font-size: 6rem;
  `}
`;

const WordMean = styled(Word) <StyledVisibleProps>`
  /* 추가 스타일 */
  ${css`
    height: 4rem;
  `}

  visibility: ${props => (props.$isVisible ? 'visible' : 'hidden')};
`;

const WordDiv = styled.div`
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

const VisibleButton = styled.button<StyledVisibleProps>`
  display: flex;
  margin: 1rem;
  padding: 0.5rem 1rem;
  border: solid 1px #6495ED;
  border-radius: 0.5rem;
  justify-content: center;
  font-size: 1rem;
  background-color: aliceblue;
  visibility: ${props => (props.$isVisible ? 'visible' : 'hidden')};
`;
