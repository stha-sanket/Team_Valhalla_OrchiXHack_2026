import { configureStore } from '@reduxjs/toolkit';
import { authApi } from './api/authApi';
import { visitingPlaceApi } from './api/visitingPlaceApi';
import { visitingRoutesApi } from './api/visitingRoutesApi';
import { userProgressApi } from './api/userProgressApi';
import { userApi } from './api/userApi';
import { adminApi } from './api/adminApi';
import { arApi } from './api/arApi';

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [visitingPlaceApi.reducerPath]: visitingPlaceApi.reducer,
    [visitingRoutesApi.reducerPath]: visitingRoutesApi.reducer,
    [userProgressApi.reducerPath]: userProgressApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [arApi.reducerPath]: arApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      visitingPlaceApi.middleware,
      visitingRoutesApi.middleware,
      userProgressApi.middleware,
      userApi.middleware,
      adminApi.middleware,
      arApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
