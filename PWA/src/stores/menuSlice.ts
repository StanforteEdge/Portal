import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "./store";
import { type Themes } from "@/stores/themeSlice";
import { icons } from "@/components/Base/Lucide";
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

export const selectMenu = (layout: Themes["layout"]) => (state: RootState) => {
  const roleSet = new Set((state.auth.roles ?? []).map((role) => String(role).toLowerCase()));

  const isAllowed = (item: Menu) => {
    if (!item.roles || item.roles.length === 0) return true;
    if (roleSet.has("admin")) return true;
    return item.roles.some((role) => roleSet.has(String(role).toLowerCase()));
  };

  const filterMenuByRole = (menu: Array<Menu | "divider">): Array<Menu | "divider"> => {
    const out: Array<Menu | "divider"> = [];
    for (const item of menu) {
      if (typeof item === "string") {
        out.push(item);
        continue;
      }

      if (!isAllowed(item)) continue;

      const next: Menu = { ...item };
      if (item.subMenu) {
        const subMenu = filterMenuByRole(item.subMenu).filter((x): x is Menu => typeof x !== "string");
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

  if (layout == "top-menu") {
    return filterMenuByRole(topMenu);
  }

  if (layout == "simple-menu") {
    return filterMenuByRole(simpleMenu);
  }

  return filterMenuByRole(sideMenu);
};

export default menuSlice.reducer;
