import React from 'react';
import styled from 'styled-components';
import GoogleLoginButton from 'components/LoginButton/GoogleLoginButton';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 40vh;
`;

const Login = () => {
  return (
    <Container>
      <GoogleLoginButton />
    </Container>
  );
};

export default Login;
