import { combineReducers } from "redux";
import level from "./level";
import deck from "./deck";
import kanji from "./kanji";

const rootReducer = combineReducers({
  level,
  deck,
  kanji,
});

export default rootReducer;
