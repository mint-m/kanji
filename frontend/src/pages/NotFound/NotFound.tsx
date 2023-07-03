import WordCard from 'components/WordCard';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IWord } from 'components/WordCard/WordCard';


const NotFound = () => {
    const navigate = useNavigate();

    const handleOnclick = () => {
        navigate('/');
    };

    const word: IWord = {
        targetWord: '憂鬱な',
        wordMean: '우울한',
        hiragana: 'ゆううつな',
        tryNum: 0
    }

    return (
        <div>
            <WordCard
                word={word}
                onKnowClick={() => { }}
                onShowClick={() => { }}
                showMean={false}
                showHiragana={false}
            />
            요청하신 페이지를 찾을 수 없습니다.
            <button onClick={handleOnclick}>
                홈으로 가기
            </button>
        </div>
    );
};

export default NotFound;
