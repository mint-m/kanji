import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';


const Main = () => {
  return (
    <Container>
      <Link to="select-level">
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
  padding: 1rem 2rem;
  cursor: pointer;
  font-size: 1rem;
  
  border: none;
  background-color: #E6EAED;
  border-radius: 0.5rem;
  box-shadow: -2px -2px 5px 1px #FFF, 4px 4px 4px 0px rgba(0, 0, 0, 0.25), 0px 4px 4px 0px rgba(0, 0, 0, 0.25);
`;