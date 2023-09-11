import React from 'react';
import StepRangeSlider from 'components/StepRangeSlider';
import { styled } from 'styled-components';
import HeaderSection from 'components/HeaderSection';

interface SelectStepProps {
  progressLevel: string;
  stepLength: number;
  onSelectStep: Function;
}

const SelectStepContainer = styled.div`
  width: 40rem;
`

const SelectStep: React.FC<SelectStepProps> = ({ progressLevel, stepLength, onSelectStep }) => {
  return (
    <SelectStepContainer>
      <HeaderSection title={progressLevel} subtitle="STEPS" />
      <StepRangeSlider stepLength={stepLength} onSelectStep={onSelectStep} />
    </SelectStepContainer>
  );
};

export default SelectStep;
