import React, { useState } from 'react';
import SelectLevel from 'components/SelectLevel';
import SelectStep from 'components/SelectStep';
import styled from 'styled-components';

const levels = ['JLPT5', 'JLPT4', 'JLPT3', 'JLPT2', 'JLPT1'];
const steps = ['step1', 'step2', 'step3', 'step4', 'step5', 'step6'];

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
  const [level, setLevel] = useState<string>('JLPT5');

  const handleSelectLevel = (selectedLevel: string) => {
    setLevel(selectedLevel);
  };

  return (
    <Container>
      <StyledHeading>Level Selection</StyledHeading>
      <SelectLevel levels={levels} onSelectLevel={handleSelectLevel} nowProgress={level} />
      <SelectStep level={level} steps={steps} />
    </Container>
  );
};

export default Study;
