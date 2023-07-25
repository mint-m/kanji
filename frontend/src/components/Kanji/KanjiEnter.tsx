import React, { PropsWithChildren } from "react";
import styled from "styled-components";

interface KanjiEnterProps extends PropsWithChildren {
  level: string;
  kanji: string;
  onRead?: string;
  kunRead?: string;
  koreanPron: string;
}

const KanjiEnter: React.FC<KanjiEnterProps> = (props) => {
  return (
    <KanjiWarp>
      <KanjiDisplay>{props.kanji}</KanjiDisplay>
      <KanjiPorn>
        <KanjiKoreanPorn >{props.koreanPron}</KanjiKoreanPorn>
        <KanjiRead >음독{props.onRead} 훈독{props.kunRead}</KanjiRead>
      </KanjiPorn>
      <KanjiLevel >{props.level}</KanjiLevel>
    </KanjiWarp>
  );
};

export default KanjiEnter;

const KanjiWarp = styled.div`
  margin: 0 auto;
  margin-top: 1rem;
  width: 80%;
  max-width: 40rem;
  display: flex;
  padding: 0.5rem;
`;

const KanjiDisplay = styled.div`
  height: 5rem;
  width: 5rem;
  margin-right: 0.5rem;
  font-size: 5rem;
`;

const KanjiPorn = styled.div`
  width: 60%;
  height: 100%;
`;

const KanjiKoreanPorn = styled.div`
  height: 2rem;
  width: 100%;
  font-size: 2rem;
`;

const KanjiRead = styled.div`
  height: 2.5rem;
  width: 100%;
  margin-top: 0.5rem;
  font-size: 2.5rem;
`;

const KanjiLevel = styled.div`
  height: 2rem;
  width: 2rem;
  margin-left: auto;
  font-size: 2rem;

  alt: "dd";
`;
