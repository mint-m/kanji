import { FC, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SelectLevel from 'components/SelectLevel';
import { useSelector } from 'react-redux';
import { RootState } from 'store';
import SelectStep from 'components/SelectStep';
import CenterDiv from 'components/CommonStyled/CenterDiv';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import ReactPageScroller from 'react-page-scroller';
import { api } from 'services/apiClient';
import progressService from 'services/progressService';
import * as styles from './LevelSelectionPage.css';
import { vars } from 'styles/vars.css';

interface LevelStepData {
  level: string;
  totalSteps: number;
  wordsPerStep: number;
}

const levels: string[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

const LevelSelectionPage: FC = () => {
  const navigate = useNavigate();
  const activeProgressType = useSelector((state: RootState) => state.user.activeProgressType);
  const [selectedLevel, setSelectedLevel] = useState('N5');
  const [selectedSteps, setSelectedSteps] = useState({ start: 1, end: 3 });
  const [currentPage, setCurrentPage] = useState(0);
  const [levelData, setLevelData] = useState<LevelStepData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedLevel) return;
    setIsLoading(true);
    setError(null);
    api.get<LevelStepData>(`/api/words/level/${selectedLevel}/steps`)
      .then(setLevelData)
      .catch(() => setError('Failed to load step data for this level'))
      .finally(() => setIsLoading(false));
  }, [selectedLevel]);

  const handleSelectLevel = useCallback((level: string) => {
    setSelectedLevel(level);
    setSelectedSteps({ start: 1, end: 3 });
  }, []);

  const handleSelectStep = useCallback((steps: { start: number; end: number }) => {
    setSelectedSteps(steps);
  }, []);

  const handleStartLearning = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user._id) { alert('User not found. Please log in again.'); return; }
      setIsLoading(true);
      await progressService.saveCheckpoint(activeProgressType || 'main', selectedLevel as any, selectedSteps);
      navigate('/flash-cards');
    } catch {
      alert('Failed to save your progress, but you can continue learning');
      navigate('/flash-cards');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ReactPageScroller pageOnChange={setCurrentPage} customPageNumber={currentPage}>
      <div>
        <CenterDiv>
          <SelectLevel levels={levels} onSelectLevel={handleSelectLevel} progressLevel={selectedLevel} />
        </CenterDiv>
      </div>

      <div>
        <CenterDiv>
          {isLoading ? (
            <div className="loading-text">Loading steps...</div>
          ) : error ? (
            <div className="error-box">{error}</div>
          ) : (
            <SelectStep
              progressLevel={selectedLevel}
              stepLength={levelData?.totalSteps || 6}
              onSelectStep={handleSelectStep}
            />
          )}
        </CenterDiv>
      </div>

      <div>
        <CenterDiv>
          <div className={styles.summaryBox}>
            <h2 className={styles.summaryTitle}>Selected Study Plan:</h2>
            <p className={styles.summaryItem}>Session: {activeProgressType || 'main'}</p>
            <p className={styles.summaryItem}>Level: {selectedLevel}</p>
            <p className={styles.summaryItem}>Steps: {selectedSteps.start} to {selectedSteps.end}</p>
            {levelData && (
              <p className={styles.summaryItem}>
                Approximately {levelData.wordsPerStep * (selectedSteps.end - selectedSteps.start + 1)} words
              </p>
            )}
          </div>
          <DefaultButton style={{ padding: '16px 32px', fontSize: vars.fontSize.md }} onClick={handleStartLearning}>
            Start Learning
          </DefaultButton>
        </CenterDiv>
      </div>
    </ReactPageScroller>
  );
};

export default LevelSelectionPage;
