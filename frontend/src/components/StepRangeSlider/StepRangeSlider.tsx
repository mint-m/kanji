import React, { useState } from 'react';
import { SliderContainer, StyledSlider, Handle } from './SliderStyles';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap_white.css';

interface StepSliderProps {
  stepLength: number;
}

interface Range {
  min: number;
  max: number;
}

const StepRangeSlider: React.FC<StepSliderProps> = (props) => {
  const [range, setRange] = useState<Range>({ min: 0, max: 0 });

  return (
    <SliderContainer>
      <StyledSlider
        range
        allowCross={false}
        min={0}
        max={10}
        step={1}
        defaultValue={[0, 0]}
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
