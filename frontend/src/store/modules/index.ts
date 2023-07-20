import { combineReducers } from "redux";
import level from "./level";
import deck from "./deck";

const rootReducer = combineReducers({
  level,
  deck,
});

export default rootReducer;
