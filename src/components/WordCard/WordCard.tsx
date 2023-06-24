import React from 'react';
import styled from 'styled-components';

interface WordCardProps {
    JpWordRead: string;
    JpWord: string;
    JpWordKoreanMean: string;
}

const WordCard = (props: WordCardProps) => {
    return (
        <WordDiv>
            <WordDiv>
                <Word>{props.JpWordRead}</Word>
                <JpWord>{props.JpWord}</JpWord>
                <JpToKo>{props.JpWordKoreanMean}</JpToKo>
            </WordDiv>
            <ControlPannal>
                <button>한글 뜻</button>
                <button>요미가미</button>
                <button>공부하겠습니다</button>
                <button>외웠습니다</button>
            </ControlPannal>
        </WordDiv>
    );
};

export default WordCard;

const Word = styled.div`
    display: flex;
    justify-content: center;
    padding: 0rem 1rem 1rem 1rem;
    font-size: 2rem;
`

const JpWord = styled(Word)`
    font-size: 3rem;
`

const JpToKo = styled(Word)`
`

const WordDiv = styled.div`
    margin: 0 auto;
    padding: 4rem;
    width: fit-content;
    display: inline-flexbox;
    border: 1px solid;
`
const ControlPannal = styled.div`
    margin: 0 auto;
    padding: 4rem;
    width: fit-content;
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
`