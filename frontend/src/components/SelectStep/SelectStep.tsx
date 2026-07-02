import { FC } from 'react';
import StepRangeSlider from 'components/StepRangeSlider';
import StepGrid from 'components/StepGrid';
import HeaderSection from 'components/HeaderSection';
import { container, gridWrapper, sliderWrapper } from './SelectStep.css';

interface SelectStepProps {
  progressLevel: string;
  stepLength: number;
  value: { start: number; end: number };
  onSelectStep: (range: { start: number; end: number }) => void;
  fixedWidth: number;
}

const SelectStep: FC<SelectStepProps> = ({ progressLevel, stepLength, value, onSelectStep, fixedWidth }) => {
  const rangeLabel = fixedWidth === 1 ? `Step ${value.start}` : `Step ${value.start}~${value.end}`;

  return (
    <div className={container}>
      <HeaderSection title={progressLevel} subtitle={rangeLabel} />
      <div className={gridWrapper}>
        <StepGrid stepLength={stepLength} value={value} onSelectStep={onSelectStep} fixedWidth={fixedWidth} />
      </div>
      <div className={sliderWrapper}>
        <StepRangeSlider stepLength={stepLength} value={value} onSelectStep={onSelectStep} fixedWidth={fixedWidth} />
      </div>
    </div>
  );
};

export default SelectStep;
