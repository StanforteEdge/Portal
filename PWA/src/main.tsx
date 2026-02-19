import ScrollToTop from "@/components/Base/ScrollToTop";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./stores/store";
import Router from "./router";
import "./assets/css/app.css";
import AppVersion from "@/components/AppVersion";

document.documentElement.setAttribute("class", "theme-2");
document.documentElement.classList.remove("dark");
localStorage.setItem("colorScheme", "theme-2");
localStorage.setItem("theme", "tinker");
localStorage.setItem("layout", "side-menu");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <BrowserRouter>
    <Provider store={store}>
      <Router />
    </Provider>
    <ScrollToTop />
    <AppVersion />
  </BrowserRouter>
);
