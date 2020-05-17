/* cf.
https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
*/

const RETRY_INTERVAL = 1000;

class GameSocket {
	constructor (game) {
		this.state = {game: game};
		this.setup();
	}

	get game () { return this.state.game }

	setup () {
		this.host = window.location.host.replace(/:\d+$/, '');
		this.path = this.game.state.room || this.host.pathname;
		console.log('Trying to establish websocket connection');
		this.ws = new WebSocket(`ws://${this.host}:8000${this.path}`);
		this.addCallbacks();
	}

	addCallbacks () {
		let self = this;
		let ws = this.ws;
		/* Connection callback */
		this.ws.addEventListener('open', () => {
			console.log('WebSocket opened');
			if (self.timeout) clearTimeout(self.timeout);
		});
		/* Message callback */
		this.ws.addEventListener('message', this.receive.bind(this));
		/* Closed callback */
		this.ws.addEventListener('close', () => {
			console.log(`WebSocket closed. Retrying in ${RETRY_INTERVAL}`);
			delete self.ws;
			self.timeout = setTimeout(self.setup.bind(self), RETRY_INTERVAL);
		});
	}

	/* Send message to server*/
	send (data) { this.ws ? this.ws.send(JSON.stringify(data)) : console.error('no websock') }
	/* Receive message from server */
	receive (evt) {
		let data = JSON.parse(evt.data);
		if (data.typ) this[data.typ](data);
	}

	/* Move cursor */
	cur (opts) { this.game.updateCur(opts.x, opts.y, opts.name, true) }
	sendCur (x, y, name) { this.send({typ: 'cur', x: x, y: y, name: name}) }
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
	ref (opts) {

	}
	sendRef () {}
	/* Request refresh */
	req (opts) {

	}
	sendReq () {}
}

export default GameSocket;
