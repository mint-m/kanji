import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import styled from 'styled-components';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import { useNavigate } from 'react-router-dom';

interface GoogleLoginButtonProps {
  onLoginError?: (error: Error) => void;
  className?: string;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ 
  onLoginError,
  className 
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google OAuth redirect URI must match the one registered in Google Cloud Console
  const REDIRECT_URI = 'http://127.0.0.1:4200';

  const googleSocialLogin = useGoogleLogin({
    flow: "auth-code",
    scope: "email profile",
    redirect_uri: REDIRECT_URI,
    onSuccess: (response) => handleAuthCodeSuccess(response.code),
    onError: (errorResponse) => {
      console.error('Google OAuth error:', errorResponse);
      setError('Failed to authenticate with Google');
      setIsLoading(false);
    }
  });

  const handleAuthCodeSuccess = async (code: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Step 1: Exchange auth code for access token
      const tokenResponse = await axios.post('/auth/google/access-token', {
        code,
        redirect_uri: REDIRECT_URI
      });
      
      // Step 2: Login with the access token
      const loginResponse = await axios.post('/auth/google-login', {
        accessToken: tokenResponse.data.accessToken
      });
      
      // Step 3: Save JWT token to local storage
      localStorage.setItem('token', loginResponse.data.token);
      
      // Step 4: Get user profile info
      const userResponse = await axios.get('/auth/profile', {
        headers: {
          Authorization: `Bearer ${loginResponse.data.token}`
        }
      });
      
      // Step 5: Save user info to local storage
      localStorage.setItem('user', JSON.stringify(userResponse.data));
      
      // Step 6: Navigate to home page
      navigate('/');
    } catch (error) {
      console.error('Login process error:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        setError(`Login failed: ${error.response.data.message || error.response.data.error || 'Unknown error'}`);
      } else {
        setError('Login process failed. Please try again.');
      }
      
      if (onLoginError && error instanceof Error) {
        onLoginError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <LoginButton 
        onClick={() => !isLoading && googleSocialLogin()} 
        disabled={isLoading}
        className={className}
      >
        {isLoading ? 'Signing in...' : 'Sign in with Google 🚀'}
      </LoginButton>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </div>
  );
};

export default GoogleLoginButton;

// Styling
const LoginButton = styled(DefaultButton)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 220px;
  position: relative;
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #f44336;
  margin-top: 8px;
  font-size: 14px;
  text-align: center;
`;