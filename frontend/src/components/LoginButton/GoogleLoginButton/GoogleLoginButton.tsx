import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { styled } from 'styled-components';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import { useNavigate } from 'react-router-dom';

const GoogleLoginButton = () => {
    const navigate = useNavigate();

    const googleSocialLogin = useGoogleLogin({
        scope: "email profile",
        onSuccess: ({ code }) => loginSuccess({ code }),
        onError: (errorResponse) => console.error(errorResponse),
        flow: "auth-code",
    });

    const loginSuccess = async ({ code }: { code: string }) => {
        axios
            .post("/auth/google/callback", { code })
            .then(({ data }) => {
                localStorage.setItem('access_token', data.tokens.access_token)
                localStorage.setItem('user_info', JSON.stringify(data.userInfoData))
                navigate('/');
            });
    }

    return (
        <LoginButton onClick={() => googleSocialLogin()}>
            Sign in with Google 🚀
        </LoginButton>
    )
}

export default GoogleLoginButton;

const LoginButton = styled(DefaultButton)``