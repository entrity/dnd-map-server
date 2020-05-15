import React from 'react';
import Overlay from './Overlay.jsx';
import Token from './Token.jsx';
import TokenConfig from './cp/TokenConfig.jsx';
import ControlPanel from './ControlPanel.jsx';
import { fog } from './Fog.jsx';
import Map from './Map.jsx'

class Game extends React.Component {
	ws = new WebSocket('ws://localhost:8000/');

	/* Current map */
	get map () { 
		if (!this.state.maps) return null;
		return this.state.maps && this.mapName && this.state.maps[this.mapName];
	}
	get mapName () {
		if (!this.state.mapName || this.state.mapName === 'undefined')
			return Object.keys(this.state.maps).find(key => { return typeof key === 'string'});
		else
			return 'string' === typeof this.state.mapName ? this.state.mapName : null;
	}
	get fog () { return this.map ? this.map.fog : null }
	/* Selected token */
	get token () { return this.tokens && this.selectedTokenIndex && this.tokens[this.selectedTokenIndex] }
	get tokens () { return this.map ? this.map.tokens : null }

	constructor (props) {
		super(props);
		this.isHost = !!props.host;
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
			cursorX: -1,
			cursorY: -2,
			radius: 55,
			fogOpacity: 0.85,
			tool: 'move',
			maps: {
				default: defaultMap,
				kiwi: {url: '/kiwi.jpeg'},
			},
			snapshots: {}, // non-pristine maps
			tokens: tokens, // in play
		};
	}

	componentDidMount () {
		this.setUpWebsocket();
		window.addEventListener('resize', this.drawMap.bind(this));
		this.mapCanvasRef.current.addEventListener('click', ((evt) => { this.selectToken(null) }));
		this.loadLocalStorage();
	}

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
		setInterval( _ => { this.ws.send( Math.random() ) }, 2000 )
	}

	loadLocalStorage () {
		try {
			let mapsJSON = localStorage.getItem('maps');
			let mapName = localStorage.getItem('mapName');
			let maps = mapsJSON && JSON.parse(mapsJSON);
			let state = {};
			if (maps) state.maps = maps;
			state.mapName = mapName || (maps && Object.keys(maps)[0]);
			let radius = localStorage.getItem('radius');
			if (radius) state.radius = radius;
			this.setState(state, this.loadMap.bind(this));
		} catch (ex) {
			console.error(ex);
			console.warn('clearing local storage')
			localStorage.clear();
		}
	}

	saveLocalStorage () {
		localStorage.setItem('maps', JSON.stringify(this.state.maps));
		localStorage.setItem('mapName', this.state.mapName);
		localStorage.setItem('radius', this.state.radius);
	}

	fogReset (updateFog) {
		fog.reset()
		if (updateFog) this.updateMap({fog: {}});
	}

	fogErase (x, y) {
		let modulus = Math.max(3, Math.round(this.state.radius / 5));
		x -= x % modulus;
		y -= y % modulus;
		let dots = Object.assign(this.map.fog||{});
		if (Array.isArray(dots)) dots = {};
		let key = [x,y].join(',');
		dots[key] = Math.max(this.state.radius, dots[key] || 0);
		fog.erase(x, y, this.state.radius);
		this.updateMap({fog: dots});
	}

	updateMap (attrs, mapName) {
		if (!mapName) mapName = this.state.mapName;
		let map = Object.assign(this.state.maps[mapName]||{}, attrs);
		this.setState(prev => ({
			maps: { ...prev.maps, [mapName]: map },
		}), (() => {
			this.saveLocalStorage();
		}));
	}
	
	// draw (img, canvasId) {
	// 	console.log(`drawing to ${canvasId}`);
	// 	let canvas = document.getElementById(canvasId || 'canvas-map');
	// 	let context = canvas.getContext('2d');
	// 	context.drawImage(img, 0, 0);
	// }

	addMap (evt) {
		let name = this.state.newMapName.trim();
		if (!name || !name.length) return;
		this.setState({
			newMapName: '',
			maps: [new Map({name: name})].concat(this.state.maps||[])
		});
	}

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
		if (!index) index = this.state.selectedTokenIndex;
		let tokens = JSON.parse(JSON.stringify(this.tokens)); // deep copy
		tokens[index] = Object.assign(attrs, tokens[index]);
		this.updateMap({ tokens: tokens });
	}
	deleteToken (index) {
		if (index === undefined) {
			index = this.selectedTokenIndex;
			delete this.selectedTokenIndex;
		}
		let tokens = JSON.parse(JSON.stringify(this.tokens)).splice(index, 1);
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
			})
		);
	}

	renderOverlay () {
		if (this.state.tool === 'fog')
			return (<Overlay game={this} />);
	}

	render () {
		let klass = this.state.tool === 'fog' ? 'pristine' : 'active';
		return (
			<div id="wrapper" className={klass}>
 				<canvas id="canvas-map" ref={this.mapCanvasRef} />
 				{this.renderTokens()}
				<canvas id="canvas-fog" className="passthrough" style={{opacity: this.state.fogOpacity}} />
				{this.renderOverlay()}
				<div id="control-panel">
					<ControlPanel game={this} />
					{this.token && <TokenConfig token={this.token} game={this} />}
				</div>
			</div>
		);
	}

	loadMap (mapName, loadSnapshot) {
		if (!mapName) mapName = this.mapName;
		let map = null;
		if (loadSnapshot)
			map = this.state.snapshots[mapName] || this.state.maps[mapName];
		else
			map = this.state.maps[mapName];
		this.setState({
			mapName: mapName,
			map: map,
			tokens: map && map.tokens,
			fog: (map && map.active) ? map.fog : {},
		}, (() => {
			this.drawMap()
			this.saveLocalStorage();
		}));
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
		this.fogReset(false);
	}
}

console.log('loaded src')

export default Game;
