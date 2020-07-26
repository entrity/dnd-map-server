/* cf.
https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
*/
import guid from './Guid.jsx';

const RETRY_INTERVAL = 2500;

const K_SOCKET = 'gameWebSocket';
const K_INTERVAL = 'gameWebSocketInterval';

const socketRoom = () => ( window[K_SOCKET].url.match(/[^/]*$/)[0] )

class Gamesocket {
	constructor (game) {
		Object.defineProperty(this, 'game', {value: game, writable: false});
		this.setup();
	}

	setup () {
		let host = window.location.host.replace(/:\d+$/, '');
		let room = this.game.room;
		const protocol = /https/.test(window.location.protocol) ? 'wss' : 'ws';
		this.guid = guid();
		console.log('Trying to establish websocket connection', host, room);
		if (window[K_INTERVAL]) clearInterval(window[K_INTERVAL]);
		if (window[K_SOCKET]) {
			let socket = window[K_SOCKET];
			console.log('Closing extant websocket', socketRoom());
			delete window[K_SOCKET]; /* Delete, then close, s.t. cb doesn't re-open it */
			socket.close();
		}
		window[K_SOCKET] = new WebSocket(`${protocol}://${host}:8000/${room}?guid=${this.guid}`);
		this.addCallbacks();
	}

	addCallbacks () {
		let ws = window[K_SOCKET];
		/* Connection callback */
		ws.addEventListener('open', (a,b,c) => {
			console.log(`WebSocket opened (from ${this.guid})`, socketRoom());
			// debugger
			if (window[K_INTERVAL]) clearInterval(window[K_INTERVAL]);
			if (!this.game.isHost) this.requestRefresh();
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
		data.from = this.guid;
		if (window[K_SOCKET] && window[K_SOCKET].readyState === WebSocket.OPEN)
			window[K_SOCKET].send(JSON.stringify(data));
		else
			console.error('no websocket');
	}

	/* Receive message from server */
	receive (evt) {
		let data = JSON.parse(evt.data);
		if (data.from === this.guid) return; /* ignore messages sent by self */
		switch (data.t) {
			case 'c': /* cursor push */
				if (data.u !== this.game.state.username)
					this.game.updateCursors(data.x, data.y, data.u, data.from);
				break;
			case 'd': /* draw */
				this.game.overlayRef.current.draw(data.x, data.y, data, true);
				break;
			case 'e': /* erase */
				this.game.overlayRef.current.erase(data.x, data.y, data.r, true);
				break;
			case 'f': /* fog erasure */
				this.game.overlayRef.current.fogErase(data.x, data.y, data.r, data.r2, true);
				break;
			case 'fogReset': /* fog reset */
				this.game.fogRef.current.fill();
				break;
			case 't': /* token */
				const local = this.game.state.tokens[data.i];
				const token = Object.assign(local, data.a); /* Keep and `$` attrs like `$selected` */
				this.game.updateTokenByIndex(data.i, token, true);
				break;
			case 'ts': /* all tokens */
				const localTokensMap = this.game.state.tokens.reduce((out, tok) => {
					out[tok.guid] = tok;
					return out;
				}, {});
				const tokens = data.tokens.map(tok => Object.assign({}, localTokensMap[tok.guid], tok));
				this.game.setState({tokens: tokens});
				break;
			case 'm': /* map id */
				const map = this.game.state.maps[data.i];
				this.game.loadMap(map);
				break;
			case 'refresh': /* refresh from host */
				let {from, t, to, ...state} = data;
				console.log(`Receive refresh of generation`, state.gen, 'from', from, 'to', to);
				if (to && to !== this.guid) {
					console.log(`Will not apply refresh from ${to} (self)`);
					return;
				}
				if ((this.game.state.gen||0) >= (state.gen||0)) {
					console.log(`Will not apply refresh of generation ${state.gen} against current state of generation ${this.game.state.gen}`);
					return;
				}
				this.game.fromJson(JSON.stringify(state));
				break;
			case 'refreshRequest': /* refresh request from player */
				if (this.game.isHost) {
					console.log('Got refresh request', data.from);
					this.pushRefresh({to: data.from});
				}
				break;
			default:
				console.error(`Unrecognized websocket message type: ${data.t}`);
		}
	}

	pushCursor (x, y) { this.send({t: 'c', x: x, y: y, u: this.game.state.username}) }
	pushDraw (data) { this.send(Object.assign({t: 'd'}, data)) }
	pushErase (x, y, r) { this.send({t: 'e', x: x, y: y, r: r}) }
	pushFogErase (x, y, r, r2) { this.send({t: 'f', x: x, y: y, r: r, r2: r2}) }
	pushMapId (mapId) { this.send({t: 'm', i: mapId}) }
	/* Push refresh */
	pushRefresh (additionalAttrs) {
		const attrs = Object.assign({t: 'refresh'}, additionalAttrs);
		let json = this.game.toJson(attrs);
		this.send(JSON.parse(json));
	}
	/* Push token update */
	pushToken (index, token) {
		const tokenCopy = Object.assign({}, token);
		this.game.scrubObject(tokenCopy);
		const data = {t: 't', i: index, a: tokenCopy};
		this.send(data);
	}
	/* Push replacement of all tokens */
	pushTokens (tokens) {
		const tokensCopy = JSON.parse(JSON.stringify(tokens));
		const data = { t: 'ts', tokens: tokensCopy };
		data.tokens.forEach(token => this.game.scrubObject(token));
		this.send(data);
	}
	/* Send refresh request */
	requestRefresh () { this.send({t: 'refreshRequest'}) }
}
export default Gamesocket;
