import { FC } from 'react';
import * as styles from './HeaderSection.css';

const HeaderSection: FC<{ title: string; subtitle: string; progress?: string }> = ({ title, subtitle, progress }) => (
  <div className={styles.header}>
    <div className={styles.titleGroup}>
      <span className={styles.title}>{title}</span>
      <span className={styles.subtitle}>{subtitle}</span>
    </div>
    {progress && <span className={styles.progress}>{progress}</span>}
  </div>
);

export default HeaderSection;
