import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import deckService from 'services/deckService';
import { DeckWord } from 'services/types';
import Kanji from 'components/Kanji';
import HeaderSection from 'components/HeaderSection';
import FlashCardContainer from 'components/FlashCardContainer';
import styled from 'styled-components';
import CenterDiv from 'components/CommonStyled/CenterDiv';
import { RootState } from 'store';

const FlashCardPage: React.FC = () => {
  const activeProgressType = useSelector((state: RootState) => state.user.activeProgressType);
  const [deck, setDeck] = useState<DeckWord[] | null>(null);
  const [level, setLevel] = useState<string>('');
  const [steps, setSteps] = useState<{ start: number; end: number } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // API 호출 함수를 useCallback으로 메모이제이션
  const fetchDeck = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // activeProgressType이 null이면 'main'을 기본값으로 사용
      const progressType = activeProgressType || 'main';
      const response = await deckService.getCurrentDeck(progressType);

      if (response.success && response.data) {
        const { words, level: deckLevel, steps: deckSteps } = response.data;
        setDeck(words);
        setLevel(deckLevel);
        setSteps(deckSteps);
      } else {
        // API 응답이 실패한 경우
        setError(response.message || '단어장을 불러오는데 실패했습니다.');
      }
    } catch (error: any) {
      console.error('Failed to fetch deck:', error);

      // 404 에러: 세션이 없는 경우
      if (error.response?.status === 404) {
        setError('활성화된 학습 세션이 없습니다. 학습을 시작하려면 레벨을 선택해주세요.');
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        setError('요청 시간이 초과되었습니다. 네트워크 연결을 확인해주세요.');
      } else {
        setError(error.response?.data?.message || '단어장을 불러오는데 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeProgressType]);

  // 컴포넌트가 마운트될 때 또는 activeProgressType이 변경될 때 데이터 불러오기
  useEffect(() => {
    fetchDeck();
  }, [fetchDeck]);

  // 로딩 상태에 따라 스켈레톤 UI 표시 또는 컨텐츠 표시
  const renderContent = () => {
    if (error) {
      return <ErrorMessage>{error}</ErrorMessage>;
    }

    return (
      <>
        {deck && <FlashCardContainer deck={deck} progressType={activeProgressType || 'main'} />}
        {isLoading && <SkeletonFlashCard />}
      </>
    );
  };

  return (
    <FlashCardWrap>
      <Kanji />
      <ContentContainer>
        <HeaderSection
          title={level}
          subtitle={steps ? `${steps.start} ~ ${steps.end}` : ''}
        />
        {renderContent()}
      </ContentContainer>
    </FlashCardWrap>
  );
};

// 스켈레톤 UI 컴포넌트
const SkeletonFlashCard = () => (
  <SkeletonContainer>
    <SkeletonCard />
    <SkeletonControls />
  </SkeletonContainer>
);

export default FlashCardPage;

const FlashCardWrap = styled.div`
  display: grid;
  place-items: center;
  height: 100vh;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
`;

const ContentContainer = styled(CenterDiv)`
  align-items: flex-start;
  width: fit-content;
`;

const ErrorMessage = styled.div`
  margin: 20px 0;
  padding: 10px;
  background-color: #fff0f0;
  color: #d32f2f;
  border-radius: 4px;
  border-left: 4px solid #d32f2f;
`;

// 스켈레톤 UI 스타일
const SkeletonContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const SkeletonCard = styled.div`
  width: 35rem;
  height: 35rem;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
  
  @keyframes shimmer {
    0% { background-position: 200% 0 }
    100% { background-position: -200% 0 }
  }
`;

const SkeletonControls = styled.div`
  width: 200px;
  height: 40px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 20px;
  margin: 0 auto;
`;