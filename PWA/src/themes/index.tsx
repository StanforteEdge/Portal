import {
  selectTheme,
  getTheme,
  setTheme,
  themes,
  Themes,
} from "@/stores/themeSlice";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect, useMemo } from "react";
import type { LazyExoticComponent } from "react";

const RubickSideMenu = lazy(() => import("@/themes/Rubick/SideMenu"));
const RubickSimpleMenu = lazy(() => import("@/themes/Rubick/SimpleMenu"));
const RubickTopMenu = lazy(() => import("@/themes/Rubick/TopMenu"));
const IcewallSideMenu = lazy(() => import("@/themes/Icewall/SideMenu"));
const IcewallSimpleMenu = lazy(() => import("@/themes/Icewall/SimpleMenu"));
const IcewallTopMenu = lazy(() => import("@/themes/Icewall/TopMenu"));
const TinkerSideMenu = lazy(() => import("@/themes/Tinker/SideMenu"));
const TinkerSimpleMenu = lazy(() => import("@/themes/Tinker/SimpleMenu"));
const TinkerTopMenu = lazy(() => import("@/themes/Tinker/TopMenu"));
const EnigmaSideMenu = lazy(() => import("@/themes/Enigma/SideMenu"));
const EnigmaSimpleMenu = lazy(() => import("@/themes/Enigma/SimpleMenu"));
const EnigmaTopMenu = lazy(() => import("@/themes/Enigma/TopMenu"));

const THEME_COMPONENTS: Record<string, LazyExoticComponent<() => JSX.Element>> = {
  "rubick:side-menu": RubickSideMenu,
  "rubick:simple-menu": RubickSimpleMenu,
  "rubick:top-menu": RubickTopMenu,
  "icewall:side-menu": IcewallSideMenu,
  "icewall:simple-menu": IcewallSimpleMenu,
  "icewall:top-menu": IcewallTopMenu,
  "tinker:side-menu": TinkerSideMenu,
  "tinker:simple-menu": TinkerSimpleMenu,
  "tinker:top-menu": TinkerTopMenu,
  "enigma:side-menu": EnigmaSideMenu,
  "enigma:simple-menu": EnigmaSimpleMenu,
  "enigma:top-menu": EnigmaTopMenu,
};

function Main() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);
  const selectedTheme = getTheme(theme);
  const Component = useMemo(() => {
    return (
      THEME_COMPONENTS[`${selectedTheme.name}:${selectedTheme.layout}`] ??
      RubickSideMenu
    );
  }, [selectedTheme.layout, selectedTheme.name]);

  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);

  const switchTheme = (theme: Themes["name"]) => {
    dispatch(setTheme(theme));
  };

  useEffect(() => {
    if (queryParams.get("theme")) {
      const selectedTheme = themes.find(
        (theme) => theme.name === queryParams.get("theme")
      );

      if (selectedTheme) {
        switchTheme(selectedTheme.name);
      }
    }
  }, []);

  return (
    <div>
      <ThemeSwitcher />
      <Suspense fallback={<div className="p-6 text-slate-500">Loading layout...</div>}>
        <Component />
      </Suspense>
    </div>
  );
}

export default Main;
