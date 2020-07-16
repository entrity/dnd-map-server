/* cf.
https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
*/

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
    this.guid = URL.createObjectURL(new Blob()).replace(/.*\//, '');
		console.log('Trying to establish websocket connection', host, room);
		if (window[K_INTERVAL]) clearInterval(window[K_INTERVAL]);
		if (window[K_SOCKET]) {
			let socket = window[K_SOCKET];
			console.log('Closing extant websocket', socketRoom());
			delete window[K_SOCKET]; /* Delete, then close, s.t. cb doesn't re-open it */
			socket.close();
		}
		window[K_SOCKET] = new WebSocket(`ws://${host}:8000/${room}?guid=${this.guid}`);
		this.addCallbacks();
	}

	addCallbacks () {
		let ws = window[K_SOCKET];
		/* Connection callback */
		ws.addEventListener('open', (a,b,c) => {
			console.log('WebSocket opened', socketRoom());
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
		if (window[K_SOCKET] && window[K_SOCKET].readyState === WebSocket.OPEN)
			window[K_SOCKET].send(JSON.stringify(data));
		else
			console.error('no websocket');
	}

	/* Receive message from server */
	receive (evt) {
		let data = JSON.parse(evt.data);
    if (data.from === this.guid) return;
		switch (data.t) {
      case 'c': /* cursor push */
        if (data.u !== this.game.state.username)
          this.game.updateCursors(data.x, data.y, data.u, data.from);
        break;
      case 'f': /* fog erasure */
        this.game.overlayRef.current.fogErase(data.x, data.y, data.r, data.r2, true);
        break;
      case 'fogReset': /* fog reset */
        this.game.fogRef.current.fill();
        break;
      case 't': /* token */
        this.game.updateTokenByIndex(data.i, data.a, true);
        break;
      case 'ts': /* all tokens */
        this.game.setState({tokens: data.tokens});
        break;
      case 'm': /* map id */
        const map = this.game.state.maps[data.i];
        this.game.loadMap(map);
        break;
      case 'refresh': /* refresh from host */
        let {from, typ, to, ...state} = data;
        if (to && to !== this.game.state.username) return;
        this.game.fromJson(JSON.stringify(state));
        break;
      case 'refreshRequest': /* refresh request from player */
        if (this.game.isHost) this.pushRefresh({to: data.from});
        break;
      default:
        console.error(`Unrecognized websocket message type: ${data.t}`);
    }
  }

  /* Push cursor position */
  pushCursor (x, y) { this.send({t: 'c', x: x, y: y, u: this.game.state.username}) }
  /* Push fog erasure */
  pushFogErase (x, y, r, r2) { this.send({t: 'f', x: x, y: y, r: r, r2: r2}) }
  /* Push map id */
  pushMapId (mapId) { this.send({t: 'm', i: mapId}) }
  /* Push refresh */
  pushRefresh (additionalAttrs) {
    let attrs = Object.assign({t: 'refresh'}, additionalAttrs);
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
