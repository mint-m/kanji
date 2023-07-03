import React from 'react';
import SelectLevel from 'components/SelectLevel';

const levels = ['Beginner', 'Intermediate', 'Advanced'];

const Study = () => {
  const handleSelectLevel = (level: string) => {
    console.log('Selected level:', level);
    // Do something with the selected level
  };

  return (
    <div>
      <h1>Level Selection</h1>
      <SelectLevel levels={levels} onSelectLevel={handleSelectLevel} nowProgress={'Advanced'} />
    </div>
  );
};

export default Study;
