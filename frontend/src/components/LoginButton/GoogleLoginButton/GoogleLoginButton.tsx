import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { styled } from 'styled-components';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import { useNavigate } from 'react-router-dom';
import { saveTokenLocally } from 'services/authService';

const GoogleLoginButton = () => {
    const navigate = useNavigate();

    const googleSocialLogin = useGoogleLogin({
        scope: "email profile",
        onSuccess: ({ code }) => loginSuccess({ code }),
        onError: (errorResponse) => console.error(errorResponse),
        flow: "auth-code",
    });

    const loginSuccess = async ({ code }: { code: string }) => {
        try {
            const response = await axios.post("/auth/google/callback", { code });
            const token = response.data.token;
            saveTokenLocally(token);
            navigate('/');
        } catch (error) {
            console.error('Google login callback error:', error);
        }
    }

    return (
        <LoginButton onClick={() => googleSocialLogin()}>
            Sign in with Google 🚀
        </LoginButton>
    )
}

export default GoogleLoginButton;

const LoginButton = styled(DefaultButton)``
