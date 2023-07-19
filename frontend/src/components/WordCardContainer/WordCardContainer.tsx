import React, { useCallback, useEffect, useState } from 'react';
import WordCard, { WordType, Word } from 'components/WordCard/WordCard';
import { styled } from 'styled-components';
import axios from 'axios';

const WordCardContainer = React.memo(() => {
    const [showMean, setShowMean] = useState<boolean>(false);
    const [showHiragana, setShowHiragana] = useState<boolean>(false);
    const [words, setWordData] = useState<Word[] | null>(null); // Define the type of 'words' as an array of Word or null

    const handleKnowClick = useCallback((know: boolean) => {
        setShowMean(false);
        setShowHiragana(false);
    }, []);

    const handleShowClick = useCallback((type: WordType['type']) => {
        type === 'Mean' ? setShowMean(true) : setShowHiragana(true);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('api/word/all');
                setWordData(response.data);
            } catch (error) {
                console.log(error);
            }
        };
        fetchData();
    }, []);

    return (
        <Container>
            {words && words.length > 0 && (
                <WordCard
                    onKnowClick={handleKnowClick}
                    onShowClick={handleShowClick}
                    word={words[0]} // Render the first word when available
                    showMean={showMean}
                    showHiragana={showHiragana}
                />
            )}
        </Container>
    );
});

export default WordCardContainer;

const Container = styled.div`
    height: 100vh
`;
