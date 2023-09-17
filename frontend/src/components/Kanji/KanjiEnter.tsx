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
  const {
    kanji,
    koreanPron,
    onRead,
    kunRead,
    level
  } = props;

  return (
    <KanjiCardWrapper>
      <KanjiMain>
        <KanjiCharacter>{kanji}</KanjiCharacter>
        <KoreanPronunciation>{koreanPron}</KoreanPronunciation>
      </KanjiMain>
      <KanjiInfo>
        <ReadingInfo>
          {onRead && (
            <>
              <ReadingLabel>음</ReadingLabel>
              {onRead}
            </>
          )}
          {kunRead && (
            <>
              <ReadingLabel>훈</ReadingLabel>
              {kunRead}
            </>
          )}
        </ReadingInfo>
      </KanjiInfo>
      <LevelBadge>N{level}</LevelBadge>
    </KanjiCardWrapper>
  );
};

export default KanjiCard;

const KanjiMain = styled.div`
  flex: 1;
  margin-right: 0.5rem;
`

const KanjiCardWrapper = styled.div`
  margin: 1rem auto;
  width: 85%;
  display: flex;
  padding: 0.25rem 0.75rem;
  ${props => props.theme.outerShadow}
  border-radius: 0.5rem;
`;

const KanjiCharacter = styled.div`
  font-size: 5rem;
`;

const KanjiInfo = styled.div`
  flex: 5;
`;

const KoreanPronunciation = styled.div`
  font-size: 1.25rem;
  font-weight: bold;
`;

const ReadingInfo = styled.div`
justify-content: start;
  flex-direction: column;
  margin-top: 0.5rem;
  font-size: 1.5rem;
`;

const ReadingLabel = styled.span`
  border: 1px solid black;
  padding: 3px 5px;
  font-size: 1rem;
  margin: 0.25rem;
`;

const LevelBadge = styled.div`
  margin-left: auto;
  font-size: 1.25rem;
`;
