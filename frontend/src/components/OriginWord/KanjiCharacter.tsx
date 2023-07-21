import React from 'react';
import { styled } from 'styled-components';

interface KanjiProps {
  kanji: string;
}

const Kanji = (props: KanjiProps) => {
  return <KanjiDiv>{props.kanji}</KanjiDiv>;
};

export default Kanji;

const KanjiDiv = styled.div`
  cursor: pointer;
`;
