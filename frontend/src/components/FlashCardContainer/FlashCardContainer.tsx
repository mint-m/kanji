import { FC, memo, useCallback, useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';

import StudyCard from 'components/StudyCard';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import { DeckWord } from 'services/types';
import progressService from 'services/progressService';
import { useToggleBookmark } from 'hooks/useToggleBookmark';
import { displaySpelling, formatMeaning } from 'utils/wordDisplay';
import * as styles from './FlashCardContainer.css';

interface FlashCardContainerProps {
  deck: DeckWord[];
  progressType: 'main' | 'sub';
  initialIndex: number;
  initialPassResult?: { windowComplete: boolean } | null; // 완료 상태로 재진입한 경우 서버 deckStatus에서 복원
  onContinue: () => Promise<boolean>; // 패스 완료: 몰랐던 단어를 다시 섞어 이어가기
  onAdvance: () => Promise<boolean>;  // 윈도우 완료: 다음 윈도우(메인) / 같은 스텝 재학습(서브)
  onGoHome: () => void;               // 서브 세션 완료 후 홈으로
  onResync: () => Promise<boolean>;   // 진행 저장 실패: 서버에 저장된 위치로 덱을 다시 불러오기
  onIndexChange?: (index: number) => void;
  onAnswer?: (know: boolean) => void; // 범위 진행(익힘 수) 표시용
}

const FlashCardContainer: FC<FlashCardContainerProps> = memo(
  ({ deck, progressType, initialIndex, initialPassResult, onContinue, onAdvance, onGoHome, onResync, onIndexChange, onAnswer }) => {
    const [wordIndex, setWordIndex] = useState(initialIndex);
    const [error, setError] = useState<string | null>(null);
    const [mastered, setMastered] = useState<DeckWord[]>([]);
    const [learning, setLearning] = useState<DeckWord[]>([]);
    const [openList, setOpenList] = useState<'mastered' | 'learning' | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [cardStudyTime, setCardStudyTime] = useState(Date.now());
    const [passResult, setPassResult] = useState<{ windowComplete: boolean; nextPassSize?: number } | null>(
      initialPassResult ?? null
    );
    const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(
      () => new Set(deck.filter(w => w.isBookmarked).map(w => w._id))
    );
    const [bookmarkWarning, setBookmarkWarning] = useState<string | null>(null);
    const [syncFailed, setSyncFailed] = useState(false);
    const syncFailedRef = useRef(false);
    const lastSubmittedWordIdRef = useRef<string | null>(null);
    const requestQueueRef = useRef<Promise<any>>(Promise.resolve());

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

    const handleKnowClick = useCallback((know: boolean) => {
      if (!currentWordId || lastSubmittedWordIdRef.current === currentWordId) return;
      lastSubmittedWordIdRef.current = currentWordId;

      const wordId = currentWordId;
      const index = wordIndex;
      const answeredWord = deck[wordIndex];
      const timeSpent = Math.floor((Date.now() - cardStudyTime) / 1000);

      if (know) setMastered(prev => [...prev, answeredWord]);
      else setLearning(prev => [...prev, answeredWord]);
      setWordIndex(prev => prev + 1);
      onAnswer?.(know);

      requestQueueRef.current = requestQueueRef.current
        .then(() => {
          // 앞선 요청이 실패하면 서버 위치가 어긋나므로 더 보내지 않는다 — "다시 불러오기"로 서버 위치에서 이어간다
          if (syncFailedRef.current) return;
          return progressService.completeWord(progressType, { wordId, isCorrect: know, timeSpent, index })
            .then(res => {
              if (res.data?.passComplete) {
                setPassResult({ windowComplete: res.data.windowComplete, nextPassSize: res.data.nextPassSize });
              }
            });
        })
        .catch(err => {
          console.warn('⚠️ Progress sync failed', err);
          syncFailedRef.current = true;
          setSyncFailed(true);
        });
    }, [currentWordId, deck, wordIndex, cardStudyTime, progressType, onAnswer]);

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

    if (syncFailed) {
      return (
        <div className={styles.completedCard}>
          <h3 className={styles.completedTitle}>진행 상황을 저장하지 못했어요</h3>
          <p className={styles.completeDesc}>
            네트워크가 불안정하거나 서버가 깨어나는 중일 수 있어요. 다시 불러오면 마지막으로 저장된 단어부터 이어갑니다.
          </p>
          <div className={styles.completeActions}>
            <DefaultButton variant="primary" onClick={() => runAction(onResync)} disabled={isProcessing} autoFocus>
              {isProcessing ? '불러오는 중...' : '다시 불러오기'}
            </DefaultButton>
          </div>
        </div>
      );
    }

    const errorBanner = error && (
      <div className={styles.errorBanner} role="alert">
        <span className={styles.errorIcon} aria-hidden="true">⚠️</span>
        <span className={styles.errorText}>{error}</span>
      </div>
    );

    const warningBanner = bookmarkWarning && (
      <div className={styles.warningBanner} role="status">
        <span className={styles.errorIcon} aria-hidden="true">🔖</span>
        <span className={styles.warningText}>{bookmarkWarning}</span>
      </div>
    );

    if (isPassComplete) {
      const isWindowDone = passResult?.windowComplete;
      const isMain = progressType === 'main';
      const remaining = passResult?.nextPassSize ?? learning.length;
      const listWords = openList === 'mastered' ? mastered : openList === 'learning' ? learning : [];
      // 완료 상태로 재진입하면 이번 화면에서 답한 기록이 없으므로 0/0 통계는 숨긴다
      const hasAnswers = mastered.length + learning.length > 0;

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
                  ? (isMain ? '이 범위를 모두 익혔어요 🎉' : '이 스텝을 모두 익혔어요 🎉')
                  : '한 바퀴 완료'}
            </h3>

            {hasAnswers && (
              <>
                <div className={styles.statsRow}>
                  <button
                    type="button"
                    className={clsx(styles.statItemButton, openList === 'mastered' && styles.statItemActive)}
                    onClick={() => toggleList('mastered')}
                    aria-expanded={openList === 'mastered'}
                  >
                    <span className={styles.statLabel}>알았음</span>
                    <span className={styles.statValueGreen}>{mastered.length}</span>
                  </button>
                  <button
                    type="button"
                    className={clsx(styles.statItemButton, openList === 'learning' && styles.statItemActive)}
                    onClick={() => toggleList('learning')}
                    aria-expanded={openList === 'learning'}
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
                          <span className={styles.wordItemEntry} lang="ja">{displaySpelling(w).written}</span>
                          <span className={styles.wordItemMean}>{formatMeaning(w.means[0] ?? '')}</span>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <p className={styles.statHint}>숫자를 누르면 단어 목록을 볼 수 있어요</p>
                )}
              </>
            )}

            {passResult && (
              <>
                <p className={styles.completeDesc}>
                  {isWindowDone
                    ? isMain
                      ? '다음 범위로 넘어갑니다. 오늘 익힌 단어는 내일부터 오늘의 복습에 나와요.'
                      : '다시 섞어 한 번 더 하거나 홈으로 갈 수 있어요.'
                    : `아직 익히지 못한 ${remaining}개 단어를 다시 섞어 학습을 이어갑니다.`}
                </p>
                <div className={styles.completeActions}>
                  {!isWindowDone ? (
                    <DefaultButton variant="primary" onClick={() => runAction(onContinue)} disabled={isProcessing} autoFocus>
                      {isProcessing ? '처리 중...' : '이어가기'}
                    </DefaultButton>
                  ) : isMain ? (
                    <DefaultButton variant="primary" onClick={() => runAction(onAdvance)} disabled={isProcessing} autoFocus>
                      {isProcessing ? '처리 중...' : '다음 범위로'}
                    </DefaultButton>
                  ) : (
                    <>
                      <DefaultButton variant="primary" onClick={() => runAction(onAdvance)} disabled={isProcessing} autoFocus>
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
        <StudyCard
          word={deck[wordIndex]}
          next={deck[wordIndex + 1]}
          onAnswer={handleKnowClick}
          isBookmarked={bookmarkedIds.has(currentWordId ?? '')}
          onBookmark={handleBookmark}
        />
      </>
    );
  });

export default FlashCardContainer;
