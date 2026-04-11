import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "@/shared";
import App from "./App";
import { AuthProvider } from "@/shared/context/AuthProvider";
import "./styles.css";
import faviconUrl from "../../shared/assets/brand/stanforte-icon-white.png";

const faviconLink =
  document.querySelector<HTMLLinkElement>("link[rel='icon']") ||
  document.querySelector<HTMLLinkElement>("link[rel='shortcut icon']");

if (faviconLink) {
  faviconLink.href = faviconUrl;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
