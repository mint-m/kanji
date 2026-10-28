import { LearningLevel } from 'services/types';

// 화면에 보여 주는 레벨 — daily(생활 어휘)는 운영 데이터가 0개라 단어를 채울 때까지 뺀다(LEVEL_INFO의 이름은 남긴다)
export const LEVELS: LearningLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

export const LEVEL_INFO: Record<LearningLevel, { name: string; label: string; description: string }> = {
  daily: { name: '일상', label: '생활 필수', description: '인사말·기초회화·고빈도 일상어처럼 시험과 무관하지만 실생활에 꼭 필요한 표현.' },
  N5: { name: 'N5', label: '입문', description: '숫자·날짜·간단한 인사말을 이해하는 수준.' },
  N4: { name: 'N4', label: '초급', description: '일상적인 대화와 쉬운 글을 읽을 수 있는 수준.' },
  N3: { name: 'N3', label: '중급', description: '자연스러운 일상 대화와 짧은 기사 요약을 이해하는 수준.' },
  N2: { name: 'N2', label: '중상급', description: '뉴스·사설·업무 문서를 읽고 이해하는 수준.' },
  N1: { name: 'N1', label: '고급', description: '복잡한 문장과 추상적 표현까지 다루는 수준.' },
};

export const levelName = (level: string) => LEVEL_INFO[level as LearningLevel]?.name ?? level;

// 화면에 보이는 범위 이름 — 진도 학습은 3스텝 윈도우(레벨 끝에서는 1스텝으로 돌아온다), 집중 학습은 한 스텝
export const formatSteps = (steps: { start: number; end: number }, type: 'main' | 'sub'): string => {
  if (type === 'sub' || steps.start === steps.end) return `스텝 ${steps.start}`;
  if (steps.start < steps.end) return `스텝 ${steps.start}–${steps.end}`;
  return `스텝 ${steps.start}–끝, 1${steps.end > 1 ? `–${steps.end}` : ''}`;
};
