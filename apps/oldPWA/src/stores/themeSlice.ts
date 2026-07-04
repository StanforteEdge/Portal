import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./store";

export const themes = [
  {
    name: "rubick",
    layout: "side-menu",
  },
  {
    name: "rubick",
    layout: "simple-menu",
  },
  {
    name: "rubick",
    layout: "top-menu",
  },
  {
    name: "icewall",
    layout: "side-menu",
  },
  {
    name: "icewall",
    layout: "simple-menu",
  },
  {
    name: "icewall",
    layout: "top-menu",
  },
  {
    name: "tinker",
    layout: "side-menu",
  },
  {
    name: "tinker",
    layout: "simple-menu",
  },
  {
    name: "tinker",
    layout: "top-menu",
  },
  {
    name: "enigma",
    layout: "side-menu",
  },
  {
    name: "enigma",
    layout: "simple-menu",
  },
  {
    name: "enigma",
    layout: "top-menu",
  },
] as const;

export type Themes = (typeof themes)[number];

interface ThemeState {
  value: {
    name: Themes["name"];
    layout: Themes["layout"];
  };
}

export const getTheme = (search?: {
  name: Themes["name"];
  layout: Themes["layout"];
}) => {
  const searchValues =
    search === undefined
      ? {
          name: localStorage.getItem("theme"),
          layout: localStorage.getItem("layout"),
        }
      : search;
  return (
    themes.filter((item, key) => {
      return (
        item.name === searchValues.name && item.layout === searchValues.layout
      );
    })[0] || themes[0]
  );
};

const initialState: ThemeState = {
  value: {
    name: "rubick",
    layout: "side-menu",
  },
};

export const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme: (state, _action: PayloadAction<Themes["name"]>) => {
      state.value = {
        name: "rubick",
        layout: "side-menu",
      };
      localStorage.setItem("theme", "rubick");
      localStorage.setItem("layout", "side-menu");
    },
    setLayout: (state, _action: PayloadAction<Themes["layout"]>) => {
      state.value = {
        name: "rubick",
        layout: "side-menu",
      };
      localStorage.setItem("theme", "rubick");
      localStorage.setItem("layout", "side-menu");
    },
  },
});

export const { setTheme, setLayout } = themeSlice.actions;

export const selectTheme = (state: RootState) => {
  // Portal is locked to Rubick + side-menu.
  localStorage.setItem("theme", "rubick");
  localStorage.setItem("layout", "side-menu");

  return {
    ...state.theme.value,
    name: "rubick" as const,
    layout: "side-menu" as const,
  };
};

export default themeSlice.reducer;
