import React from 'react';
import { useNavigate } from 'react-router-dom';
import SelectLevel from 'components/SelectLevel';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store';
import * as userActions from 'store/modules/user';
import SelectStep from 'components/SelectStep';
import DefaultButton from 'components/CommonStyled/DefaultButton';

const levels = ['N5', 'N4', 'N3', 'N2', 'N1'];
const steps = [1, 2, 3, 4, 5, 6];

const ScrollablePage = styled.div`
  height: 100vh;
  align-items: center;
  display: flex;
`

const StudyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
      <ScrollablePage>
        <SelectLevel levels={levels} onSelectLevel={handleSelectLevel} progressLevel={learningCheckpoint.level} />
      </ScrollablePage>
      <ScrollablePage>
        <SelectStep progressLevel={learningCheckpoint.level} stepLength={steps.length} onSelectStep={handleSelectStep} />
      </ScrollablePage>
      <ScrollablePage>
        <DefaultButton onClick={() => navigate('/flash-cards')}>Start</DefaultButton>
      </ScrollablePage>
    </StudyContainer>
  );
};

export default Study;
