import { FC, memo, useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import FlashCard, { ShowType } from 'components/FlashCard';
import ControlPanel from 'components/ControlPanel';
import { DeckWord } from 'services/types';
import * as kanjiActions from 'store/modules/kanji';
import progressService from 'services/progressService';
import { useToggleBookmark } from 'hooks/useToggleBookmark';
import * as styles from './FlashCardContainer.css';

interface FlashCardContainerProps {
  deck: DeckWord[];
  progressType: 'main' | 'sub';
  initialIndex: number;
  onPassComplete?: () => void;
  onWindowComplete?: () => void;
  onIndexChange?: (index: number) => void;
}

const FlashCardContainer: FC<FlashCardContainerProps> = memo(
  ({ deck, progressType, initialIndex, onPassComplete, onWindowComplete, onIndexChange }) => {
    const [wordIndex, setWordIndex] = useState(initialIndex);
    const [showMean, setShowMean] = useState(false);
    const [showHiragana, setShowHiragana] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [masteredCount, setMasteredCount] = useState(0);
    const [learningCount, setLearningCount] = useState(0);
    const [cardStudyTime, setCardStudyTime] = useState(Date.now());
    const [passResult, setPassResult] = useState<{ windowComplete: boolean; nextPassSize?: number } | null>(null);
    const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(
      () => new Set(deck.filter(w => w.isBookmarked).map(w => w._id))
    );
    const [bookmarkWarning, setBookmarkWarning] = useState<string | null>(null);
    const lastSubmittedWordIdRef = useRef<string | null>(null);
    const isProcessingRef = useRef(false);
    const dispatch = useDispatch();

    const isPassComplete = wordIndex >= deck.length;
    const currentWordId = deck[wordIndex]?._id;

    useEffect(() => { setCardStudyTime(Date.now()); }, [wordIndex]);
    useEffect(() => { onIndexChange?.(wordIndex); }, [wordIndex, onIndexChange]);

    useEffect(() => {
      if (!error) return;
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }, [error]);

    useEffect(() => {
      if (!bookmarkWarning) return;
      const timer = setTimeout(() => setBookmarkWarning(null), 5000);
      return () => clearTimeout(timer);
    }, [bookmarkWarning]);

    const resetUIState = useCallback(() => {
      dispatch(kanjiActions.reset());
      setShowMean(false);
      setShowHiragana(false);
    }, [dispatch]);

    const handleKnowClick = useCallback((know: boolean) => {
      if (!currentWordId || lastSubmittedWordIdRef.current === currentWordId) return;
      if (isProcessingRef.current) return;

      isProcessingRef.current = true;
      lastSubmittedWordIdRef.current = currentWordId;

      const wordId = currentWordId;
      const timeSpent = Math.floor((Date.now() - cardStudyTime) / 1000);

      know ? setMasteredCount(prev => prev + 1) : setLearningCount(prev => prev + 1);
      setWordIndex(prev => prev + 1);
      resetUIState();

      progressService.completeWord(progressType, { wordId, isCorrect: know, timeSpent })
        .then(res => {
          if (res.data?.passComplete) {
            setPassResult({ windowComplete: res.data.windowComplete, nextPassSize: res.data.nextPassSize });
            if (res.data.windowComplete) onWindowComplete?.();
            else onPassComplete?.();
          }
        })
        .catch(err => console.warn('⚠️ Progress sync failed', err))
        .finally(() => { isProcessingRef.current = false; });
    }, [currentWordId, cardStudyTime, progressType, resetUIState, onPassComplete, onWindowComplete]);

    const handleShowClick = useCallback((type: ShowType['type']) => {
      type === 'Mean' ? setShowMean(true) : setShowHiragana(true);
    }, []);

    const handleBookmark = useToggleBookmark({
      wordId: currentWordId,
      progressType,
      setBookmarkedIds,
      onWarning: setBookmarkWarning,
      onLimitError: setError,
    });

    if (deck.length === 0) return null;

    const errorBanner = error && (
      <div className={styles.errorBanner}>
        <span className={styles.errorIcon}>⚠️</span>
        <span className={styles.errorText}>{error}</span>
      </div>
    );

    const warningBanner = bookmarkWarning && (
      <div className={styles.warningBanner}>
        <span className={styles.errorIcon}>🔖</span>
        <span className={styles.warningText}>{bookmarkWarning}</span>
      </div>
    );

    if (isPassComplete) {
      const isWindowDone = passResult?.windowComplete;
      const nextCount = passResult?.nextPassSize;
      return (
        <>
          {errorBanner}
          {warningBanner}
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
        {warningBanner}
        <FlashCard
          word={deck[wordIndex]}
          showMean={showMean}
          showHiragana={showHiragana}
          isBookmarked={bookmarkedIds.has(currentWordId ?? '')}
          onBookmark={handleBookmark}
        />
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
