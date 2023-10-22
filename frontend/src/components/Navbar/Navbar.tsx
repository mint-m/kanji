import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';

const Navbar = () => {
  const navigate = useNavigate();
  const userInfoString = localStorage.getItem('user_info');
  const userInfoJson = userInfoString && JSON.parse(userInfoString);

  const handleOnClick = useCallback((path: string) => {
    navigate(`/${path}`);
  }, [navigate]);

  return (
    <NavbarDiv>
      <Button onClick={() => handleOnClick('')}>홈</Button>
      <Button onClick={() => handleOnClick('login')}>
        {(userInfoJson && userInfoJson.name) || "로그인"}
      </Button>
    </NavbarDiv>
  );
};

export default Navbar;

const Button = styled.button`
  /* 공통 스타일 */
  ${css`
    width: 6rem;
    height: 2rem;
    justify-content: center;
    align-items: center;
    outline: none;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    background-color: 96d2d7b8;
    padding-left: 1rem;
    padding-right: 1rem;
    margin-left: 0.5rem;
    font-size: 1em;
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
