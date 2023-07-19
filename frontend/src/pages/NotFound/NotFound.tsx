import WordCard from 'components/WordCard';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Word } from 'components/WordCard/WordCard';


const NotFound = () => {
    const navigate = useNavigate();

    const handleOnclick = () => {
        navigate('/');
    };

    const word: Word = {
        pron: '憂鬱な',
        means: ['우울한'],
        entry: 'ゆううつな',
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
