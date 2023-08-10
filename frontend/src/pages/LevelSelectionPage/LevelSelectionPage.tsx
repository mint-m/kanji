import React from 'react';
import { useNavigate } from 'react-router-dom';
import SelectLevel from 'components/SelectLevel';
import SelectStep from 'components/SelectStep';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store';
import * as userActions from 'store/modules/user';

const levels = ['N5', 'N4', 'N3', 'N2', 'N1'];
const steps = [1, 2, 3, 4, 5, 6];

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
  const learningCheckpoint = useSelector((state: RootState) => state.user.learningCheckpoint);

  const handleSelectLevel = React.useCallback((selectedLevel: string) => {
    dispatch(userActions.setLevelCheckpoint(selectedLevel));
  }, [dispatch]);

  const handleStepClick = React.useCallback((selectedStep: number) => {
    dispatch(userActions.setStepCheckpoint(selectedStep));
    navigate(`/flash-cards`);
  }, [dispatch, navigate]);

  return (
    <Container>
      <StyledHeading>Level Selection</StyledHeading>
      <SelectLevel levels={levels} onSelectLevel={handleSelectLevel} nowProgress={learningCheckpoint.level} />
      <SelectStep steps={steps} onStepClick={handleStepClick} />
    </Container>
  );
};

export default Study;
