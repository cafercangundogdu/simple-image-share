const Message = require('./message');

class SessionManager {
  constructor() {
    this._clients = new Map()
    this.totalConnectedClientCount = 0
  }

  get clients() {
    return [...this._clients.values()]
  }

  get serializedClients() {
    return this.clients.map(client => client.serialize())
  }

  getFilteredClients(...filteredClientIds) {
    return this.clients.filter(client => !filteredClientIds.includes(client.id))
  }

  getSerializedClients(...filteredClientIds) {
    return this.getFilteredClients(...filteredClientIds).map(client => client.serialize())
  }

  get activeClientCount() {
    return this._clients.size
  }

  getClientById(clientId) {
    return this._clients.get(clientId)
  }

  addClient(client) {
    this._clients.set(client.id, client)
    this.totalConnectedClientCount++
  }

  removeClient(clientId) {
    this._clients.delete(clientId)
  }

  generateClientName() {
    return `Client ${this.totalConnectedClientCount+1}`
  }

  sendMessage(message) {
    const targetClient = this.getClientById(message.toId)
    targetClient.socket.send(message.serialize())
  }

  broadcastMessage(messageType, messageDataCallback, ...filteredClientIds) {
    this.getFilteredClients(...filteredClientIds)
      .forEach(client =>
        this.sendMessage(new Message(messageType, messageDataCallback(client), 0, client.id))
      )
  }
}

module.exports = SessionManager
