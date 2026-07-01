import { FC } from 'react';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import HeaderSection from 'components/HeaderSection';
import { container } from './SelectLevel.css';

interface SelectLevelProps {
  levels: string[];
  progressLevel: string;
  onSelectLevel: (level: string) => void;
}

const LEVEL_LABELS: Record<string, string> = { daily: '일상' };

const SelectLevel: FC<SelectLevelProps> = ({ levels, onSelectLevel, progressLevel }) => (
  <div>
    <HeaderSection title="JLPT" subtitle="LEVELS" />
    <div className={container}>
      {levels.map((level, index) => (
        <DefaultButton
          key={index}
          pressed={progressLevel === level}
          onClick={() => onSelectLevel(level)}
        >
          {LEVEL_LABELS[level] ?? level}
        </DefaultButton>
      ))}
    </div>
  </div>
);

export default SelectLevel;
