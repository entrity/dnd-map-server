/* cf.
https://github.com/websockets/ws/tree/master/examples
https://github.com/theturtle32/WebSocket-Node/blob/master/docs/index.md
https://blog.zackad.dev/en/2017/08/19/create-websocket-with-nodejs.html
*/

const PRIVATE_KEY_FILE = 'privkey.pem';
const SSl_CERTIFICATE_FILE = 'fullchain.pem';
const SOCKET_SERVER_PORT = 8000;

const fs = require('fs');

/* Write pid file*/
fs.writeFile('pid.tmp', process.pid, err => {
	if (err) return console.log(err);
	console.log(`process id ${process.pid}`);
});

var httpServer;

/* Check SSL files & create HTTPS server */
if (fs.existsSync(PRIVATE_KEY_FILE) && fs.existsSync(SSl_CERTIFICATE_FILE)) {
	const privateKey = fs.readFileSync(PRIVATE_KEY_FILE, 'utf-8');
	const certificate = fs.readFileSync(SSl_CERTIFICATE_FILE, 'utf-8');
	const https = require('https');
	httpServer = https.createServer({key: privateKey, cert: certificate});
}
/* Create HTTP server*/
else {
	const http = require('http');
	httpServer = http.createServer();
}

const webSocketServer = require('ws').Server;
const ws = new webSocketServer({
  server: httpServer,
  autoAcceptConnections: true,
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
  return now - then > 1000 * 60 * 60 * 3;
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
httpServer.listen(SOCKET_SERVER_PORT);
