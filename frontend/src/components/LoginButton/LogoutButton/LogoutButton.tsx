import { googleLogout } from '@react-oauth/google';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import { useNavigate } from 'react-router-dom';

const LogoutButton = () => {
  const navigate = useNavigate();

  const logout = () => {
    googleLogout();
    localStorage.clear();
    navigate('/');
  };

  return (
    <DefaultButton onClick={logout}>Logout</DefaultButton>
  );
};

export default LogoutButton;
