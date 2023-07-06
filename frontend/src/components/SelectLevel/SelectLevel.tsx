import React from 'react';
import { bindActionCreators } from 'redux'
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import * as levelActions from 'modules/level';

interface SelectLevelProps {
  levels: string[];
  nowProgress: string;
  onSelectLevel: (level: string) => void;
}

const LevelButton = styled.button<{ $nowProgress?: boolean }>`
  background-color: ${props => (!props.$nowProgress ? '#eaeaea' : '#96d2d7b8')};
  border: none;
  border-radius: 4px;
  padding: 1.5vw 3vw;
  margin-right: 2%;
  cursor: pointer;
  font-size: 1rem;

  &:hover {
    background-color: ${props => (!props.$nowProgress ? '#d4d4d4' : '#4f858cb8')};
  }
`;

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 1.6rem;
`;

const SelectLevel: React.FC<SelectLevelProps> = ({ levels, onSelectLevel, nowProgress }) => {
  const dispatch = useDispatch();

  const handleLevelClick = (level: string) => {
    onSelectLevel(level);
    dispatch(levelActions.setLevel(level));
  };

  return (
    <Container>
      {levels.map((level, index) => (
        <LevelButton key={index} $nowProgress={nowProgress === level} onClick={() => handleLevelClick(level)}>
          {level}
        </LevelButton>
      ))}
    </Container>
  );
};

export default SelectLevel;
