import { FC, useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import bookmarkService from 'services/bookmarkService';
import { DeckWord, LearningLevel } from 'services/types';
import FlashCard, { ShowType } from 'components/FlashCard';
import ControlPanel from 'components/ControlPanel';
import CenterDiv from 'components/CommonStyled/CenterDiv';
import * as kanjiActions from 'store/modules/kanji';
import * as styles from './BookmarkStudyPage.css';

interface LocationState {
  level?: LearningLevel | 'all';
  sortBy?: string;
}

const BookmarkStudyPage: FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { state } = useLocation();
  const { level, sortBy } = (state as LocationState) || {};

  const [deck, setDeck] = useState<DeckWord[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [wordIndex, setWordIndex] = useState(0);
  const [showMean, setShowMean] = useState(false);
  const [showHiragana, setShowHiragana] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);
  const [learningCount, setLearningCount] = useState(0);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    bookmarkService.getBookmarks({
      level: level !== 'all' ? level : undefined,
      sortBy: (sortBy as any) || 'recent',
      limit: 100,
    }).then(res => {
      if (res.success && res.data?.bookmarks) {
        const words: DeckWord[] = res.data.bookmarks.map((b, idx) => ({
          ...b.word,
          index: idx,
          isCurrent: false,
          isWindowCompleted: false,
          isBookmarked: true,
        }));
        setDeck(words);
        setBookmarkedIds(new Set(res.data.bookmarks.map(b => b.word._id)));
      }
    }).finally(() => setIsLoading(false));
  }, [level, sortBy]);

  const handleKnowClick = useCallback((know: boolean) => {
    know ? setMasteredCount(p => p + 1) : setLearningCount(p => p + 1);
    setWordIndex(p => p + 1);
    dispatch(kanjiActions.reset());
    setShowMean(false);
    setShowHiragana(false);
  }, [dispatch]);

  const handleShowClick = useCallback((type: ShowType['type']) => {
    type === 'Mean' ? setShowMean(true) : setShowHiragana(true);
  }, []);

  const handleBookmark = useCallback(async () => {
    if (!deck) return;
    const wordId = deck[wordIndex]?._id;
    if (!wordId) return;
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      next.has(wordId) ? next.delete(wordId) : next.add(wordId);
      return next;
    });
    await bookmarkService.toggleBookmark(wordId).catch(() => {
      setBookmarkedIds(prev => {
        const next = new Set(prev);
        next.has(wordId) ? next.delete(wordId) : next.add(wordId);
        return next;
      });
    });
  }, [deck, wordIndex]);

  if (isLoading) return <CenterDiv><div>복습 단어를 불러오는 중...</div></CenterDiv>;

  if (!deck || deck.length === 0) {
    return (
      <CenterDiv>
        <div style={{ textAlign: 'center' }}>
          <p>복습할 단어가 없습니다.</p>
          <button className={styles.backBtn} onClick={() => navigate('/bookmark')}>돌아가기</button>
        </div>
      </CenterDiv>
    );
  }

  const isComplete = wordIndex >= deck.length;
  const currentWordId = deck[wordIndex]?._id;

  if (isComplete) {
    return (
      <div className={styles.page}>
        <div className={styles.flashCardArea}>
          <div className={styles.resultCard}>
            <h2 className={styles.resultTitle}>복습 완료!</h2>
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
            <button className={styles.backBtn} onClick={() => navigate('/bookmark')}>북마크로 돌아가기</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.flashCardArea}>
        <div className={styles.header}>
          <button className={styles.backLink} onClick={() => navigate('/bookmark')}>← 북마크</button>
          <span className={styles.progress}>{wordIndex + 1} / {deck.length}</span>
        </div>
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
      </div>
    </div>
  );
};

export default BookmarkStudyPage;
