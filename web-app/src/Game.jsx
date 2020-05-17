import React from 'react';
import Overlay from './Overlay.jsx';
import Token from './Token.jsx';
import ControlPanel from './ControlPanel.jsx';
import { fog } from './Fog.jsx';
import GameSocket from './Websockets.js'

function deepCopy (argument) { return argument === undefined ? null : JSON.parse(JSON.stringify(argument)) }

class Game extends React.Component {
	/* Is the current user a dm or a player? */
	get isHost () {
		if (!window.params) window.params = new URLSearchParams(window.location.href.replace(/.*\?/, ''));
		return window.params.get('host') && (window.params.get('host') !== '0');
	}
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
	get fog () { return this.map ? this.map.fog : null }
	get fogOpacity () { return this.isHost ? this.state.fogOpacity : 1 }
	/* Selected token */
	get token () { return this.tokens && !isNaN(this.state.selectedTokenIndex) && this.tokens[this.state.selectedTokenIndex] }
	get tokens () { return this.map ? this.map.tokens || [] : [] }

	constructor (props) {
		super(props);
		this.mapCanvasRef = React.createRef();
		let tokens = [
			{name: 'bar', pc: 0},
			{name: 'foo', url: '/belmont.jpg'},
			{name: 'arr', pc: 1},
			{name: 'win', pc: 1, url: '/redhead.jpg', y: 50, x: 90, w: 64, h:64},
		];
		let defaultMap = {
			url: "/FFtri9T.png",
			tokens: tokens,
			spawnX: 40, spawnY: 80,
			fog: {},
		};
		this.state = {
			room: window.location.pathname,
			username: this.isHost ? 'DM' : navigator.userAgent,
			radius: 55,
			fogOpacity: 0.85,
			tool: 'move',
			edit: 'pristine',
			pristine: {
				default: defaultMap,
				kiwi: {url: '/kiwi.jpeg'},
			},
			showHud: true,
			showMapsMenu: false,
			showTokensMenu: false,
			mapName: 'default',
			cursors: {},
			snapshots: {}, // non-pristine maps
		};
		this.state.websocket = new GameSocket(this);
	}

	componentDidMount () {
		window.addEventListener('resize', this.drawMap.bind(this));
		this.mapCanvasRef.current.addEventListener('click', ((evt) => {
			this.selectToken(null)
			this.setState({showMapsMenu: false});
			this.setState({showTokensMenu: false});
		}));
		window.document.addEventListener('keydown', this.onKeydown.bind(this));
		window.document.addEventListener('keypress', this.onKeypress.bind(this));
		window.document.addEventListener('mousemove', this.onMousemove.bind(this));
		this.loadMap(); /* load default map */
		this.loadLocalStorage(); /* load map from storage, if any */
	}

	onKeydown (evt) {
		if (this.token) {
			let token = deepCopy(this.token);
			switch (evt.keyCode) {
				case 37: /* left */ token.x -= 10; break;
				case 38: /* up */ token.y -= 10; break;
				case 39: /* right */ token.x += 10; break;
				case 40: /* down */ token.y += 10; break;
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
			case 'KeyH': this.setState({showHud: !this.state.showHud}); break;
			case 'KeyG': this.setState({tool: 'fog'}); break;
			case 'KeyM': toggleSub.bind(this)('showMapsMenu'); break;
			case 'KeyT': toggleSub.bind(this)('showTokensMenu'); break;
			case 'KeyV': this.setState({tool: 'move'}); break;
			default: return
		}
	}

	onMousemove (evt, noEmit) {
		if (!this.isHost || this.state.shareCursor)
			this.state.websocket.sendCur(evt.pageX, evt.pageY, this.state.name);
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
		let json = localStorage.getItem(this.state.room);
		if (!this.fromJson(json)) {
			console.error(`Bad localStorage load for ${this.state.room}. Clearing.`);
			localStorage.removeItem(this.state.room);
		}
	}

	saveLocalStorage () { localStorage.setItem(this.state.room, this.toJson()) }

	fromJson (json) {
		let state = {};
		try {
			let data = JSON.parse(json);
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
		return JSON.stringify(Object.assign(data, additionalAttrs));
	}

	nameChange (oldName, newName) {
		let cursors = deepCopy(this.state.cursors||{});
		cursors[newName] = cursors[oldName];
		delete cursors[oldName];
		this.setState({cursors: cursors});
	}

	fogReset (opts) {
		fog.reset();
		this.updateMap({fog: {}});
		if (!opts || !opts.noEmit) this.state.websocket.sendFre();
	}

	fogErase (x, y, radius, noEmit) {
		if (!radius) radius = this.state.radius;
		let modulus = Math.max(3, Math.round(radius / 5));
		x -= x % modulus;
		y -= y % modulus;
		let dots = Object.assign({}, this.map.fog||{});
		if (Array.isArray(dots)) dots = {};
		let key = [x,y].join(',');
		dots[key] = Math.max(radius, dots[key] || 0);
		fog.erase(x, y, radius);
		this.updateMap({fog: dots});
		if (!noEmit) this.state.websocket.sendFog(x, y, radius);
	}

	loadMap (mapName, edit='snapshots', forceCopy=false) {
		if (!mapName) mapName = this.mapName;
		if (!this.state.pristine[mapName]) {
			console.error('Attempted to load non-existant map', mapName);
			return null;
		}
		let state = { mapName: mapName, edit: edit };
		/* Overwrite pristine using snapshot */
		if (forceCopy || !this.state.snapshots[mapName]) {
			let snapshots = deepCopy(this.state.snapshots);
			snapshots[mapName] = deepCopy(this.state.pristine[mapName]);
			state.snapshots = snapshots;
		}
		this.setState(state, ((arg) => {
			this.drawMap();
			this.saveLocalStorage();
		}));
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
		let map = this.map;
		let img = new Image();
		const ctx = this.mapCanvasRef.current.getContext('2d');
		img.onload = () => {
			this.resizeCanvases(img.width, img.height);
			ctx.drawImage(img, 0, 0);
			for (let key in map.fog) {
				let [x, y] = key.split(',');
				fog.erase(x, y, map.fog[key]);
			}
		}
		img.src = this.map.url;
	}

	getImg (callback) {
		let el = document.querySelector('#file-select');
		let file = el.files && el.files[0];
		if (!el.files) return;
		let reader = new FileReader();
		let img = new Image();
		reader.onload = evt => {
			if (evt.target.readyState === FileReader.DONE) {
				img.src = evt.target.result;
				callback(img);
			}
		}
		reader.readAsDataURL(file);
	}

	handleText (key, evt) { this.setState({[key]: evt.target.value}) }
	handleCheckbox (key, evt) { this.setState({[key]: evt.target.checked}) }

	selectToken (index) { this.setState({selectedTokenIndex: index}) }
	updateToken (attrs, index, noEmit) {
		if (isNaN(index)) index = this.state.selectedTokenIndex;
		let tokens = deepCopy(this.tokens);
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
		let selectedIndex = this.state.selectedTokenIndex;
		if (this.tokens) return (
			this.tokens.map((token, index) => {
				if (token.url)
					return <Token
						key={index}
						index={index}
						token={token}
						game={game}
						selected={selectedIndex === index}
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

	renderOverlay () {
		if (this.state.tool === 'fog')
			return (<Overlay game={this} />);
	}

	render () {
		return (
			<div id="wrapper" className={this.state.edit}>
 				<canvas id="canvas-map" ref={this.mapCanvasRef} />
 				{this.renderTokens()}
				<canvas id="canvas-fog" className="passthrough" style={{opacity: this.fogOpacity}} />
				{this.renderCursors()}
				<canvas id="indicator" />
				{this.renderOverlay()}
				<div id="control-panel"><ControlPanel game={this} /></div>
			</div>
		);
	}

	resizeCanvases (w, h) {
		console.log('resizing canvas');
		if (!w) w = window.innerWidth;
		if (!h) h = window.innerHeight;
		this.setState({ w: w, h: h });
		document.querySelectorAll('canvas').forEach(canvas => {
			canvas.width = w;
			canvas.height = h;
		});
		fog.reset(); /* Fill fog canvas w/out saving */
	}
}

console.log('loaded src')

export default Game;
