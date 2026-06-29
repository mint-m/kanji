import { memo } from 'react';
import { clsx } from 'clsx';
import OriginWord from 'components/OriginWord';
import * as styles from './FlashCard.css';

export interface ShowType {
  type: 'Mean' | 'Hiragana';
}

export interface Word {
  tryNum?: number;
  pron?: string;
  means: string[];
  entry: string;
}

interface FlashCardProps {
  word: Word;
  showHiragana: boolean;
  showMean: boolean;
  isBookmarked?: boolean;
  onBookmark?: () => void;
}

const FlashCard = memo(({ word, showHiragana, showMean, isBookmarked, onBookmark }: FlashCardProps) => (
  <div className={styles.card}>
    {onBookmark && (
      <button
        className={clsx(styles.bookmarkBtn, isBookmarked && styles.bookmarkBtnActive)}
        onClick={onBookmark}
        aria-label={isBookmarked ? '북마크 해제' : '북마크'}
      >
        {isBookmarked ? '★' : '☆'}
      </button>
    )}
    <div className={clsx(styles.hiraganaRow, showHiragana ? styles.visible : styles.invisible)}>
      {word.entry}
    </div>
    <OriginWord word={word.pron || word.entry} />
    <div>
      {word.means.map((mean, index) => (
        <div key={index} className={clsx(styles.meanItem, showMean ? styles.visible : styles.invisible)}>
          {mean}
        </div>
      ))}
    </div>
  </div>
));

export default FlashCard;
