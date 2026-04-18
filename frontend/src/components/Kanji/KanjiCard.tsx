import { FC, PropsWithChildren, useState } from 'react';
import { clsx } from 'clsx';
import * as styles from './KanjiCard.css';

interface KanjiCardProps extends PropsWithChildren {
  level: string;
  kanji: string;
  onRead?: string;
  kunRead?: string;
  koreanPron: string;
}

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

const KanjiCard: FC<KanjiCardProps> = ({ kanji, koreanPron, onRead, kunRead, level, children }) => {
  const [isExpanded, setIsExpanded] = useState(false);

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
      onClick={hasReadings ? () => setIsExpanded(!isExpanded) : undefined}
      tabIndex={hasReadings ? 0 : undefined}
      role={hasReadings ? 'button' : undefined}
      aria-expanded={hasReadings ? isExpanded : undefined}
    >
      {hasReadings && (
        <span
          className={styles.indicator}
          style={{ background: isExpanded ? 'transparent' : 'rgba(0,0,0,0.1)' }}
        />
      )}

      <div className={styles.levelBadge}>N{level}</div>

      <div className={styles.cardBody}>
        <div className={styles.kanjiRow}>
          <div className={styles.kanjiGlyph}>{kanji}</div>
          <div className={styles.pronWrapper}>
            {pronItems.map((item, i) => (
              <div key={i} className={styles.pronEntry}>
                {item.mean && <span className={styles.pronMean}>{item.mean}</span>}
                <span className={styles.pronSound}>{item.sound}</span>
              </div>
            ))}
          </div>
        </div>

        {hasReadings && isExpanded && (
          <div className={styles.readingsPanel}>
            <div className={styles.readingsScroll}>
              {onReadItems.length > 0 && (
                <div className={styles.readingGroup}>
                  <span className={styles.readingTag}>음</span>
                  <div className={styles.readingList}>
                    {onReadItems.map((item, i) => (
                      <span key={`on-${i}`} className={styles.readingItem}>{item}</span>
                    ))}
                  </div>
                </div>
              )}
              {kunReadItems.length > 0 && (
                <div className={styles.readingGroup}>
                  <span className={styles.readingTag}>훈</span>
                  <div className={styles.readingList}>
                    {kunReadItems.map((item, i) => (
                      <span key={`kun-${i}`} className={styles.readingItem}>{item}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {children && <div>{children}</div>}
    </div>
  );
};

export default KanjiCard;
