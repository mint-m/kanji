import React from 'react';
import StepRangeSlider from 'components/StepRangeSlider';
import { styled } from 'styled-components';

interface SelectStepProps {
  progressLevel: string;
  stepLength: number;
}

const SelectStepHeader = styled.div`
`

const AlignedHeading = styled.h1`
  margin-top: 0;
  margin-bottom: 0;
  display: inline-block;
`

const SelectStep: React.FC<SelectStepProps> = ({ progressLevel, stepLength }) => {
  return (
    <div>
      <SelectStepHeader>
        <AlignedHeading>{progressLevel}</AlignedHeading>
        <AlignedHeading as="h2">STEPS</AlignedHeading>
      </SelectStepHeader>
      <StepRangeSlider stepLength={stepLength} />
    </div>
  );
};

export default SelectStep;
