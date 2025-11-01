import { combineReducers } from "redux";
import user from "./user";
import kanji from "./kanji";

const rootReducer = combineReducers({
  user,
  kanji,
});

export default rootReducer;
