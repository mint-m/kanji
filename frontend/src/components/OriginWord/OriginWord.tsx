import React from 'react';
import { styled } from 'styled-components';
import KanjiCharacter from './KanjiCharacter';
interface OriginWordProps {
  word: string;
}

const OriginWord = (props: OriginWordProps) => {
  const split = Array.from(props.word);
  const isKanjiRegex = /[一-龥]/;
  const wordObj = split.map((char, index) => {
    return isKanjiRegex.test(char) ?
      <KanjiCharacter key={index} kanji={char} /> :
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