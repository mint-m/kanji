import { FC, useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import progressService from 'services/progressService';
import { getStats, updateActiveProgressType } from 'services/userService';
import { updateLocalUser } from 'services/authService';
import { getErrorMessage } from 'services/apiClient';
import { ProgressType, SessionSummary, UserStats } from 'services/types';
import { setActiveProgressType } from 'store/modules/user';
import { formatSteps, levelName } from 'constants/levels';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import ProgressBar from 'components/ProgressBar';
import { RootState } from 'store';
import * as layout from 'styles/layout.css';
import * as styles from './Home.css';

const SESSION_INFO: Record<ProgressType, { title: string; empty: string }> = {
  main: { title: '진도 학습', empty: '레벨을 고르면 3스텝씩 범위를 밀며 끝까지 익혀요.' },
  sub: { title: '집중 학습', empty: '한 스텝만 골라 완전히 익힐 때까지 반복해요. 진도와 따로 기록돼요.' },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' });

const ReviewCard: FC<{ stats: UserStats; onStart: () => void }> = ({ stats, onStart }) => {
  const { due, nextDueAt } = stats.review;
  return (
    <section className={clsx(styles.reviewCard, due > 0 && styles.reviewCardDue)} aria-label="오늘의 복습">
      <div className={styles.cardHead}>
        <h2 className={styles.cardTitle}>오늘의 복습</h2>
        <p className={styles.cardText}>
          {due > 0 ? (
            <>잊기 전에 다시 볼 단어 <span className={styles.strong}>{due}개</span>가 기다려요.</>
          ) : stats.learned.total > 0 ? (
            nextDueAt ? `오늘 복습은 다 했어요. 다음 복습은 ${formatDate(nextDueAt)}에 나와요.` : '오늘 복습은 다 했어요.'
          ) : (
            '진도·집중 학습에서 "알아요"를 누른 단어가 다음 날부터 1·3·7일 간격으로 이곳에 나와요.'
          )}
        </p>
      </div>
      {due > 0 && <DefaultButton variant="primary" onClick={onStart}>복습 시작</DefaultButton>}
    </section>
  );
};

const SessionCard: FC<{
  type: ProgressType;
  session?: SessionSummary;
  isActive: boolean;
  disabled: boolean;
  onContinue: (type: ProgressType) => void;
  onChange: (type: ProgressType) => void;
}> = ({ type, session, isActive, disabled, onContinue, onChange }) => (
  <section className={styles.sessionCard} aria-label={SESSION_INFO[type].title}>
    {isActive && session && <span className={styles.recent}>최근 학습</span>}
    <h2 className={styles.cardTitle}>{SESSION_INFO[type].title}</h2>
    {session ? (
      <>
        <div className={styles.position}>
          <span className={styles.level}>{levelName(session.level)}</span>
          <span>{formatSteps(session.steps, type)}</span>
        </div>
        <div className={styles.progressRow}>
          <ProgressBar
            value={session.window.known}
            max={session.window.total}
            label={`${SESSION_INFO[type].title} 이번 범위에서 익힌 단어`}
          />
          <span>익힘 {session.window.known} / {session.window.total}</span>
        </div>
        <div className={styles.actions}>
          <DefaultButton variant={isActive ? 'primary' : 'default'} className={styles.smallButton} onClick={() => onContinue(type)} disabled={disabled}>
            이어하기
          </DefaultButton>
          <DefaultButton variant="ghost" className={styles.smallButton} onClick={() => onChange(type)} disabled={disabled}>
            범위 바꾸기
          </DefaultButton>
        </div>
      </>
    ) : (
      <>
        <p className={styles.cardText}>{SESSION_INFO[type].empty}</p>
        <div className={styles.actions}>
          <DefaultButton className={styles.smallButton} onClick={() => onChange(type)} disabled={disabled}>시작하기</DefaultButton>
        </div>
      </>
    )}
  </section>
);

// 로그인 후 첫 화면 — 오늘 할 일(복습)과 이어 할 학습을 한눈에
const Home: FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const name = useSelector((state: RootState) => state.user.name);
  const activeProgressType = useSelector((state: RootState) => state.user.activeProgressType);

  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const loadSessions = useCallback(() => {
    setSessionsError(null);
    progressService.getAllSessions()
      .then((res) => setSessions(res.data?.sessions ?? []))
      .catch((err) => setSessionsError(getErrorMessage(err, '학습 정보를 불러오지 못했어요.')));
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // 기록을 불러오지 못하면 오늘·복습 영역만 숨기고 학습은 이어갈 수 있게 한다
  useEffect(() => {
    getStats().then(setStats).catch(() => setStats(null));
  }, []);

  const handleContinue = async (type: ProgressType) => {
    if (type !== activeProgressType) {
      setSwitching(true);
      setSwitchError(null);
      try {
        await updateActiveProgressType(type);
        dispatch(setActiveProgressType(type));
        updateLocalUser({ activeProgressType: type });
      } catch {
        setSwitchError('학습을 전환하지 못했어요. 다시 시도해주세요.');
        setSwitching(false);
        return;
      }
      setSwitching(false);
    }
    navigate('/flash-cards');
  };

  const sessionOf = (type: ProgressType) => sessions?.find((session) => session.type === type);

  return (
    <div className={layout.page}>
      <div className={layout.stack}>
        <div className={styles.greeting}>
          <h1 className={styles.hello}>{name ? `${name}님, 오늘도 한 걸음` : '오늘도 한 걸음'}</h1>
          {stats && (
            <div className={styles.chips}>
              {stats.streak.current > 0 && <span className={styles.chip}>🔥 연속 {stats.streak.current}일</span>}
              <span className={styles.chip}>
                오늘 {stats.today.count} / {stats.today.goal}
                <span className={styles.chipBar}>
                  <ProgressBar value={stats.today.count} max={stats.today.goal} label="오늘 목표 진행" />
                </span>
              </span>
            </div>
          )}
        </div>

        {stats && <ReviewCard stats={stats} onStart={() => navigate('/review')} />}

        {switchError && <div className="error-box" role="alert">{switchError}</div>}
        {sessionsError ? (
          <div className="error-box" role="alert">
            {sessionsError}{' '}
            <DefaultButton variant="ghost" className={styles.smallButton} onClick={loadSessions}>다시 시도</DefaultButton>
          </div>
        ) : !sessions ? (
          <p className="loading-text">불러오는 중...</p>
        ) : (
          <div className={styles.sessions}>
            {(['main', 'sub'] as const).map((type) => (
              <SessionCard
                key={type}
                type={type}
                session={sessionOf(type)}
                isActive={activeProgressType === type}
                disabled={switching}
                onContinue={handleContinue}
                onChange={(t) => navigate(`/start?type=${t}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
