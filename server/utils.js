const { v4: uuid } = require("uuid");

const generateUUID = () => uuid();

module.exports = generateUUID;
