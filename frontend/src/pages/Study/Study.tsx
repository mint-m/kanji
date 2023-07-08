import React from 'react';
import { useNavigate } from 'react-router-dom';
import SelectLevel from 'components/SelectLevel';
import SelectStep from 'components/SelectStep';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store';
import * as levelActions from 'store/modules/level';

const levels = ['JLPT5', 'JLPT4', 'JLPT3', 'JLPT2', 'JLPT1'];
const steps = ['STEP 1', 'STEP 2', 'STEP 3', 'STEP 4', 'STEP 5', 'STEP 6'];

const StyledHeading = styled.h1`
  text-align: center;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 25vh;
`;

const Study = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const level = useSelector((state: RootState) => state.level.level);

  const handleSelectLevel = React.useCallback((selectedLevel: string) => {
    dispatch(levelActions.setLevel(selectedLevel));
  }, [dispatch]);

  const handleStepClick = React.useCallback((selectedStep: string) => {
    dispatch(levelActions.setStep(selectedStep));
    navigate('/');
  }, [dispatch, navigate]);

  return (
    <Container>
      <StyledHeading>Level Selection</StyledHeading>
      <SelectLevel levels={levels} onSelectLevel={handleSelectLevel} nowProgress={level} />
      <SelectStep level={level} steps={steps} onStepClick={handleStepClick} />
    </Container>
  );
};

export default Study;
