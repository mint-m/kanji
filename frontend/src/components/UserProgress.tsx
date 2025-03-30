import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from 'store';

// 레벨별 학습 통계 인터페이스
interface LevelStats {
  level: string;
  mastered: number;
  total: number;
  percentage: number;
}

interface UserProgressProps {
  userId?: string;
}

const UserProgress: React.FC<UserProgressProps> = ({ userId }) => {
  const [stats, setStats] = useState<LevelStats[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const user = useSelector((state: RootState) => state.user);
  
  useEffect(() => {
    const fetchUserStats = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // userId가 props로 전달되지 않은 경우 로컬 스토리지에서 가져옴
        const id = userId || JSON.parse(localStorage.getItem('user') || '{}')._id;
        
        if (!id) {
          setError('사용자 인증 정보가 없습니다');
          setIsLoading(false);
          return;
        }
        
        const token = localStorage.getItem('token');
        
        // 사용자 통계 API 호출
        const response = await axios.get<LevelStats[]>(
          `/api/users/${id}/stats`, 
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        setStats(response.data);
      } catch (error) {
        console.error('통계 데이터를 가져오는데 실패했습니다:', error);
        setError('학습 진행 상황을 불러오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserStats();
  }, [userId, user.isLoggin]);
  
  // 로딩 중일 때 표시할 컴포넌트
  if (isLoading) {
    return <LoadingMessage>학습 진행 상황을 불러오는 중...</LoadingMessage>;
  }
  
  // 에러가 발생했을 때 표시할 컴포넌트
  if (error) {
    return <ErrorMessage>{error}</ErrorMessage>;
  }
  
  return (
    <ProgressContainer>
      <h2>학습 진행 상황</h2>
      
      {/* 통계 데이터가 없을 때 표시할 컴포넌트 */}
      {stats.length === 0 ? (
        <EmptyState>
          아직 학습을 시작하지 않았습니다. 레벨을 선택하고 학습을 시작해보세요!
        </EmptyState>
      ) : (
        <>
          {/* 요약 통계 */}
          <ProgressSummary>
            <SummaryItem>
              <StatsNumber>
                {stats.reduce((sum, level) => sum + level.mastered, 0)}
              </StatsNumber>
              <StatsLabel>마스터한 단어</StatsLabel>
            </SummaryItem>
            <SummaryItem>
              <StatsNumber>
                {stats.length}
              </StatsNumber>
              <StatsLabel>학습 중인 레벨</StatsLabel>
            </SummaryItem>
          </ProgressSummary>
          
          {/* 레벨별 진행 상황 */}
          <LevelProgressList>
            {stats.map((levelStat) => (
              <LevelProgressItem key={levelStat.level}>
                <LevelName>{levelStat.level}</LevelName>
                <ProgressBarContainer>
                  <ProgressBar width={levelStat.percentage} />
                </ProgressBarContainer>
                <ProgressText>
                  {levelStat.mastered} / {levelStat.total} 단어 ({levelStat.percentage}%)
                </ProgressText>
              </LevelProgressItem>
            ))}
          </LevelProgressList>
        </>
      )}
    </ProgressContainer>
  );
};

export default UserProgress;

// 스타일 컴포넌트
const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
  font-size: 1.2rem;
`;

const ErrorMessage = styled.div`
  color: #d32f2f;
  background-color: #fff0f0;
  padding: 1rem;
  border-radius: 0.5rem;
  border-left: 4px solid #d32f2f;
  margin: 1rem 0;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
`;

const ProgressContainer = styled.div`
  width: 100%;
  padding: 1.5rem;
  border-radius: 0.5rem;
  background-color: #fff;
  ${props => props.theme.outerShadow}
  
  h2 {
    margin-top: 0;
    text-align: center;
    color: #2c3e50;
    margin-bottom: 1.5rem;
  }
`;

const ProgressSummary = styled.div`
  display: flex;
  justify-content: space-around;
  margin-bottom: 2rem;
  text-align: center;
`;

const SummaryItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StatsNumber = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  color: #3498db;
`;

const StatsLabel = styled.div`
  font-size: 1rem;
  color: #7f8c8d;
  margin-top: 0.5rem;
`;

const LevelProgressList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const LevelProgressItem = styled.div`
  display: grid;
  grid-template-columns: 3rem 1fr 8rem;
  align-items: center;
  gap: 1rem;
`;

const LevelName = styled.div`
  font-weight: bold;
  text-align: center;
`;

const ProgressBarContainer = styled.div`
  height: 0.75rem;
  background-color: #ecf0f1;
  border-radius: 0.5rem;
  overflow: hidden;
`;

const ProgressBar = styled.div<{ width: number }>`
  height: 100%;
  width: ${props => Math.min(props.width, 100)}%;
  background-color: #3498db;
  border-radius: 0.5rem;
`;

const ProgressText = styled.div`
  font-size: 0.85rem;
  color: #7f8c8d;
  text-align: right;
`;