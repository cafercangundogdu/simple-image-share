import React from "react";
import { w3cwebsocket as W3CWebSocket } from "websocket";
export const socket = new W3CWebSocket(
  `${process.env.REACT_APP_API_SOCKET_HOST}:${process.env.REACT_APP_API_SOCKET_PORT}`
);
export const SocketContext = React.createContext();
