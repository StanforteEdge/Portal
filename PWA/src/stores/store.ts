import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import darkModeReducer from "@/stores/darkModeSlice";
import colorSchemeReducer from "@/stores/colorSchemeSlice";
import menuReducer from "@/stores/menuSlice";
import themeReducer from "@/stores/themeSlice";
import authReducer from "@/stores/authSlice";

export const store = configureStore({
  reducer: {
    darkMode: darkModeReducer,
    colorScheme: colorSchemeReducer,
    menu: menuReducer,
    auth: authReducer,
    theme: themeReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
