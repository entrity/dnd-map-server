/* cf.
https://github.com/websockets/ws/tree/master/examples
https://github.com/theturtle32/WebSocket-Node/blob/master/docs/index.md
*/

const fs = require('fs');
const webSocketsServerPort = 8000;
const webSocketServer = require('ws').Server;
const http = require('http');
const httpServer = http.createServer();
const ws = new webSocketServer({
  server: httpServer,
  autoAcceptConnections: true,
});

fs.writeFile('pid.tmp', process.pid, err => {
	if (err) return console.log(err);
	console.log(`process id ${process.pid}`);
});

ws.on('connection', function (connection, request) {
  connection.on('message', onMessage);
  let [room, params] = request.url.split('?');
  connection.room = room;
  params = new URLSearchParams(params);
  connection.guid = params.get('guid');
  console.log(connection.room, 'id', connection.guid) /*todo*/
});


function isExpired (obj) {
  if (!obj) return true;
  let then = obj.createdAt;
  if (!then) return true;
  let now = new Date();
  return now - then > 1000 * 60 * 60 * 24;
}

function onMessage (msg) {
  const data = JSON.parse(msg);
  /* Forward message to all other clients (for this room) */
  if (data.t) {
    data.from = this.guid;
    ws.clients.forEach(conn => {
      if (conn.room !== this.room) return;
      if (data.to && data.to !== conn.guid) return;
      if (conn !== this) { conn.send(JSON.stringify(data)) }
    });
  /* Assign key-val to this connection (e.g. isHost) */
  } else {
    Object.assign(this, msg);
  }
}

console.log('starting...')
httpServer.listen(webSocketsServerPort);
