import React from 'react';
import styled from 'styled-components';
import type { ShowType } from 'components/WordCard';

interface ControlPanelProps {
  onShowClick: (type: ShowType['type']) => void;
  onKnowClick: (know: boolean) => void;
  showMean: boolean;
  showHiragana: boolean;
}

interface StyledVisibleProps {
  $isVisible: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  onShowClick,
  onKnowClick,
  showMean,
  showHiragana
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
};

export default ControlPanel;

const ControlPanelContainer = styled.div`
  margin: 0 auto;
  padding: 1rem;
  display: grid;
  grid-template-columns: 2fr 2fr;
`;

const StyledButton = styled.button`
  display: flex;
  margin: 1rem;
  padding: 0.5rem 1rem;
  border: solid 1px #6495ED;
  border-radius: 0.5rem;
  justify-content: center;
  font-size: 1rem;
  background-color: aliceblue;
`;

const VisibleButton = styled(StyledButton) <StyledVisibleProps>`
  visibility: ${props => (props.$isVisible ? 'visible' : 'hidden')};
`;
