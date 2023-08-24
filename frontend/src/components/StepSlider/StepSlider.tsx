import React, { useState } from 'react';
import styled from 'styled-components';

const SliderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  margin-top: 1rem;
  border-radius: 0.5rem;
  box-shadow: inset 2px 2px 8px #bebebe,
              inset -2px -2px 8px #ffffff;
`;

const Slider = styled.input`
  flex: 1;
  outline: none;
  width: 100%;
  appearance: none;

  &::-webkit-slider-runnable-track {
    border-radius: 0.5rem;
    height: 1rem;
    box-shadow: inset 2px 2px 6px #bebebe,
                inset -2px -2px 6px #ffffff;
  }

  &::-webkit-slider-thumb {
    transform: translateY(-0.25rem);
    appearance: none;
    width: 1.5rem;
    height: 1.5rem;
    background: #E7EBEE;
    border-radius: 50%;
    cursor: pointer;

    box-shadow: -2px -2px 5px #fff,
                4px 4px 4px rgba(0, 0, 0, 0.25);
  }
`;

interface StepSliderProps {
  level: string;
  stepLength: number;
  progressStep: number;
  onSelectStep: (step: number) => void;
}

function StepSlider(props: StepSliderProps) {
  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(event.target.value, 10);
    props.onSelectStep(newValue);
  };

  return (
    <SliderContainer>
      <Slider
        type="range"
        min="1"
        max={props.stepLength}
        step={1}
        value={props.progressStep}
        onChange={handleSliderChange}
      />
    </SliderContainer>
  );
}

export default StepSlider;
