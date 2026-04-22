import { FC, memo } from 'react';
import type { ShowType } from 'components/FlashCard';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import { grid } from './ControlPanel.css';

interface ControlPanelProps {
  onShowClick: (type: ShowType['type']) => void;
  onKnowClick: (know: boolean) => void;
  showMean: boolean;
  showHiragana: boolean;
}

const ControlPanel: FC<ControlPanelProps> = memo(({
  onShowClick,
  onKnowClick,
  showMean,
  showHiragana,
}) => (
  <div className={grid}>
    <DefaultButton pressed={showMean} onClick={() => onShowClick('Mean')}>
      한글 뜻
    </DefaultButton>
    <DefaultButton pressed={showHiragana} onClick={() => onShowClick('Hiragana')}>
      요미가나
    </DefaultButton>
    <DefaultButton onClick={() => onKnowClick(false)}>
      공부하겠습니다
    </DefaultButton>
    <DefaultButton onClick={() => onKnowClick(true)}>
      외웠습니다
    </DefaultButton>
  </div>
));

export default ControlPanel;
