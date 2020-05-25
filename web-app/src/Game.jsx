import React from 'react';
import Overlay from './Overlay.jsx';
import Token from './Token.jsx';
import ControlPanel from './ControlPanel.jsx';
import FogMethods from './FogMethods.js';
import MapMethods from './MapMethods.js';
import TokenMethods from './TokenMethods.js';
import GameSocket from './Websockets.js'
import ControlsMethods from './ControlsMethods.js';
import { deepCopy } from './Helper.js';
import { NotificationContainer, NotificationManager } from 'react-notifications';
import 'react-notifications/lib/notifications.css';

class Game extends React.Component {
	get params () {
		if (!window.params) window.params = new URLSearchParams(window.location.href.replace(/.*\?/, ''));
		return window.params;
	}
	/* Is the current user a dm or a player? */
	get isHost () { return this.params.get('host') && (this.params.get('host') !== '0') }
	get room () { return this.params.get('room') || 'defaultRoom' }
	get map () { return this.state.map }
	get maps () { return this.state.maps || [] }
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
		let kiwiMap = {
			name: 'kiwi', url: '/kiwi.jpeg',
		};
		this.state = {
			username: this.isHost ? 'DM' : navigator.userAgent,
			radius: 55,
			fogOpacity: 0.7,
			tool: 'move',
			edit: 'pristine',
			maps: [defaultMap, kiwiMap],
			tokens: tokens,
			showHud: true,
			showMapsMenu: false,
			showTokensMenu: false,
			mapName: 'default',
			cursors: {},
		};
		this.state.websocket = new GameSocket(this);
		this.extend(TokenMethods);
		this.extend(MapMethods);
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
			/* load map from storage, if any */
			this.loadLocalStorage().catch(() => {
				console.log('Attempting to load default map')
				this.loadMap(); /* load default map */
			});
		});
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
		return new Promise((resolve, reject) => {
			this.fromJson(json).then(() => { resolve() })
			.catch(() => {
				console.error(`Bad localStorage load for ${this.room}. Clearing.`);
				localStorage.removeItem(this.room);
				NotificationManager.error('Bad localStorage', 'foo');
				reject();
			});
		});
	}

	saveLocalStorage (evt) {
		console.error('saving...',this.state.maps)
		if (this.state.isInitialLoadFinished)
			localStorage.setItem(this.room, this.toJson());
		else
			console.error(`saveLocalStorage`, 'init not finished');
	}

	fromJson (json) {
		return new Promise((resolve, reject) => {
			if (!json) {
				NotificationManager.warning('Tried to load from JSON, but no JSON was found', 'Bad JSON load');
				reject();
			}
			try {
				let data = JSON.parse(json);
				let state = {};
				['tokens', 'maps', 'mapName', 'radius'].forEach(key => {
					state[key] = data[key];
				});
				if (!state.radius) state.radius = 33;
				this.setState(state, () => {
					this.loadMap().then(resolve).catch(reject);
				});
			} catch (ex) {
				console.error(ex);
				NotificationManager.error(ex.message, 'Error in `fromJSON`');
				reject();
			}
		})
	}

	toJson (additionalAttrs) {
		let game = this;
		let data = {};
		['tokens', 'maps', 'mapName', 'radius'].forEach(key => {
			data[key] = game.state[key];
		});
		if (this.map) this.dumpTokensForMap(this.map.name, data.tokens);
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

	updateSnapshot (attrs, mapName) { this.updateMap(attrs, mapName, 'snapshots') }

	handleText (key, evt) { this.setState({[key]: evt.target.value}) }
	handleCheckbox (key, evt) { this.setState({[key]: evt.target.checked}) }

	renderTokens () {
		let game = this;
		return (
			this.tokens.map((token, index) => (
				(token.url && game.isTokenOnMap(token))
				? <Token key={index} index={index} token={token} game={game}/>
				: null
			))
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
					<NotificationContainer/>
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
