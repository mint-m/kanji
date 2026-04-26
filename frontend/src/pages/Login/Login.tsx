import { useSelector } from 'react-redux';
import GoogleLoginButton from 'components/LoginButton/GoogleLoginButton';
import KakaoLoginButton from 'components/LoginButton/KakaoLoginButton';
import LogoutButton from 'components/LoginButton/LogoutButton';
import CenterDiv from 'components/CommonStyled/CenterDiv';
import type { RootState } from 'store';

const Login = () => {
  const isLoggedIn = useSelector((state: RootState) => state.user.isLoggin);

  return (
    <CenterDiv>
      {isLoggedIn ? (
        <LogoutButton />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
          <GoogleLoginButton />
          <KakaoLoginButton />
        </div>
      )}
    </CenterDiv>
  );
};

export default Login;
