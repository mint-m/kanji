import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'store';
import axios from 'axios';
import { WordType } from 'store/modules/deck';
import Kanji from 'components/Kanji';
import HeaderSection from 'components/HeaderSection';
import FlashCardContainer from 'components/FlashCardContainer';
import styled from 'styled-components';
import CenterDiv from 'components/CommonStyled/CenterDiv';

// 캐시를 위한 객체 선언
const deckCache: Record<string, WordType[]> = {};

const FlashCardPage: React.FC = () => {
  const { level, step } = useSelector((state: RootState) => state.user.learningCheckpoint);
  const [deck, setDeck] = useState<WordType[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 데이터 미리 로드 함수 (다음 레벨 등)
  const preloadNextLevelData = useCallback(() => {
    // 현재 레벨에서 다음 레벨을 예측
    const numbersOnlyLevel = level.replace(/\D/g, "");
    const nextLevel = (parseInt(numbersOnlyLevel) + 1).toString();
    
    // 다음 레벨 데이터가 캐시에 없을 경우 미리 로드
    if (!deckCache[nextLevel]) {
      axios.get<WordType[]>(`api/word/level/${nextLevel}`)
        .then(response => {
          deckCache[nextLevel] = response.data;
        })
        .catch(error => {
          console.log('Next level preload failed, but this is okay:', error);
        });
    }
  }, [level]);

  // API 호출 함수를 useCallback으로 메모이제이션
  const fetchDeck = useCallback(async () => {
    const numbersOnlyLevel = level.replace(/\D/g, "");
    
    // 이미 캐시된 데이터가 있는지 확인
    if (deckCache[numbersOnlyLevel]) {
      setDeck(deckCache[numbersOnlyLevel]);
      setIsLoading(false);
      // 다음 레벨 데이터 미리 로드
      preloadNextLevelData();
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // API 요청 타임아웃 설정 (3초)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await axios.get<WordType[]>(
        `api/word/level/${numbersOnlyLevel}`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      // 캐시에 저장
      deckCache[numbersOnlyLevel] = response.data;
      setDeck(response.data);
      
      // 다음 레벨 데이터 미리 로드
      preloadNextLevelData();
    } catch (error: any) {
      console.error('Failed to fetch deck:', error);
      if (error.name === 'AbortError') {
        setError('요청 시간이 초과되었습니다. 네트워크 연결을 확인해주세요.');
      } else {
        setError('단어장을 불러오는데 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [level, preloadNextLevelData]);

  // 컴포넌트가 마운트되거나 level이 변경될 때 데이터 불러오기
  useEffect(() => {
    fetchDeck();
  }, [level, fetchDeck]);

  // 로딩 상태에 따라 스켈레톤 UI 표시
  const renderContent = () => {
    if (error) {
      return <ErrorMessage>{error}</ErrorMessage>;
    }

    return (
      <>
        {deck && <FlashCardContainer deck={deck} />}
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
          subtitle={`${step.min} ~ ${step.max}`} 
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