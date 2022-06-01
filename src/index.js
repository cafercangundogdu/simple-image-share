import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { SocketContext, socket } from "./socket";

ReactDOM.render(
  <SocketContext.Provider value={socket}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </SocketContext.Provider>,
  document.getElementById("root")
);
