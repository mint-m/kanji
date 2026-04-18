import DefaultButton from 'components/CommonStyled/DefaultButton';
import { useNavigate } from 'react-router-dom';
import CenterDiv from 'components/CommonStyled/CenterDiv';

const Main = () => {
  const navigate = useNavigate();
  return (
    <CenterDiv>
      <DefaultButton onClick={() => navigate('/flash-cards')}>시작하기</DefaultButton>
    </CenterDiv>
  );
};

export default Main;
