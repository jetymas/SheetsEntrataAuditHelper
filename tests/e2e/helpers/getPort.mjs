import net from 'net';

export default function getPort(start = 0) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen({ port: start }, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}
