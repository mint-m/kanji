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

  const onReadText = onRead && onRead.replaceAll('·', '\n')
  const kunReadText = kunRead && kunRead.replaceAll('·', `\n`)

  const onReadInfo = onReadText && (
    <ReadingInfoKind>
      <ReadingLabel>음</ReadingLabel>
      <span>
        {onReadText}
      </span>
    </ReadingInfoKind>
  )

  const kunReadInfo = kunReadText && (
    <ReadingInfoKind>
      <ReadingLabel>훈</ReadingLabel>
      {kunReadText}
    </ReadingInfoKind>
  )

  return (
    <KanjiCardWrapper>
      <KanjiMain>
        <KanjiCharacter>{kanji}</KanjiCharacter>
        <KoreanPronunciation>{koreanPron.replace(/[,/]/g, '\n')}</KoreanPronunciation>
      </KanjiMain>
      <KanjiInfo>
        <ReadingInfo>
          {onReadInfo}
          {kunReadInfo}
        </ReadingInfo>
      </KanjiInfo>
      <LevelBadge>N{level}</LevelBadge>
    </KanjiCardWrapper>
  );
};

export default KanjiCard;

const KanjiMain = styled.div`
  flex: 2;
  margin-right: 0.5rem;
  text-align: center;
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
  flex: 6;
`;

const KoreanPronunciation = styled.div`
  font-size: 1.25rem;
  font-weight: bold;
  white-space: break-spaces;
`;

const ReadingInfo = styled.div`
  padding: 5px;
  font-size: 1.5rem;
  display: flex;
`;

const ReadingInfoKind = styled.div`
  white-space: pre-line;
  flex: 1;
  display: flex;
`;

const ReadingLabel = styled.span`
  border: 1px solid black;
  padding: 3px 5px;
  font-size: 1rem;
  margin: 0.25rem;
  width: fit-content;
  height: fit-content;
`;

const LevelBadge = styled.div`
  margin-left: auto;
  font-size: 1.25rem;
`;
