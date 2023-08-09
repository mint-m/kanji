import React, { useState } from 'react';
import { useGoogleLogin, TokenResponse } from '@react-oauth/google';
import axios from 'axios';
import { styled } from 'styled-components';

const GoogleLoginButton = () => {
    const [name, setName] = useState('');
    const login = useGoogleLogin({
        onSuccess: tokenResponse => loginSuccess(tokenResponse),
    })

    const loginSuccess = async (accessToken: TokenResponse) => {
        try {
            const res = await axios.post(`/auth/google`, { accessToken: accessToken.access_token });
            res.data.success && setName(res.data.user.email);
        } catch (error) {
            console.error("Google login error : ", error);
        }
    }

    return (
        <LoginButton onClick={() => login()}>
            Sign in with Google 🚀{name}
        </LoginButton>
    )
}

export default GoogleLoginButton;

const LoginButton = styled.button`
    width: 12rem;
    height: 3rem;
    border-radius: 8px;
    background: #E6EAED;
    
    box-shadow: -2px -2px 5px 1px #FFF, 4px 4px 4px 0px rgba(0, 0, 0, 0.25), 1px 1px 5px 0px rgba(0, 0, 0, 0.25);
`