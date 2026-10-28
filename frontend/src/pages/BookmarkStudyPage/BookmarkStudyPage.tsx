import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import bookmarkService, { Bookmark } from 'services/bookmarkService';
import { LearningLevel, ProgressType, Word } from 'services/types';
import { getErrorMessage } from 'services/apiClient';
import { useToggleBookmark } from 'hooks/useToggleBookmark';
import StudyCard from 'components/StudyCard';
import StudyHeader from 'components/StudyHeader';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import { shuffle } from 'utils/shuffle';
import * as styles from './BookmarkStudyPage.css';

interface LocationState {
  level?: LearningLevel | 'all';
  sortBy?: string;
}

// 북마크 학습 — 섞어서 한 바퀴, 몰랐던 단어만 다시 섞어 다음 바퀴. 다 알 때까지 반복할 수 있다
// (응답은 서버에 기록하지 않는다: 진도·복습 일정과 섞이지 않는 자유 연습)
const BookmarkStudyPage: FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { level, sortBy } = (state as LocationState) || {};

  const [allWords, setAllWords] = useState<Word[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roundWords, setRoundWords] = useState<Word[]>([]);
  const [round, setRound] = useState(1);
  const [index, setIndex] = useState(0);
  const [unknown, setUnknown] = useState<Word[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [bookmarkWarning, setBookmarkWarning] = useState<string | null>(null);
  const progressTypeMapRef = useRef<Map<string, ProgressType | undefined>>(new Map());

  const startRound = useCallback((words: Word[], roundNumber: number) => {
    setRoundWords(shuffle(words));
    setRound(roundNumber);
    setIndex(0);
    setUnknown([]);
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    bookmarkService.getBookmarks({
      level: level !== 'all' ? level : undefined,
      sortBy: (sortBy as any) || 'recent',
      limit: 150, // 서버 BOOKMARK_LIMIT(북마크 최대 개수)과 같아야 한다 — 넘으면 400
    }).then(res => {
      if (!active) return;
      if (res.success && res.data?.bookmarks) {
        progressTypeMapRef.current = new Map(res.data.bookmarks.map((b: Bookmark) => [b.word._id, b.progress_type]));
        const words = res.data.bookmarks.map((b: Bookmark) => b.word);
        setAllWords(words);
        setBookmarkedIds(new Set(words.map((w) => w._id)));
        startRound(words, 1);
      } else {
        setError('북마크 단어를 불러오지 못했어요.');
      }
    }).catch(err => {
      if (!active) return;
      setError(getErrorMessage(err, '북마크 단어를 불러오지 못했어요.'));
    }).finally(() => {
      if (active) setIsLoading(false);
    });
    return () => { active = false; };
  }, [level, sortBy, startRound]);

  useEffect(() => {
    if (!bookmarkWarning) return;
    const timer = setTimeout(() => setBookmarkWarning(null), 5000);
    return () => clearTimeout(timer);
  }, [bookmarkWarning]);

  const current = roundWords[index];

  const handleAnswer = useCallback((know: boolean) => {
    if (!current) return;
    if (!know) setUnknown((prev) => [...prev, current]);
    setIndex((prev) => prev + 1);
  }, [current]);

  const handleBookmark = useToggleBookmark({
    wordId: current?._id,
    progressType: current ? progressTypeMapRef.current.get(current._id) : undefined,
    setBookmarkedIds,
    onWarning: setBookmarkWarning,
    onLimitError: setBookmarkWarning,
  });

  const backButton = (
    <DefaultButton variant="ghost" className={styles.backLink} onClick={() => navigate('/bookmarks')}>← 북마크</DefaultButton>
  );

  if (isLoading) return <div className={styles.page}><p className="loading-text">북마크 단어를 불러오는 중...</p></div>;

  if (error || !allWords || allWords.length === 0) {
    return (
      <div className={styles.page}>
        {backButton}
        <div className={styles.resultCard}>
          <p>{error ?? '북마크한 단어가 없어요. 학습 중 어려운 단어에 ☆를 눌러 모아 보세요.'}</p>
          <DefaultButton onClick={() => navigate('/bookmarks')}>북마크로 돌아가기</DefaultButton>
        </div>
      </div>
    );
  }

  if (!current) {
    const allKnown = unknown.length === 0;
    return (
      <div className={styles.page}>
        {backButton}
        <div className={styles.resultCard}>
          <h2 className={styles.resultTitle}>{allKnown ? '북마크 단어를 모두 알았어요 🎉' : `${round}회차 완료`}</h2>
          <div className={styles.statsRow}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>알았음</span>
              <span className={styles.statValueGreen}>{roundWords.length - unknown.length}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>몰랐음</span>
              <span className={styles.statValueAmber}>{unknown.length}</span>
            </div>
          </div>
          <div className={styles.actions}>
            {allKnown ? (
              <DefaultButton variant="primary" onClick={() => startRound(allWords, 1)} autoFocus>처음부터 다시</DefaultButton>
            ) : (
              <DefaultButton variant="primary" onClick={() => startRound(unknown, round + 1)} autoFocus>
                몰랐던 {unknown.length}개 다시
              </DefaultButton>
            )}
            <DefaultButton onClick={() => navigate('/bookmarks')}>북마크로 돌아가기</DefaultButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {backButton}
      <StudyHeader
        title="북마크 학습"
        subtitle={`${round}회차`}
        counter={`${index + 1} / ${roundWords.length}`}
        progress={{ value: index, max: roundWords.length, label: '이번 회차 진행', caption: `몰랐음 ${unknown.length}` }}
      />
      {bookmarkWarning && <div className={styles.bookmarkWarningBanner} role="status">🔖 {bookmarkWarning}</div>}
      <StudyCard
        key={`${round}-${index}`}
        word={current}
        onAnswer={handleAnswer}
        isBookmarked={bookmarkedIds.has(current._id)}
        onBookmark={handleBookmark}
      />
    </div>
  );
};

export default BookmarkStudyPage;
