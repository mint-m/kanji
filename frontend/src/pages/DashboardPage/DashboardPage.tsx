import { FC, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from 'store';
import { getStats, updateActiveProgressType } from 'services/userService';
import { setActiveProgressType } from 'store/modules/user';
import { updateLocalUser } from 'services/authService';
import deckService from 'services/deckService';
import { CurrentDeck } from 'services/types';
import CenterDiv from 'components/CommonStyled/CenterDiv';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import * as styles from './DashboardPage.css';

interface LevelBreakdown {
  level: string;
  total: number;
  completed: number;
  percentage: number;
}

interface DashboardStats {
  overall: { totalWords: number; completedWords: number; progressPercentage: number };
  streak: { current: number; longest: number; studyDays: number };
  totalWordsStudied: number;
  levelBreakdown: LevelBreakdown[];
}

const DashboardPage: FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const activeProgressType = useSelector((state: RootState) => state.user.activeProgressType);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingSession, setIsUpdatingSession] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<CurrentDeck | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => setError('통계를 불러오는데 실패했습니다.'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!activeProgressType) { setProgressData(null); return; }
    let active = true;
    // 이전 데이터를 유지한 채 새로 불러와 세션 전환 시 깜빡임 방지
    setIsLoadingProgress(true);
    deckService.getCurrentDeck(activeProgressType)
      .then(res => { if (active) setProgressData(res.success && res.data ? res.data : null); })
      .catch(() => { if (active) setProgressData(null); })
      .finally(() => { if (active) setIsLoadingProgress(false); });
    return () => { active = false; };
  }, [activeProgressType]);

  const handleSessionToggle = async (type: 'main' | 'sub') => {
    if (isUpdatingSession || type === activeProgressType) return;
    setIsUpdatingSession(true);
    setSwitchError(null);
    try {
      await updateActiveProgressType(type);
      dispatch(setActiveProgressType(type));
      updateLocalUser({ activeProgressType: type });
    } catch {
      setSwitchError('세션 전환에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsUpdatingSession(false);
    }
  };

  if (isLoading) return <CenterDiv><div className="loading-text">불러오는 중...</div></CenterDiv>;
  if (error) return <CenterDiv><div className="error-box">{error}</div></CenterDiv>;
  if (!stats) return null;

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>진도</h1>

      {/* 학습 세션 */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>학습 세션</h2>
        {switchError && (
          <div className="error-box" style={{ marginBottom: '12px' }}>{switchError}</div>
        )}
        <div className={styles.sessionBtns}>
          {(['main', 'sub'] as const).map((type) => (
            <button
              key={type}
              className={clsx(styles.sessionBtn, activeProgressType === type && styles.sessionBtnActive)}
              onClick={() => handleSessionToggle(type)}
              disabled={isUpdatingSession}
            >
              {type === 'main' ? '메인' : '서브'}
            </button>
          ))}
        </div>

        <p className={styles.subTitle}>현재 학습 위치</p>
        {progressData ? (
          <div className={clsx(styles.progressRow, isLoadingProgress && styles.progressRowLoading)}>
            <div className={styles.progressCell}>
              <span className={styles.progressCellLabel}>레벨</span>
              <span className={styles.progressCellValue}>{progressData.level ?? 'N/A'}</span>
            </div>
            <div className={styles.progressCell}>
              <span className={styles.progressCellLabel}>스텝</span>
              <span className={styles.progressCellValue}>
                {progressData.steps
                  ? progressData.steps.start === progressData.steps.end
                    ? progressData.steps.start
                    : `${progressData.steps.start} – ${progressData.steps.end}`
                  : 'N/A'}
              </span>
            </div>
          </div>
        ) : isLoadingProgress ? (
          <div className={styles.progressRow} aria-busy="true">
            <div className={styles.progressCell}>
              <span className={styles.progressCellLabel}>레벨</span>
              <span className={styles.skeletonBar} />
            </div>
            <div className={styles.progressCell}>
              <span className={styles.progressCellLabel}>스텝</span>
              <span className={styles.skeletonBar} />
            </div>
          </div>
        ) : (
          <p className={styles.noProgress}>학습 세션이 없습니다. 단계를 선택해주세요.</p>
        )}

        <div className={styles.actionBtns}>
          <button className={styles.actionBtn} onClick={() => navigate('/select-level')}>단계 변경</button>
          <button className={styles.actionBtn} onClick={() => navigate('/flash-cards')}>학습 이어하기</button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.streak.current}일</div>
          <div className={styles.statLabel}>현재 연속 학습</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.streak.longest}일</div>
          <div className={styles.statLabel}>최장 연속 학습</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.streak.studyDays}</div>
          <div className={styles.statLabel}>총 학습일</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.totalWordsStudied}</div>
          <div className={styles.statLabel}>학습한 단어</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.overall.progressPercentage}%</div>
          <div className={styles.statLabel}>전체 완료율</div>
        </div>
      </div>

      {/* 레벨별 진행률 */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>레벨별 진행률</h2>
        <div className={styles.levelList}>
          {stats.levelBreakdown.filter(({ total }) => total > 0).map(({ level, completed, total, percentage }) => (
            <div key={level} className={styles.levelRow}>
              <span className={styles.levelLabel}>{level}</span>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${percentage}%` }} />
              </div>
              <span className={styles.progressText}>{completed}/{total}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
