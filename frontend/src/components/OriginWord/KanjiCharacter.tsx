import { FC, MouseEvent, useState } from 'react';
import { useDispatch } from 'react-redux';
import { clsx } from 'clsx';
import * as kanjiActions from 'store/modules/kanji';
import { lookupKanji } from './kanjiDataFilter';
import * as styles from './OriginWord.css';

interface KanjiCharacterProps {
  kanji: string;
}

const KanjiCharacter: FC<KanjiCharacterProps> = ({ kanji }) => {
  const dispatch = useDispatch();
  const [status, setStatus] = useState<'idle' | 'loading' | 'missing'>('idle');

  const handleClick = async (event: MouseEvent) => {
    // 카드를 눌러 읽기·뜻을 여는 동작과 구분한다
    event.stopPropagation();
    setStatus('loading');
    const data = await lookupKanji(kanji);
    if (data) {
      dispatch(kanjiActions.addKanji(data));
      setStatus('idle');
    } else {
      setStatus('missing');
    }
  };

  return (
    <button
      type="button"
      className={clsx(styles.kanjiChar, status === 'missing' && styles.notFoundChar)}
      onClick={handleClick}
      disabled={status === 'loading'}
      aria-label={status === 'missing' ? `${kanji} (한자 풀이 없음)` : `${kanji} 한자 풀이 보기`}
      title={status === 'missing' ? '한자 풀이를 찾지 못했어요' : '한자 풀이 보기'}
    >
      {kanji}
    </button>
  );
};

export default KanjiCharacter;
