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
  matchSubPaths?: boolean;
  subMenu?: Menu[];
  ignore?: boolean;
  roles?: string[];
  permissions?: string[];
  moduleKey?: string;
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

const filterMenuByAccess = (
  menu: Array<Menu | "divider">,
  roleSet: Set<string>,
  permissionSet: Set<string>,
  enabledModuleSet: Set<string>
): Array<Menu | "divider"> => {
  const hasAllPermissions = (required: string[]) => {
    if (permissionSet.has("*")) return true;
    return required.every((permission) => permissionSet.has(String(permission).toLowerCase()));
  };

  const isAllowed = (item: Menu) => {
    if (item.moduleKey && !permissionSet.has("*") && enabledModuleSet.size > 0 && !enabledModuleSet.has(item.moduleKey)) {
      return false;
    }
    if (item.permissions && item.permissions.length > 0) {
      return hasAllPermissions(item.permissions);
    }
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
      const subMenu = filterMenuByAccess(item.subMenu, roleSet, permissionSet, enabledModuleSet).filter(
        (x): x is Menu => typeof x !== "string"
      );
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
  createSelector(
    [
      (state: RootState) => state.auth.roles,
      (state: RootState) => state.auth.permissions,
      (state: RootState) => state.auth.enabledModules
    ],
    (roles, permissions, enabledModules) => {
      const roleSet = new Set((roles ?? []).map((role) => String(role).toLowerCase()));
      const permissionSet = new Set((permissions ?? []).map((permission) => String(permission).toLowerCase()));
      const enabledModuleSet = new Set((enabledModules ?? []).map((moduleName) => String(moduleName).toLowerCase()));
      return filterMenuByAccess(getMenuByLayout(layout), roleSet, permissionSet, enabledModuleSet);
    }
  );

export const selectSideMenu = makeMenuSelector("side-menu");
export const selectTopMenu = makeMenuSelector("top-menu");
export const selectSimpleMenu = makeMenuSelector("simple-menu");
export const selectMenu = (layout: Themes["layout"]) => makeMenuSelector(layout);

export default menuSlice.reducer;
