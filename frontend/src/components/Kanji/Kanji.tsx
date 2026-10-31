import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from 'store';
import { reset } from 'store/modules/kanji';
import KanjiCard from './KanjiCard';
import * as styles from './Kanji.css';

// 카드의 한자를 눌러 연 풀이 목록 — 좁은 화면의 시트는 바깥을 눌러도 닫힌다
const Kanji = () => {
  const dispatch = useDispatch();
  const kanjiData = useSelector((state: RootState) => state.kanji.kanjis);
  const close = () => dispatch(reset());

  useEffect(() => {
    return () => { dispatch(reset()); };
  }, [dispatch]);

  if (kanjiData.length === 0) return null;

  return (
    <>
      <div className={styles.backdrop} onClick={close} aria-hidden="true" />
      <aside className={styles.panel} aria-label="한자 풀이">
        <div className={styles.panelHeader}>
          <span>한자 풀이</span>
          <button type="button" className={styles.closeBtn} onClick={close} aria-label="한자 풀이 닫기">
            ✕
          </button>
        </div>
        {kanjiData.map((kanji) => (
          <KanjiCard
            key={kanji.kanji}
            kanji={kanji.kanji}
            level={kanji.level}
            koreanPron={kanji.koreanPron}
            onRead={kanji.onRead}
            kunRead={kanji.kunRead}
            missing={kanji.missing}
          />
        ))}
      </aside>
    </>
  );
};

export default Kanji;
