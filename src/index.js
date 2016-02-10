import Server from './Server'

const server = new Server();

module.exports.create = server.createPhantom.bind(server);