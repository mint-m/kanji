import { FC, ReactNode, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'store';
import { getStats } from 'services/userService';
import * as styles from './UserProgress.css';

interface SessionProgress {
  type: 'main' | 'sub';
  currentLevel: string;
  steps: { start: number; end: number };
  cycleProgress: { current: number; total: number; percentage: number };
}

interface UserStats {
  overall: { totalWords: number; completedWords: number; progressPercentage: number };
  sessions: SessionProgress[];
}

const ProgressBar: FC<{ width: number }> = ({ width }) => (
  <div className={styles.progressBarTrack}>
    <div className={styles.progressBarFill} style={{ width: `${Math.min(width, 100)}%` }} />
  </div>
);

const SectionHeading: FC<{ children: ReactNode }> = ({ children }) => (
  <h3 className={styles.sectionHeading}>{children}</h3>
);

const emptyState = (
  <div className={styles.emptyState}>
    아직 학습을 시작하지 않았습니다. 레벨을 선택하고 학습을 시작해보세요!
  </div>
);

const UserProgress: FC = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = useSelector((state: RootState) => state.user);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getStats()
      .then(setStats)
      .catch(() => setError('학습 진행 상황을 불러오는데 실패했습니다'))
      .finally(() => setIsLoading(false));
  }, [user.isLoggin]);

  if (isLoading) return <div className="loading-text">학습 진행 상황을 불러오는 중...</div>;
  if (error) return <div className="error-box" style={{ margin: '16px 0' }}>{error}</div>;

  return (
    <div className="card" style={{ width: '100%' }}>
      <h2 className={styles.pageTitle}>학습 진행 상황</h2>

      {!stats ? emptyState : (
        <>
          <div className={styles.overallSection}>
            <SectionHeading>전체 학습 진행률</SectionHeading>
            <ProgressBar width={stats.overall.progressPercentage} />
            <div className="progress-text">{stats.overall.progressPercentage}% 완료</div>
          </div>

          {stats.sessions.length > 0 ? (
            <div>
              <SectionHeading>진행 중인 학습 세션</SectionHeading>
              <div className={styles.sessionsGrid}>
                {stats.sessions.map((session) => (
                  <div key={session.type} className={styles.sessionCard}>
                    <div className={styles.sessionHeader}>
                      <div className={styles.sessionLabel}>
                        {session.type === 'main' ? '메인 학습' : '북마크 학습'}
                      </div>
                      <div className={styles.levelBadge}>{session.currentLevel}</div>
                    </div>
                    <div className={styles.statsGrid}>
                      <div className={styles.statCell}>
                        <div className={styles.statCellLabel}>스탭 범위</div>
                        <div className={styles.statCellValue}>Step {session.steps.start} - {session.steps.end}</div>
                      </div>
                      <div className={styles.statCell}>
                        <div className={styles.statCellLabel}>현재 사이클 진행</div>
                        <div className={styles.statCellValue}>
                          {session.cycleProgress.current} / {session.cycleProgress.total} 단어
                        </div>
                      </div>
                    </div>
                    <ProgressBar width={session.cycleProgress.percentage} />
                    <div className="progress-text">{session.cycleProgress.percentage}% 완료</div>
                  </div>
                ))}
              </div>
            </div>
          ) : emptyState}
        </>
      )}
    </div>
  );
};

export default UserProgress;
