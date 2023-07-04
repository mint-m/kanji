import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SelectLevel from 'components/SelectLevel';
import SelectStep from 'components/SelectStep';
import styled from 'styled-components';

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
  height: 80vh;
  margin-bottom: 20vh;
`;

const Study = () => {
  const [level, setLevel] = useState<string>('JLPT5'); //set default level to JLTP5 or user progressed level
  const navigate = useNavigate();

  const handleSelectLevel = (selectedLevel: string) => {
    setLevel(selectedLevel);
  };

  const handleStepClick = (selectedLevel: string) => {
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
