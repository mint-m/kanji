import React, { useCallback, useState } from 'react';
import { debounce } from 'lodash';
import WordCard, { ShowType } from 'components/WordCard/WordCard';
import { styled } from 'styled-components';
import { WordType } from 'store/modules/deck';
import { useDispatch } from 'react-redux';
import * as kanjiActions from 'store/modules/kanji';


const WordCardContainer = React.memo((props: { deck: WordType[] | null }) => {
    const [wordIndex, setWordIndex] = useState<number>(0);
    const [showMean, setShowMean] = useState<boolean>(false);
    const [showHiragana, setShowHiragana] = useState<boolean>(false);

    const dispatch = useDispatch();


    const deck = props.deck;

    const debouncedHandleKnowClick = debounce((know: boolean) => {
        if (deck && deck.length > wordIndex) {
            setWordIndex((prevIndex) => {
                const nextIndex = prevIndex + 1;
                return nextIndex >= deck.length ? prevIndex : nextIndex;
            });
        }
        setShowMean(false);
        setShowHiragana(false);
        dispatch(kanjiActions.reset())
    }, 60);

    const handleKnowClick = useCallback(debouncedHandleKnowClick, [wordIndex, deck, debouncedHandleKnowClick]);
    const handleShowClick = useCallback((type: ShowType['type']) => {
        type === 'Mean' ? setShowMean(true) : setShowHiragana(true);
    }, []);

    return (
        <Container>
            {deck && deck.length > 0 && (
                <WordCard
                    onKnowClick={handleKnowClick}
                    onShowClick={handleShowClick}
                    word={deck[wordIndex]}
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
