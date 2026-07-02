import { FC } from 'react';
import Slider from 'rc-slider';
import Tooltip from 'rc-tooltip';
import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap_white.css';
import './SliderStyles.css.ts';

interface StepSliderProps {
  stepLength: number;
  value: { start: number; end: number };
  onSelectStep: (range: { start: number; end: number }) => void;
  fixedWidth?: number;
}

const StepRangeSlider: FC<StepSliderProps> = ({ stepLength, value, onSelectStep, fixedWidth }) => {
  if (fixedWidth) {
    const maxStart = stepLength - fixedWidth + 1;
    return (
      <div className="slider-container">
        <Slider
          min={1}
          max={maxStart}
          step={1}
          value={value.start}
          style={{ height: '1rem', padding: '0' }}
          onChange={(v) => {
            const start = v as number;
            onSelectStep({ start, end: start + fixedWidth - 1 });
          }}
          handleRender={(node, handleProps) => (
            <Tooltip
              overlayInnerStyle={{ minHeight: 'auto' }}
              overlay={`STEP ${handleProps.value} ~ ${handleProps.value + fixedWidth - 1}`}
              placement="top"
              prefixCls="rc-slider-tooltip"
            >
              {node}
            </Tooltip>
          )}
        />
      </div>
    );
  }

  return (
    <div className="slider-container">
      <Slider
        range
        allowCross={false}
        min={1}
        max={stepLength}
        step={1}
        value={[value.start, value.end]}
        style={{ height: '1rem', padding: '0' }}
        onChange={(v) => {
          const [start, end] = v as number[];
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
