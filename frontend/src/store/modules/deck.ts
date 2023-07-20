import { Action, createAction, handleActions } from "redux-actions";

interface deckState {
  deck: Array<WordType> | null;
  loading: boolean;
  error: string | null;
}

export interface WordType {
  tryNum?: number;
  pron: string;
  means: string[];
  entry: string;
}

// actionType
export const deckActionType = {
  setDeck: "deck/SET_DECK",
} as const;

// action
export const setDeck = createAction<Array<string>>(deckActionType.setDeck);

const initialState = {
  deck: null,
  loading: false,
  error: null,
};

//reducer
const deckReducer = handleActions<deckState, any>(
  {
    [deckActionType.setDeck]: (state, action: Action<Array<string>>) => ({
      ...state,
      step: action.payload,
    }),
  },
  initialState
);

export default deckReducer;
