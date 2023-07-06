import React from 'react';
import { Link } from 'react-router-dom';
import { styled } from 'styled-components';

const Main = () => {
  return (
    <div>
      <Link to={'study'}>
        <StartButton>히히 니뽄</StartButton>
      </Link>
    </div>
  );
};
export default Main;

const StartButton = styled.button`
  background-color: #eaeaea;
  border: none;
  border-radius: 4px;
  padding: 1rem 2rem;
  margin: 0 auto;
  cursor: pointer;
  font-size: 1rem;
`