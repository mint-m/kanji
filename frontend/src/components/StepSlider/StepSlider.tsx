import React, { useState } from 'react';
import styled from 'styled-components';

const SliderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  margin-top: 1rem;
  border-radius: 5px;
  background: #f0f0f0;
  box-shadow: 10px 10px 30px rgba(163, 177, 198, 0.6),
              -10px -10px 30px rgba(255, 255, 255, 0.5);
`;

const Slider = styled.input`
  width: 100%;
`;

interface StepSliderProps {
  level: string;
  stepLength: number;
}

function StepSlider(props: StepSliderProps) {
  const [sliderValue, setSliderValue] = useState(1);

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(event.target.value, 10);
    setSliderValue(newValue);
  };

  return (
    <SliderContainer>
      <Slider
        type="range"
        min="1"
        max={props.stepLength}
        step={1}
        value={sliderValue}
        onChange={handleSliderChange}
      />
    </SliderContainer>
  );
}

export default StepSlider;
