import { FC, KeyboardEvent, useState } from 'react';
import { clsx } from 'clsx';
import * as styles from './KanjiCard.css';

interface KanjiCardProps {
  level: string;
  kanji: string;
  onRead?: string;
  kunRead?: string;
  koreanPron: string;
  missing?: boolean;
}

// 좁은 화면의 시트에서는 처음부터 음독·훈독까지 펼쳐 보인다
const opensExpanded = () => window.matchMedia?.('(max-width: 1099px)').matches ?? false;

const processReadings = (reading: string | undefined): string[] => {
  if (!reading) return [];
  return reading.split('·').filter(r => r.trim());
};

const parseKoreanPron = (koreanPron: string): { mean: string; sound: string }[] => {
  return koreanPron.split(',').map(entry => {
    const parts = entry.trim().split(/\s+/);
    return {
      sound: parts[parts.length - 1],
      mean: parts.slice(0, -1).join(' '),
    };
  });
};

const KanjiCard: FC<KanjiCardProps> = ({ kanji, koreanPron, onRead, kunRead, level, missing }) => {
  const [isExpanded, setIsExpanded] = useState(opensExpanded);
  const toggle = () => setIsExpanded((prev) => !prev);
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle();
    }
  };

  const onReadItems = processReadings(onRead);
  const kunReadItems = processReadings(kunRead);
  const hasReadings = onReadItems.length > 0 || kunReadItems.length > 0;
  const pronItems = parseKoreanPron(koreanPron);

  return (
    <div
      className={clsx(
        styles.card,
        isExpanded ? styles.cardExpanded : styles.cardCollapsed,
        hasReadings && styles.cardClickable,
      )}
      onClick={hasReadings ? toggle : undefined}
      onKeyDown={hasReadings ? handleKeyDown : undefined}
      tabIndex={hasReadings ? 0 : undefined}
      role={hasReadings ? 'button' : undefined}
      aria-expanded={hasReadings ? isExpanded : undefined}
    >
      <div className={styles.kanjiRow}>
        <div className={styles.kanjiGlyph} lang="ja">{kanji}</div>
        <div className={styles.pronWrapper}>
          {missing ? (
            <p className={styles.missing}>아직 풀이가 없는 한자예요</p>
          ) : pronItems.map((item, i) => (
            <div key={i} className={styles.pronEntry}>
              {item.mean && <span className={styles.pronMean}>{item.mean}</span>}
              <span className={styles.pronSound}>{item.sound}</span>
            </div>
          ))}
        </div>
        {level && <span className={styles.chip}>N{level}</span>}
        {/* 펼칠 수 있다는 표시 — 예전의 회색 막대는 끌어 올리는 손잡이처럼 보였다 */}
        {hasReadings && (
          <svg className={clsx(styles.chevron, isExpanded && styles.chevronUp)} width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        )}
      </div>

      {/* 음독·훈독은 줄 단위로 놓고 읽기는 옆으로 이어 쓴다 — 세로 목록은 훈독이 많은 한자(下·生)에서 열 줄이 됐다 */}
      {hasReadings && isExpanded && (
        <div className={styles.readings}>
          {onReadItems.length > 0 && (
            <div className={styles.readingGroup}>
              <span className={styles.chip}>음</span>
              <span className={styles.readingList} lang="ja">
                {onReadItems.map((item, i) => (
                  <span key={`on-${i}`} className={styles.readingItem}>{item}</span>
                ))}
              </span>
            </div>
          )}
          {kunReadItems.length > 0 && (
            <div className={styles.readingGroup}>
              <span className={styles.chip}>훈</span>
              <span className={styles.readingList} lang="ja">
                {kunReadItems.map((item, i) => (
                  <span key={`kun-${i}`} className={styles.readingItem}>{item}</span>
                ))}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KanjiCard;
