import React from 'react';
import styled from 'styled-components';

interface SelectStepProps {
  level: string
  steps: string[]
}

const StepButton = styled.button`
  background-color: #eaeaea;
  border: none;
  border-radius: 4px;
  padding: 1vh 2vh;
  margin-right: 1vh;
  cursor: pointer;
  font-size: 1rem;

  &:hover {
    background-color: #d4d4d4;
  }
`

const Container = styled.div`
  display: flex;
  width: max-content;
  margin-top: 2%;
`

const SelectStep = ({ level, steps }: SelectStepProps) => {
  const handleStepClick = (step: string) => {
    console.log(step);
  };

  return (
    <Container>
      {steps.map((step, index) => (
        <StepButton key={index} onClick={() => handleStepClick(step)}>
          {step}
        </StepButton>
      ))}
    </Container>
  )
};

export default SelectStep;
