import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import styled from 'styled-components';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import { useNavigate } from 'react-router-dom';
import {
  exchangeCodeForToken,
  loginWithGoogleToken,
} from 'services/authService';

interface GoogleLoginButtonProps {
  onLoginError?: (error: Error) => void;
  onLoginSuccess?: () => void;
  className?: string;
  redirectPath?: string;
  buttonText?: string;
  loadingText?: string;
}

// 에러 타입 정의
type LoginError = Error | { response?: { data?: { message?: string; error?: string } } };

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onLoginError,
  onLoginSuccess,
  className,
  redirectPath = '/',
  buttonText = '구글 로그인 🚀',
  loadingText = 'in...'
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComponentMounted, setIsComponentMounted] = useState(true);
  const redirect_url = process.env['REACT_APP_GOOGLE_REDIRECT_URI'];

  // 컴포넌트 마운트 상태 추적
  useEffect(() => {
    setIsComponentMounted(true);
    return () => setIsComponentMounted(false);
  }, []);

  // 통합된 에러 핸들링 함수
  const handleError = (error: LoginError, errorMessage: string) => {
    console.error(errorMessage, error);

    let displayError = 'Login process failed. Please try again.';

    if (axios.isAxiosError(error) && error.response?.data) {
      const { message, error: errorText } = error.response.data;
      displayError = `Login failed: ${message || errorText || 'Unknown error'}`;
    }

    if (isComponentMounted) {
      setError(displayError);
      setIsLoading(false);
    }

    if (onLoginError && error instanceof Error) {
      onLoginError(error);
    }
  };

  const handleAuthCodeSuccess = async (code: string) => {
    if (!isComponentMounted) return;
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Exchange auth code for access token
      const tokenResponse = await exchangeCodeForToken(code, redirect_url);

      if (!tokenResponse.accessToken) {
        throw new Error('Failed to get access token from Google');
      }

      // Step 2: Login with the access token (already includes user profile)
      const loginResponse = await loginWithGoogleToken(tokenResponse.accessToken);

      if (!loginResponse.token || !loginResponse.user) {
        throw new Error('Login failed - missing token or user data');
      }

      // 성공 콜백 호출
      if (onLoginSuccess && isComponentMounted) {
        onLoginSuccess();
      }

      // Step 3: Navigate to destination page (only if component is still mounted)
      if (isComponentMounted) {
        navigate(redirectPath);
      }
    } catch (error) {
      handleError(error as LoginError, 'Login process error:');
    } finally {
      if (isComponentMounted) {
        setIsLoading(false);
      }
    }
  };

  const googleSocialLogin = useGoogleLogin({
    flow: "auth-code",
    scope: "email profile",
    redirect_uri: 'postmessage',
    onSuccess: (response) => {
      handleAuthCodeSuccess(response.code)
    },
    onError: (errorResponse) => {
      handleError(new Error(errorResponse.error_description || 'OAuth error'), 'Google OAuth error:');
    }
  });

  return (
    <div>
      <LoginButton
        onClick={() => !isLoading && googleSocialLogin()}
        disabled={isLoading}
        className={className}
        type="button"
        aria-busy={isLoading}
      >
        {isLoading ? loadingText : buttonText}
      </LoginButton>

      {error && <ErrorMessage role="alert">{error}</ErrorMessage>}
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