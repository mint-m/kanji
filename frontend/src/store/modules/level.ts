import { Action, createAction, handleActions } from "redux-actions";

interface levelState {
  level: LevelType;
  step: string;
}

export type LevelType = "1" | "2" | "3" | "4" | "5";
// actionType
export const levelActionType = {
  setLevel: "level/SET_LEVEL",
  setStep: "level/SET_STEP",
} as const;

// action
export const setLevel = createAction<string>(levelActionType.setLevel);
export const setStep = createAction<string>(levelActionType.setStep);

const initialState = {
  level: "1" as LevelType,
  step: "STEP1",
};

//reducer
const levelReducer = handleActions<levelState, any>(
  {
    [levelActionType.setLevel]: (state, action: Action<LevelType>) => ({
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
