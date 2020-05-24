function deepCopy (argument) { return argument === undefined ? null : JSON.parse(JSON.stringify(argument)) }

class ControlsMethods {
	addControlsCallbacks () {
		window.addEventListener('keydown', this.onKeydown.bind(this));
		window.addEventListener('keypress', this.onKeypress.bind(this));
		window.addEventListener('mousedown', this.onMousedown.bind(this));
		window.addEventListener('mousemove', this.onMousemove.bind(this));
		window.addEventListener('mouseout', this.onMouseout.bind(this));
		window.addEventListener('mouseup', this.onMouseup.bind(this));
	}

	removeControlsCallbacks () {
		window.removeEventListener('keydown', this.onKeydown.bind(this));
		window.removeEventListener('keypress', this.onKeypress.bind(this));
		window.removeEventListener('mousedown', this.onMousedown.bind(this));
		window.removeEventListener('mousemove', this.onMousemove.bind(this));
		window.removeEventListener('mouseout', this.onMouseout.bind(this));
		window.removeEventListener('mouseup', this.onMouseup.bind(this));
	}

	onKeydown (evt) {
		if (this.token) {
			let token = deepCopy(this.token);
			let moveFactor = evt.shiftKey ? 40 : 10;
			switch (evt.keyCode) {
				case 27: /* escape */ this.selectToken(); return;
				case 37: /* left */ token.x -= moveFactor; break;
				case 38: /* up */ token.y -= moveFactor; break;
				case 39: /* right */ token.x += moveFactor; break;
				case 40: /* down */ token.y += moveFactor; break;
				default: return;
			}
			evt.preventDefault();
			this.updateToken(token);
		}
	}

	onKeypress (evt) {
		if (!this.isHost) return evt;
		if (evt.target.tagName === 'INPUT' && evt.target.type === 'text')
			return evt;
		function toggleSub (key) {
			let nextState = !(this.state.showHud && this.state[key]);
			this.setState({[key]: nextState, showHud: true});
		}
		switch(evt.code) {
			case 'KeyC':
				if (evt.shiftKey)
					navigator.clipboard.writeText(this.toJson());
				break;
			case 'KeyH': this.setState({showHud: !this.state.showHud}); break;
			case 'KeyG': this.setState({tool: 'fog'}); break;
			case 'KeyM': toggleSub.bind(this)('showMapsMenu'); break;
			case 'KeyT': toggleSub.bind(this)('showTokensMenu'); break;
			case 'KeyV':
				if (evt.shiftKey)
					navigator.clipboard.writeText(this.toJson());
				else
					this.setState({tool: 'move'});
				break;
			default: return
		}
	}

	onMousemove (evt, noEmit) {
		if (!this.isHost || this.state.shareCursor)
			this.state.websocket.sendCur(evt.pageX, evt.pageY, this.state.name);
		if (evt.buttons & 1) this.dragSelectedTokens(evt);
		this.setState({cursorX: evt.pageX, cursorY: evt.pageY});
		if (noEmit) evt.preventDefault();
	}

	onMousedown (evt) {
		if (evt.buttons & 1) {
			this.mouseDownX = evt.pageX;
			this.mouseDownY = evt.pageY;
		}
		if (!evt.target.classList.contains('token'))
			this.selectToken(-1, evt);
	}

	onMouseout () {

	}

	onMouseup () {

	}
}

export default ControlsMethods;
