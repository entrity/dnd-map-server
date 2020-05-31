/* cf.
https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
*/

const RETRY_INTERVAL = 2500;

const K_SOCKET = 'gameWebSocket';
const K_INTERVAL = 'gameWebSocketInterval';

const socketRoom = () => ( window[K_SOCKET].url.match(/[^/]*$/)[0] )

class GameSocket {
	constructor (game) {
		this.state = {game: game};
		this.setup();
	}

	get game () { return this.state.game }

	setup () {
		let host = window.location.host.replace(/:\d+$/, '');
		let room = this.game.room || host.pathname;
		console.log('Trying to establish websocket connection', host, room);
		if (window[K_INTERVAL]) clearInterval(window[K_INTERVAL]);
		if (window[K_SOCKET]) {
			let socket = window[K_SOCKET];
			console.log('Closing extant websocket', socketRoom());
			delete window[K_SOCKET]; /* Delete, then close, s.t. cb doesn't re-open it */
			socket.close();
		}
		window[K_SOCKET] = new WebSocket(`ws://${host}:8000/${room}`);
		this.addCallbacks();
	}

	addCallbacks () {
		let ws = window[K_SOCKET];
		/* Connection callback */
		ws.addEventListener('open', () => {
			console.log('WebSocket opened', socketRoom());
			if (window[K_INTERVAL]) clearInterval(window[K_INTERVAL]);
			if (!this.game.isHost) this.sendReq();
		});
		/* Message callback */
		ws.addEventListener('message', this.receive.bind(this));
		/* Closed callback */
		let setup = this.setup.bind(this);
		ws.addEventListener('close', () => {
			console.error(`WebSocket closed. Will retry in ${RETRY_INTERVAL}`);
			window[K_INTERVAL] = setInterval(setup, RETRY_INTERVAL);
		});
	}

	/* Send message to server*/
	send (data) {
		if (window[K_SOCKET] && window[K_SOCKET].readyState === WebSocket.OPEN)
			window[K_SOCKET].send(JSON.stringify(data));
		else
			console.error('no websock');
	}
	/* Receive message from server */
	receive (evt) {
		let data = JSON.parse(evt.data);
		if (data.typ) this[data.typ](data, evt.data);
	}

	/* Change username */
	chn (opts) { this.game.nameChange(opts.old, opts.new) }
	sendChn (oldName, newName) { this.send({typ: 'chn', old: oldName, new: newName}) }
	/* Move cursor */
	cur (opts) {
		if (opts.name !== this.game.state.username)
			this.game.updateCur(opts.x, opts.y, opts.name);
	}
	sendCur (x, y) { this.send({typ: 'cur', x: x, y: y, name: this.game.state.username}) }
	/* Erase fog */
	fog (opts) { this.game.fogErase(opts.x, opts.y, opts.rad, true) }
	sendFog (x, y, radius) { this.send({typ: 'fog', x: x, y: y, rad: radius}) }
	/* Reset fog */
	fre () { this.game.fogReset({noEmit: true}) }
	sendFre () { this.send({typ: 'fre'}) }
	/* Update token */
	tok (opts) {
		let {idx, typ, ...attrs} = opts;
		this.game.updateToken(attrs, opts.idx, true);
	}
	sendTok (idx, token) { this.send(Object.assign({typ: 'tok', idx: idx}, token)) }
	/* Full refresh */
	ref (opts, raw) {
		let {from, typ, to, ...data} = opts;
		if (from === this.game.state.username) return null;
		if (to && to !== this.game.state.username) return null;
		let json = JSON.stringify(opts);
		console.log(typ, from, to, data)
		if (this.game.state.lastRefresh === json) return null;
		this.game.fromJson(json);
	}
	/* Push refresh */
	sendRef (additionalAttrs) {
		let attrs = Object.assign({typ: 'ref', from: this.game.state.username}, additionalAttrs);
		let json = this.game.toJson(attrs);
		this.send(JSON.parse(json));
	}
	/* Receive request refresh. Push refresh in response */
	req (opts) { if (this.game.isHost) this.sendRef({to: opts.from}) }
	/* Send refresh request */
	sendReq () { this.send({typ: 'req', from: this.game.state.username}) }
}

export default GameSocket;
