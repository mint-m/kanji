import { FC } from 'react';
import StepRangeSlider from 'components/StepRangeSlider';
import HeaderSection from 'components/HeaderSection';
import { container } from './SelectStep.css';

interface SelectStepProps {
  progressLevel: string;
  stepLength: number;
  onSelectStep: Function;
}

const SelectStep: FC<SelectStepProps> = ({ progressLevel, stepLength, onSelectStep }) => (
  <div className={container}>
    <HeaderSection title={progressLevel} subtitle="STEPS" />
    <StepRangeSlider stepLength={stepLength} onSelectStep={onSelectStep} />
  </div>
);

export default SelectStep;
