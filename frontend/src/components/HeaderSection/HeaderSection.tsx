import { FC } from 'react';
import * as styles from './HeaderSection.css';

const HeaderSection: FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className={styles.header}>
    <span className={styles.title}>{title}</span>
    <span className={styles.subtitle}>{subtitle}</span>
  </div>
);

export default HeaderSection;
