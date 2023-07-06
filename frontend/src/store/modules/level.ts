import { Action, createAction, handleActions } from "redux-actions";

interface levelState {
  level: string;
  step: string;
}

// actionType
export const levelActionType = {
  setLevel: "level/SET_LEVEL",
  setStep: "level/SET_STEP",
} as const;

// action
export const setLevel = createAction<string>(levelActionType.setLevel);
export const setStep = createAction<string>(levelActionType.setStep);

const initialState = {
  level: "JLPT5",
  step: "STEP1",
};

//reducer
const levelReducer = handleActions<levelState, any>(
  {
    [levelActionType.setLevel]: (state, action: Action<string>) => ({
      ...state,
      level: action.payload,
    }),
    [levelActionType.setStep]: (state, action: Action<string>) => ({
      ...state,
      step: action.payload,
    }),
  },
  initialState
);

export default levelReducer;
