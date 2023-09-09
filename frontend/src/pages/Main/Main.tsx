import DefaultButton from 'components/DefaultButton';
import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
`;

const Main = () => {
  return (
    <Container>
      <Link to="select-level">
        <DefaultButton>시작하기</DefaultButton>
      </Link>
    </Container>
  );
};

export default Main;