import "@/assets/css/vendors/simplebar.css";
import "@/assets/css/components/mobile-menu.css";
import { Transition } from "react-transition-group";
import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toRaw } from "@/utils/helper";
import { selectSideMenu } from "@/stores/menuSlice";
import { useAppSelector } from "@/stores/hooks";
import { FormattedMenu, linkTo, nestedMenu, enter, leave } from "./mobile-menu";
import Lucide from "@/components/Base/Lucide";
import { BRAND_LOGO_FULL_DARK } from "@/constants/branding";
import clsx from "clsx";
import SimpleBar from "simplebar";

function menuPanelId(level: number, key: number) {
  return `mobile-menu-panel-${level}-${key}`;
}

function Main() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formattedMenu, setFormattedMenu] = useState<
    Array<FormattedMenu | "divider">
  >([]);
  const menuStore = useAppSelector(selectSideMenu);
  const menu = () => nestedMenu(toRaw(menuStore), location);
  const [activeMobileMenu, setActiveMobileMenu] = useState(false);
  const scrollableRef = useRef<HTMLDivElement | null>(null);
  const simpleBarRef = useRef<SimpleBar | null>(null);

  useEffect(() => {
    if (scrollableRef.current && !simpleBarRef.current) {
      simpleBarRef.current = new SimpleBar(scrollableRef.current);
    }
    return () => simpleBarRef.current?.unMount();
  }, []);

  useEffect(() => {
    setFormattedMenu(menu());
  }, [location.pathname]);

  return (
    <>
      {/* BEGIN: Mobile Menu */}
      <div
        className={clsx([
          "mobile-menu group top-0 inset-x-0 fixed bg-theme-1/90 z-[60] border-b border-white/[0.08] dark:bg-darkmode-800/90 md:hidden",
          "before:content-[''] before:w-full before:h-screen before:z-10 before:fixed before:inset-x-0 before:bg-black/90 before:transition-opacity before:duration-200 before:ease-in-out",
          "before:invisible before:opacity-0",
          "[&.mobile-menu--active]:before:visible [&.mobile-menu--active]:before:opacity-100",
          activeMobileMenu && "mobile-menu--active",
        ])}
      >
        <div className="h-[70px] px-3 sm:px-8 flex items-center">
          <button
            type="button"
            className="flex mr-auto"
            aria-label="Go to dashboard"
            onClick={() => {
              navigate("/app");
              setActiveMobileMenu(false);
            }}
          >
            <img
              alt="Midone Tailwind HTML Admin Template"
              className="w-32 h-auto"
              src={BRAND_LOGO_FULL_DARK}
            />
          </button>
          <button
            type="button"
            aria-label={activeMobileMenu ? "Close mobile menu" : "Open mobile menu"}
            aria-expanded={activeMobileMenu}
            aria-controls="mobile-menu-navigation"
            onClick={() => {
              setActiveMobileMenu(!activeMobileMenu);
            }}
          >
            <Lucide
              icon="BarChart2"
              className="w-8 h-8 text-white transform -rotate-90"
            />
          </button>
        </div>
        <div
          id="mobile-menu-navigation"
          ref={scrollableRef}
          className={clsx([
            "h-screen z-20 top-0 left-0 w-[270px] -ml-[100%] bg-primary transition-all duration-300 ease-in-out dark:bg-darkmode-800",
            "[&[data-simplebar]]:fixed [&_.simplebar-scrollbar]:before:bg-black/50",
            "group-[.mobile-menu--active]:ml-0",
          ])}
        >
          <button
            type="button"
            aria-label="Close mobile menu"
            className={clsx([
              "fixed top-0 right-0 mt-4 mr-4 transition-opacity duration-200 ease-in-out",
              "invisible opacity-0",
              "group-[.mobile-menu--active]:visible group-[.mobile-menu--active]:opacity-100",
            ])}
            onClick={() => {
              setActiveMobileMenu(!activeMobileMenu);
            }}
          >
            <Lucide
              icon="XCircle"
              className="w-8 h-8 text-white transform -rotate-90"
            />
          </button>
          <div className="px-5 pt-6 pb-3">
            <div className="text-white text-xl font-bold tracking-wide">
              Menu
            </div>
            <div className="mt-2 h-px bg-white/15" />
          </div>
          <ul className="py-2">
            {/* BEGIN: First Child */}
            {formattedMenu.map((menu, menuKey) =>
              menu == "divider" ? (
                <li className="my-6 menu__divider" key={menuKey}></li>
              ) : (
                <li key={menuKey}>
                  {menu.subMenu ? (
                    <button
                      type="button"
                      className={clsx([
                        menu.active ? "menu menu--active" : "menu",
                      ])}
                      aria-expanded={Boolean(menu.activeDropdown)}
                      aria-controls={menuPanelId(1, menuKey)}
                      onClick={(event) => {
                        event.preventDefault();
                        linkTo(menu, navigate, setActiveMobileMenu);
                        setFormattedMenu([...formattedMenu]);
                      }}
                    >
                      <div className="menu__icon">
                        <Lucide icon={menu.icon} />
                      </div>
                      <div className="menu__title">
                        {menu.title}
                        <div
                          className={clsx([
                            "menu__sub-icon",
                            menu.activeDropdown && "transform rotate-180",
                          ])}
                        >
                          <Lucide icon="ChevronDown" />
                        </div>
                      </div>
                    </button>
                  ) : (
                  <a
                    href={menu.pathname}
                    className={clsx([
                      menu.active ? "menu menu--active" : "menu",
                    ])}
                    onClick={(event) => {
                      event.preventDefault();
                      linkTo(menu, navigate, setActiveMobileMenu);
                      setFormattedMenu([...formattedMenu]);
                    }}
                  >
                    <div className="menu__icon">
                      <Lucide icon={menu.icon} />
                    </div>
                    <div className="menu__title">
                      {menu.title}
                      {menu.subMenu && (
                        <div
                          className={clsx([
                            "menu__sub-icon",
                            menu.activeDropdown && "transform rotate-180",
                          ])}
                        >
                          <Lucide icon="ChevronDown" />
                        </div>
                      )}
                    </div>
                  </a>
                  )}
                  {/* BEGIN: Second Child */}
                  {menu.subMenu && (
                    <Transition
                      in={menu.activeDropdown}
                      onEnter={enter}
                      onExit={leave}
                      timeout={300}
                    >
                      <ul
                        id={menuPanelId(1, menuKey)}
                        className={clsx({
                          "menu__sub-open": menu.activeDropdown,
                        })}
                      >
                        {menu.subMenu.map((subMenu, subMenuKey) => (
                          <li key={subMenuKey}>
                            {subMenu.subMenu ? (
                              <button
                              type="button"
                              className={clsx([
                                subMenu.active ? "menu menu--active" : "menu",
                              ])}
                              aria-expanded={Boolean(subMenu.activeDropdown)}
                              aria-controls={menuPanelId(2, subMenuKey)}
                              onClick={(event) => {
                                event.preventDefault();
                                linkTo(subMenu, navigate, setActiveMobileMenu);
                                setFormattedMenu([...formattedMenu]);
                              }}
                            >
                              <div className="menu__icon">
                                <Lucide icon={subMenu.icon} />
                              </div>
                              <div className="menu__title">
                                {subMenu.title}
                                {subMenu.subMenu && (
                                  <div
                                    className={clsx([
                                      "menu__sub-icon",
                                      subMenu.activeDropdown &&
                                        "transform rotate-180",
                                    ])}
                                  >
                                    <Lucide icon="ChevronDown" />
                                  </div>
                                )}
                              </div>
                              </button>
                            ) : (
                            <a
                              href={subMenu.pathname}
                              className={clsx([
                                subMenu.active ? "menu menu--active" : "menu",
                              ])}
                              onClick={(event) => {
                                event.preventDefault();
                                linkTo(subMenu, navigate, setActiveMobileMenu);
                                setFormattedMenu([...formattedMenu]);
                              }}
                            >
                              <div className="menu__icon">
                                <Lucide icon={subMenu.icon} />
                              </div>
                              <div className="menu__title">
                                {subMenu.title}
                              </div>
                            </a>
                            )}
                            {/* BEGIN: Third Child */}
                            {subMenu.subMenu && (
                              <Transition
                                in={subMenu.activeDropdown}
                                onEnter={enter}
                                onExit={leave}
                                timeout={300}
                              >
                                <ul
                                  id={menuPanelId(2, subMenuKey)}
                                  className={clsx({
                                    "menu__sub-open": subMenu.activeDropdown,
                                  })}
                                >
                                  {subMenu.subMenu.map(
                                    (lastSubMenu, lastSubMenuKey) => (
                                      <li key={lastSubMenuKey}>
                                        <a
                                          href={lastSubMenu.subMenu ? undefined : lastSubMenu.pathname}
                                          className={clsx([
                                            lastSubMenu.active
                                              ? "menu menu--active"
                                              : "menu",
                                          ])}
                                          onClick={(event) => {
                                            event.preventDefault();
                                            linkTo(
                                              lastSubMenu,
                                              navigate,
                                              setActiveMobileMenu
                                            );
                                            setFormattedMenu([
                                              ...formattedMenu,
                                            ]);
                                          }}
                                        >
                                          <div className="menu__icon">
                                            <Lucide icon={lastSubMenu.icon} />
                                          </div>
                                          <div className="menu__title">
                                            {lastSubMenu.title}
                                          </div>
                                        </a>
                                      </li>
                                    )
                                  )}
                                </ul>
                              </Transition>
                            )}
                            {/* END: Third Child */}
                          </li>
                        ))}
                      </ul>
                    </Transition>
                  )}
                  {/* END: Second Child */}
                </li>
              )
            )}
            {/* END: First Child */}
          </ul>
        </div>
      </div>
      {/* END: Mobile Menu */}
    </>
  );
}

export default Main;
