import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from 'store';

// 세션 진행 상황 인터페이스
interface SessionProgress {
  type: 'main' | 'sub';
  currentLevel: string;
  steps: {
    start: number;
    end: number;
  };
  cycleProgress: {
    current: number;
    total: number;
    percentage: number;
  };
}

// 전체 통계 인터페이스
interface UserStats {
  overall: {
    totalWords: number;
    completedWords: number;
    progressPercentage: number;
  };
  sessions: SessionProgress[];
}

interface UserProgressProps {}

const UserProgress: React.FC<UserProgressProps> = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const user = useSelector((state: RootState) => state.user);

  useEffect(() => {
    const fetchUserStats = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');

        if (!token) {
          setError('사용자 인증 정보가 없습니다');
          setIsLoading(false);
          return;
        }

        // 사용자 통계 API 호출
        const response = await axios.get<UserStats>(
          `/api/users/me/stats`,
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
  }, [user.isLoggin]);

  // 로딩 중일 때 표시할 컴포넌트
  if (isLoading) {
    return <LoadingMessage>학습 진행 상황을 불러오는 중...</LoadingMessage>;
  }

  // 에러가 발생했을 때 표시할 컴포넌트
  if (error) {
    return <ErrorMessage>{error}</ErrorMessage>;
  }

  // 데이터가 없을 때
  if (!stats) {
    return (
      <ProgressContainer>
        <h2>학습 진행 상황</h2>
        <EmptyState>
          아직 학습을 시작하지 않았습니다. 레벨을 선택하고 학습을 시작해보세요!
        </EmptyState>
      </ProgressContainer>
    );
  }

  return (
    <ProgressContainer>
      <h2>학습 진행 상황</h2>

      {/* 전체 학습 진행률 */}
      <OverallProgressSection>
        <SectionTitle>전체 학습 진행률</SectionTitle>
        <ProgressBarContainer>
          <ProgressBar width={stats.overall.progressPercentage} />
        </ProgressBarContainer>
        <ProgressText>
          {stats.overall.progressPercentage}% 완료
        </ProgressText>
      </OverallProgressSection>

      {/* 세션별 진행 상황 */}
      {stats.sessions.length > 0 && (
        <SessionsSection>
          <SectionTitle>진행 중인 학습 세션</SectionTitle>
          <SessionsList>
            {stats.sessions.map((session) => (
              <SessionCard key={session.type}>
                <SessionHeader>
                  <SessionType>{session.type === 'main' ? '메인 학습' : '북마크 학습'}</SessionType>
                  <SessionLevel>{session.currentLevel}</SessionLevel>
                </SessionHeader>

                <SessionInfo>
                  <InfoItem>
                    <InfoLabel>스탭 범위</InfoLabel>
                    <InfoValue>Step {session.steps.start} - {session.steps.end}</InfoValue>
                  </InfoItem>

                  <InfoItem>
                    <InfoLabel>현재 사이클 진행</InfoLabel>
                    <InfoValue>
                      {session.cycleProgress.current} / {session.cycleProgress.total} 단어
                    </InfoValue>
                  </InfoItem>
                </SessionInfo>

                <ProgressBarContainer>
                  <ProgressBar width={session.cycleProgress.percentage} />
                </ProgressBarContainer>
                <ProgressText>
                  {session.cycleProgress.percentage}% 완료
                </ProgressText>
              </SessionCard>
            ))}
          </SessionsList>
        </SessionsSection>
      )}

      {/* 세션이 없을 때 */}
      {stats.sessions.length === 0 && (
        <EmptyState>
          아직 학습을 시작하지 않았습니다. 레벨을 선택하고 학습을 시작해보세요!
        </EmptyState>
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

const OverallProgressSection = styled.div`
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 0.5rem;
  border: 1px solid #e9ecef;
`;

const SessionsSection = styled.div`
  margin-top: 1.5rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 1rem;
`;

const SessionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SessionCard = styled.div`
  padding: 1.5rem;
  background-color: #fff;
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
  ${props => props.theme.innerShadow}
`;

const SessionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const SessionType = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #495057;
`;

const SessionLevel = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  color: #3498db;
  padding: 0.25rem 0.75rem;
  background-color: #e3f2fd;
  border-radius: 0.25rem;
`;

const SessionInfo = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const InfoLabel = styled.div`
  font-size: 0.85rem;
  color: #6c757d;
`;

const InfoValue = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #212529;
`;

const ProgressBarContainer = styled.div`
  height: 0.75rem;
  background-color: #ecf0f1;
  border-radius: 0.5rem;
  overflow: hidden;
  margin-top: 1rem;
`;

const ProgressBar = styled.div<{ width: number }>`
  height: 100%;
  width: ${props => Math.min(props.width, 100)}%;
  background-color: #3498db;
  border-radius: 0.5rem;
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  font-size: 0.9rem;
  color: #495057;
  text-align: right;
  margin-top: 0.5rem;
  font-weight: 500;
`;