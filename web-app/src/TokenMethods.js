import { deepCopy } from './Helper.js';

class TokenMethods {
	dragSelectedTokens (evt) {
		if (this.state.tool !== 'move') return;
		let tokens = deepCopy(this.tokens);
		tokens.forEach(token => {
			if (token.isSelected) {
				Object.assign(token, {
					x: token.initX + evt.pageX - this.mouseDownX,
					y: token.initY + evt.pageY - this.mouseDownY,
				});
			}
		});
		this.updateTokens(tokens);
	}

	isTokenOnMap (token, map) {
		if (!map) map = this.map;
		return token && map && (token.pc || token.allMaps || token[map.name]);
	}

	loadTokensForMap (mapName, tokens) {
		tokens.forEach(token => {
			if (!token.maps) token.maps = {};
			if (!token.maps[mapName]) token.maps[mapName] = {};
			['x','y'].forEach(key => {
				token[key] = token.maps[mapName][key];
			});
			['w','h'].forEach(key => {
				if (token.maps[mapName][key] !== undefined)
					token[key] = token.maps[mapName][key];
			});
		});
	}

	dumpTokensForMap (mapName, tokens) {
		tokens.forEach(token => {
			if (!token.maps) token.maps = {};
			if (!token.maps[mapName]) token.maps[mapName] = {};
			['x','y','w','h'].forEach(key => {
				token.maps[mapName][key] = token[key];
			});
		});
	}

	moveSelectedTokens (evt) {
		if (this.tokens.find(t => t.isSelected)) {
			let tokens = deepCopy(this.tokens);
			let moveFactor = evt.shiftKey ? 100 : 10;
			tokens.forEach(token => {
				if (token.isSelected) {
					switch (evt.keyCode) {
						case 27: token.isSelected = false; break; /* escape */
						case 37: token.x -= moveFactor; break; /* left */
						case 38: token.y -= moveFactor; break; /* up */
						case 39: token.x += moveFactor; break; /* right */
						case 40: token.y += moveFactor; break; /* down */
						default: return;
					}
				}
			});
			this.updateTokens(tokens);
			evt.preventDefault();
		}
	}

	selectToken (index, evt) {
		function deselect (token) {
			if (token) {
				delete token.isSelected;
				delete token.initX;
				delete token.initY;
			}
		}
		function select (token) {
			if (token) {
				token.isSelected = true;
				token.initX = evt && evt.target.offsetLeft;
				token.initY = evt && evt.target.offsetTop;
			}
		}
		let tokens = deepCopy(this.tokens);
		/* Single-select mode */
		if (!evt || !evt.ctrlKey) {
			tokens.forEach(token => { deselect(token) });
			select(tokens[index]);
		}
		/* Toggle selected token */
		else if (tokens[index].isSelected)
			deselect(tokens[index]);
		/* Multi-select enabled */
		else
			select(tokens[index]);
		let state = {tokens: tokens};
		if (index >= 0) state.tool = 'move';
		this.setState(state);
	}

	updateToken (attrs, index, noEmit) {
		let tokens = deepCopy(this.tokens);
		['x', 'y'].forEach(key => { attrs[key] = parseInt(attrs[key]) || 0 });
		['h', 'w'].forEach(key => { attrs[key] = parseInt(attrs[key]) || undefined });
		tokens[index] = Object.assign(deepCopy(tokens[index]), attrs);
		this.updateTokens(tokens);
		if (!noEmit) this.state.websocket.sendTok(index, tokens[index]);
	}

	updateTokens (tokens) {
		this.setState({tokens: tokens});
	}
}
export default TokenMethods;
