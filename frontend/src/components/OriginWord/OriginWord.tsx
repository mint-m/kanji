import KanjiCharacter from './KanjiCharacter';
import * as styles from './OriginWord.css';

interface OriginWordProps {
  word: string;
}

const calculateFontSize = (stringLength: number) => {
  const maxSize = 30;
  const minSize = 6;
  const fontSize = Math.min(maxSize / stringLength, minSize);
  return `${fontSize}rem`;
};

const OriginWord = ({ word }: OriginWordProps) => {
  const chars = Array.from(word);
  const isKanjiRegex = /[一-龥]/;

  return (
    <div className={styles.wordRow} style={{ fontSize: calculateFontSize(chars.length) }}>
      {chars.map((char, index) =>
        isKanjiRegex.test(char)
          ? <KanjiCharacter key={index} kanji={char} />
          : <div key={index}>{char}</div>
      )}
    </div>
  );
};

export default OriginWord;
