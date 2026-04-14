import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SelectLevel from 'components/SelectLevel';
import { useSelector } from 'react-redux';
import { RootState } from 'store';
import SelectStep from 'components/SelectStep';
import CenterDiv from 'components/CommonStyled/CenterDiv';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import ReactPageScroller from 'react-page-scroller';
import styled from 'styled-components';
import { api } from 'services/apiClient';

// Types for level data
interface LevelStepData {
  level: string;
  totalSteps: number;
  wordsPerStep: number;
}

// All available JLPT levels
const levels: string[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

const LevelSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const activeProgressType = useSelector((state: RootState) => state.user.activeProgressType);

  // Local state for level and step selection
  const [selectedLevel, setSelectedLevel] = useState<string>('N5');
  const [selectedSteps, setSelectedSteps] = useState<{ start: number, end: number }>({ start: 1, end: 3 });

  // Current page for page scroller
  const [currentPage, setCurrentPage] = useState<number>(0);

  // State for steps data
  const [levelData, setLevelData] = useState<LevelStepData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch steps data for the selected level
  useEffect(() => {
    const fetchStepsForLevel = async () => {
      if (!selectedLevel) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await api.get<LevelStepData>(`/api/words/level/${selectedLevel}/steps`);

        setLevelData(data);
      } catch (error) {
        console.error('Failed to fetch level data:', error);
        setError('Failed to load step data for this level');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStepsForLevel();
  }, [selectedLevel]);

  // Handler for level selection
  const handleSelectLevel = React.useCallback((level: string) => {
    setSelectedLevel(level);
    // Reset to default step selection when level changes
    setSelectedSteps({ start: 1, end: 3 });
  }, []);

  // Handler for step selection
  const handleSelectStep = React.useCallback((steps: { start: number, end: number }) => {
    setSelectedSteps(steps);
  }, []);

  // Handler for page changes
  const handlePageChange = (page: number): void => {
    setCurrentPage(page);
  };

  // 체크포인트 저장 및 UserProgress 생성/업데이트
  const handleStartLearning = () => {
    const saveCheckpoint = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user._id) {
          alert('User not found. Please log in again.');
          return;
        }

        setIsLoading(true);

        // UserProgress 생성/업데이트
        await api.patch(
          `/api/users/me/checkpoint`,
          {
            progressType: activeProgressType || 'main',
            level: selectedLevel,
            steps: selectedSteps,
          }
        );

        // Navigate to flashcards
        navigate('/flash-cards');
      } catch (error) {
        console.error('Failed to save checkpoint:', error);

        // Show error but continue anyway
        const errorMessage = "Failed to save your progress, but you can continue learning";
        alert(errorMessage);

        navigate('/flash-cards');
      } finally {
        setIsLoading(false);
      }
    };

    saveCheckpoint();
  };

  return (
    <ReactPageScroller
      pageOnChange={handlePageChange}
      customPageNumber={currentPage}
    >
      {/* Level selection section */}
      <div>
        <CenterDiv>
          <SelectLevel
            levels={levels}
            onSelectLevel={handleSelectLevel}
            progressLevel={selectedLevel}
          />
        </CenterDiv>
      </div>

      {/* Step selection section */}
      <div>
        <CenterDiv>
          {isLoading ? (
            <LoadingMessage>Loading steps...</LoadingMessage>
          ) : error ? (
            <ErrorMessage>{error}</ErrorMessage>
          ) : (
            <SelectStep
              progressLevel={selectedLevel}
              stepLength={levelData?.totalSteps || 6}
              onSelectStep={handleSelectStep}
            />
          )}
        </CenterDiv>
      </div>

      {/* Start learning section */}
      <div>
        <CenterDiv>
          <InfoPanel>
            <h2>Selected Study Plan:</h2>
            <p>Session: {activeProgressType || 'main'}</p>
            <p>Level: {selectedLevel}</p>
            <p>Steps: {selectedSteps.start} to {selectedSteps.end}</p>
            {levelData && (
              <p>Approximately {levelData.wordsPerStep * (selectedSteps.end - selectedSteps.start + 1)} words</p>
            )}
          </InfoPanel>
          <StartButton onClick={handleStartLearning}>
            Start Learning
          </StartButton>
        </CenterDiv>
      </div>
    </ReactPageScroller>
  );
};

export default LevelSelectionPage;

// Styled Components
const LoadingMessage = styled.div`
  font-size: 1.2rem;
  color: #666;
`;

const ErrorMessage = styled.div`
  color: #d32f2f;
  background-color: #fff0f0;
  padding: 1rem;
  border-radius: 0.5rem;
  border-left: 4px solid #d32f2f;
`;

const InfoPanel = styled.div`
  background-color: #f5f5f5;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 2rem;
  text-align: center;
  ${props => props.theme.outerShadow}
  
  h2 {
    margin-top: 0;
    font-size: 1.5rem;
  }
  
  p {
    margin: 0.5rem 0;
    font-size: 1.2rem;
  }
`;

const StartButton = styled(DefaultButton)`
  padding: 1rem 2rem;
  font-size: 1.2rem;
`;