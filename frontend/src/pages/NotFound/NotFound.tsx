import WordCard from 'components/FlashCard';
import { useNavigate } from 'react-router-dom';
import { Word } from 'components/FlashCard/FlashCard';
import * as styles from './NotFound.css';

const word: Word = {
  pron: '憂鬱な',
  means: ['우울한'],
  entry: 'ゆううつな',
  tryNum: 0,
};

// vanilla-extract style()은 .css.ts 안에서만 호출할 수 있다 — 컴포넌트 파일에서 부르면 런타임 예외로 404가 오류 화면이 된다
const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <WordCard word={word} showMean={false} showHiragana={false} />
      <p className={styles.message}>요청하신 페이지를 찾을 수 없습니다.</p>
      <button onClick={() => navigate('/')}>홈으로 가기</button>
    </div>
  );
};

export default NotFound;
