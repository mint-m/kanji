import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { styled } from 'styled-components';

interface KanjiProps {
  kanji?: string;
}

interface KanjiData {
  expKoreanPron: string;
}

const Kanji: React.FC<KanjiProps> = ({ kanji }) => {
  const [kanjiData, setKanjiData] = useState<KanjiData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('api/kanji', { params: { kanji } });
        setKanjiData(response.data.searchResult[0]);
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
  }, [kanji]);

  return (
    <div>
      <KanjiDiv>
        {kanjiData?.expKoreanPron}
      </KanjiDiv>
    </div>
  );
};

export default Kanji;

const KanjiDiv = styled.div`
  font-size: 2rem;
  background-color: antiquewhite;
`;
