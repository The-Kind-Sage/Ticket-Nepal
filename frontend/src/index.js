import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";      // optional global styles
import App from "./App";

// If you plan to use routing later, uncomment the next two lines:
// import { BrowserRouter } from "react-router-dom";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    {/* Wrap with <BrowserRouter> only if using react-router */}
    {/* <BrowserRouter> */}
      <App />
    {/* </BrowserRouter> */}
  </React.StrictMode>
);
