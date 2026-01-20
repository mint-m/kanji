import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import FlashCard, { ShowType } from 'components/FlashCard';
import ControlPanel from 'components/ControlPanel';
import { DeckWord } from 'services/types';
import * as kanjiActions from 'store/modules/kanji';
import progressService from 'services/progressService';

interface FlashCardContainerProps {
    deck: DeckWord[];
    progressType: 'main' | 'sub';
    initialIndex: number;
}

const FlashCardContainer: React.FC<FlashCardContainerProps> = React.memo(
    ({ deck, progressType, initialIndex }) => {
        // =========================
        // Core learning state
        // =========================
        const [wordIndex, setWordIndex] = useState(initialIndex);

        // =========================
        // UI state
        // =========================
        const [showMean, setShowMean] = useState(false);
        const [showHiragana, setShowHiragana] = useState(false);
        const [error, setError] = useState<string | null>(null);

        // =========================
        // Progress state
        // =========================
        const [masteredCount, setMasteredCount] = useState(0);
        const [learningCount, setLearningCount] = useState(0);

        // =========================
        // Control flags
        // =========================
        const [isResetting, setIsResetting] = useState(false);

        // =========================
        // Time tracking
        // =========================
        const [cardStudyTime, setCardStudyTime] = useState(Date.now());

        const isProcessingRef = useRef(false);


        const dispatch = useDispatch();

        // =========================
        // Derived state
        // =========================
        const isCompleted = wordIndex >= deck.length;
        const currentWordId = useMemo(() => deck[wordIndex]?._id, [deck, wordIndex]);

        // =========================
        // Effects
        // =========================
        useEffect(() => {
            setCardStudyTime(Date.now());
        }, [wordIndex]);

        useEffect(() => {
            if (!error) return;
            const timer = setTimeout(() => setError(null), 3000);
            return () => clearTimeout(timer);
        }, [error]);

        // =========================
        // Helpers
        // =========================
        const resetUIState = useCallback(() => {
            dispatch(kanjiActions.reset());
            setShowMean(false);
            setShowHiragana(false);
        }, [dispatch]);

        const moveToNextCard = useCallback(() => {
            setWordIndex(prev => prev + 1);
            resetUIState();
        }, [resetUIState]);

        const updateStats = useCallback((know: boolean) => {
            know
                ? setMasteredCount(prev => prev + 1)
                : setLearningCount(prev => prev + 1);
        }, []);

        // =========================
        // Server sync (fire-and-forget)
        // =========================
        const completeWordAsync = useCallback(
            (wordId: string, startedAt: number, know: boolean) => {
                return progressService.completeWord(
                    progressType,
                    wordId,
                    know,
                    Math.floor((Date.now() - startedAt) / 1000)
                );
            },
            [progressType]
        );

        // =========================
        // Event handlers
        // =========================
        const handleKnowClick = useCallback((know: boolean) => {
            // 중복 클릭 방지: ref를 통해 동기적으로 처리 (성능 최적화)
            // TODO: UX 개선 필요 시 ControlPanel에 disabled prop 추가 고려
            //       (트레이드오프: 카드당 2번 추가 리렌더링 vs 시각적 피드백)
            if (isProcessingRef.current || !currentWordId) return;

            isProcessingRef.current = true;

            // Optimistic UI
            updateStats(know);
            moveToNextCard();

            // Background sync
            completeWordAsync(currentWordId, cardStudyTime, know)
                .catch((error: unknown) => {
                    console.warn('⚠️ Progress sync failed', {
                        error,
                        wordIndex,
                    })
                })
                .finally(() => {
                    isProcessingRef.current = false;
                });
        }, [updateStats, moveToNextCard, currentWordId, cardStudyTime, completeWordAsync, wordIndex]);

        const handleShowClick = useCallback((type: ShowType['type']) => {
            type === 'Mean' ? setShowMean(true) : setShowHiragana(true);
        }, []);

        const handleRestartClick = useCallback(async () => {
            if (isResetting) return;
            setIsResetting(true);

            try {
                await progressService.resetProgress(progressType);

                setWordIndex(0);
                setMasteredCount(0);
                setLearningCount(0);
                setCardStudyTime(Date.now());
                resetUIState();
            } catch (e) {
                console.error('❌ Failed to restart deck', e);
                setError('Failed to restart deck');
            } finally {
                setIsResetting(false);
            }
        }, [isResetting, progressType, resetUIState]);

        // =========================
        // Render
        // =========================
        if (deck.length === 0) return null;

        if (isCompleted) {
            return (
                <>
                    {error && (
                        <ErrorBanner>
                            <ErrorIcon>⚠️</ErrorIcon>
                            <ErrorMessage>{error}</ErrorMessage>
                        </ErrorBanner>
                    )}

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

                        <RestartButton onClick={handleRestartClick} disabled={isResetting}>
                            {isResetting ? '🔄 Restarting...' : '🔄 Restart Deck'}
                        </RestartButton>
                    </CompletionMessage>
                </>
            );
        }

        return (
            <>
                {error && (
                    <ErrorBanner>
                        <ErrorIcon>⚠️</ErrorIcon>
                        <ErrorMessage>{error}</ErrorMessage>
                    </ErrorBanner>
                )}

                <FlashCard
                    word={deck[wordIndex]}
                    showMean={showMean}
                    showHiragana={showHiragana}
                />

                {/*
                    성능 최적화: disabled prop 제거됨
                    - 중복 클릭은 isProcessingRef로 방지 (기능적으로 안전)
                    - 리렌더링 감소로 성능 향상
                    - 단, 버튼 비활성화 시각 피드백 없음 (UX 트레이드오프)
                */}
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

    &.mastered { color: #10b981; }
    &.learning { color: #f59e0b; }
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
    transition: all 0.2s ease;

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

const ErrorBanner = styled.div`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: #fee2e2;
    border: 1px solid #fca5a5;
    border-radius: 0.75rem;
    padding: 1rem 1.25rem;
    margin-bottom: 1rem;
`;

const ErrorIcon = styled.span`
    font-size: 1.25rem;
`;

const ErrorMessage = styled.span`
    color: #991b1b;
    font-size: 0.9rem;
    font-weight: 500;
`;
