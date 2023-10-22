const loginCheck = () => {
  return !!localStorage.getItem("access_token");
};
export default loginCheck;
