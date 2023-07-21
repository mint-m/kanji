import React from 'react';
import { styled } from 'styled-components';
import Kanji from './KanjiCharacter';
interface OriginWordProps {
  word: string;
}

const OriginWord = (props: OriginWordProps) => {
  const split = Array.from(props.word);
  const kanjiRegex = /[\u4e00-\u9faf]/g;
  const wordObj = split.map((char, index) => {
    return kanjiRegex.test(char) ?
      <Kanji key={index} kanji={char} /> :
      <div key={index}>{char}</div>
  });

  return <OriginWordWarp>{wordObj}</OriginWordWarp>;
};

export default OriginWord;

const OriginWordWarp = styled.div`
  display: flex;
  flex-direction: row;
  font-size: 6rem;
  justify-content: center;
`