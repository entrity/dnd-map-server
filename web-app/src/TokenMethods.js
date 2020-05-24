import { deepCopy } from './Helper.js';

/*
	updateToken (attrs, index, noEmit) {
		if (isNaN(index)) index = this.state.selectedTokenIndex;
		let tokens = deepCopy(this.tokens);
		['x', 'y'].forEach(key => { attrs[key] = parseInt(attrs[key]) || 0 });
		['h', 'w'].forEach(key => { attrs[key] = parseInt(attrs[key]) || undefined });
		tokens[index] = Object.assign(deepCopy(tokens[index])||{}, attrs);
		this.updateMap({ tokens: tokens });
		if (!noEmit) this.state.websocket.sendTok(index, tokens[index]);
	}
	deleteToken (index) {
		if (index === undefined) {
			index = this.selectedTokenIndex;
			delete this.selectedTokenIndex;
		}
		let tokens = deepCopy(this.tokens).splice(index, 1);
		this.updateMap({tokens: tokens});
	}
*/
class TokenMethods {
	dragSelectedTokens (evt) {
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

	isTokenOnMap (token) {
		return token && this.map && (token.allMaps || token[this.map.name]);
	}

	moveSelectedTokens (evt) {
		if (this.tokens.find(t => t.isSelected)) {
			let tokens = deepCopy(this.tokens);
			let moveFactor = evt.shiftKey ? 100 : 10;
			tokens.forEach(token => {
				if (token.isSelected)
					switch (evt.keyCode) {
						case 27: token.isSelected = false; break; /* escape */
						case 37: token.x -= moveFactor; break; /* left */
						case 38: token.y -= moveFactor; break; /* up */
						case 39: token.x += moveFactor; break; /* right */
						case 40: token.y += moveFactor; break; /* down */
						default: return;
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
				token.initX = evt.target.offsetLeft;
				token.initY = evt.target.offsetTop;
			}
		}
		let tokens = deepCopy(this.tokens);
		/* Single-select mode */
		if (!evt.ctrlKey) {
			tokens.forEach(token => { deselect(token) });
			select(tokens[index]);
		}
		/* Toggle selected token */
		else if (tokens[index].isSelected)
			deselect(tokens[index]);
		/* Multi-select enabled */
		else
			select(tokens[index]);
		this.setState({tokens: tokens});
	}

	updateTokens (tokens) {
		this.setState({tokens: tokens});
	}
}
export default TokenMethods;
