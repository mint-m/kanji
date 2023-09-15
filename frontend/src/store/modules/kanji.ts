import { Action, createAction, handleActions } from "redux-actions";

interface kanjiStoreState {
  kanjis: KanjiDataType[];
}

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

// actionType
const kanjiActionType = {
  addKanji: "kanji/ADD_KANJI",
  reset: "kanji/RESET",
} as const;

// action
export const addKanji = createAction<KanjiDataType>(kanjiActionType.addKanji);
export const reset = createAction<void>(kanjiActionType.reset, () => ({
  ...initialState,
}));

const initialState = {
  kanjis: [],
};

// reducer
const kanjiReducer = handleActions<kanjiStoreState, any>(
  {
    [kanjiActionType.reset]: (_state) => ({
      ...initialState,
    }),
    [kanjiActionType.addKanji]: (state, action: Action<KanjiDataType>) => ({
      ...state,
      kanjis: [...state.kanjis, action.payload],
    }),
  },
  initialState
);

export default kanjiReducer;
