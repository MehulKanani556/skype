import { combineReducers } from "redux";
import userSlice from "./slice/user.slice";

export const rootReducer = combineReducers({
    user:userSlice,
});
