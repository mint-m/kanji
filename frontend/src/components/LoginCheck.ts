import { useSelector } from "react-redux";
import { RootState } from "store";

const LoginCheck = () => {
  const isLogin = useSelector((state: RootState) => state.level.level);

  return isLogin;
};

export default LoginCheck;
