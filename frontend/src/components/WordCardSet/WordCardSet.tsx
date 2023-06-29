import React, { useState } from 'react';
import styled from 'styled-components';
import WordCard, { WordType } from 'components/WordCard/WordCard';

interface Word {
    tryNum: number;
    wordOrigin: string;
    wordMean: string;
    hiragana: string;
}

const WordSet: Word[] = JSON.parse(`[{
    "hiragana": "あい",
    "wordOrigin": "[愛]",
    "wordMean": "[명사]사랑;애정",
    "tryNum": 0
}]`);

const WordCardSet = () => {
    const [showMean, setShowMean] = useState(false);
    const [showHiragana, setShowHiragana] = useState(false);

    const handleKnowClick = (know: boolean) => {
        setShowMean(false);
        setShowHiragana(false);
    }

    const handleShowClick = (type: WordType['type']) => {
        type === 'Mean' ? setShowMean(true) : setShowHiragana(true);
    }

    return (
        <div>
            <WordCard
                onKnowClick={handleKnowClick}
                onShowClick={handleShowClick}
                word={WordSet[0]}
                showMean={showMean}
                showHiragana={showHiragana}
            />
        </div>
    );
};

export default WordCardSet;