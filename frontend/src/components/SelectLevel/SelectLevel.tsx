import DefaultButton from 'components/CommonStyled/DefaultButton';
import HeaderSection from 'components/HeaderSection/HeaderSection';
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
    <div>
      <HeaderSection title="JLPT" subtitle="LEVELS" />
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
    </div>
  );
};

export default SelectLevel;
