import styled from "styled-components";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

export const SliderContainer = styled.div`
  padding: 2rem;
  border-radius: 0.5rem;
  background-color: #e6eaed;
  box-shadow: inset 2px 2px 8px #bebebe, inset -2px -2px 8px #ffffff;
`;

export const StyledSlider = styled(Slider)`
  .rc-slider {
    height: 2rem !important;
  }
  .rc-slider-rail {
    height: 1rem;
    border-radius: 0.5rem;
    background: #e6eaed;
    box-shadow: inset 2px 2px 8px #bebebe, inset -2px -2px 8px #ffffff;
  }
  .rc-slider-track {
    height: 1rem;
    background: #e6eaed;
    box-shadow: 6px 6px 12px rgba(163, 177, 198),
      -6px -6px 12px rgba(255, 255, 255);
  }
  .rc-slider-step {
    height: 1rem;
  }
  .rc-slider-handle {
    width: 1.5rem;
    height: 1.5rem;
    border: none;
    opacity: 1;
    background: #e6eaed;
    box-shadow: 6px 6px 12px rgba(163, 177, 198),
      -6px -6px 12px rgba(255, 255, 255);

    &:focus {
      box-shadow: 6px 6px 12px rgba(163, 177, 198),
        -6px -6px 12px rgba(255, 255, 255);
    }
  }
  .rc-slider-handle-dragging.rc-slider-handle-dragging.rc-slider-handle-dragging {
    border: none;
    box-shadow: 4px 4px 10px #bebebe, -4px -4px 10px #ffffff;
  }
  .rc-slider-tooltip-inner {
    min-height: auto;
  }
  .rc-slider-tooltip-placement-top {
    &::before {
      border-top-color: #4527a0;
    }
  }
`;
