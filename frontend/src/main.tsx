import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <div className="app-shell">
        <App />
      </div>
    </React.StrictMode>
  );
} else {
  // Helpful trace if the root element is missing for some reason.
  // Visible in the browser console.
  // eslint-disable-next-line no-console
  console.error("[wedge] Root element #root not found in index.html");
}
