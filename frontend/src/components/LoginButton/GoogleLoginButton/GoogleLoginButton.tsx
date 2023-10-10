import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { styled } from 'styled-components';

const GoogleLoginButton = () => {
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
                console.log(data);
            });
    }

    return (
        <LoginButton onClick={() => googleSocialLogin()}>
            Sign in with Google 🚀
        </LoginButton>
    )
}

export default GoogleLoginButton;

const LoginButton = styled.button`
    width: 12rem;
    height: 3rem;
    border-radius: 0.5rem;
    outline: none;
    border: none;
    background: #E6EAED;
    box-shadow: -2px -2px 5px 1px #FFF, 4px 4px 4px 0px rgba(0, 0, 0, 0.25), 0px 4px 4px 0px rgba(0, 0, 0, 0.25);
`