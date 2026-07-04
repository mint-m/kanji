import { FC, memo, useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { clsx } from 'clsx';

import FlashCard, { ShowType } from 'components/FlashCard';
import ControlPanel from 'components/ControlPanel';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import { DeckWord } from 'services/types';
import * as kanjiActions from 'store/modules/kanji';
import progressService from 'services/progressService';
import { useToggleBookmark } from 'hooks/useToggleBookmark';
import * as styles from './FlashCardContainer.css';

interface FlashCardContainerProps {
  deck: DeckWord[];
  progressType: 'main' | 'sub';
  initialIndex: number;
  onContinue: () => Promise<boolean>; // 패스 완료: 몰랐던 단어를 다시 섞어 이어가기
  onAdvance: () => Promise<boolean>;  // 윈도우 완료: 다음 윈도우(메인) / 같은 스텝 재학습(서브)
  onGoHome: () => void;               // 서브 세션 완료 후 홈으로
  onIndexChange?: (index: number) => void;
}

const FlashCardContainer: FC<FlashCardContainerProps> = memo(
  ({ deck, progressType, initialIndex, onContinue, onAdvance, onGoHome, onIndexChange }) => {
    const [wordIndex, setWordIndex] = useState(initialIndex);
    const [showMean, setShowMean] = useState(false);
    const [showHiragana, setShowHiragana] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mastered, setMastered] = useState<DeckWord[]>([]);
    const [learning, setLearning] = useState<DeckWord[]>([]);
    const [openList, setOpenList] = useState<'mastered' | 'learning' | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [cardStudyTime, setCardStudyTime] = useState(Date.now());
    const [passResult, setPassResult] = useState<{ windowComplete: boolean; nextPassSize?: number } | null>(null);
    const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(
      () => new Set(deck.filter(w => w.isBookmarked).map(w => w._id))
    );
    const [bookmarkWarning, setBookmarkWarning] = useState<string | null>(null);
    const lastSubmittedWordIdRef = useRef<string | null>(null);
    const requestQueueRef = useRef<Promise<any>>(Promise.resolve());
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
      lastSubmittedWordIdRef.current = currentWordId;

      const wordId = currentWordId;
      const answeredWord = deck[wordIndex];
      const timeSpent = Math.floor((Date.now() - cardStudyTime) / 1000);

      if (know) setMastered(prev => [...prev, answeredWord]);
      else setLearning(prev => [...prev, answeredWord]);
      setWordIndex(prev => prev + 1);
      resetUIState();

      requestQueueRef.current = requestQueueRef.current
        .then(() => progressService.completeWord(progressType, { wordId, isCorrect: know, timeSpent }))
        .then(res => {
          if (res.data?.passComplete) {
            setPassResult({ windowComplete: res.data.windowComplete, nextPassSize: res.data.nextPassSize });
          }
        })
        .catch(err => console.warn('⚠️ Progress sync failed', err));
    }, [currentWordId, deck, wordIndex, cardStudyTime, progressType, resetUIState]);

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

    // 상위(FlashCardPage)의 비동기 전환을 실행. 성공 시 상위가 리마운트/이동하므로 복원 불필요.
    const runAction = useCallback(async (action: () => Promise<boolean>) => {
      setIsProcessing(true);
      const ok = await action();
      if (!ok) setIsProcessing(false);
    }, []);

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
      const isMain = progressType === 'main';
      const remaining = passResult?.nextPassSize ?? learning.length;
      const listWords = openList === 'mastered' ? mastered : openList === 'learning' ? learning : [];

      const toggleList = (which: 'mastered' | 'learning') =>
        setOpenList(prev => (prev === which ? null : which));

      return (
        <>
          {errorBanner}
          {warningBanner}
          <div className={styles.completedCard}>
            <h3 className={styles.completedTitle}>
              {!passResult
                ? '처리 중...'
                : isWindowDone
                  ? (isMain ? '윈도우 완료! 🎉' : '스텝 마스터! 🎉')
                  : '패스 완료'}
            </h3>

            <div className={styles.statsRow}>
              <button
                type="button"
                className={clsx(styles.statItemButton, openList === 'mastered' && styles.statItemActive)}
                onClick={() => toggleList('mastered')}
              >
                <span className={styles.statLabel}>알았음</span>
                <span className={styles.statValueGreen}>{mastered.length}</span>
              </button>
              <button
                type="button"
                className={clsx(styles.statItemButton, openList === 'learning' && styles.statItemActive)}
                onClick={() => toggleList('learning')}
              >
                <span className={styles.statLabel}>몰랐음</span>
                <span className={styles.statValueAmber}>{learning.length}</span>
              </button>
            </div>

            {openList ? (
              <div className={styles.wordList}>
                {listWords.length === 0 ? (
                  <div className={styles.wordListEmpty}>해당하는 단어가 없어요</div>
                ) : (
                  listWords.map(w => (
                    <div key={w._id} className={styles.wordItem}>
                      <span className={styles.wordItemEntry}>{w.pron || w.entry}</span>
                      <span className={styles.wordItemMean}>{w.means[0] ?? ''}</span>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <p className={styles.statHint}>숫자를 탭하면 단어 목록을 볼 수 있어요</p>
            )}

            {passResult && (
              <>
                <p className={styles.completeDesc}>
                  {isWindowDone
                    ? isMain
                      ? '이 범위의 단어를 모두 익혔어요. 다음 스텝 범위로 넘어갑니다.'
                      : '이 스텝의 단어를 모두 익혔어요. 다시 섞어 복습하거나 홈으로 갈 수 있어요.'
                    : `아직 익히지 못한 ${remaining}개 단어를 다시 섞어 학습을 이어갑니다.`}
                </p>
                <div className={styles.completeActions}>
                  {!isWindowDone ? (
                    <DefaultButton onClick={() => runAction(onContinue)} disabled={isProcessing}>
                      {isProcessing ? '처리 중...' : '이어가기'}
                    </DefaultButton>
                  ) : isMain ? (
                    <DefaultButton onClick={() => runAction(onAdvance)} disabled={isProcessing}>
                      {isProcessing ? '처리 중...' : '다음 윈도우로'}
                    </DefaultButton>
                  ) : (
                    <>
                      <DefaultButton onClick={() => runAction(onAdvance)} disabled={isProcessing}>
                        {isProcessing ? '처리 중...' : '다시 학습하기'}
                      </DefaultButton>
                      <DefaultButton onClick={onGoHome} disabled={isProcessing}>홈으로</DefaultButton>
                    </>
                  )}
                </div>
              </>
            )}
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
