import { FC } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'store';
import Home from './Home';
import Landing from './Landing';

const Main: FC = () => {
  const isLoggedIn = useSelector((state: RootState) => state.user.isLoggedIn);
  return isLoggedIn ? <Home /> : <Landing />;
};

export default Main;
