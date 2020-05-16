import React from 'react';
import Overlay from './Overlay.jsx';
import Token from './Token.jsx';
import ControlPanel from './ControlPanel.jsx';
import { fog } from './Fog.jsx';

function deepCopy (argument) { return argument === undefined ? null : JSON.parse(JSON.stringify(argument)) }

class Game extends React.Component {
	ws = new WebSocket('ws://localhost:8000/');

	/* Is the current user a dm or a player? */
	get isHost () { return /host=/.test(window.location.href) }
	/* Selected map (for selected `edit`) */
	get map () {
		if (!this.state.edit || !this.state.mapName || !this.state[this.state.edit]) return
		return this.state[this.state.edit][this.state.mapName];
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
	get tokens () { return this.map ? this.map.tokens : null }

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
			radius: 55,
			fogOpacity: 0.85,
			tool: 'move',
			edit: 'pristine',
			pristine: {
				default: defaultMap,
				kiwi: {url: '/kiwi.jpeg'},
			},
			showHud: true,
			showTokensMenu: true,
			mapName: 'default',
			snapshots: {}, // non-pristine maps
		};
	}

	componentDidMount () {
		this.setUpWebsocket();
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
		if (evt.target.tagName === 'INPUT' && evt.target.type !== 'text')
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
	onMousemove (evt) { this.setState({curX: evt.offsetX, curY: evt.offsetY}) }

	setUpWebsocket () {
		/* Define websockets callbacks */
		this.ws.onopen = () => {
			console.log('opened WebSocket');
		}
		this.ws.onmessage = evt => {
			console.log('got msg', evt.data);
		}
		this.ws.onclose = () => {
			console.log('closed');
		}
		// setInterval( _ => { this.ws.send( Math.random() ) }, 2000 )
	}

	loadLocalStorage () {
		try {
			let state = {};
			['pristine', 'snapshots'].forEach(key => {
				let json = localStorage.getItem(key);
				let obj = json ? JSON.parse(json) : {};
				state[key] = Object.assign(deepCopy(this.state[key]), obj);
			});
			['mapName', 'radius'].forEach(key => {
				state[key] = localStorage.getItem(key);
			});
			if (!state.mapName || !state.pristine[state.mapName])
				state.mapName = Object.keys(state.pristine)[0];
			state.radius = JSON.parse(state.radius) || 33;
			this.setState(state, this.loadMap.bind(this));
		} catch (ex) {
			console.error(ex);
			['pristine', 'snapshots'].forEach(key => {
				let json = localStorage.getItem(key);
				console.warn('Loaded localStorage', key, json);
			});
			console.warn('clearing local storage')
			localStorage.clear();
		}
	}

	saveLocalStorage () {
		if (this.state.pristine)
			localStorage.setItem('pristine', JSON.stringify(this.state.pristine));
		if (this.state.snapshots)
			localStorage.setItem('snapshots', JSON.stringify(this.state.snapshots));
		localStorage.setItem('mapName', this.state.mapName);
		localStorage.setItem('radius', this.state.radius);
	}

	fogReset () {
		fog.reset();
		this.updateMap({fog: {}});
	}

	fogErase (x, y) {
		let modulus = Math.max(3, Math.round(this.state.radius / 5));
		x -= x % modulus;
		y -= y % modulus;
		let dots = Object.assign({}, this.map.fog||{});
		if (Array.isArray(dots)) dots = {};
		let key = [x,y].join(',');
		dots[key] = Math.max(this.state.radius, dots[key] || 0);
		fog.erase(x, y, this.state.radius);
		this.updateMap({fog: dots});
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
	updateToken (attrs, index) {
		if (isNaN(index)) index = this.state.selectedTokenIndex;
		let tokens = deepCopy(this.tokens);
		tokens[index] = Object.assign(deepCopy(tokens[index])||{}, attrs);
		this.updateMap({ tokens: tokens });
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
