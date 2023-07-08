import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const Main = () => {
  return (
    <Container>
      <Link to="study">
        <StartButton>시작하기</StartButton>
      </Link>
    </Container>
  );
};

export default Main;

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
`;

const StartButton = styled.button`
  background-color: #eaeaea;
  border: none;
  border-radius: 4px;
  padding: 1rem 2rem;
  cursor: pointer;
  font-size: 1rem;
`;