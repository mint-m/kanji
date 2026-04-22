import { FC, useState } from 'react';
import Slider from 'rc-slider';
import Tooltip from 'rc-tooltip';
import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap_white.css';
import './SliderStyles.css.ts';

interface StepSliderProps {
  stepLength: number;
  onSelectStep: (range: { start: number; end: number }) => void;
}

const StepRangeSlider: FC<StepSliderProps> = ({ stepLength, onSelectStep }) => {
  const [range, setRange] = useState({ start: 1, end: 1 });

  return (
    <div className="slider-container">
      <Slider
        range
        allowCross={false}
        min={1}
        max={stepLength}
        step={1}
        defaultValue={[range.start, range.end]}
        style={{ height: '1rem', padding: '0' }}
        onChange={(value) => {
          const [start, end] = value as number[];
          setRange({ start, end });
          onSelectStep({ start, end });
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
