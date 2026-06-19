import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Mean {
  value: string;
  exampleOri: string | null;
  exampleTrans: string | null;
}

export interface KanjiDataType {
  level: string;
  kanji: string;
  onRead?: string;
  kunRead?: string;
  koreanPron: string;
  means: Array<Mean>;
}

interface KanjiState {
  kanjis: KanjiDataType[];
}

const initialState: KanjiState = {
  kanjis: [],
};

const kanjiSlice = createSlice({
  name: 'kanji',
  initialState,
  reducers: {
    addKanji: (state, action: PayloadAction<KanjiDataType>) => {
      state.kanjis.push(action.payload);
    },
    reset: () => initialState,
  },
});

export const { addKanji, reset } = kanjiSlice.actions;
export default kanjiSlice.reducer;
