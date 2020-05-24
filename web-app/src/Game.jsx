import React from 'react';
import Overlay from './Overlay.jsx';
import Token from './Token.jsx';
import ControlPanel from './ControlPanel.jsx';
import FogMethods from './FogMethods.js';
import GameSocket from './Websockets.js'
import ControlsMethods from './ControlsMethods.js';

function deepCopy (argument) { return argument === undefined ? null : JSON.parse(JSON.stringify(argument)) }

class Game extends React.Component {
	get params () {
		if (!window.params) window.params = new URLSearchParams(window.location.href.replace(/.*\?/, ''));
		return window.params;
	}
	/* Is the current user a dm or a player? */
	get isHost () { return this.params.get('host') && (this.params.get('host') !== '0') }
	get room () { return this.params.get('room') || 'defaultRoom' }
	/* Selected map (for selected `edit`) */
	get map () {
		if (!this.state.edit || !this.mapName || !this.state[this.state.edit]) return null;
		return this.state[this.state.edit][this.mapName];
	}
	get maps () { return this.state.edit && this.state[this.state.edit] }
	get mapName () {
		if (this.state.mapName && this.state.mapName !== 'undefined')
			return this.state.mapName;
		else
			return Object.keys(this.pristine||{}).find(key => { return typeof key === 'string'});
	}
	get fogOpacity () { return this.isHost ? this.state.fogOpacity : 1 }
	get tokens () { return this.state.tokens }

	constructor (props) {
		super(props);
		window.game = this;
		this.mapCanvasRef = React.createRef();
		let tokens = [
			{name: 'bar', pc: 0, all: true},
			{name: 'foo', url: '/belmont.jpg', all: true},
			{name: 'arr', pc: 1, all: true},
			{name: 'win', pc: 1, url: '/redhead.jpg', y: 50, x: 90, w: 64, h:64, all: true},
		];
		let defaultMap = {
			url: "/FFtri9T.png",
			spawnX: 40, spawnY: 80,
		};
		this.state = {
			username: this.isHost ? 'DM' : navigator.userAgent,
			radius: 55,
			fogOpacity: 0.7,
			tool: 'fog',
			edit: 'pristine',
			pristine: {
				default: defaultMap,
				kiwi: {url: '/kiwi.jpeg'},
			},
			tokens: tokens,
			showHud: true,
			showMapsMenu: false,
			showTokensMenu: false,
			mapName: 'default',
			cursors: {},
			snapshots: {}, // non-pristine maps
		};
		this.state.websocket = new GameSocket(this);
		this.extend(FogMethods);
		this.extend(ControlsMethods);
	}

	/* Helper function for extending other classes */
	extend (base) {
		Object.getOwnPropertyNames(base.prototype)
		.filter(prop => prop !== 'constructor')
		.forEach(prop => {
			Game.prototype[prop] = base.prototype[prop];
		});
	}

	componentWillUnmount () {
		window.removeEventListener('beforeunload', this.saveLocalStorage.bind(this));
		window.removeEventListener('resize', this.drawMap.bind(this));
		this.removeControlsCallbacks();
		this.saveLocalStorage();
	}

	componentDidMount () {
		window.addEventListener('beforeunload', this.saveLocalStorage.bind(this));
		window.addEventListener('resize', this.drawMap.bind(this));
		this.addControlsCallbacks();
		this.mapCanvasRef.current.addEventListener('click', ((evt) => {
			this.setState({showMapsMenu: false});
			this.setState({showTokensMenu: false});
		}));
		this.setState({fogLoaded: false}, () => {
			console.log('Attempting to load from localStorage')
			if (!this.loadLocalStorage()) { /* load map from storage, if any */
				console.log('Attempting to load defaultMap')
				this.loadMap(); /* load default map */
			}
		});
	}

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
		this.setState({tokens: tokens});
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

	isTokenOnMap (token) {
		return token && this.map && (token.allMaps || token[this.map.name]);
	}

	updateCur (x, y, username) {
		let cursors = deepCopy(this.state.cursors||{});
		cursors[username] = {x: x, y: y, date: new Date()};
		let tooOld = new Date(new Date() - 1000); // after 2 sec, expire the cursor
		Object.keys(cursors).forEach(key => {
			if (cursors[key].date < tooOld) delete cursors[key];
		});
		this.setState({cursors: cursors});
	}

	loadLocalStorage () {
		let json = localStorage.getItem(this.room);
		if (!this.fromJson(json)) {
			console.error(`Bad localStorage load for ${this.room}. Clearing.`);
			localStorage.removeItem(this.room);
			return false;
		} else return true;
	}

	saveLocalStorage (evt) {
		if (this.state.isInitialLoadFinished)
			localStorage.setItem(this.room, this.toJson())
		else
			console.error(`saveLocalStorage`, 'init not finished');
	}

	fromJson (json) {
		try {
			let data = JSON.parse(json);
			let state = {};
			['pristine', 'snapshots'].forEach(key => {
				state[key] = data[key] || {};
			});
			['mapName', 'radius'].forEach(key => {
				state[key] = data[key];
			});
			if (!state.mapName || !state.pristine[state.mapName])
				state.mapName = Object.keys(state.pristine)[0];
			if (!state.radius) state.radius = 33;
			this.setState(state, this.loadMap.bind(this));
			return true;
		} catch (ex) {
			console.error(ex);
			return false;
		}
	}

	toJson (additionalAttrs) {
		let data = {};
		let game = this;
		['mapName', 'radius'].forEach(key => {
			data[key] = game.state[key];
		});
		['pristine', 'snapshots'].forEach(key => {
			if (game.state[key]) data[key] = game.state[key];
		})
		if (data.snapshots && data.mapName && data.snapshots[data.mapName])
			data.snapshots[data.mapName].fogUrl = this.fogUrl();
		return JSON.stringify(Object.assign(data, additionalAttrs));
	}

	nameChange (oldName, newName) {
		let cursors = deepCopy(this.state.cursors||{});
		cursors[newName] = cursors[oldName];
		delete cursors[oldName];
		this.setState({cursors: cursors});
	}

	loadMap (mapName, edit='snapshots', opts) {
		console.log('>>> caled loadMap', mapName, this.mapName, edit)
		if (!opts) opts = {}
		if (!mapName) mapName = this.mapName;
		if (!this.state.pristine[mapName]) {
			console.error('Attempted to load non-existant map', mapName);
			return null;
		}
		let state = { mapName: mapName, edit: edit, fogLoaded: false };
		/* Overwrite pristine using snapshot */
		if (opts.forceCopy || !this.state.snapshots[mapName]) {
			let snapshots = deepCopy(this.state.snapshots);
			snapshots[mapName] = deepCopy(this.state.pristine[mapName]);
			state.snapshots = snapshots;
		}
		return new Promise(resolve => {
			this.setState(state, ((arg) => {
				this.loadFog(this.map && this.map.fogUrl)
				.then(this.drawMap.bind(this))
				.then(() => { resolve() });
			}));
		})
	}

	updateMap (attrs, mapName, edit) {
		if (!mapName) mapName = this.mapName;
		if (!edit) edit = this.state.edit;
		let map = Object.assign(deepCopy(this.map), attrs);
		this.setState(prev => ({
			[edit]: { ...prev[edit], [mapName]: map },
		}), this.saveLocalStorage);
	}

	updateSnapshot (attrs, mapName) { this.updateMap(attrs, mapName, 'snapshots') }

	drawMap () {
		if (!this.map || !this.map.url) return;
		let img = new Image();
		const ctx = this.mapCanvasRef.current.getContext('2d');
		return new Promise((resolve, reject) => {
			img.onload = () => {
				this.resizeCanvases(img.width, img.height);
				ctx.drawImage(img, 0, 0);
				if (!this.state.isInitialLoadFinished) this.setState({isInitialLoadFinished: true});
				resolve();
			}
			img.src = this.map.url;
		})
	}

	handleText (key, evt) { this.setState({[key]: evt.target.value}) }
	handleCheckbox (key, evt) { this.setState({[key]: evt.target.checked}) }

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

	renderTokens () {
		let game = this;
		if (this.tokens) return (
			this.tokens.map((token, index) => {
				if (token.url)
					return <Token
						key={index}
						index={index}
						token={token}
						game={game}
					/>
				else
					return null;
			})
		);
	}

	renderCursors () {
		if (this.state.cursors)
			return (
				Object.keys(this.state.cursors).map((key, index) => {
					let cur = this.state.cursors[key];
					let lbl = key.substr(0, 10);
					return ( <span key={index} className="cursor" style={{left: cur.x, top: cur.y}}>&#x1f5e1;<br/>{lbl}</span> )
				})
			);
	}

	render () {
		try {
			return (
				<div id="wrapper" className={this.state.edit}>
					<canvas id="canvas-map" ref={this.mapCanvasRef} />
					<div id="fog-placeholder" className={this.state.fogLoaded ? 'gone' : ''}>{/* Just blacks out screen while waiting for fog to be drawn so that Tokens and Map are not revealed */}</div>
					<canvas id="canvas-fog" className="passthrough" style={{opacity: this.fogOpacity}} />
					{this.renderTokens()}
					{this.renderCursors()}
					<canvas id="indicator" />
					<Overlay game={this} />
					<div id="control-panel"><ControlPanel game={this} /></div>
				</div>
			);
		} catch (ex) {
			console.error(ex);
			console.error('Exception in `render`. Clearing localStorage...');
			localStorage.removeItem(this.room);
		}
	}

	resizeCanvases (w, h) {
		if (!w) w = window.innerWidth;
		if (!h) h = window.innerHeight;
		let canvases = document.querySelectorAll('canvas');
		if (canvases[0].width !== w || canvases[0].height !== h) {
			console.log('resizing canvases', w, h, this.state.isInitialLoadFinished);
			this.setState({ w: w, h: h, fogLoaded: false }, () => {
				let fogUrl = this.state.isInitialLoadFinished ? this.fogUrl() : this.map.fogUrl;
				canvases.forEach(canvas => {
					canvas.width = w;
					canvas.height = h;
				});
				this.loadFog(fogUrl);
			});
		}
	}
}

export default Game;
