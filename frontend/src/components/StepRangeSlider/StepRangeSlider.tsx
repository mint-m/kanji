import React, { useState } from 'react';
import { SliderContainer, StyledSlider } from './SliderStyles';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap_white.css';

interface StepSliderProps {
  stepLength: number;
}

interface Range {
  min: number;
  max: number;
}

const StepRangeSlider: React.FC<StepSliderProps> = (props: StepSliderProps) => {
  const [range, setRange] = useState<Range>({ min: 0, max: 0 });

  return (
    <SliderContainer>
      <StyledSlider
        range
        allowCross={false}
        min={1}
        max={props.stepLength}
        step={1}
        defaultValue={[1, 1]}
        style={{ height: "1rem", padding: "0" }}
        onChange={(value) => {
          const [min, max] = value as number[];
          setRange({ min, max });
        }}
        handleRender={(node, handleProps) => {
          return (
            <Tooltip
              overlayInnerStyle={{ minHeight: "auto" }}
              overlay={`STEP ${handleProps.value}`}
              placement="top"
              prefixCls="rc-slider-tooltip"
            >
              {node}
            </Tooltip>
          );
        }}
      />
    </SliderContainer>
  );
};

export default StepRangeSlider;
