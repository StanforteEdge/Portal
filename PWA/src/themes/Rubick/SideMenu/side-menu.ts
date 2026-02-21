import { NavigateFunction } from "react-router-dom";
import { Menu } from "@/stores/menuSlice";
import { slideUp, slideDown } from "@/utils/helper";
import { createContext } from "react";

interface Location {
  pathname: string;
  forceActiveMenu?: string;
}

export interface FormattedMenu extends Menu {
  active?: boolean;
  activeDropdown?: boolean;
  subMenu?: FormattedMenu[];
}

const resolvePathnameForLocation = (pathname: string | undefined, location: Location) => {
  if (!pathname) return { pathname: undefined, active: false, shouldRender: true };
  if (!pathname.includes(":id")) {
    const active =
      (location.forceActiveMenu !== undefined && pathname === location.forceActiveMenu) ||
      (location.forceActiveMenu === undefined && pathname === location.pathname);
    return { pathname, active, shouldRender: true };
  }

  const basePath = pathname.split(":id")[0];
  const active = location.pathname.startsWith(basePath) && location.pathname.length > basePath.length;
  if (!active) return { pathname, active: false, shouldRender: false };
  return { pathname: location.pathname, active: true, shouldRender: true };
};

const isPathActive = (pathname: string | undefined, location: Location, matchSubPaths?: boolean) => {
  if (!pathname) return false;
  if (location.forceActiveMenu !== undefined) return pathname === location.forceActiveMenu;
  if (pathname === location.pathname) return true;
  if (matchSubPaths && location.pathname.startsWith(`${pathname}/`)) return true;
  return false;
};

const forceActiveMenu = (location: Location, pathname: string) => {
  location.forceActiveMenu = pathname;
};

const forceActiveMenuContext = createContext<{
  forceActiveMenu: (pathname: string) => void;
}>({
  forceActiveMenu: () => {},
});

// Setup side menu
const findActiveMenu = (subMenu: Menu[], location: Location): boolean => {
  let match = false;
  subMenu.forEach((item) => {
    const resolved = resolvePathnameForLocation(item.pathname, location);
    if (
      isPathActive(resolved.pathname, location, item.matchSubPaths) &&
      !item.ignore
    ) {
      match = true;
    } else if (!match && item.subMenu) {
      match = findActiveMenu(item.subMenu, location);
    }
  });
  return match;
};

const nestedMenu = (menu: Array<Menu | "divider">, location: Location) => {
  const formattedMenu: Array<FormattedMenu | "divider"> = [];
  menu.forEach((item) => {
    if (typeof item !== "string") {
      const resolved = resolvePathnameForLocation(item.pathname, location);
      if (!resolved.shouldRender) return;

      const menuItem: FormattedMenu = {
        icon: item.icon,
        title: item.title,
        pathname: resolved.pathname,
        matchSubPaths: item.matchSubPaths,
        subMenu: item.subMenu,
        ignore: item.ignore,
      };
      menuItem.active =
        (isPathActive(menuItem.pathname, location, menuItem.matchSubPaths) ||
          (menuItem.subMenu && findActiveMenu(menuItem.subMenu, location))) &&
        !menuItem.ignore;

      if (menuItem.subMenu) {
        menuItem.activeDropdown = findActiveMenu(menuItem.subMenu, location);

        // Nested menu
        const subMenu: Array<FormattedMenu> = [];
        nestedMenu(menuItem.subMenu, location).map(
          (menu) => typeof menu !== "string" && subMenu.push(menu)
        );
        menuItem.subMenu = subMenu;
      }

      formattedMenu.push(menuItem);
    } else {
      formattedMenu.push(item);
    }
  });

  return formattedMenu;
};

const linkTo = (menu: FormattedMenu, navigate: NavigateFunction) => {
  if (menu.subMenu) {
    menu.activeDropdown = !menu.activeDropdown;
  } else {
    if (menu.pathname !== undefined) {
      navigate(menu.pathname);
    }
  }
};

const enter = (el: HTMLElement) => {
  slideDown(el, 300);
};

const leave = (el: HTMLElement) => {
  slideUp(el, 300);
};

export {
  nestedMenu,
  linkTo,
  enter,
  leave,
  forceActiveMenuContext,
  forceActiveMenu,
};
