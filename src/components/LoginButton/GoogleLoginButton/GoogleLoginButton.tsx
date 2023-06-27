import React from 'react';
import { GoogleLogin } from '@react-oauth/google';

const GoogleLoginButton = () => {
    return (
        <div>
            <GoogleLogin
                onSuccess={credentialResponse => {
                    console.log(credentialResponse);
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
