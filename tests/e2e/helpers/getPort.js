// Utility to get a free port for E2E tests
const net = require('net');

module.exports = function getPort(start = 8080) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen({ port: start }, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
};
