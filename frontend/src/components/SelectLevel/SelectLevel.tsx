import DefaultButton from 'components/DefaultButton';
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

const LevelButton = styled(DefaultButton) <{ $nowProgress: boolean; }>`
  ${props => props.$nowProgress && props.theme.innerShadow}
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
