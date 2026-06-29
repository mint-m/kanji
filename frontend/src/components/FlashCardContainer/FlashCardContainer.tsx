import { FC, memo, useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import FlashCard, { ShowType } from 'components/FlashCard';
import ControlPanel from 'components/ControlPanel';
import { DeckWord } from 'services/types';
import * as kanjiActions from 'store/modules/kanji';
import progressService from 'services/progressService';
import bookmarkService from 'services/bookmarkService';
import { ApiError } from 'services/authService';
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
    const requestQueueRef = useRef<Array<() => Promise<void>>>([]);
    const isDrainingRef = useRef(false);
    const lastEnqueuedWordIdRef = useRef<string | null>(null);
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

    const moveToNextCard = useCallback(() => {
      setWordIndex(prev => prev + 1);
      resetUIState();
    }, [resetUIState]);

    const updateStats = useCallback((know: boolean) => {
      know ? setMasteredCount(prev => prev + 1) : setLearningCount(prev => prev + 1);
    }, []);

    const drainQueue = useCallback(async () => {
      if (isDrainingRef.current) return;
      isDrainingRef.current = true;
      while (requestQueueRef.current.length > 0) {
        const task = requestQueueRef.current.shift()!;
        try {
          await task();
        } catch (err) {
          console.warn('⚠️ Progress sync failed', err);
        }
      }
      isDrainingRef.current = false;
    }, []);

    const handleKnowClick = useCallback((know: boolean) => {
      if (!currentWordId || lastEnqueuedWordIdRef.current === currentWordId) return;
      lastEnqueuedWordIdRef.current = currentWordId;

      const wordId = currentWordId;
      const timeSpent = Math.floor((Date.now() - cardStudyTime) / 1000);

      updateStats(know);
      moveToNextCard();

      requestQueueRef.current.push(async () => {
        const res = await progressService.completeWord(progressType, {
          wordId,
          isCorrect: know,
          timeSpent,
        });
        if (res.data?.passComplete) {
          setPassResult({ windowComplete: res.data.windowComplete, nextPassSize: res.data.nextPassSize });
          if (res.data.windowComplete) {
            onWindowComplete?.();
          } else {
            onPassComplete?.();
          }
        }
      });

      drainQueue();
    }, [updateStats, moveToNextCard, currentWordId, cardStudyTime, progressType, onPassComplete, onWindowComplete, drainQueue]);

    const handleShowClick = useCallback((type: ShowType['type']) => {
      type === 'Mean' ? setShowMean(true) : setShowHiragana(true);
    }, []);

    const handleBookmark = useCallback(async () => {
      if (!currentWordId) return;
      const id = currentWordId;
      const revert = () => setBookmarkedIds(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
      setBookmarkedIds(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
      try {
        const res = await bookmarkService.toggleBookmark(id, progressType);
        if (res.warning) {
          setBookmarkWarning(`북마크 ${res.warning.remaining}개 남았습니다. 복습 후 정리해보세요.`);
        }
      } catch (err) {
        revert();
        if (err instanceof ApiError && err.code === 'BOOKMARK_LIMIT_EXCEEDED') {
          setError('북마크가 가득 찼습니다 (최대 150개). 복습 후 정리해주세요.');
        }
      }
    }, [currentWordId, progressType]);


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
