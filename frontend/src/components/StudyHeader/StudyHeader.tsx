import { FC } from 'react';
import { Link } from 'react-router-dom';
import ProgressBar from 'components/ProgressBar';
import * as styles from './StudyHeader.css';

interface StudyHeaderProps {
  title: string;
  // 학습 화면은 상단 메뉴를 숨기므로 머리글에서 나간다
  exit: { to: string; label: string };
  subtitle?: string;
  // 진행은 막대 하나와 숫자 하나로 — 진한 칸은 끝낸(익힌) 카드, 연한 칸은 이번 회차에 지나간 모름
  progress?: {
    value: number;
    max: number;
    label: string;
    passed?: number;
    remaining?: number; // 이번 회차에 남은 카드 — '남음 n'
  };
}

// 카드 학습 화면의 머리글 — 무엇을(제목·범위) 어디까지(진행 막대) 하고 있는지
const StudyHeader: FC<StudyHeaderProps> = ({ title, exit, subtitle, progress }) => {
  const count = progress && `${progress.value} / ${progress.max}`;
  const left = progress?.remaining !== undefined ? `남음 ${progress.remaining}` : undefined;

  return (
    <div className={styles.header}>
      <Link to={exit.to} className={styles.exit}>← {exit.label}</Link>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </div>
      {progress && (
        <div className={styles.progressRow}>
          <ProgressBar
            value={progress.value + (progress.passed ?? 0)}
            secondary={progress.value}
            max={progress.max}
            label={progress.label}
            valueText={left ? `${count}, ${left}` : count}
          />
          <span className={styles.caption}>
            <span>{count}</span>
            {left && <span className={styles.remaining}>{left}</span>}
          </span>
        </div>
      )}
    </div>
  );
};

export default StudyHeader;
