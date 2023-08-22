import React from 'react';
import styled from 'styled-components';

interface SelectLevelProps {
  levels: string[];
  nowProgress: string;
  onSelectLevel: (level: string) => void;
}

const SelectLevelContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 1.6rem;
  box-sizing: border-box;
`;

const LevelButton = styled.button<{ $nowProgress?: boolean; isLast?: boolean }>`
  background-color: ${props => (!props.$nowProgress ? '#eaeaea' : '#5e9da5')};
  border: none;
  border-radius: 4px;
  padding: 1.5rem 3rem;
  margin-right: ${props => (props.isLast ? '0' : '1rem')};
  cursor: pointer;
  font-size: 1rem;

  &:hover {
    background-color: ${props => (!props.$nowProgress ? '#d4d4d4' : '#5e9da5')};
  }
`;

const SelectLevel: React.FC<SelectLevelProps> = ({ levels, onSelectLevel, nowProgress }) => {
  const handleLevelClick = (level: string) => {
    onSelectLevel(level);
  };

  return (
    <SelectLevelContainer>
      {levels.map((level, index) => (
        <LevelButton
          key={index}
          $nowProgress={nowProgress === level}
          isLast={index === levels.length - 1}
          onClick={() => handleLevelClick(level)}
        >
          {level}
        </LevelButton>
      ))}
    </SelectLevelContainer>
  );
};

export default SelectLevel;
