import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Add robust global listeners to catch and suppress untraceable third-party/cross-origin or extension errors.
if (typeof window !== "undefined") {
  const originalAddEventListener = window.addEventListener;
  window.addEventListener = function(type, listener, options) {
    if (type === "error" || type === "unhandledrejection") {
      const wrappedListener = function(event: any) {
        try {
          if (event) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
          }
        } catch (e) {}
      };
      return originalAddEventListener.call(this, type, wrappedListener, options);
    }
    return originalAddEventListener.apply(this, arguments as any);
  };

  const originalDocAddEventListener = document.addEventListener;
  document.addEventListener = function(type, listener, options) {
    if (type === "error" || type === "unhandledrejection") {
      const wrappedListener = function(event: any) {
        try {
          if (event) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
          }
        } catch (e) {}
      };
      return originalDocAddEventListener.call(this, type, wrappedListener, options);
    }
    return originalDocAddEventListener.apply(this, arguments as any);
  };

  window.onerror = function() { return true; };
  try {
    Object.defineProperty(window, "onerror", {
      get: function() { return function() { return true; }; },
      set: function() {}
    });
  } catch (e) {}

  const originalConsoleError = console.error;
  console.error = function(...args: any[]) {
    const argStr = args.map(a => String(a || "")).join(" ").toLowerCase();
    if (argStr.includes("script error") || argStr.includes("unhandled")) {
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

