import * as styles from './ProgressBar.css';

interface ProgressBarProps {
  value: number;
  max: number;
  // value 위에 더 진하게 겹쳐 그릴 양
  secondary?: number;
  label: string;
  // 두 겹을 읽을 말 — 값 하나로는 무엇을 셌는지 알 수 없을 때
  valueText?: string;
}

const percent = (value: number, max: number) => (max > 0 ? Math.min(100, (value / max) * 100) : 0);

const ProgressBar = ({ value, max, secondary, label, valueText }: ProgressBarProps) => (
  <div
    className={styles.track}
    role="progressbar"
    aria-label={label}
    aria-valuemin={0}
    aria-valuemax={max}
    aria-valuenow={value}
    aria-valuetext={valueText}
  >
    <div className={styles.fill} style={{ width: `${percent(value, max)}%` }} />
    {secondary !== undefined && <div className={styles.secondary} style={{ width: `${percent(secondary, max)}%` }} />}
  </div>
);

export default ProgressBar;
