import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import GoogleLoginButton from 'components/LoginButton/GoogleLoginButton';
import KakaoLoginButton from 'components/LoginButton/KakaoLoginButton';
import LogoutButton from 'components/LoginButton/LogoutButton';
import CenterDiv from 'components/CommonStyled/CenterDiv';
import type { RootState } from 'store';
import * as styles from './Login.css';

const Login = () => {
  const isLoggedIn = useSelector((state: RootState) => state.user.isLoggin);
  const location = useLocation();
  const errorMessage = (location.state as any)?.error;

  return (
    <CenterDiv>
      {isLoggedIn ? (
        <LogoutButton />
      ) : (
        <div className={styles.loginButtons}>
          {errorMessage && (
            <p className={styles.errorText}>{errorMessage}</p>
          )}
          <GoogleLoginButton />
          <KakaoLoginButton />
        </div>
      )}
    </CenterDiv>
  );
};

export default Login;
