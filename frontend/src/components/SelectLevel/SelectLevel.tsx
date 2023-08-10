import React from 'react';
import styled from 'styled-components';

interface SelectLevelProps {
  levels: string[];
  nowProgress: string;
  onSelectLevel: (level: string) => void;
}

const LevelButton = styled.button<{ $nowProgress?: boolean }>`
  background-color: ${props => (!props.$nowProgress ? '#eaeaea' : '#5e9da5')};
  border: none;
  border-radius: 4px;
  padding: 1.5vw 3vw;
  margin-right: 2%;
  cursor: pointer;
  font-size: 1rem;

  &:hover {
    background-color: ${props => (!props.$nowProgress ? '#d4d4d4' : '#5e9da5')};
  }
`;

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 1.6rem;
`;

const SelectLevel: React.FC<SelectLevelProps> = ({ levels, onSelectLevel, nowProgress }) => {
  const handleLevelClick = (level: string) => {
    onSelectLevel(level);
  };

  return (
    <Container>
      {levels.map((level, index) => (
        <LevelButton
          key={index}
          $nowProgress={nowProgress === level}
          onClick={() => handleLevelClick(level)}
        >
          {level}
        </LevelButton>
      ))}
    </Container>
  );
};

export default SelectLevel;
