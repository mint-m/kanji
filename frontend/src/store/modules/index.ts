import { combineReducers } from "redux";
import user from "./user";
import deck from "./deck";
import kanji from "./kanji";

const rootReducer = combineReducers({
  user,
  deck,
  kanji,
});

export default rootReducer;
