import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Navbar = () => {
    const navigate = useNavigate();

    const handleOnclick = (props: string) => {
        navigate(`/${props}`);
    };

    return (
        <div>
            <Button onClick={() => handleOnclick('login')}>로그인</Button>
            <Button onClick={() => handleOnclick('regist')}>회원가입</Button>
        </div>
    );
};
export default Navbar;

const Button = styled.button`
    display: inline-flex;
    align-items: center;
    outline: none;
    border: none;
    border-radius: 4px;
    color: white;
    font-weight: bold;
    cursor: pointer;
    padding-left: 1rem;
    padding-right: 1rem;
`;