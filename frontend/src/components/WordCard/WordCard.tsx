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
    font-size: 5rem;
`

const JpToKo = styled(Word)`
`

const WordDiv = styled.div`
    margin: 0 auto;
    padding: 4rem;
    width: fit-content;
    border: 1px solid;
`
const ControlPannal = styled.div`
    margin: 0 auto;
    padding: 4rem;
    display: grid;
    grid-template-columns: 2fr 2fr;

    & > button {
        display: flex;
        margin: 1rem;
        padding: 0.5rem 1rem;
        border: solid 1px #6495ED;
        border-radius: 0.5rem;
        justify-content: center;
        font-size: 1rem;
        background-color: aliceblue;
    }
`