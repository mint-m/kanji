import React, { useCallback, useState, useEffect } from 'react';
import { debounce } from 'lodash';
import FlashCard, { ShowType } from 'components/FlashCard';
import { WordType } from 'store/modules/deck';
import { useDispatch } from 'react-redux';
import * as kanjiActions from 'store/modules/kanji';
import ControlPanel from 'components/ControlPanel';

// 학습 항목 인터페이스 정의
interface LearningItem {
  wordId: string;
  timestamp: Date;
  status: 'mastered' | 'learning' | 'difficult';
  level: string;
  step: number;
}

// 학습 데이터를 위한 큐
const learningQueue: LearningItem[] = [];

// 배치 처리를 위한 함수
const sendLearningDataToServer = async (): Promise<void> => {
  if (learningQueue.length === 0) return;
  
  try {
    await fetch('/api/checkpoint', {
      method: 'POST',
      body: JSON.stringify({ items: learningQueue }),
      headers: { 'Content-Type': 'application/json' }
    });
    
    // 성공적으로 전송 후 큐 비우기
    learningQueue.length = 0;
  } catch (error) {
    console.error('Failed to send learning data:', error);
  }
};

interface FlashCardContainerProps {
    deck: WordType[];
}

const FlashCardContainer: React.FC<FlashCardContainerProps> = React.memo((props: FlashCardContainerProps) => {
    const [wordIndex, setWordIndex] = useState<number>(0);
    const [showMean, setShowMean] = useState<boolean>(false);
    const [showHiragana, setShowHiragana] = useState<boolean>(false);

    const dispatch = useDispatch();
    const deck = props.deck;

    // 배치 전송을 위한 타이머 설정
    useEffect(() => {
        // 30초마다 자동으로 배치 전송
        const intervalId = setInterval(sendLearningDataToServer, 30000);
        
        // 페이지 떠날 때 남은 데이터 전송
        const handleBeforeUnload = (): void => {
            sendLearningDataToServer();
        };
        
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            clearInterval(intervalId);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            // 컴포넌트 언마운트 시 남은 데이터 전송
            sendLearningDataToServer();
        };
    }, []);

    const debouncedHandleKnowClick = debounce((know: boolean) => {
        // 현재 단어 정보 저장
        if (deck.length > 0 && wordIndex < deck.length) {
            const currentWord = deck[wordIndex];
            
            // 학습 큐에 추가
            learningQueue.push({
                wordId: currentWord.origin_entry_id,
                timestamp: new Date(),
                status: know ? 'mastered' : 'learning',
                level: currentWord.level,
                step: currentWord.step || 1
            });
            
            // 큐가 10개 이상 쌓였을 때 서버로 전송
            if (learningQueue.length >= 10) {
                sendLearningDataToServer();
            }
        }
        
        // 다음 단어로 이동
        setWordIndex((prevIndex) => {
            const nextIndex = prevIndex + 1;
            return nextIndex >= deck.length ? prevIndex : nextIndex;
        });
        dispatch(kanjiActions.reset());
        setShowMean(false);
        setShowHiragana(false);
    }, 200);

    const handleKnowClick = useCallback((know: boolean) => {
        debouncedHandleKnowClick(know);
    }, [debouncedHandleKnowClick, deck, wordIndex]);

    const handleShowClick = useCallback((type: ShowType['type']) => {
        type === 'Mean' ? setShowMean(true) : setShowHiragana(true);
    }, []);

    return (
        <>
            {deck.length > 0 && (
                <FlashCard
                    word={deck[wordIndex]}
                    showMean={showMean}
                    showHiragana={showHiragana}
                />
            )}
            <ControlPanel
                onShowClick={handleShowClick}
                onKnowClick={handleKnowClick}
                showMean={!showMean}
                showHiragana={!showHiragana}
            />
        </>
    );
});

export default FlashCardContainer;