import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import GoogleLoginButton from 'components/LoginButton/GoogleLoginButton';
import KakaoLoginButton from 'components/LoginButton/KakaoLoginButton';
import LogoutButton from 'components/LoginButton/LogoutButton';
import CenterDiv from 'components/CommonStyled/CenterDiv';
import type { RootState } from 'store';

const Login = () => {
  const isLoggedIn = useSelector((state: RootState) => state.user.isLoggin);
  const location = useLocation();
  const errorMessage = (location.state as any)?.error;

  return (
    <CenterDiv>
      {isLoggedIn ? (
        <LogoutButton />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
          {errorMessage && (
            <p style={{ color: '#d32f2f', fontSize: '14px', margin: 0 }}>{errorMessage}</p>
          )}
          <GoogleLoginButton />
          <KakaoLoginButton />
        </div>
      )}
    </CenterDiv>
  );
};

export default Login;
