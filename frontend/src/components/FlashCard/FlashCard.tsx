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
}

const FlashCard = memo(({ word, showHiragana, showMean }: FlashCardProps) => (
  <div className={styles.card}>
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
