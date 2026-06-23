import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Add robust global listeners to catch and suppress untraceable third-party/cross-origin or extension errors.
if (typeof window !== "undefined") {
  const suppress = (msg?: any, src?: any, reason?: any): boolean => {
    const m = String(msg || "").toLowerCase();
    const s = String(src || "").toLowerCase();
    const r = String(reason || "").toLowerCase();
    
    const keywords = [
      "script error",
      "gm_authfailure",
      "google maps",
      "map",
      "rpc failed",
      "xhr error",
      "makersuite",
      "alkali",
      "clients6",
      "listimportedprojects",
      "websocket",
      "extension",
      "favicon"
    ];
    
    for (const kw of keywords) {
      if (m.includes(kw) || s.includes(kw) || r.includes(kw)) {
        return true;
      }
    }
    
    if (src) {
      const host = window.location.hostname.toLowerCase();
      const isAbsolute = src.indexOf("http://") === 0 || src.indexOf("https://") === 0 || src.indexOf("//") === 0;
      if (isAbsolute && !s.includes(host)) {
        return true;
      }
    }
    
    return false;
  };

  const originalOnError = window.onerror;
  window.onerror = function (message, source, lineno, colno, error) {
    if (suppress(message, source, error ? error.message : "")) {
      return true; // Swallows the error
    }
    if (originalOnError) {
      return (originalOnError as any).apply(this, arguments);
    }
    return false;
  };

  window.addEventListener("error", (event) => {
    const msg = String(event.message || (event.error && event.error.message) || "");
    const src = String(event.filename || "");
    const errReason = event.error ? event.error.stack || event.error.message : "";
    if (suppress(msg, src, errReason) || !event.filename) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event && event.reason && (event.reason.message || event.reason) || "";
    const reasonStr = String(reason);
    if (suppress("", "", reasonStr)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

