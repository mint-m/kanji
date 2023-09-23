import React from 'react';
import { styled } from 'styled-components';
import KanjiCharacter from './KanjiCharacter';
interface OriginWordProps {
  word: string;
}

const calculateFontSize = (stringLength: number) => {
  const maxSize = 30; // 부모 요소의 최대 크기, 여유 공간 계산(28rem)
  const minSize = 6; // 최소 폰트 크기 (6rem)
  const fontSize = Math.min(maxSize / stringLength, minSize);
  return `${fontSize}rem`;
};

const OriginWord = (props: OriginWordProps) => {
  const split = Array.from(props.word);
  const isKanjiRegex = /[一-龥]/;
  const wordObj = split.map((char, index) => {
    return isKanjiRegex.test(char) ?
      <KanjiCharacter key={index} kanji={char} /> :
      <div key={index}>{char}</div>
  });

  return <OriginWordWarp $stringLength={wordObj.length}>{wordObj}</OriginWordWarp>;
};

export default OriginWord;

const OriginWordWarp = styled.div<{ $stringLength: number }>`
  display: flex;
  flex-direction: row;
  font-size: ${(props) => calculateFontSize(props.$stringLength)};
  justify-content: center;
  align-items: center;
  height: fit-content;

  font-family: 'Noto Sans JP';
`