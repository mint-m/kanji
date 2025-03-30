import React, { PropsWithChildren, useState } from "react";
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
    level,
    children
  } = props;

  const [isExpanded, setIsExpanded] = useState(false);

  // 읽기 정보를 처리하는 함수
  const processReadings = (reading: string | undefined): string[] => {
    if (!reading) return [];
    return reading.split('·').filter(r => r.trim());
  };

  // 음독과 훈독을 배열로 분리
  const onReadItems = processReadings(onRead);
  const kunReadItems = processReadings(kunRead);

  // 읽기 정보가 있는지 확인
  const hasReadings = onReadItems.length > 0 || kunReadItems.length > 0;

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <KanjiCardWrapper
      onClick={hasReadings ? toggleExpand : undefined}
      $isClickable={hasReadings}
      $isExpanded={isExpanded}
      tabIndex={hasReadings ? 0 : undefined}
      role={hasReadings ? "button" : undefined}
      aria-expanded={hasReadings ? isExpanded : undefined}
    >
      <LevelBadge>N{level}</LevelBadge>

      <MainContent>
        <KanjiMain>
          <KanjiCharacter>{kanji}</KanjiCharacter>
          <KoreanPronunciation>{koreanPron.replace(/[,/]/g, '\n')}</KoreanPronunciation>
        </KanjiMain>

        {hasReadings && isExpanded && (
          <KanjiInfo>
            <ReadingInfo>
              {onReadItems.length > 0 && (
                <ReadingSection>
                  <ReadingLabel>음</ReadingLabel>
                  <ReadingList>
                    {onReadItems.map((item, index) => (
                      <ReadingItem key={`on-${index}`}>{item}</ReadingItem>
                    ))}
                  </ReadingList>
                </ReadingSection>
              )}

              {kunReadItems.length > 0 && (
                <ReadingSection>
                  <ReadingLabel>훈</ReadingLabel>
                  <ReadingList>
                    {kunReadItems.map((item, index) => (
                      <ReadingItem key={`kun-${index}`}>{item}</ReadingItem>
                    ))}
                  </ReadingList>
                </ReadingSection>
              )}
            </ReadingInfo>
          </KanjiInfo>
        )}
      </MainContent>

      {children && <ChildrenContainer>{children}</ChildrenContainer>}
    </KanjiCardWrapper>
  );
};

export default KanjiCard;

// 스타일 컴포넌트
const KanjiCardWrapper = styled.div<{ $isClickable: boolean; $isExpanded: boolean }>`
  position: relative;
  margin: 1rem auto;
  width: 85%;
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  ${props => props.theme.outerShadow}
  border-radius: 0.5rem;
  max-height: ${props => props.$isExpanded ? 'none' : 'calc(7rem + 2vw)'};
  overflow: hidden;
  transition: max-height 0.3s ease-in-out, transform 0.2s ease;
  
  ${props => props.$isClickable && `
    cursor: pointer;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    }
    
    &:after {
      content: '';
      position: absolute;
      bottom: 0.5rem;
      left: 50%;
      width: 3rem;
      height: 0.25rem;
      background: ${props.$isExpanded ? 'transparent' : 'rgba(0, 0, 0, 0.1)'};
      border-radius: 1rem;
      transform: translateX(-50%);
    }
  `}
  
  &:focus-visible {
    outline: 2px solid #4527a0;
    outline-offset: 2px;
  }
`;

const LevelBadge = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 1rem;
  font-weight: bold;
  background: #E6EAED;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  z-index: 1;
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const KanjiMain = styled.div`
  display: flex;
  align-items: center;
  margin: 0.5rem 0 0.75rem;
`;

const KanjiCharacter = styled.div`
  font-size: 4rem;
  margin-right: 1rem;
`;

const KoreanPronunciation = styled.div`
  font-size: 1.25rem;
  font-weight: bold;
  white-space: break-spaces;
  flex: 1;
`;

const KanjiInfo = styled.div`
  width: 100%;
  margin-top: 0.5rem;
`;

const ReadingInfo = styled.div`
  padding: 0.5rem;
  font-size: 1.25rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  max-height: 130px;
  overflow-y: auto;
  
  /* 스크롤바 스타일링 */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

const ReadingSection = styled.div`
  display: flex;
  flex: 1;
  min-width: 120px;
`;

const ReadingLabel = styled.span`
  border: 1px solid #333;
  padding: 3px 5px;
  font-size: 0.85rem;
  margin-right: 0.5rem;
  height: fit-content;
  border-radius: 4px;
`;

const ReadingList = styled.div`
  display: flex;
  flex-direction: column;
`;

const ReadingItem = styled.span`
  line-height: 1.5;
`;

const ChildrenContainer = styled.div`
`;