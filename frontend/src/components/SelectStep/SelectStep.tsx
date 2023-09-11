import React from 'react';
import StepRangeSlider from 'components/StepRangeSlider';
import { styled } from 'styled-components';
import HeaderSection from 'components/HeaderSection/HeaderSection';

interface SelectStepProps {
  progressLevel: string;
  stepLength: number;
  onSelectStep: Function;
}

const SelectStepContainer = styled.div`
  width: 40rem;
`

const LevelHeader = styled.span<{ $fontSize: string; }>`
  font-size: ${(props) => props.theme.fontSize[props.$fontSize]};
`

const Header = styled.div`
  > :not(:last-child) {
    margin-right: 0.25rem;
  }

  > :first-child {
    font-weight: bold;
  }
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
