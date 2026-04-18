import WordCard from 'components/FlashCard';
import { useNavigate } from 'react-router-dom';
import { Word } from 'components/FlashCard/FlashCard';
import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

const container = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  gap: vars.space.lg,
});

const message = style({
  fontSize: vars.fontSize.md,
  color: vars.color.textMuted,
});

const word: Word = {
  pron: '憂鬱な',
  means: ['우울한'],
  entry: 'ゆううつな',
  tryNum: 0,
};

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className={container}>
      <WordCard word={word} showMean={false} showHiragana={false} />
      <p className={message}>요청하신 페이지를 찾을 수 없습니다.</p>
      <button onClick={() => navigate('/')}>홈으로 가기</button>
    </div>
  );
};

export default NotFound;
