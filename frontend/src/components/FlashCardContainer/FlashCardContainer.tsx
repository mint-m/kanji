import React, { useCallback, useState } from 'react';
import { debounce } from 'lodash';
import FlashCard, { ShowType } from 'components/FlashCard';
import { WordType } from 'store/modules/deck';
import { useDispatch } from 'react-redux';
import * as kanjiActions from 'store/modules/kanji';

interface FlashCardContainerProps {
    deck: WordType[];
}

const FlashCardContainer: React.FC<FlashCardContainerProps> = React.memo((props: FlashCardContainerProps) => {
    const [wordIndex, setWordIndex] = useState<number>(0);
    const [showMean, setShowMean] = useState<boolean>(false);
    const [showHiragana, setShowHiragana] = useState<boolean>(false);

    const dispatch = useDispatch();
    const deck = props.deck;

    const debouncedHandleKnowClick = debounce((know: boolean) => {
        setWordIndex((prevIndex) => {
            const nextIndex = prevIndex + 1;
            return nextIndex >= deck.length ? prevIndex : nextIndex;
        });
        setShowMean(false);
        setShowHiragana(false);
        dispatch(kanjiActions.reset());
    }, 200);

    const handleKnowClick = useCallback(() => {
        debouncedHandleKnowClick(true);
    }, [debouncedHandleKnowClick]);

    const handleShowClick = useCallback((type: ShowType['type']) => {
        type === 'Mean' ? setShowMean(true) : setShowHiragana(true);
    }, []);

    return (
        <>
            {deck.length > 0 && (
                <FlashCard
                    onKnowClick={handleKnowClick}
                    onShowClick={handleShowClick}
                    word={deck[wordIndex]}
                    showMean={showMean}
                    showHiragana={showHiragana}
                />
            )}
        </>
    );
});

export default FlashCardContainer;