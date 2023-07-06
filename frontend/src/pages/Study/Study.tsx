import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SelectLevel from 'components/SelectLevel';
import SelectStep from 'components/SelectStep';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
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
  const [level, setLevel] = useState<string>('JLPT5');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSelectLevel = (selectedLevel: string) => {
    setLevel(selectedLevel);
    dispatch(levelActions.setLevel(level));
  };
  
  const handleStepClick = (selectedStep: string) => {
    dispatch(levelActions.setStep(selectedStep));
    navigate('')
  };

  return (
    <Container>
      <StyledHeading>Level Selection</StyledHeading>
      <SelectLevel levels={levels} onSelectLevel={handleSelectLevel} nowProgress={level} />
      <SelectStep level={level} steps={steps} onStepClick={handleStepClick} />
    </Container>
  );
};

export default Study;
