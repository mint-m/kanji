import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
    const navigate = useNavigate();

    const handleOnclick = () => {
        navigate('/');
    };

    return (
        <div>
            요청하신 페이지를 찾을 수 없습니다.
            <button onClick={handleOnclick}>
                홈으로 가기
            </button>
        </div>
    );
};

export default NotFound;
