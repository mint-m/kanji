import DefaultButton from 'components/CommonStyled/DefaultButton';
import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';

const Navbar = () => {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileData = localStorage.getItem('user');
  const userProfile = profileData ? JSON.parse(profileData) : null;

  const handleOnClick = useCallback((path: string) => {
    navigate(`/${path}`);
  }, [navigate]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('user');
    navigate('/');
    // You might want to add additional logout logic here
    // such as clearing other local storage items or calling a logout API
  }, [navigate]);

  // Close the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <NavbarDiv>
      <Button onClick={() => handleOnClick('')}>홈</Button>
      
      {userProfile ? (
        <UserSection ref={menuRef}>
          <ProfileButton 
            onClick={() => setShowUserMenu(!showUserMenu)}
            isActive={showUserMenu}
          >
            {userProfile.name}
          </ProfileButton>
          
          {showUserMenu && (
            <UserMenu>
              <MenuItem onClick={() => handleOnClick('profile')}>
                프로필
              </MenuItem>
              <MenuItem onClick={() => handleOnClick('learning')}>
                학습완료
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                로그아웃
              </MenuItem>
            </UserMenu>
          )}
        </UserSection>
      ) : (
        <Button onClick={() => handleOnClick('login')}>로그인</Button>
      )}
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
    font-size: 0.9rem;
    border-radius: 2rem;
    padding: 0 0.5rem;
    margin-left: 1rem;
    color: gray;
  `}
`;

const ProfileButton = styled(Button)<{ isActive: boolean }>`
  ${props => props.isActive && css`
    background-color: #f0f0f0;
  `}
`;

const UserSection = styled.div`
  position: relative;
  display: inline-block;
`;

const UserMenu = styled.div`
  position: absolute;
  right: 0;
  top: 3rem;
  width: 8rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 100;
`;

const MenuItem = styled.div`
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: #333;
  
  &:hover {
    background-color: #f5f5f5;
  }
`;

const NavbarDiv = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  top: 1vh;
  right: 1vh;
`;