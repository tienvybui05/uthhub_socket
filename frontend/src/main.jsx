import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import Global from "./styles/Global/Global.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Global>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Global>
  </StrictMode>
);
