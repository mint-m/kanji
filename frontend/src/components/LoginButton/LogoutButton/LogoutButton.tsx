import React from 'react';
import { googleLogout } from '@react-oauth/google';
import { styled } from 'styled-components';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import { useNavigate } from 'react-router-dom';

const LogoutButton = () => {
    const navigate = useNavigate();
    const logout = () => {
        googleLogout();
        localStorage.clear();
        navigate('/');
    }
    return (
        <DefaultLogoutButton onClick={() => logout()}>
            Logout
        </DefaultLogoutButton>
    )
}

export default LogoutButton;

const DefaultLogoutButton = styled(DefaultButton)``