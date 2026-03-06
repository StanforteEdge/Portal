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

const CHUNK_RELOAD_KEY = "__chunk_reload_once__";
const shouldForceReloadOnChunkError = (message: string) => {
  const text = String(message || "").toLowerCase();
  return (
    text.includes("failed to fetch dynamically imported module") ||
    text.includes("dynamically imported module") ||
    text.includes("chunkloaderror") ||
    text.includes("loading css chunk")
  );
};

window.addEventListener("unhandledrejection", (event) => {
  const reasonText = String((event as PromiseRejectionEvent)?.reason || "");
  if (!shouldForceReloadOnChunkError(reasonText)) return;

  if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1") {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    return;
  }
  sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
  window.location.reload();
});

window.addEventListener("error", (event) => {
  const message = String(event.message || "");
  if (!shouldForceReloadOnChunkError(message)) return;

  if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1") {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    return;
  }
  sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
  window.location.reload();
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <BrowserRouter>
    <Provider store={store}>
      <Router />
    </Provider>
    <ScrollToTop />
    <AppVersion />
  </BrowserRouter>
);
