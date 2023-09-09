import React from 'react';
import { useNavigate } from 'react-router-dom';
import SelectLevel from 'components/SelectLevel';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store';
import * as userActions from 'store/modules/user';
import SelectStep from 'components/SelectStep';
import DefaultButton from 'components/DefaultButton';

const levels = ['N5', 'N4', 'N3', 'N2', 'N1'];
const steps = [1, 2, 3, 4, 5, 6];

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
        <h1>Level</h1>
        <SelectLevel levels={levels} onSelectLevel={handleSelectLevel} progressLevel={learningCheckpoint.level} />
      </SubPage>
      <SubPage>
        <SelectStep progressLevel={learningCheckpoint.level} stepLength={steps.length} onSelectStep={handleSelectStep} />
      </SubPage>
      <SubPage>
        <DefaultButton onClick={() => navigate('/flash-cards')}>Start</DefaultButton>
      </SubPage>
    </StudyContainer>
  );
};

export default Study;
