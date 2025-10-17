import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SelectLevel from 'components/SelectLevel';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store';
import axios from 'axios';
import * as userActions from 'store/modules/user';
import SelectStep from 'components/SelectStep';
import CenterDiv from 'components/CommonStyled/CenterDiv';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import ReactPageScroller from 'react-page-scroller';
import styled from 'styled-components';

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
  const dispatch = useDispatch();
  const learningCheckpoint = useSelector((state: RootState) => state.user.learningCheckpoint);

  // Current page for page scroller
  const [currentPage, setCurrentPage] = useState<number>(0);

  // State for steps data
  const [levelData, setLevelData] = useState<LevelStepData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch steps data for the selected level
  useEffect(() => {
    const fetchStepsForLevel = async () => {
      if (!learningCheckpoint.level) return;

      setIsLoading(true);
      setError(null);

      try {
        // 수정된 API 경로 사용
        const response = await axios.get<LevelStepData>(
          `/api/words/level/${learningCheckpoint.level}/steps`
        );

        setLevelData(response.data);
      } catch (error) {
        console.error('Failed to fetch level data:', error);
        setError('Failed to load step data for this level');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStepsForLevel();
  }, [learningCheckpoint.level]);

  // Handler for level selection
  const handleSelectLevel = React.useCallback((selectedLevel: string) => {
    dispatch(userActions.setLevelCheckpoint(selectedLevel));
    // Reset to default step selection when level changes
    dispatch(userActions.setStepCheckpoint({ min: 1, max: 1 }));
  }, [dispatch]);

  // Handler for step selection
  const handleSelectStep = React.useCallback((selectedStep: { min: number, max: number }) => {
    dispatch(userActions.setStepCheckpoint(selectedStep));
  }, [dispatch]);

  // Handler for page changes
  const handlePageChange = (page: number): void => {
    setCurrentPage(page);
  };

  // 체크포인트 저장
  const handleStartLearning = () => {
    // Save checkpoint to server
    const saveCheckpoint = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user._id) return;

        // Show loading feedback
        setIsLoading(true);

        // 수정된 API 경로 사용
        await axios.patch(
          `/api/users/${user._id}/checkpoint`,
          { checkpoint: learningCheckpoint },
          { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
        );

        // Navigate to flashcards
        navigate('/flash-cards');
      } catch (error) {
        console.error('Failed to save checkpoint:', error);

        // Show error but continue anyway - user can still learn
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
            progressLevel={learningCheckpoint.level}
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
              progressLevel={learningCheckpoint.level}
              stepLength={levelData?.totalSteps || 6} // Fallback to 6 if not loaded
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
            <p>Level: {learningCheckpoint.level}</p>
            <p>Steps: {learningCheckpoint.step.min} to {learningCheckpoint.step.max}</p>
            {levelData && (
              <p>Approximately {levelData.wordsPerStep * (learningCheckpoint.step.max - learningCheckpoint.step.min + 1)} words</p>
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