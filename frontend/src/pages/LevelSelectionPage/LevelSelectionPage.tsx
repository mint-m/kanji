import React from 'react';
import { useNavigate } from 'react-router-dom';
import SelectLevel from 'components/SelectLevel';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store';
import * as userActions from 'store/modules/user';
import SelectStep from 'components/SelectStep';

const levels = ['N5', 'N4', 'N3', 'N2', 'N1'];
const steps = [1, 2, 3, 4, 5, 6];

const StyledHeading = styled.h1`
  text-align: center;
`;

const SubPage = styled.div`
  height: 100vh;
`

const StudyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 25vh;
`;

const StartButton = styled.button`
  background: #E6EAED;
  border: none;
  border-radius: 0.5rem;
  padding: 1rem 2.5rem;
  cursor: pointer;
  font-size: 1rem;
  box-shadow: 6px 6px 12px rgba(163, 177, 198, 0.6),
              -6px -6px 12px rgba(255, 255, 255, 0.5);
`

const Study = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const learningCheckpoint = useSelector((state: RootState) => state.user.learningCheckpoint);

  const handleSelectLevel = React.useCallback((selectedLevel: string) => {
    dispatch(userActions.setLevelCheckpoint(selectedLevel));
  }, [dispatch]);

  const handleSelectStep = React.useCallback((selectedStep: number[]) => {
    dispatch(userActions.setStepCheckpoint(selectedStep));
  }, [dispatch]);

  return (
    <StudyContainer>
      <SubPage>
        <StyledHeading>Level Selection</StyledHeading>
      </SubPage>
      <SubPage>
        <SelectLevel levels={levels} onSelectLevel={handleSelectLevel} progressLevel={learningCheckpoint.level} />
      </SubPage>
      <SubPage>
        <SelectStep progressLevel={learningCheckpoint.level} stepLength={steps.length} onSelectStep={handleSelectStep} />
      </SubPage>
      <SubPage>
        <StartButton onClick={() => navigate('/flash-cards')}>Start</StartButton>
      </SubPage>
    </StudyContainer>
  );
};

export default Study;
