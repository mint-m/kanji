import { useSelector } from "react-redux";
import { RootState } from "store";

const LoginCheck = () => {
  const isLogin = useSelector((state: RootState) => state.user.email);

  return isLogin;
};

export default LoginCheck;
