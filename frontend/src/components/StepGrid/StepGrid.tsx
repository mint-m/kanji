import { FC, useState } from 'react';
import { clsx } from 'clsx';
import * as styles from './StepGrid.css';

interface StepGridProps {
  stepLength: number;
  value: { start: number; end: number };
  onSelectStep: (range: { start: number; end: number }) => void;
  fixedWidth: number;
}

const StepGrid: FC<StepGridProps> = ({ stepLength, value, onSelectStep, fixedWidth }) => {
  const [hoverStep, setHoverStep] = useState<number | null>(null);

  const getClampedRange = (n: number) => {
    if (fixedWidth === 1) return { start: n, end: n };
    const half = Math.floor(fixedWidth / 2);
    const start = Math.max(1, Math.min(n - half, stepLength - fixedWidth + 1));
    return { start, end: start + fixedWidth - 1 };
  };

  const hoveredCells = hoverStep !== null
    ? (() => { const { start, end } = getClampedRange(hoverStep); return new Set(Array.from({ length: end - start + 1 }, (_, i) => start + i)); })()
    : new Set<number>();
  const isInSelection = (n: number) => n >= value.start && n <= value.end;

  return (
    <div className={styles.grid}>
      {Array.from({ length: stepLength }, (_, i) => i + 1).map((n) => {
        const isHovered = hoveredCells.has(n);
        const isSelected = !isHovered && isInSelection(n);
        return (
          <div
            key={n}
            className={clsx(styles.cell, isHovered && styles.cellHover, isSelected && styles.cellSelected)}
            onMouseEnter={() => setHoverStep(n)}
            onMouseLeave={() => setHoverStep(null)}
            onClick={() => onSelectStep(getClampedRange(n))}
          >
            {n}
          </div>
        );
      })}
    </div>
  );
};

export default StepGrid;
