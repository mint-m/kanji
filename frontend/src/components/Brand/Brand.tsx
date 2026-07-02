import { useNavigate } from 'react-router-dom';
import * as styles from './Brand.css';

const Brand = () => {
  const navigate = useNavigate();
  return (
    <button className={styles.brand} onClick={() => navigate('/')} aria-label="홈으로">
      <span className={styles.word}>kanji</span>
    </button>
  );
};

export default Brand;
