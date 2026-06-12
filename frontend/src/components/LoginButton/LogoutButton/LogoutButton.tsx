import { googleLogout } from '@react-oauth/google';
import DefaultButton from 'components/CommonStyled/DefaultButton';
import { logout } from 'services/authService';

const LogoutButton = () => {
  const handleLogout = () => {
    googleLogout();
    logout();
  };

  return (
    <DefaultButton onClick={handleLogout}>Logout</DefaultButton>
  );
};

export default LogoutButton;
