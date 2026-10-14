import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import App from "./App";
import reportWebVitals from "./reportWebVitals";

import { ThemeProvider } from "./context/ThemeContext";
import { AUTH_TOKEN_KEY, clearSession } from "./utils/auth";

const originalFetch = window.fetch.bind(window);
window.fetch = async (input, init = {}) => {
  const requestUrl = new URL(
    typeof input === "string" ? input : input.url,
    window.location.href
  );
  const apiOrigin = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const isBackendRequest =
    requestUrl.origin === new URL(apiOrigin).origin &&
    (requestUrl.pathname.startsWith("/api/") ||
      requestUrl.pathname.startsWith("/videos/") ||
      requestUrl.pathname.startsWith("/snapshots/"));

  let responseInput = input;
  let responseInit = init;
  if (isBackendRequest) {
    const headers = new Headers(
      init.headers || (typeof input !== "string" ? input.headers : undefined)
    );
    const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    if (typeof input !== "string") {
      responseInput = new Request(input, { ...init, headers });
      responseInit = undefined;
    } else {
      responseInit = { ...init, headers };
    }
  }

  const response = await originalFetch(responseInput, responseInit);
  if (
    isBackendRequest &&
    response.status === 401 &&
    requestUrl.pathname !== "/api/auth/login"
  ) {
    clearSession();
    if (window.location.pathname !== "/") window.location.assign("/");
  }
  return response;
};

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

reportWebVitals();
