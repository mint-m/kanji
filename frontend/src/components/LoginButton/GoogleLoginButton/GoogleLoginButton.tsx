import { FC, useState, useRef, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import { useNavigate } from 'react-router-dom';
import { exchangeCodeForToken, loginWithGoogleToken } from 'services/authService';
import { setUser } from 'store/modules/user';
import { errorText } from './GoogleLoginButton.css';

interface GoogleLoginButtonProps {
  onLoginError?: (error: Error) => void;
  onLoginSuccess?: () => void;
  className?: string;
  redirectPath?: string;
  buttonText?: string;
  loadingText?: string;
}

type LoginError = Error | { response?: { data?: { message?: string; error?: string } } };

const GoogleLoginButton: FC<GoogleLoginButtonProps> = ({
  onLoginError,
  onLoginSuccess,
  className,
  redirectPath = '/',
  buttonText = '구글 로그인 🚀',
  loadingText = 'in...',
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const redirect_url = process.env['REACT_APP_GOOGLE_REDIRECT_URI'];

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const handleError = (err: LoginError, msg: string) => {
    console.error(msg, err);
    let displayError = 'Login process failed. Please try again.';
    if (axios.isAxiosError(err) && err.response?.data) {
      const { message, error: errorText } = err.response.data;
      displayError = `Login failed: ${message || errorText || 'Unknown error'}`;
    }
    if (mountedRef.current) {
      setError(displayError);
      setIsLoading(false);
    }
    if (onLoginError && err instanceof Error) onLoginError(err);
  };

  const handleAuthCodeSuccess = async (code: string) => {
    if (!mountedRef.current) return;
    setIsLoading(true);
    setError(null);
    try {
      const tokenResponse = await exchangeCodeForToken(code, redirect_url);
      if (!tokenResponse.accessToken) throw new Error('Failed to get access token from Google');

      const loginResponse = await loginWithGoogleToken(tokenResponse.accessToken);
      if (!loginResponse.token || !loginResponse.user) throw new Error('Login failed - missing token or user data');

      if (mountedRef.current) {
        dispatch(setUser({
          isLoggin: true,
          loginStatusType: loginResponse.user.type || 'google',
          email: loginResponse.user.email,
          name: loginResponse.user.name,
          activeProgressType: loginResponse.user.activeProgressType || null,
        }));
        onLoginSuccess?.();
        navigate(redirectPath);
      }
    } catch (err) {
      handleError(err as LoginError, 'Login process error:');
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  };

  const googleSocialLogin = useGoogleLogin({
    flow: 'auth-code',
    scope: 'email profile',
    redirect_uri: 'postmessage',
    onSuccess: (response) => handleAuthCodeSuccess(response.code),
    onError: (errorResponse) => handleError(
      new Error(errorResponse.error_description || 'OAuth error'),
      'Google OAuth error:'
    ),
  });

  return (
    <div>
      <DefaultButton
        className={className}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minWidth: '220px' }}
        onClick={() => !isLoading && googleSocialLogin()}
        disabled={isLoading}
        type="button"
        aria-busy={isLoading}
      >
        {isLoading ? loadingText : buttonText}
      </DefaultButton>
      {error && (
        <div role="alert" className={errorText}>{error}</div>
      )}
    </div>
  );
};

export default GoogleLoginButton;
