import "@/assets/css/themes/rubick/side-nav.css";
import { Transition } from "react-transition-group";
import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { selectSideMenu } from "@/stores/menuSlice";
import { useAppSelector } from "@/stores/hooks";
import {
  FormattedMenu,
  linkTo,
  nestedMenu,
  enter,
  leave,
  forceActiveMenuContext,
  forceActiveMenu,
} from "./side-menu";
import Tippy from "@/components/Base/Tippy";
import Lucide from "@/components/Base/Lucide";
import { BRAND_LOGO_ICON_WHITE } from "@/constants/branding";
import clsx from "clsx";
import TopBar from "@/components/Themes/Rubick/TopBar";
import MobileMenu from "@/components/MobileMenu";

function Main() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formattedMenu, setFormattedMenu] = useState<
    Array<FormattedMenu | "divider">
  >([]);
  const menuStore = useAppSelector(selectSideMenu);
  const menu = () => nestedMenu(menuStore, location);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    setFormattedMenu(menu());
    const onResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [location.pathname]);

  return (
    <forceActiveMenuContext.Provider
      value={{
        forceActiveMenu: (pathname) => {
          forceActiveMenu(location, pathname);
          setFormattedMenu(menu());
        },
      }}
    >
      <div
        className={clsx([
          "rubick px-5 sm:px-8 py-5",
          "before:content-[''] before:bg-gradient-to-b before:from-theme-1 before:to-theme-2 dark:before:from-darkmode-800 dark:before:to-darkmode-800 before:fixed before:inset-0 before:z-[-1]",
        ])}
      >
        <MobileMenu />
        <div className="flex mt-[4.7rem] md:mt-0">
          {/* BEGIN: Side Menu */}
          <nav className="side-nav hidden w-[80px] overflow-x-hidden pb-16 pr-5 md:block xl:w-[230px]">
            <Link to="/" className="flex items-center pt-4 pl-5 intro-x">
                <img
                  alt="Stanforte Edge"
                  className="w-6"
                  src={BRAND_LOGO_ICON_WHITE}
                />
              <span className="hidden ml-3 text-lg text-white xl:block">
                Stanforte Edge
              </span>
            </Link>
            <div className="my-6 side-nav__divider"></div>
            <ul>
              {/* BEGIN: First Child */}
              {formattedMenu.map((menu, menuKey) =>
                menu == "divider" ? (
                  <li className="my-6 side-nav__divider" key={menuKey}></li>
                ) : (
                  <li key={menuKey}>
                    {menu.subMenu ? (
                      <Tippy
                        as="a"
                        href="javascript:void(0)"
                        content={menu.title}
                        options={{
                          placement: "right",
                        }}
                        disable={windowWidth > 1260}
                        onClick={(event: React.MouseEvent) => {
                          event.preventDefault();
                          linkTo(menu, navigate);
                          setFormattedMenu([...formattedMenu]);
                        }}
                        aria-label={menu.title}
                        title={menu.title}
                        className={clsx("side-menu", {
                          "side-menu--active": menu.active,
                          "side-menu--open": Boolean(menu.activeDropdown),
                        })}
                      >
                        <div className="side-menu__icon">
                          <Lucide icon={menu.icon} />
                        </div>
                        <div className="side-menu__title">
                          {menu.title}
                          <div
                            className={clsx([
                              "side-menu__sub-icon",
                              { "transform rotate-180": menu.activeDropdown },
                            ])}
                          >
                            <Lucide icon="ChevronDown" />
                          </div>
                        </div>
                      </Tippy>
                    ) : (
                      <Tippy
                        as="a"
                        content={menu.title}
                        options={{
                          placement: "right",
                        }}
                        disable={windowWidth > 1260}
                        href={menu.pathname}
                        onClick={(event: React.MouseEvent) => {
                          event.preventDefault();
                          linkTo(menu, navigate);
                          setFormattedMenu([...formattedMenu]);
                        }}
                        aria-label={menu.title}
                        title={menu.title}
                        className={clsx([
                          menu.active ? "side-menu side-menu--active" : "side-menu",
                        ])}
                      >
                        <div className="side-menu__icon">
                          <Lucide icon={menu.icon} />
                        </div>
                        <div className="side-menu__title">{menu.title}</div>
                      </Tippy>
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
                          className={clsx({
                            "side-menu__sub-open": menu.activeDropdown,
                          })}
                        >
                          {menu.subMenu.map((subMenu, subMenuKey) => (
                            <li key={subMenuKey}>
                              {subMenu.subMenu ? (
                                <Tippy
                                  as="a"
                                  href="javascript:void(0)"
                                  content={subMenu.title}
                                  options={{
                                    placement: "right",
                                  }}
                                  disable={windowWidth > 1260}
                                  onClick={(event: React.MouseEvent) => {
                                    event.preventDefault();
                                    linkTo(subMenu, navigate);
                                    setFormattedMenu([...formattedMenu]);
                                  }}
                                  aria-label={subMenu.title}
                                  title={subMenu.title}
                                  className={clsx("side-menu", {
                                    "side-menu--active": subMenu.active,
                                    "side-menu--open": Boolean(subMenu.activeDropdown),
                                  })}
                                >
                                  <div className="side-menu__icon">
                                    <Lucide icon={subMenu.icon} />
                                  </div>
                                  <div className="side-menu__title">
                                    {subMenu.title}
                                    <div
                                      className={clsx([
                                        "side-menu__sub-icon",
                                        {
                                          "transform rotate-180":
                                            subMenu.activeDropdown,
                                        },
                                      ])}
                                    >
                                      <Lucide icon="ChevronDown" />
                                    </div>
                                  </div>
                                </Tippy>
                              ) : (
                                <Tippy
                                  as="a"
                                  content={subMenu.title}
                                  options={{
                                    placement: "right",
                                  }}
                                  disable={windowWidth > 1260}
                                  href={subMenu.pathname}
                                  onClick={(event: React.MouseEvent) => {
                                    event.preventDefault();
                                    linkTo(subMenu, navigate);
                                    setFormattedMenu([...formattedMenu]);
                                  }}
                                  aria-label={subMenu.title}
                                  title={subMenu.title}
                                  className={clsx([
                                    subMenu.active ? "side-menu side-menu--active" : "side-menu",
                                  ])}
                                >
                                  <div className="side-menu__icon">
                                    <Lucide icon={subMenu.icon} />
                                  </div>
                                  <div className="side-menu__title">{subMenu.title}</div>
                                </Tippy>
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
                                    className={clsx({
                                      "side-menu__sub-open":
                                        subMenu.activeDropdown,
                                    })}
                                  >
                                    {subMenu.subMenu.map(
                                      (lastSubMenu, lastSubMenuKey) => (
                                        <li key={lastSubMenuKey}>
                                          <Tippy
                                            as="a"
                                            content={lastSubMenu.title}
                                            options={{
                                              placement: "right",
                                            }}
                                            disable={windowWidth > 1260}
                                            href={lastSubMenu.pathname}
                                            onClick={(event: React.MouseEvent) => {
                                              event.preventDefault();
                                              linkTo(lastSubMenu, navigate);
                                              setFormattedMenu([...formattedMenu]);
                                            }}
                                            aria-label={lastSubMenu.title}
                                            title={lastSubMenu.title}
                                            className={clsx([
                                              lastSubMenu.active
                                                ? "side-menu side-menu--active"
                                                : "side-menu",
                                            ])}
                                          >
                                            <div className="side-menu__icon">
                                              <Lucide icon={lastSubMenu.icon} />
                                            </div>
                                            <div className="side-menu__title">
                                              {lastSubMenu.title}
                                            </div>
                                          </Tippy>
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
          </nav>
          {/* END: Side Menu */}
          {/* BEGIN: Content */}
          <div className="md:max-w-auto min-h-screen min-w-0 max-w-full flex-1 rounded-[30px] bg-slate-100 px-4 pb-10 before:block before:h-px before:w-full before:content-[''] dark:bg-darkmode-700 md:px-[22px]">
            <TopBar />
            <Outlet />
          </div>
          {/* END: Content */}
        </div>
      </div>
    </forceActiveMenuContext.Provider>
  );
}

export default Main;
