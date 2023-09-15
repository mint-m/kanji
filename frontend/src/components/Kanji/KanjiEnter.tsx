import React, { PropsWithChildren } from "react";
import styled from "styled-components";

interface KanjiCardProps extends PropsWithChildren {
  level: string;
  kanji: string;
  onRead?: string;
  kunRead?: string;
  koreanPron: string;
}

const KanjiCard: React.FC<KanjiCardProps> = (props) => {
  return (
    <KanjiCardWrapper>
      <KanjiCharacter>{props.kanji}</KanjiCharacter>
      <KanjiInfo>
        <KoreanPronunciation>{props.koreanPron}</KoreanPronunciation>
        <ReadingInfo>
          <ReadingLabel>음</ReadingLabel>
          {props.onRead}
          <ReadingLabel>훈</ReadingLabel>
          {props.kunRead}
        </ReadingInfo>
      </KanjiInfo>
      <LevelBadge>N{props.level}</LevelBadge>
    </KanjiCardWrapper>
  );
};

export default KanjiCard;

const KanjiCardWrapper = styled.div`
  margin: 1rem auto;
  width: 80%;
  max-width: 40rem;
  display: flex;
  padding: 0.5rem;
  align-items: center;
`;

const KanjiCharacter = styled.div`
  flex: 1;
  margin-right: 0.5rem;
  font-size: 5rem;
`;

const KanjiInfo = styled.div`
  flex: 2;
`;

const KoreanPronunciation = styled.div`
  font-size: 2rem;
`;

const ReadingInfo = styled.div`
  margin-top: 0.5rem;
  font-size: 1.5rem;
`;

const ReadingLabel = styled.span`
  border: solid black 1px;
  padding: 5px 8px;
  font-size: 1.25rem;
  margin: 0.25rem;
`;

const LevelBadge = styled.div`
  width: 2rem;
  margin-left: auto;
  font-size: 1.25rem;
`;
