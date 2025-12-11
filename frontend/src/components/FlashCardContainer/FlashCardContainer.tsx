import React, { useCallback, useEffect, useState } from 'react';
import FlashCard, { ShowType } from 'components/FlashCard';
import { DeckWord } from 'services/types';
import { useDispatch } from 'react-redux';
import * as kanjiActions from 'store/modules/kanji';
import ControlPanel from 'components/ControlPanel';
import axios from 'axios';
import styled from 'styled-components';
interface FlashCardContainerProps {
    deck: DeckWord[];
}

const FlashCardContainer: React.FC<FlashCardContainerProps> = React.memo((props: FlashCardContainerProps) => {
    // State for the current word being shown
    const [wordIndex, setWordIndex] = useState<number>(0);
    const [showMean, setShowMean] = useState<boolean>(false);
    const [showHiragana, setShowHiragana] = useState<boolean>(false);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);

    // Learning stats
    const [masteredCount, setMasteredCount] = useState<number>(0);
    const [learningCount, setLearningCount] = useState<number>(0);

    // Processing state for preventing duplicate clicks
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    // Error state
    const [error, setError] = useState<string | null>(null);

    // User and learning state from Redux
    const dispatch = useDispatch();
    const deckSesstion = props.deck;

    useEffect(() => {
        const restoreCheckpoint = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const progressType = 'main'; // TODO: 타입 유동화
                const response = await axios.get(
                    `/api/progress/${progressType}/current`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );

                if (response.data.success && response.data.data) {
                    const { currentIndex } = response.data.data;

                    // 저장된 인덱스로 복원
                    setWordIndex(currentIndex);
                    console.log(`✅ Checkpoint restored: starting at index ${currentIndex}`);
                }
            } catch (error) {
                console.error('Failed to restore checkpoint:', error);
            } finally {
                setIsInitialized(true);
            }
        };

        if (!isInitialized) {
            restoreCheckpoint();
        }
    }, [isInitialized]);


    /**
     * "알아요" / "모르겠어요" 버튼 클릭 핸들러
     * - 단어 완료 API 호출 (complete-word)
     * - 백엔드에서 자동으로 체크포인트 업데이트
     * - 중복 클릭 방지 (isProcessing state 사용)
     */
    const handleKnowClick = useCallback(async (know: boolean) => {
        // 중복 클릭 방지
        if (isProcessing) {
            console.log('⏳ Still processing previous click...');
            return;
        }

        setIsProcessing(true);

        try {
            // 현재 단어 정보 확인
            if (deckSesstion.length === 0 || wordIndex >= deckSesstion.length) {
                console.warn('⚠️ No valid word to process');
                return;
            }

            const currentWord = deckSesstion[wordIndex];

            // 학습 카운트 업데이트
            if (know) {
                setMasteredCount(prev => prev + 1);
            } else {
                setLearningCount(prev => prev + 1);
            }

            const token = localStorage.getItem('token');

            if (!token) {
                console.warn('⚠️ User not authenticated');
                return;
            }
            const progressType = 'main'; // TODO: 타입 유동화

            // 단어 완료 처리 - 백엔드에서 자동으로 체크포인트 업데이트됨
            await axios.post(
                `/api/progress/${progressType}/complete-word`,
                {
                    wordId: currentWord._id,
                    isCorrect: know,
                    timeSpent: 0, // TODO: 실제 소요 시간 측정 로직 추가
                },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            // 다음 단어로 이동
            setWordIndex(prevIndex => {
                const nextIndex = prevIndex + 1;
                return nextIndex >= deckSesstion.length ? prevIndex : nextIndex;
            });

            // UI 상태 리셋
            dispatch(kanjiActions.reset());
            setShowMean(false);
            setShowHiragana(false);

        } catch (error) {
            console.error('❌ Failed to process word completion:', error);

            // 에러 메시지 설정
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.message || 'Failed to save progress';
                setError(errorMessage);
            } else {
                setError('An unexpected error occurred');
            }

            // 에러 메시지는 3초 후 자동으로 사라짐
            setTimeout(() => setError(null), 3000);

            // 에러가 발생해도 사용자 경험을 위해 다음 카드로 진행
            setWordIndex(prevIndex => {
                const nextIndex = prevIndex + 1;
                return nextIndex >= deckSesstion.length ? prevIndex : nextIndex;
            });
            dispatch(kanjiActions.reset());
            setShowMean(false);
            setShowHiragana(false);
        } finally {
            // 처리 완료 후 버튼 다시 활성화
            setIsProcessing(false);
        }
    }, [isProcessing, deckSesstion, wordIndex, dispatch]);

    /**
     * "뜻 보기" / "히라가나 보기" 버튼 핸들러
     */
    const handleShowClick = useCallback((type: ShowType['type']) => {
        type === 'Mean' ? setShowMean(true) : setShowHiragana(true);
    }, []);

    // 덱의 끝에 도달했는지 확인
    const isEndOfDeck = wordIndex >= deckSesstion.length - 1;

    return (
        <>
            {error && (
                <ErrorBanner>
                    <ErrorIcon>⚠️</ErrorIcon>
                    <ErrorMessage>{error}</ErrorMessage>
                </ErrorBanner>
            )}

            {deckSesstion.length > 0 && (
                <>
                    <FlashCard
                        word={deckSesstion[wordIndex]}
                        showMean={showMean}
                        showHiragana={showHiragana}
                    />

                    {isEndOfDeck ? (
                        <CompletionMessage>
                            <h3>🎉 All cards completed!</h3>
                            <StatsContainer>
                                <StatItem>
                                    <StatLabel>Mastered</StatLabel>
                                    <StatValue className="mastered">{masteredCount}</StatValue>
                                </StatItem>
                                <StatItem>
                                    <StatLabel>Still learning</StatLabel>
                                    <StatValue className="learning">{learningCount}</StatValue>
                                </StatItem>
                            </StatsContainer>
                            <RestartButton
                                onClick={() => {
                                    setWordIndex(0);
                                    setMasteredCount(0);
                                    setLearningCount(0);
                                    dispatch(kanjiActions.reset());
                                    setShowMean(false);
                                    setShowHiragana(false);
                                }}
                            >
                                🔄 Restart Deck
                            </RestartButton>
                        </CompletionMessage>
                    ) : (
                        <ControlPanel
                            onShowClick={handleShowClick}
                            onKnowClick={handleKnowClick}
                            showMean={!showMean}
                            showHiragana={!showHiragana}
                            disabled={isProcessing}
                        />
                    )}
                </>
            )}
        </>
    );
});

export default FlashCardContainer;

// ============================================
// Styled Components
// ============================================

const CompletionMessage = styled.div`
    margin-top: 2rem;
    padding: 2rem;
    background: linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%);
    border-radius: 1rem;
    text-align: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
    
    h3 {
        margin-top: 0;
        margin-bottom: 1.5rem;
        color: #2c3e50;
        font-size: 1.5rem;
        font-weight: 600;
    }
`;

const StatsContainer = styled.div`
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin: 1.5rem 0;
`;

const StatItem = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
`;

const StatLabel = styled.span`
    font-size: 0.9rem;
    color: #64748b;
    font-weight: 500;
`;

const StatValue = styled.span`
    font-size: 2rem;
    font-weight: 700;
    
    &.mastered {
        color: #10b981;
    }
    
    &.learning {
        color: #f59e0b;
    }
`;

const RestartButton = styled.button`
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    border: none;
    border-radius: 0.75rem;
    padding: 0.875rem 2rem;
    margin-top: 1.5rem;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
    transition: all 0.2s ease;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(59, 130, 246, 0.4);
    }

    &:active {
        transform: translateY(0);
    }
`;

const ErrorBanner = styled.div`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    border: 1px solid #fca5a5;
    border-radius: 0.75rem;
    padding: 1rem 1.25rem;
    margin-bottom: 1rem;
    box-shadow: 0 2px 4px rgba(239, 68, 68, 0.1);
    animation: slideDown 0.3s ease-out;

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;

const ErrorIcon = styled.span`
    font-size: 1.25rem;
    flex-shrink: 0;
`;

const ErrorMessage = styled.span`
    color: #991b1b;
    font-size: 0.9rem;
    font-weight: 500;
`;