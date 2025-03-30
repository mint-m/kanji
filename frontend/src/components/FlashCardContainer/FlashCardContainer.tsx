import React, { useCallback, useState, useEffect, useRef } from 'react';
import { debounce } from 'lodash';
import FlashCard, { ShowType } from 'components/FlashCard';
import { WordType } from 'store/modules/deck';
import { useDispatch, useSelector } from 'react-redux';
import * as kanjiActions from 'store/modules/kanji';
import ControlPanel from 'components/ControlPanel';
import axios from 'axios';
import { RootState } from 'store';
import styled from 'styled-components';

// Learning status types
type LearningStatus = 'mastered' | 'learning' | 'difficult';

// Learning progress item interface
interface LearningItem {
    wordId: string;
    timestamp: number;
    status: LearningStatus;
    level: string;
    step: number;
}

interface FlashCardContainerProps {
    deck: WordType[];
}

const FlashCardContainer: React.FC<FlashCardContainerProps> = React.memo((props: FlashCardContainerProps) => {
    // State for the current word being shown
    const [wordIndex, setWordIndex] = useState<number>(0);
    const [showMean, setShowMean] = useState<boolean>(false);
    const [showHiragana, setShowHiragana] = useState<boolean>(false);

    // Learning stats
    const [masteredCount, setMasteredCount] = useState<number>(0);
    const [learningCount, setLearningCount] = useState<number>(0);

    // Ref for batch queue
    const learningQueueRef = useRef<LearningItem[]>([]);

    // Timer ref for batch sending
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // User and learning state from Redux
    const user = useSelector((state: RootState) => state.user);
    const dispatch = useDispatch();
    const deck = props.deck;

    // Function to send learning data to server
    const sendLearningDataToServer = useCallback(async (): Promise<void> => {
        const queue = learningQueueRef.current;
        if (queue.length === 0) return;

        try {
            const token = localStorage.getItem('token');
            const userId = JSON.parse(localStorage.getItem('user') || '{}')._id;

            if (!token || !userId) {
                console.warn('User not authenticated, learning data not saved');
                return;
            }

            await axios.post(
                '/api/learning/progress',
                { items: queue },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            // Clear queue after successful send
            learningQueueRef.current = [];

            // Update checkpoint if needed
            // This could be moved to the backend for more sophisticated progress tracking
            if (deck.length > 0 && wordIndex >= deck.length - 1) {
                // End of deck, update checkpoint
                const checkpoint = { ...user.learningCheckpoint };

                // Simple logic: if mastered > 80% of cards, move to next step
                const masteryRate = masteredCount / (masteredCount + learningCount);

                if (masteryRate > 0.8 && checkpoint.step.max < (deck[0].step || 1)) {
                    // Advance to next step
                    checkpoint.step = {
                        min: checkpoint.step.max + 1,
                        max: checkpoint.step.max + 1
                    };

                    await axios.patch(
                        `/api/checkpoint/${userId}`,
                        { checkpoint },
                        { headers: { 'Authorization': `Bearer ${token}` } }
                    );
                }
            }
        } catch (error) {
            console.error('Failed to send learning data:', error);
        }
    }, [deck, wordIndex, user.learningCheckpoint, masteredCount, learningCount]);

    // Set up timer for periodic sending
    useEffect(() => {
        // Send data every 30 seconds
        timerRef.current = setInterval(sendLearningDataToServer, 30000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            // Send any remaining data when component unmounts
            sendLearningDataToServer();
        };
    }, [sendLearningDataToServer]);

    // Set up beforeunload handler
    useEffect(() => {
        const handleBeforeUnload = (): void => {
            // Attempt to sync data before page unloads
            sendLearningDataToServer();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [sendLearningDataToServer]);

    // Handle "I know" / "I don't know" button clicks
    const debouncedHandleKnowClick = debounce((know: boolean) => {
        // Current word information
        if (deck.length > 0 && wordIndex < deck.length) {
            const currentWord = deck[wordIndex];

            // Create learning item
            const learningStatus: LearningStatus = know ? 'mastered' : 'learning';

            // Update stats
            if (know) {
                setMasteredCount(prev => prev + 1);
            } else {
                setLearningCount(prev => prev + 1);
            }

            // Add to queue
            learningQueueRef.current.push({
                wordId: currentWord.origin_entry_id,
                timestamp: Date.now(),
                status: learningStatus,
                level: currentWord.level,
                step: currentWord.step || 1
            });

            // Send to server if queue gets large
            if (learningQueueRef.current.length >= 10) {
                sendLearningDataToServer();
            }
        }

        // Move to next word
        setWordIndex(prevIndex => {
            const nextIndex = prevIndex + 1;
            return nextIndex >= deck.length ? prevIndex : nextIndex;
        });

        // Reset UI state
        dispatch(kanjiActions.reset());
        setShowMean(false);
        setShowHiragana(false);
    }, 200);

    // Handler for know/don't know buttons
    const handleKnowClick = useCallback((know: boolean) => {
        debouncedHandleKnowClick(know);
    }, [debouncedHandleKnowClick]);

    // Handler for show buttons
    const handleShowClick = useCallback((type: ShowType['type']) => {
        type === 'Mean' ? setShowMean(true) : setShowHiragana(true);
    }, []);

    // Check if we've reached the end of the deck
    const isEndOfDeck = wordIndex >= deck.length - 1;

    return (
        <>
            {deck.length > 0 && (
                <>
                    <FlashCard
                        word={deck[wordIndex]}
                        showMean={showMean}
                        showHiragana={showHiragana}
                    />

                    {isEndOfDeck ? (
                        <CompletionMessage>
                            <h3>All cards completed!</h3>
                            <p>Mastered: {masteredCount}</p>
                            <p>Still learning: {learningCount}</p>
                            <RestartButton onClick={() => {
                                setWordIndex(0);
                                setMasteredCount(0);
                                setLearningCount(0);
                                dispatch(kanjiActions.reset());
                                setShowMean(false);
                                setShowHiragana(false);
                            }}>
                                Restart Deck
                            </RestartButton>
                        </CompletionMessage>
                    ) : (
                        <ControlPanel
                            onShowClick={handleShowClick}
                            onKnowClick={handleKnowClick}
                            showMean={!showMean}
                            showHiragana={!showHiragana}
                        />
                    )}
                </>
            )}
        </>
    );
});

export default FlashCardContainer;

// Styled components
const CompletionMessage = styled.div`
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: #f0f7ff;
  border-radius: 0.5rem;
  text-align: center;
  ${props => props.theme.outerShadow}
  
  h3 {
    margin-top: 0;
    color: #2c3e50;
  }
  
  p {
    margin: 0.5rem 0;
    font-size: 1.1rem;
  }
`;

const RestartButton = styled.button`
  background-color: #e6eaed;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  margin-top: 1rem;
  cursor: pointer;
  font-size: 1rem;
  ${props => props.theme.outerShadow}
  
  &:hover {
    background-color: #d9e1e7;
  }
`;