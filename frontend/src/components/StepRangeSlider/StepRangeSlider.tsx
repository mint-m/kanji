import React, { useState } from 'react';
import styled from 'styled-components';
import Slider from 'rc-slider';
import "rc-slider/assets/index.css";
import Tooltip from "rc-tooltip";
import "rc-tooltip/assets/bootstrap_white.css";


const SliderContainer = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: inset 2px 2px 8px #bebebe,
              inset -2px -2px 8px #ffffff;
`;

interface StepSliderProps {
  stepLength: number;
}

interface Range {
  min: number;
  max: number;
}

const StepRangeSlider = (props: StepSliderProps) => {
  const [range, setRange] = useState<Range>({ min: 0, max: 0 });

  return (
    <SliderContainer>
      <div>
        <Slider
          range
          allowCross={false}
          handleRender={(node, handleProps) => {
            return (
              <Tooltip
                overlayInnerStyle={{ minHeight: "auto" }}
                overlay={`STEP ${handleProps.value}`}
                placement="top"
              >
                {node}
              </Tooltip>
            );
          }}
          handleStyle={{ borderColor: "#4527a0", borderWidth: 4 }}
          trackStyle={{ backgroundColor: "#4527a0" }}
          min={0}
          max={10}
          step={1}
          defaultValue={[0, 0]}
          onChange={(value) => {
            const [min, max] = value as number[];
            setRange({ min, max });
          }}
        />
      </div>
    </SliderContainer>
  );
}

export default StepRangeSlider;