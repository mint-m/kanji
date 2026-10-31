import { FC, MouseEvent, useState } from 'react';
import { useDispatch } from 'react-redux';
import { showKanji } from './kanjiDataFilter';
import * as styles from './OriginWord.css';

interface KanjiCharacterProps {
  kanji: string;
}

const KanjiCharacter: FC<KanjiCharacterProps> = ({ kanji }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const handleClick = async (event: MouseEvent) => {
    // 카드를 눌러 읽기·뜻을 여는 동작과 구분한다
    event.stopPropagation();
    setLoading(true);
    await showKanji(kanji, dispatch);
    setLoading(false);
  };

  return (
    <button
      type="button"
      className={styles.kanjiChar}
      onClick={handleClick}
      disabled={loading}
      aria-label={`${kanji} 한자 풀이 보기`}
      title="한자 풀이 보기"
    >
      {kanji}
    </button>
  );
};

export default KanjiCharacter;
