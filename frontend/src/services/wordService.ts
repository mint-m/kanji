import { api } from './apiClient';
import { LearningLevel } from './types';

export interface LevelSteps {
  level: LearningLevel;
  totalWords: number;
  totalSteps: number;
  stepDistribution: { _id: number; wordCount: number }[];
  availableSteps: number[];
}

const wordService = {
  // 레벨의 스텝 구성 — 학습 시작 화면의 범위 선택에 쓴다
  getLevelSteps(level: LearningLevel): Promise<LevelSteps> {
    return api.get<LevelSteps>(`/api/words/level/${level}/steps`);
  },
};

export default wordService;
