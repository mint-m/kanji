import React from 'react';
import StepRangeSlider from 'components/StepRangeSlider';
import { styled } from 'styled-components';

interface SelectStepProps {
  progressLevel: string;
  stepLength: number;
  onSelectStep: Function;
}

const SelectStepContainer = styled.div`
  width: 40rem;
`

const AlignedHeading = styled.h1`
  margin-top: 0;
  margin-bottom: 0;
  display: inline-block;
`

const SelectStep: React.FC<SelectStepProps> = ({ progressLevel, stepLength, onSelectStep }) => {
  return (
    <SelectStepContainer>
      <div>
        <AlignedHeading>{progressLevel}</AlignedHeading>
        <AlignedHeading as="h2">STEPS</AlignedHeading>
      </div>
      <StepRangeSlider stepLength={stepLength} onSelectStep={onSelectStep} />
    </SelectStepContainer>
  );
};

export default SelectStep;
