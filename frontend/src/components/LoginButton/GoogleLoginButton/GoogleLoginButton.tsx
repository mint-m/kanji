import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { styled } from 'styled-components';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import { useNavigate } from 'react-router-dom';
import { saveTokenLocally, requestUserInfoAndStoreLocally } from 'services/authService';

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
            const accessTokenResponse = (await axios.post("/auth/google/access-token", { code })).data;
            const loginResponse = await axios.post("/auth/google-login", { accessToken: accessTokenResponse });

            // Saving the JWT token locally after successful login
            saveTokenLocally(loginResponse.data.token);

            // Requesting user information and storing it locally
            await requestUserInfoAndStoreLocally(loginResponse.data);

            // Navigating to the home page after successful login
            // navigate('/');
        } catch (error) {
            console.error('Google login callback error:', error);
            // Handle error (e.g., display error message to user)
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
