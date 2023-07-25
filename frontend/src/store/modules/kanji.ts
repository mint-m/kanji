import { Action, createAction, handleActions } from "redux-actions";

interface kanjiStoreState {
  kanji: KanjiDataType | null;
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
  setKanji: "kanji/SET_KANJI",
  reset: "kanji/RESET",
} as const;

// action
export const setKanji = createAction<KanjiDataType>(kanjiActionType.setKanji);
export const reset = createAction<void>(kanjiActionType.reset, () => ({
  ...initialState,
}));

const initialState = {
  kanji: null,
};

// reducer
const kanjiReducer = handleActions<kanjiStoreState, any>(
  {
    [kanjiActionType.reset]: (_state) => ({
      ...initialState,
    }),
    [kanjiActionType.setKanji]: (state, action: Action<KanjiDataType>) => ({
      ...state,
      kanji: action.payload,
    }),
  },
  initialState
);

export default kanjiReducer;
