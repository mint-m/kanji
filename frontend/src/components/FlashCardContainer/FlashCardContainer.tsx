import React, { useCallback, useState } from 'react';
import { debounce } from 'lodash';
import FlashCard, { ShowType } from 'components/FlashCard';
import { WordType } from 'store/modules/deck';
import { useDispatch } from 'react-redux';
import * as kanjiActions from 'store/modules/kanji';
import ControlPanel from 'components/ControlPanel';

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
        dispatch(kanjiActions.reset());
        setShowMean(false);
        setShowHiragana(false);
    }, 200);

    const handleKnowClick = useCallback((know: boolean) => {
        // axios.patch(`/api/checkpoint/:${user}/:${know}/:${wordIndex}`)
        debouncedHandleKnowClick(know);
    }, [debouncedHandleKnowClick]);

    const handleShowClick = useCallback((type: ShowType['type']) => {
        type === 'Mean' ? setShowMean(true) : setShowHiragana(true);
    }, []);

    return (
        <>
            {deck.length > 0 && (
                <FlashCard
                    word={deck[wordIndex]}
                    showMean={showMean}
                    showHiragana={showHiragana}
                />

            )}
            <ControlPanel
                onShowClick={handleShowClick}
                onKnowClick={handleKnowClick}
                showMean={!showMean}
                showHiragana={!showHiragana}
            />
        </>
    );
});

export default FlashCardContainer;