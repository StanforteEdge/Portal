import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "./store";
import { type Themes } from "@/stores/themeSlice";
import { icons } from "@/components/Base/Lucide";
import { createSelector } from "@reduxjs/toolkit";
import sideMenu from "@/main/side-menu";
import simpleMenu from "@/main/simple-menu";
import topMenu from "@/main/top-menu";

export interface Menu {
  icon: keyof typeof icons;
  title: string;
  badge?: number;
  pathname?: string;
  subMenu?: Menu[];
  ignore?: boolean;
  roles?: string[];
}

export interface MenuState {
  menu: Array<Menu | "divider">;
}

const initialState: MenuState = {
  menu: [],
};

export const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {},
});

const filterMenuByRole = (
  menu: Array<Menu | "divider">,
  roleSet: Set<string>
): Array<Menu | "divider"> => {
  const isAllowed = (item: Menu) => {
    if (!item.roles || item.roles.length === 0) return true;
    if (roleSet.has("admin")) return true;
    return item.roles.some((role) => roleSet.has(String(role).toLowerCase()));
  };

  const out: Array<Menu | "divider"> = [];
  for (const item of menu) {
    if (typeof item === "string") {
      out.push(item);
      continue;
    }

    if (!isAllowed(item)) continue;

    const next: Menu = { ...item };
    if (item.subMenu) {
      const subMenu = filterMenuByRole(item.subMenu, roleSet).filter((x): x is Menu => typeof x !== "string");
      if (subMenu.length === 0 && !item.pathname) continue;
      next.subMenu = subMenu;
    }
    out.push(next);
  }

  const cleaned: Array<Menu | "divider"> = [];
  for (const item of out) {
    if (item === "divider") {
      if (cleaned.length === 0 || cleaned[cleaned.length - 1] === "divider") continue;
    }
    cleaned.push(item);
  }
  while (cleaned.length && cleaned[cleaned.length - 1] === "divider") cleaned.pop();
  return cleaned;
};

const getMenuByLayout = (layout: Themes["layout"]) => {
  if (layout === "top-menu") return topMenu;
  if (layout === "simple-menu") return simpleMenu;
  return sideMenu;
};

const makeMenuSelector = (layout: Themes["layout"]) =>
  createSelector([(state: RootState) => state.auth.roles], (roles) => {
    const roleSet = new Set((roles ?? []).map((role) => String(role).toLowerCase()));
    return filterMenuByRole(getMenuByLayout(layout), roleSet);
  });

export const selectSideMenu = makeMenuSelector("side-menu");
export const selectTopMenu = makeMenuSelector("top-menu");
export const selectSimpleMenu = makeMenuSelector("simple-menu");
export const selectMenu = (layout: Themes["layout"]) => makeMenuSelector(layout);

export default menuSlice.reducer;
