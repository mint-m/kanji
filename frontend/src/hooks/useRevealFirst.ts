import { useEffect, useState } from 'react';
import { getPreferences, knownPreferences } from 'services/userService';
import { RevealFirst } from 'services/types';

// 학습 카드를 누를 때 먼저 보일 것 — 받아 둔 설정이 있으면 첫 그림부터 쓰고, 받기 전이나 실패하면 요미가나부터
export const useRevealFirst = (): RevealFirst => {
  const [revealFirst, setRevealFirst] = useState<RevealFirst>(() => knownPreferences()?.revealFirst ?? 'reading');

  useEffect(() => {
    let active = true;
    getPreferences()
      .then((preferences) => { if (active) setRevealFirst(preferences.revealFirst); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  return revealFirst;
};
