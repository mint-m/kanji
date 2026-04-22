import GoogleLoginButton from 'components/LoginButton/GoogleLoginButton';
import LogoutButton from 'components/LoginButton/LogoutButton';
import CenterDiv from 'components/CommonStyled/CenterDiv';

const Login = () => {
  const user = localStorage.getItem('user');
  return (
    <CenterDiv>
      {user ? <LogoutButton /> : <GoogleLoginButton />}
    </CenterDiv>
  );
};

export default Login;
