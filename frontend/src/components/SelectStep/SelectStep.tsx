import React from 'react';
import styled from 'styled-components';

interface SelectStepProps {
  level: string;
  steps: string[];
}

const StepButton = styled.button`
  position: relative;
  background-color: #eaeaea;
  border: none;
  border-radius: 4px;
  padding: 1vh 2vh;
  margin-right: 1vh;
  cursor: pointer;
  font-size: 1rem;
  overflow: hidden;

  &::after {
    content: 'Start';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #4f858cb8;
    color: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1rem;
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover::after {
    opacity: 1;
  }
`;

const Container = styled.div`
  display: flex;
  width: max-content;
  margin-top: 2%;
`;

const SelectStep: React.FC<SelectStepProps> = ({ level, steps }) => {
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
  );
};

export default SelectStep;
