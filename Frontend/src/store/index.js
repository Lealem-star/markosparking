import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import rootReducer from './reducers/rootReducer';

const persistConfig = {
    key: 'root',
    storage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['FLUSH', 'REHYDRATE', 'PAUSE', 'PERSIST', 'PURGE', 'REGISTER'],
                ignoredActionPaths: ['payload.register', 'payload.rehydrate', 'register', 'rehydrate'],
            },
        }),
});

const persistor = persistStore(store);

export { store, persistor };
export { setUser, clearUser } from './reducers/userReducer';
export { selectCurrentUser } from './selectors';
