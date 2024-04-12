const loginCheck = () => {
  return !!localStorage.getItem("token");
};
export default loginCheck;
