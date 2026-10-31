import KanjiCharacter from './KanjiCharacter';
import * as styles from './OriginWord.css';

interface OriginWordProps {
  word: string;
}

// 글자 수에 맞춰 줄이되 카드 폭(모바일 85vw, 데스크톱 35rem)을 넘지 않게 한다
const fontSizeFor = (length: number) => `min(6rem, ${Math.floor(68 / length)}vw, ${Math.floor(480 / length)}px)`;

export const KANJI = /[一-龥]/;

const OriginWord = ({ word }: OriginWordProps) => {
  const chars = Array.from(word);

  return (
    <div className={styles.wordRow} style={{ fontSize: fontSizeFor(chars.length) }} lang="ja">
      {chars.map((char, index) =>
        KANJI.test(char)
          ? <KanjiCharacter key={`${index}-${char}`} kanji={char} />
          : <span key={`${index}-${char}`}>{char}</span>
      )}
    </div>
  );
};

export default OriginWord;
