import { combineReducers } from "redux";
import userSlice from "./slice/user.slice";
import authSlice from "./slice/auth.slice";
export const rootReducer = combineReducers({
    user:userSlice,
    auth:authSlice,
});
