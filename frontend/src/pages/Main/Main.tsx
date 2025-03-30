import DefaultButton from 'components/CommonStyled/DefaultButton';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
`;

const Main = () => {
  const navigate = useNavigate();
  
  // 시작하기 버튼 클릭 시 플래시카드 페이지로 바로 이동
  // 인증 및 체크포인트 확인은 LearningRoute 컴포넌트에서 처리
  const handleStartClick = () => {
    navigate('/flash-cards');
  };

  return (
    <Container>
      <DefaultButton onClick={handleStartClick}>
        시작하기
      </DefaultButton>
    </Container>
  );
};

export default Main;