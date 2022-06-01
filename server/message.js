const generateUUID = require("./utils");

class Message {
  constructor(type, messageData, fromId, toId, isReverted = false) {
    this.id = generateUUID();
    this.type = type;
    this.messageData = messageData;
    this.fromId = fromId;
    this.toId = toId;
    this.isReverted = isReverted;
  }

  serialize() {
    return JSON.stringify({
      id: this.id,
      type: this.type,
      messageData: this.messageData,
      from: this.fromId,
      isReverted: this.isReverted,
    });
  }

  static from(messageString, fromId) {
    const msg = JSON.parse(messageString);
    return new Message(msg.type, msg.messageData, fromId, msg.toId);
  }
}

module.exports = Message;
