import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { redirect } from 'react-router-dom';

const GoogleLoginButton = () => {
    return (
        <div>
            <GoogleLogin
                onSuccess={credentialResponse => {
                    console.log(credentialResponse);
                    redirect('/main');
                }}

                onError={() => {
                    console.log('Login Failed');
                }}
                type="icon"
                shape="square"
            />
        </div>
    )
}

export default GoogleLoginButton;
