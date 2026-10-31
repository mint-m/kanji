import { useNavigate } from 'react-router-dom';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import * as styles from './NotFound.css';

// vanilla-extract style()은 .css.ts 안에서만 호출할 수 있다 — 컴포넌트 파일에서 부르면 런타임 예외로 404가 오류 화면이 된다
const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.card} aria-hidden="true">
        <span className={styles.reading} lang="ja">ゆううつな</span>
        <span className={styles.word} lang="ja">憂鬱な</span>
        <span className={styles.mean}>우울한</span>
      </div>
      <p className={styles.message}>요청하신 페이지를 찾을 수 없어요.</p>
      <DefaultButton variant="primary" onClick={() => navigate('/')}>홈으로 가기</DefaultButton>
    </div>
  );
};

export default NotFound;
