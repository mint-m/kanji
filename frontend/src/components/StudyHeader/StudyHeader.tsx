import { FC } from 'react';
import { Link } from 'react-router-dom';
import ProgressBar from 'components/ProgressBar';
import * as styles from './StudyHeader.css';

interface StudyHeaderProps {
  title: string;
  // 학습 화면은 상단 메뉴를 숨기므로 머리글에서 나간다
  exit: { to: string; label: string };
  subtitle?: string;
  counter?: string;
  progress?: { value: number; max: number; label: string; caption: string };
}

// 카드 학습 화면의 머리글 — 무엇을(제목·범위) 어디까지(카드 순번·진행 막대) 하고 있는지
const StudyHeader: FC<StudyHeaderProps> = ({ title, exit, subtitle, counter, progress }) => (
  <div className={styles.header}>
    <Link to={exit.to} className={styles.exit}>← {exit.label}</Link>
    <div className={styles.titleRow}>
      <h1 className={styles.title}>{title}</h1>
      {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      {counter && <span className={styles.counter}>{counter}</span>}
    </div>
    {progress && (
      <div className={styles.progressRow}>
        <ProgressBar value={progress.value} max={progress.max} label={progress.label} />
        <span className={styles.caption}>{progress.caption}</span>
      </div>
    )}
  </div>
);

export default StudyHeader;
