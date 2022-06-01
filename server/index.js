#!/usr/bin/env node

const httpServer = require("http").createServer();
const webSocketServer = require("websocket").server;
const SessionManager = require("./session-manager");
const Client = require("./client");
const Message = require("./message");

httpServer.listen(process.env.PORT || "3003");
const wsServer = new webSocketServer({
  httpServer,
  maxReceivedFrameSize: 131072,
  maxReceivedMessageSize: 10 * 1024 * 1024, // 10 MB
  autoAcceptConnections: false,
});

const sessionManager = new SessionManager();

wsServer.on("request", (request) => {
  const connection = request.accept(null, request.origin);
  const client = Client.createClient(sessionManager.generateClientName(), connection);
  sessionManager.addClient(client);

  console.log(
    `${new Date()} New Client connected as ${client.id} name: ${client.name}, total client count: ${
      sessionManager.totalConnectedClientCount
    }  -  active client count: ${sessionManager.activeClientCount}`
  );

  connection.on("message", (wsMsg) => {
    const message = Message.from(wsMsg.utf8Data, client.id);
    const revertMessage = new Message(message.type, message.messageData, message.toId, message.fromId, true); // because of id
    revertMessage.id = message.id;
    sessionManager.sendMessage(revertMessage);
    sessionManager.sendMessage(message);
  });

  connection.on("close", (_) => {
    sessionManager.removeClient(client.id);
    console.log(
      `${new Date()} New Client *disconnected as ${client.id} name: ${client.name}, total client count: ${
        sessionManager.totalConnectedClientCount
      }  -  active client count: ${sessionManager.activeClientCount}`
    );
    sessionManager.broadcastMessage("client-disconnected", () => client.serialize());
  });

  sessionManager.sendMessage(new Message("owner", client.serialize(), 0, client.id));
  sessionManager.sendMessage(new Message("clients", sessionManager.getSerializedClients(client.id), 0, client.id));
  sessionManager.broadcastMessage("client-connected", (_) => client.serialize(), client.id);
});
