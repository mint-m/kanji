import React from 'react';
import styled from 'styled-components';
import type { ShowType } from 'components/FlashCard';
import DefaultButton from 'components/CommonStyled/DefaultButton';

interface ControlPanelProps {
  onShowClick: (type: ShowType['type']) => void;
  onKnowClick: (know: boolean) => void;
  showMean: boolean;
  showHiragana: boolean;
}

interface StyledVisibleProps {
  $isVisible: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = React.memo(({
  onShowClick,
  onKnowClick,
  showMean,
  showHiragana,
}) => {
  return (
    <ControlPanelContainer>
      <VisibleButton $isVisible={showMean} onClick={() => onShowClick('Mean')}>
        한글 뜻
      </VisibleButton>
      <VisibleButton $isVisible={showHiragana} onClick={() => onShowClick('Hiragana')}>
        요미가미
      </VisibleButton>
      <VisibleButton $isVisible={true} onClick={() => onKnowClick(false)}>
        공부하겠습니다
      </VisibleButton>
      <VisibleButton $isVisible={true} onClick={() => onKnowClick(true)}>
        외웠습니다
      </VisibleButton>
    </ControlPanelContainer>
  );
});

export default ControlPanel;

const ControlPanelContainer = styled.div`
  display: grid;
  grid-template-columns: 2fr 2fr;
  width: 100%;
  margin-top: 1rem;

  > :nth-child(odd) {
    margin-right: 1rem;
  }

  > :nth-child(-n+2) {
    margin-bottom: 0.5rem;
  }
`;

const VisibleButton = styled(DefaultButton) <StyledVisibleProps>`
  ${props => !props.$isVisible && props.theme.innerShadow}
  width: auto;
`;
