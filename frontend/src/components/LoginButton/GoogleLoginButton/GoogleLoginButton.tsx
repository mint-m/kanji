import React from 'react';
import { useGoogleLogin, TokenResponse } from '@react-oauth/google';
import axios from 'axios';
import { styled } from 'styled-components';
import { useDispatch } from 'react-redux';
import * as userActions from 'store/modules/user';


const GoogleLoginButton = () => {
    const dispatch = useDispatch();
    const login = useGoogleLogin({
        onSuccess: tokenResponse => loginSuccess(tokenResponse),
    })

    const loginSuccess = async (accessToken: TokenResponse) => {
        try {
            const res = await axios.post(`/auth/google`, { accessToken: accessToken.access_token });
            dispatch(userActions.setUser(res.data));
        } catch (error) {
            console.error("Google login error : ", error);
        }
    }

    return (
        <LoginButton onClick={() => login()}>
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