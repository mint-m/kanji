import React from 'react';
import { useNavigate } from 'react-router-dom';
import SelectLevel from 'components/SelectLevel';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store';
import * as userActions from 'store/modules/user';
import SelectStep from 'components/SelectStep';
import CenterDiv from 'components/CommonStyled/CenterDiv';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import { SectionsContainer, Section } from 'react-fullpage';

const levels = ['N5', 'N4', 'N3', 'N2', 'N1'];
const steps = [1, 2, 3, 4, 5, 6];

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

  // Configure options for the fullpage scrolling
  const options = {
    activeClass: 'active',
    anchors: ['level', 'step', 'start'],
    arrowNavigation: true,
    className: 'SectionContainer',
    delay: 1000,
    navigation: true,
    scrollBar: false,
    sectionClassName: 'Section',
    sectionPaddingTop: '0',
    sectionPaddingBottom: '0',
    verticalAlign: false
  };

  return (
    <SectionsContainer {...options}>
      <Section>
        <CenterDiv>
          <SelectLevel levels={levels} onSelectLevel={handleSelectLevel} progressLevel={learningCheckpoint.level} />
        </CenterDiv>
      </Section>
      <Section>
        <CenterDiv>
          <SelectStep progressLevel={learningCheckpoint.level} stepLength={steps.length} onSelectStep={handleSelectStep} />
        </CenterDiv>
      </Section>
      <Section>
        <CenterDiv>
          <DefaultButton onClick={() => navigate('/flash-cards')}>Start</DefaultButton>
        </CenterDiv>
      </Section>
    </SectionsContainer>
  );
};

export default Study;