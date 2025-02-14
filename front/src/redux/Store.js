import { applyMiddleware, createStore } from "redux";
import { thunk } from "redux-thunk";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { rootReducer } from "./rootReducer.js";

export const configureStore = () => {
  const persistConfig = {
    key: "root",
    storage,
    whitelist: [],
  };

  const persistedReducer = persistReducer(persistConfig, rootReducer);

  const store = createStore(persistedReducer, applyMiddleware(thunk));

  let persistor = persistStore(store);

  return { store, persistor };
};
