import React from 'react';
import styled from 'styled-components';
import GoogleLoginButton from 'components/LoginButton/GoogleLoginButton';
import LogoutButton from 'components/LoginButton/LogoutButton';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
`;

const Login = () => {
  const user = localStorage.getItem('profile');
  return (
    <Container>
      {user ? <LogoutButton /> : <GoogleLoginButton />}
    </Container>
  );
};

export default Login;
