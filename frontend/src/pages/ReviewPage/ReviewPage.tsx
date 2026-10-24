import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StudyCard from 'components/StudyCard';
import StudyHeader from 'components/StudyHeader';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import reviewService, { REVIEW_INTERVAL_DAYS } from 'services/reviewService';
import { getErrorMessage } from 'services/apiClient';
import { ReviewWord } from 'services/types';
import { useToggleBookmark } from 'hooks/useToggleBookmark';
import * as styles from './ReviewPage.css';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' });

const stageLabel = (stage: number) => (stage === 0 ? '다시 익히는 중' : `${REVIEW_INTERVAL_DAYS[stage]}일 간격 복습`);

const ReviewPage: FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<ReviewWord[]>([]);
  const [total, setTotal] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [nextDueAt, setNextDueAt] = useState<string | null>(null);
  const [forgotten, setForgotten] = useState<Set<string>>(new Set());
  const [saveFailed, setSaveFailed] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [bookmarkMessage, setBookmarkMessage] = useState<string | null>(null);
  // 같은 단어가 다시 나와도 카드를 새로 그리도록 응답할 때마다 올린다
  const [turn, setTurn] = useState(0);
  const answeredTurnRef = useRef(-1);
  const shownAtRef = useRef(Date.now());

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const data = await reviewService.getDue();
      setQueue(data.words);
      setTotal(data.words.length);
      setDueCount(data.dueCount);
      setNextDueAt(data.nextDueAt);
      setForgotten(new Set());
      setBookmarkedIds(new Set(data.words.filter((w) => w.isBookmarked).map((w) => w._id)));
      setTurn((t) => t + 1);
      setStatus('ready');
    } catch (err) {
      setError(getErrorMessage(err, '복습할 단어를 불러오지 못했어요.'));
      setStatus('error');
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { shownAtRef.current = Date.now(); }, [turn]);

  useEffect(() => {
    if (!bookmarkMessage) return;
    const timer = setTimeout(() => setBookmarkMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [bookmarkMessage]);

  const current = queue[0];

  const handleAnswer = useCallback((know: boolean) => {
    if (!current || answeredTurnRef.current === turn) return;
    answeredTurnRef.current = turn;
    const timeSpent = Math.floor((Date.now() - shownAtRef.current) / 1000);

    // 몰라요는 이번 복습의 맨 뒤로 보낸다 — 서버는 0단계로 두고, 다시 알아요를 받으면 1일 간격부터 시작한다
    setQueue((prev) => (know ? prev.slice(1) : [...prev.slice(1), prev[0]]));
    if (!know) setForgotten((prev) => new Set(prev).add(current._id));
    setTurn((t) => t + 1);

    // 저장에 실패한 응답은 서버 일정이 그대로라 다음 복습에 다시 나온다
    reviewService.answer(current._id, know, timeSpent).catch(() => setSaveFailed(true));
  }, [current, turn]);

  const handleBookmark = useToggleBookmark({
    wordId: current?._id,
    progressType: 'main',
    setBookmarkedIds,
    onWarning: setBookmarkMessage,
    onLimitError: setBookmarkMessage,
  });

  if (status === 'loading') {
    return <div className={styles.page}><p className="loading-text">복습할 단어를 불러오는 중...</p></div>;
  }

  if (status === 'error') {
    return (
      <div className={styles.page}>
        <div className={styles.panel}>
          <p className={styles.desc}>{error}</p>
          <DefaultButton variant="primary" onClick={load}>다시 시도</DefaultButton>
        </div>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className={styles.page}>
        <StudyHeader title="오늘의 복습" />
        <div className={styles.panel}>
          <h2 className={styles.title}>지금 복습할 단어가 없어요</h2>
          <p className={styles.desc}>
            {nextDueAt
              ? `다음 복습은 ${formatDate(nextDueAt)}부터 나와요.`
              : '진도 학습이나 집중 학습에서 "알아요"를 누른 단어가 다음 날부터 이곳에 나와요.'}
          </p>
          <div className={styles.actions}>
            <DefaultButton variant="primary" onClick={() => navigate('/')} autoFocus>학습하러 가기</DefaultButton>
          </div>
        </div>
      </div>
    );
  }

  if (!current) {
    const remaining = dueCount - total;
    return (
      <div className={styles.page}>
        <StudyHeader title="오늘의 복습" />
        <div className={styles.panel}>
          <h2 className={styles.title}>복습을 마쳤어요 🎉</h2>
          <div className={styles.stats}>
            <span className={styles.stat}><span className={styles.statValue}>{total - forgotten.size}</span>한 번에 알았음</span>
            <span className={styles.stat}><span className={styles.statValue}>{forgotten.size}</span>다시 익힘</span>
          </div>
          <p className={styles.desc}>
            {remaining > 0
              ? `아직 복습할 단어가 ${remaining}개 남았어요.`
              : '맞힌 단어는 간격을 늘려 다시 찾아와요. 잊었던 단어는 내일 한 번 더 나와요.'}
          </p>
          <div className={styles.actions}>
            {remaining > 0 ? (
              <DefaultButton variant="primary" onClick={load} autoFocus>이어서 복습</DefaultButton>
            ) : (
              <DefaultButton variant="primary" onClick={() => navigate('/')} autoFocus>진도 학습하러 가기</DefaultButton>
            )}
            <DefaultButton onClick={() => navigate('/stats')}>기록 보기</DefaultButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <StudyHeader
        title="오늘의 복습"
        subtitle={stageLabel(current.stage)}
        counter={`남은 ${queue.length}`}
        progress={{ value: total - queue.length, max: total, label: '이번 복습 진행', caption: `${total - queue.length} / ${total}` }}
      />
      {saveFailed && (
        <p className={styles.notice} role="alert">일부 응답을 저장하지 못했어요. 그 단어는 다음 복습에 다시 나와요.</p>
      )}
      {bookmarkMessage && <p className={styles.notice} role="status">{bookmarkMessage}</p>}
      <StudyCard
        key={turn}
        word={current}
        onAnswer={handleAnswer}
        isBookmarked={bookmarkedIds.has(current._id)}
        onBookmark={handleBookmark}
      />
    </div>
  );
};

export default ReviewPage;
