import { FC, useEffect, useState } from 'react';
import { getStats } from 'services/userService';
import CenterDiv from 'components/CommonStyled/CenterDiv';
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
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => setError('통계를 불러오는데 실패했습니다.'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <CenterDiv><div className="loading-text">불러오는 중...</div></CenterDiv>;
  if (error) return <CenterDiv><div className="error-box">{error}</div></CenterDiv>;
  if (!stats) return null;

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>학습 대시보드</h1>

      <div className={styles.statsGrid}>
        <div className={clsx('card', styles.statCard)}>
          <div className={styles.streakValue}>{stats.streak.current}일</div>
          <div className={styles.statLabel}>현재 연속 학습</div>
        </div>
        <div className={clsx('card', styles.statCard)}>
          <div className={styles.streakValue}>{stats.streak.longest}일</div>
          <div className={styles.statLabel}>최장 연속 학습</div>
        </div>
        <div className={clsx('card', styles.statCard)}>
          <div className={styles.statValue}>{stats.streak.studyDays}</div>
          <div className={styles.statLabel}>총 학습일</div>
        </div>
        <div className={clsx('card', styles.statCard)}>
          <div className={styles.statValue}>{stats.totalWordsStudied}</div>
          <div className={styles.statLabel}>학습한 단어</div>
        </div>
        <div className={clsx('card', styles.statCard)}>
          <div className={styles.statValue}>{stats.overall.progressPercentage}%</div>
          <div className={styles.statLabel}>전체 완료율</div>
        </div>
      </div>

      <div className="card">
        <h2 className={styles.sectionTitle}>레벨별 진행률</h2>
        <div className={styles.levelList}>
          {stats.levelBreakdown.map(({ level, completed, total, percentage }) => (
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
