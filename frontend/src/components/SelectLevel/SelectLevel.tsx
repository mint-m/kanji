import React from 'react';
import styled from 'styled-components';

interface SelectLevelProps {
  levels: string[];
  progressLevel: string;
  onSelectLevel: (level: string) => void;
}

const SelectLevelContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 1.6rem;
  box-sizing: border-box;
  
  padding: 2rem;
  width: 40rem;
  border-radius: 0.5rem;
  box-shadow: inset 6px 6px 12px rgba(163, 177, 198, 0.6),
                inset -6px -6px 12px rgba(255, 255, 255, 0.5);


  > :not(:last-child) {
    margin-right: 1rem;
  }
`;

const LevelButton = styled.button<{ $nowProgress: boolean; }>`
  background: #E6EAED;
  border: none;
  border-radius: 0.5rem;
  padding: 1rem 2.5rem;
  cursor: pointer;
  font-size: 1rem;
  box-shadow: 6px 6px 12px rgba(163, 177, 198, 0.6),
              -6px -6px 12px rgba(255, 255, 255, 0.5);

  &:hover {
    background-color: ${props => (!props.$nowProgress ? '#eeeeee' : '#E6EAED')};
  }

  ${props =>
    props.$nowProgress &&
    `
    box-shadow: inset 6px 6px 12px rgba(163, 177, 198, 0.6),
                inset -6px -6px 12px rgba(255, 255, 255, 0.5);
  `}
`;

const SelectLevel: React.FC<SelectLevelProps> = ({ levels, onSelectLevel, progressLevel: nowProgress }) => {
  const handleLevelClick = (level: string) => {
    onSelectLevel(level);
  };

  return (
    <SelectLevelContainer>
      {levels.map((level, index) => (
        <LevelButton
          key={index}
          $nowProgress={nowProgress === level}
          onClick={() => handleLevelClick(level)}
        >
          {level}
        </LevelButton>
      ))}
    </SelectLevelContainer>
  );
};

export default SelectLevel;
