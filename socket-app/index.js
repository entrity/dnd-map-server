/* cf.
https://github.com/websockets/ws/tree/master/examples
https://github.com/theturtle32/WebSocket-Node/blob/master/docs/index.md
*/

const webSocketsServerPort = 8000;
const webSocketServer = require('ws').Server;
const http = require('http');
const httpServer = http.createServer();
const ws = new webSocketServer({
  server: httpServer,
  autoAcceptConnections: true,
});

ws.on('connection', function (connection, request) {
  connection.on('message', onMessage);
  connection.room = request.url;
});


function isExpired (obj) {
  if (!obj) return true;
  let then = obj.createdAt;
  if (!then) return true;
  let now = new Date();
  return now - then > 1000 * 60 * 60 * 24;
}

function onMessage (msg) {
  /* Forward message to all other clients (for this room) */
  if (JSON.parse(msg).typ) {
    ws.clients.forEach(conn => {
      if (conn.room !== this.room) return;
      if (conn !== this) { conn.send(msg) }
    });
  /* Assign key-val to this connection (e.g. isHost) */
  } else {
    Object.assign(this, msg);
  }
}

console.log('starting...')
httpServer.listen(webSocketsServerPort);
