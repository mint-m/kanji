import React from "react";
import { styled } from 'styled-components';


const LevelHeader = styled.span<{ $fontSize: string; }>`
  font-size: ${(props) => props.theme.fontSize[props.$fontSize]};
`

const Header = styled.div`
  > :not(:last-child) {
    margin-right: 0.25rem;
  }

  > :first-child {
    font-weight: bold;
  }
`

const HeaderSection: React.FC<{ title: string; subtitle: string; }> = ({ title, subtitle }) => (
  <Header>
    <LevelHeader $fontSize="lg">{title}</LevelHeader>
    <LevelHeader $fontSize="md">{subtitle}</LevelHeader>
  </Header>
);

export default HeaderSection;