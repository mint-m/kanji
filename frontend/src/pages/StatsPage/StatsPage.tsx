import { FC, useEffect, useState } from 'react';
import { getStats } from 'services/userService';
import { getErrorMessage } from 'services/apiClient';
import { UserStats } from 'services/types';
import { levelName } from 'constants/levels';
import ProgressBar from 'components/ProgressBar';
import { vars } from 'styles/vars.css';
import * as layout from 'styles/layout.css';
import * as styles from './StatsPage.css';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' });

const reviewHint = (review: UserStats['review']) => {
  if (review.due > 0) return '지금 복습할 수 있어요';
  return review.nextDueAt ? `다음 복습 ${formatDate(review.nextDueAt)}` : '아직 복습할 단어가 없어요';
};

const StatsPage: FC = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getStats()
      .then((data) => { if (active) setStats(data); })
      .catch((err) => { if (active) setError(getErrorMessage(err, '기록을 불러오지 못했어요.')); });
    return () => { active = false; };
  }, []);

  if (error) return <div className={layout.page}><div className="error-box">{error}</div></div>;
  if (!stats) return <div className={layout.page}><p className="loading-text">기록을 불러오는 중...</p></div>;

  const { streak, today, learned, review, levels } = stats;
  const remaining = Math.max(today.goal - today.count, 0);

  return (
    <div className={layout.page}>
      <h1 className={layout.pageTitle}>기록</h1>

      <div className={layout.stack}>
        <section className={styles.tiles} aria-label="요약">
          <div className={styles.tile}>
            <span className={styles.tileLabel}>연속 학습</span>
            <span className={styles.tileValue}>{streak.current}<span className={styles.tileUnit}>일</span></span>
            <span className={styles.tileSub}>최장 {streak.longest}일</span>
          </div>
          <div className={styles.tile}>
            <span className={styles.tileLabel}>오늘</span>
            <span className={styles.tileValue}>{today.count}<span className={styles.tileUnit}>/ {today.goal}</span></span>
            <span className={styles.tileSub}>{remaining > 0 ? `목표까지 ${remaining}개` : '오늘 목표 달성'}</span>
          </div>
          <div className={styles.tile}>
            <span className={styles.tileLabel}>익힌 단어</span>
            <span className={styles.tileValue}>{learned.total.toLocaleString()}<span className={styles.tileUnit}>개</span></span>
            <span className={styles.tileSub}>장기 기억 {learned.longTerm}개</span>
          </div>
          <div className={styles.tile}>
            <span className={styles.tileLabel}>복습 대기</span>
            <span className={styles.tileValue}>{review.due}<span className={styles.tileUnit}>개</span></span>
            <span className={styles.tileSub}>{reviewHint(review)}</span>
          </div>
          <div className={styles.tile}>
            <span className={styles.tileLabel}>학습한 날</span>
            <span className={styles.tileValue}>{streak.studyDays}<span className={styles.tileUnit}>일</span></span>
            <span className={styles.tileSub}>응답 {stats.totalAnswers.toLocaleString()}회</span>
          </div>
        </section>

        <section className={layout.card}>
          <h2 className={layout.sectionTitle}>레벨별 익힌 단어</h2>
          <div className={styles.levelList}>
            {levels.filter((row) => row.total > 0).map((row) => (
              <div key={row.level} className={styles.levelRow}>
                <span className={styles.levelName}>{levelName(row.level)}</span>
                <ProgressBar
                  value={row.learned}
                  secondary={row.longTerm}
                  max={row.total}
                  label={`${levelName(row.level)} 익힌 단어 ${row.learned}개, 장기 기억 ${row.longTerm}개, 전체 ${row.total}개`}
                />
                <span className={styles.levelCount}>{row.learned.toLocaleString()} / {row.total.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className={styles.legend} aria-hidden="true">
            <span><span className={styles.swatch} style={{ backgroundColor: vars.color.primary }} />장기 기억 (14일 간격 통과)</span>
            <span><span className={styles.swatch} style={{ backgroundColor: '#93b4f5' }} />익힘 (복습 중)</span>
          </div>
        </section>

        <p className={layout.muted}>
          익힌 단어는 진도·집중 학습에서 한 번 이상 "알아요"를 눌러 복습에 들어간 단어예요.
          복습에서 1·3·7·14일 간격을 차례로 넘기면 장기 기억으로 셉니다.
        </p>
      </div>
    </div>
  );
};

export default StatsPage;
