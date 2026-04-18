import { FC, useState } from 'react';
import Slider from 'rc-slider';
import Tooltip from 'rc-tooltip';
import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap_white.css';
import './SliderStyles.css.ts';

interface StepSliderProps {
  stepLength: number;
  onSelectStep: Function;
}

const StepRangeSlider: FC<StepSliderProps> = ({ stepLength, onSelectStep }) => {
  const [range, setRange] = useState({ min: 1, max: 1 });

  return (
    <div className="slider-container">
      <Slider
        range
        allowCross={false}
        min={1}
        max={stepLength}
        step={1}
        defaultValue={[range.min, range.max]}
        style={{ height: '1rem', padding: '0' }}
        onChange={(value) => {
          const [min, max] = value as number[];
          setRange({ min, max });
          onSelectStep({ min, max });
        }}
        handleRender={(node, handleProps) => (
          <Tooltip
            overlayInnerStyle={{ minHeight: 'auto' }}
            overlay={`STEP ${handleProps.value}`}
            placement="top"
            prefixCls="rc-slider-tooltip"
          >
            {node}
          </Tooltip>
        )}
      />
    </div>
  );
};

export default StepRangeSlider;
