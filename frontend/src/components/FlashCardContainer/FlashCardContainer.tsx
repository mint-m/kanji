import { FC, memo, useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import FlashCard, { ShowType } from 'components/FlashCard';
import ControlPanel from 'components/ControlPanel';
import { DeckWord } from 'services/types';
import * as kanjiActions from 'store/modules/kanji';
import progressService from 'services/progressService';
import * as styles from './FlashCardContainer.css';

interface FlashCardContainerProps {
  deck: DeckWord[];
  progressType: 'main' | 'sub';
  initialIndex: number;
}

const FlashCardContainer: FC<FlashCardContainerProps> = memo(
  ({ deck, progressType, initialIndex }) => {
    const [wordIndex, setWordIndex] = useState(initialIndex);
    const [showMean, setShowMean] = useState(false);
    const [showHiragana, setShowHiragana] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [masteredCount, setMasteredCount] = useState(0);
    const [learningCount, setLearningCount] = useState(0);
    const [isResetting, setIsResetting] = useState(false);
    const [cardStudyTime, setCardStudyTime] = useState(Date.now());
    const processingWordIdRef = useRef<string | null>(null);
    const dispatch = useDispatch();

    const isCompleted = wordIndex >= deck.length;
    const currentWordId = deck[wordIndex]?._id;

    useEffect(() => { setCardStudyTime(Date.now()); }, [wordIndex]);

    useEffect(() => {
      if (!error) return;
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }, [error]);

    const resetUIState = useCallback(() => {
      dispatch(kanjiActions.reset());
      setShowMean(false);
      setShowHiragana(false);
    }, [dispatch]);

    const moveToNextCard = useCallback(() => {
      setWordIndex(prev => prev + 1);
      resetUIState();
    }, [resetUIState]);

    const updateStats = useCallback((know: boolean) => {
      know ? setMasteredCount(prev => prev + 1) : setLearningCount(prev => prev + 1);
    }, []);

    const completeWordAsync = useCallback(
      (wordId: string, startedAt: number, know: boolean) =>
        progressService.completeWord(progressType, {
          wordId,
          isCorrect: know,
          timeSpent: Math.floor((Date.now() - startedAt) / 1000),
        }),
      [progressType]
    );

    const handleKnowClick = useCallback((know: boolean) => {
      if (!currentWordId || processingWordIdRef.current === currentWordId) return;
      processingWordIdRef.current = currentWordId;
      updateStats(know);
      moveToNextCard();
      completeWordAsync(currentWordId, cardStudyTime, know)
        .catch((err: unknown) => console.warn('⚠️ Progress sync failed', { err, wordIndex }))
        .finally(() => { processingWordIdRef.current = null; });
    }, [updateStats, moveToNextCard, currentWordId, cardStudyTime, completeWordAsync, wordIndex]);

    const handleShowClick = useCallback((type: ShowType['type']) => {
      type === 'Mean' ? setShowMean(true) : setShowHiragana(true);
    }, []);

    const handleRestartClick = useCallback(async () => {
      if (isResetting) return;
      setIsResetting(true);
      try {
        await progressService.resetSession(progressType);
        setWordIndex(0);
        setMasteredCount(0);
        setLearningCount(0);
        setCardStudyTime(Date.now());
        resetUIState();
      } catch (e) {
        console.error('❌ Failed to restart deck', e);
        setError('Failed to restart deck');
      } finally {
        setIsResetting(false);
      }
    }, [isResetting, progressType, resetUIState]);

    if (deck.length === 0) return null;

    const errorBanner = error && (
      <div className={styles.errorBanner}>
        <span className={styles.errorIcon}>⚠️</span>
        <span className={styles.errorText}>{error}</span>
      </div>
    );

    if (isCompleted) {
      return (
        <>
          {errorBanner}
          <div className={styles.completedCard}>
            <h3 className={styles.completedTitle}>🎉 All cards completed!</h3>
            <div className={styles.statsRow}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Mastered</span>
                <span className={styles.statValueGreen}>{masteredCount}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Still learning</span>
                <span className={styles.statValueAmber}>{learningCount}</span>
              </div>
            </div>
            <button
              className={styles.restartButton}
              onClick={handleRestartClick}
              disabled={isResetting}
            >
              {isResetting ? '🔄 Restarting...' : '🔄 Restart Deck'}
            </button>
          </div>
        </>
      );
    }

    return (
      <>
        {errorBanner}
        <FlashCard word={deck[wordIndex]} showMean={showMean} showHiragana={showHiragana} />
        <ControlPanel
          onShowClick={handleShowClick}
          onKnowClick={handleKnowClick}
          showMean={showMean}
          showHiragana={showHiragana}
        />
      </>
    );
  });

export default FlashCardContainer;
