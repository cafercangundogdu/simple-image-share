const generateUUID = require("./utils");

class Client {
  constructor(id, name, socket) {
    this.id = id;
    this.name = name;
    this.socket = socket;
  }

  static createClient(name, connection) {
    return new Client(generateUUID(), name, connection);
  }

  serialize() {
    return {
      id: this.id,
      name: this.name,
      photos: {},
      texts: {},
    };
  }
}

module.exports = Client;
