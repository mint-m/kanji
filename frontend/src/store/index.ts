import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "store/modules";

const store = configureStore({
  reducer: rootReducer,
});

export default store;
