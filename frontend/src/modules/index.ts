import { combineReducers } from "redux";
import level from "./level";

const rootReducer = combineReducers({
  level,
});

export default rootReducer;

export type RootState = ReturnType<typeof rootReducer>;
