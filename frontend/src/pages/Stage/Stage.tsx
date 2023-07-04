import React, { useState } from 'react';
import WordCard, { WordType, Word } from 'components/WordCard/WordCard';

const WordSet: Word[] = JSON.parse(`[{
  "hiragana": "あい",
  "targetWord": "[愛]",
  "wordMean": "[명사]사랑;애정",
  "tryNum": 0
}]`);


const Stage = () => {
  const [showMean, setShowMean] = useState<boolean>(false);
  const [showHiragana, setShowHiragana] = useState<boolean>(false);

  const handleKnowClick = (know: boolean) => {
    setShowMean(false);
    setShowHiragana(false);
  };

  const handleShowClick = (type: WordType['type']) => {
    setShowMean(type === 'Mean');
    setShowHiragana(type === 'Hiragana');
  };

  const word = WordSet[0];

  return (
    <div>
      <WordCard
        onKnowClick={handleKnowClick}
        onShowClick={handleShowClick}
        word={word}
        showMean={showMean}
        showHiragana={showHiragana}
      />
    </div>
  );
};

export default Stage;
