import DefaultButton from 'components/CommonStyled/DefaultButton';
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';

const Navbar = () => {
  const navigate = useNavigate();

  const handleOnClick = useCallback((path: string) => {
    navigate(`/${path}`);
  }, [navigate]);
  const userProfile = localStorage.getItem('profile');

  return (
    <NavbarDiv>
      <Button onClick={() => handleOnClick('')}>홈</Button>
      {userProfile ? <Button onClick={() => navigate('/login')}>{JSON.parse(localStorage.getItem('profile')!).name}</Button> : <Button onClick={() => handleOnClick('login')}>로그인</Button>}
    </NavbarDiv>
  );
};

export default Navbar;

const Button = styled(DefaultButton)`
  /* 공통 스타일 */
  ${css`
    line-height: 100%;
    width: 4rem;
    height: 2.5rem;
    font-size: 1em;
    border-radius: 2rem;
    padding: 0 0.5rem;
    margin-left: 1rem;
    color: gray;
    font-size: 0.9rem;
  `}
`;

const NavbarDiv = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  top: 1vh;
  right: 1vh;
`;
