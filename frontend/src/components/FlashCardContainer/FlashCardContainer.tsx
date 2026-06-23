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
  onPassComplete?: (nextPassSize: number) => void;
  onWindowComplete?: () => void;
}

const FlashCardContainer: FC<FlashCardContainerProps> = memo(
  ({ deck, progressType, initialIndex, onPassComplete, onWindowComplete }) => {
    const [wordIndex, setWordIndex] = useState(initialIndex);
    const [showMean, setShowMean] = useState(false);
    const [showHiragana, setShowHiragana] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [masteredCount, setMasteredCount] = useState(0);
    const [learningCount, setLearningCount] = useState(0);
    const [cardStudyTime, setCardStudyTime] = useState(Date.now());
    const [passResult, setPassResult] = useState<{ windowComplete: boolean; nextPassSize?: number } | null>(null);
    const processingWordIdRef = useRef<string | null>(null);
    const dispatch = useDispatch();

    const isPassComplete = wordIndex >= deck.length;
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

    const handleKnowClick = useCallback((know: boolean) => {
      if (!currentWordId || processingWordIdRef.current === currentWordId) return;
      processingWordIdRef.current = currentWordId;
      updateStats(know);
      moveToNextCard();
      progressService.completeWord(progressType, {
        wordId: currentWordId,
        isCorrect: know,
        timeSpent: Math.floor((Date.now() - cardStudyTime) / 1000),
      }).then((res) => {
        if (res.data?.passComplete) {
          setPassResult({ windowComplete: res.data.windowComplete, nextPassSize: res.data.nextPassSize });
          if (res.data.windowComplete) {
            onWindowComplete?.();
          } else {
            onPassComplete?.(res.data.nextPassSize ?? 0);
          }
        }
      }).catch((err: unknown) => console.warn('⚠️ Progress sync failed', { err, wordIndex }))
        .finally(() => { processingWordIdRef.current = null; });
    }, [updateStats, moveToNextCard, currentWordId, cardStudyTime, progressType, onPassComplete, onWindowComplete, wordIndex]);

    const handleShowClick = useCallback((type: ShowType['type']) => {
      type === 'Mean' ? setShowMean(true) : setShowHiragana(true);
    }, []);


    if (deck.length === 0) return null;

    const errorBanner = error && (
      <div className={styles.errorBanner}>
        <span className={styles.errorIcon}>⚠️</span>
        <span className={styles.errorText}>{error}</span>
      </div>
    );

    if (isPassComplete) {
      const isWindowDone = passResult?.windowComplete;
      const nextCount = passResult?.nextPassSize;
      return (
        <>
          {errorBanner}
          <div className={styles.completedCard}>
            {isWindowDone ? (
              <h3 className={styles.completedTitle}>윈도우 완료!</h3>
            ) : passResult ? (
              <>
                <h3 className={styles.completedTitle}>패스 완료</h3>
                <p>모르는 단어 {nextCount}개로 다음 패스를 시작합니다...</p>
              </>
            ) : (
              <h3 className={styles.completedTitle}>처리 중...</h3>
            )}
            <div className={styles.statsRow}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>알았음</span>
                <span className={styles.statValueGreen}>{masteredCount}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>몰랐음</span>
                <span className={styles.statValueAmber}>{learningCount}</span>
              </div>
            </div>
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
