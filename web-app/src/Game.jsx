import React from 'react';
import MapCpItem from './MapCpItem.jsx';
import NpcCpItem from './NpcCpItem.jsx';
import Overlay from './Overlay.jsx';
import Token from './TokenDiv.jsx';
import { fog } from './Fog.jsx';
import Map from './Map.jsx'

class Game extends React.Component {
	ws = new WebSocket('ws://localhost:8000/');

	constructor (props) {
		super(props);
		this.isHost = !!props.host;
		this.addMap = this.addMap.bind(this);
		this.setTool = this.setTool.bind(this);
		this.drawMap = this.drawMap.bind(this);
		this.handleCheckbox = this.handleCheckbox.bind(this);
		let npcs = [
			{name: 'bar'},
			{name: 'foo', url: '/belmont.jpg'},
		];
		let pcs = [
			{name: 'arr'},
			{name: 'win', url: '/redhead.jpg', y: 50, x: 90}
		];
		let defaultMap = new Map({
			name: '(default)',
			url: "/FFtri9T.png",
			npcs: npcs,
			pcs: pcs,
		});
		this.state = {
		x: -1, y: -1,
		radius: 55,
		fogOpacity: 0.85,
		// showCpMaps: true,
		// showCpNpcs: true,
		npcs: npcs,
		pcs: pcs,
		tool: 'move',
		pristineNpcs: [],
		maps: [defaultMap, new Map({name: 'kiwi', url: '/kiwi.jpeg'})],
		map: defaultMap};
	}

	componentDidMount () {
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
		/* Define window callbacks */
		window.addEventListener('resize', this.drawMap);
		/* Define canvas callbacks */
		this.mapCanvas = document.getElementById('canvas-map');
		this.mapCanvas.addEventListener('click', ((evt) => {
			this.selectToken(null);
		}));
		this.drawMap();
		this.load();
	}

	load () {
		if (localStorage.getItem('maps')) {
			this.setState({
				maps: JSON.parse(localStorage.getItem('maps'))
							.map(obj => { return new Map(obj) }),
				map: this.state.maps[localStorage.getItem('mapIndex')],
			})
			this.drawMap(this.state.map);
		}
		if (localStorage.getItem('radius'))
			this.setState({radius: localStorage.getItem('radius')});
		if (localStorage.getItem('fogDots')) {
			let fogDots = JSON.parse(localStorage.getItem('fogDots'));
			this.setState({fogDots: fogDots});
			for (let key in fogDots) {
				let [x, y] = key.split(','); 
				fog.erase(x, y, fogDots[key]);
			}
		}
	}

	save () {
		localStorage.setItem('maps', JSON.stringify(this.state.maps));
		localStorage.setItem('mapIndex', this.state.maps.indexOf(this.state.map));
		localStorage.setItem('radius', this.state.radius);
		localStorage.setItem('fogDots', JSON.stringify(this.state.fogDots));
	}

	fogReset (arg) {
		fog.reset()
		if ('object' == typeof arg)
			this.setState({fogDots: {}}, this.save.bind(this));
	}

	fogErase (x, y) {
		let modulus = Math.max(3, Math.round(this.state.radius / 5));
		x -= x % modulus;
		y -= y % modulus;
		let fogDots = this.state.fogDots ? Object.assign(this.state.fogDots) : {};
		let oldVal = fogDots ? fogDots[[x,y]] : 0;
		fogDots[[x,y].join(',')] = Math.max(this.state.radius, oldVal || 0);
		fog.erase(x, y, this.state.radius);
		this.setState({ fogDots: fogDots }, this.save.bind(this));
	}
	
	draw (img, canvasId) {
		console.log(`drawing to ${canvasId}`);
		let canvas = document.getElementById(canvasId || 'canvas-map');
		let context = canvas.getContext('2d');
		context.drawImage(img, 0, 0);
	}

	addMap (evt) {
		let name = this.state.newMapName.trim();
		if (!name || !name.length) return;
		this.setState({
			newMapName: '',
			maps: [new Map({name: name})].concat(this.state.maps||[])
		});
	}

	drawMap (map) {
		if (!map) map = this.state.map;
		if (!map) return;
		let img = new Image();
		const ctx = this.mapCanvas.getContext('2d');
		img.onload = () => {
			this.resizeCanvases(img.width, img.height);
			ctx.drawImage(img, 0, 0);
			for (let key in this.state.fogDots) {
				let [x, y] = key.split(','); 
				fog.erase(x, y, this.state.fogDots[key]);
			}			
		}
		img.src = map.url;
	}

	getImg (callback) {
		let el = document.querySelector('#file-select');
		let file = el.files && el.files[0];
		console.log(el, file);
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

	handleText (key, evt) {
		this.setState({[key]: evt.target.value});
	}
	handleCheckbox (evt) {
		let key = evt.target.dataset.field;
		this.setState({[key]: evt.target.checked});
	}

	selectToken (token) {
		this.setState({selectedToken: token && token.name});
	}
	updateToken (listKey, token) {
		let list = this.state[listKey].slice();
		let index = list.findIndex(obj => { return obj.name === token.name });
		list[index] = token;
		this.setState({ [listKey]: list });
	}

	renderTokens (key) {
		return (
			this.state[key]
			.filter(obj => {return !!obj.url})
			.map((token) => {return <Token
				key={token.name}
				obj={token}
				update={this.updateToken.bind(this, key)}
				select={this.selectToken.bind(this)}
				selected={this.state.selectedToken === token.name}
			/>})
		);
	}

	render () {
		return (
			<div style={{"position": "relative"}}>
 				<canvas id="canvas-map" />
				<div id="canvas-npcs">{this.renderTokens('npcs')}</div>
				<canvas id="canvas-fog" className="passthrough" style={{opacity: this.state.fogOpacity}} />
				<div id="canvas-pcs">{this.renderTokens('pcs')}</div>
				{this.state.tool === 'fog' && <Overlay radius={this.state.radius} fogErase={this.fogErase.bind(this)} width={this.state.w} height={this.state.h} />}
				{this.renderControlPanel()}
			</div>
		);
	}

	renderControlPanel () {
		return (
			<div id="control-panel">
				<div>
					<label>
						<input type="checkbox" data-field="showCpMaps" onChange={this.handleCheckbox} />
						Maps...
					</label>
					<label>
						<input type="checkbox" data-field="showCpNpcs" onChange={this.handleCheckbox} />
						NPCs...
					</label>
					<label>
						<input type="checkbox" data-field="showCpPcs" onChange={this.handleCheckbox} />
						PCs...
					</label>
					<button onClick={this.fogReset.bind(this)}>Reset Fog</button>
					<input onChange={this.handleText.bind(this, 'fogOpacity')} value={this.state.fogOpacity} size="2" />
					<label>
						<input type="radio" name="tool" value="fog" onChange={this.setTool} />
						fog
					</label>
					<label>
						<input type="radio" name="tool" value="move" onChange={this.setTool} />
						move
					</label>
					<input onChange={this.handleText.bind(this, 'radius')} value={this.state.radius} size="2" />
					<span>X {this.state.x} / Y {this.state.y}</span>
				</div>
				{this.state.showCpMaps && this.renderCpMaps()}
				{this.state.showCpNpcs && this.renderCpNpcs()}
				{this.state.showCpPcs && this.renderCpPcs()}
			</div>
		)
	}

	renderCpMaps () {
		return (
			<div id="maps-cp">
				<div>Maps {this.state.maps && this.state.maps.length}</div>
				<input onChange={this.handleText.bind(this, 'newMapName')} value={this.state.newMapName || ''} placeholder='Map name' />
				<button onClick={this.addMap}>Add map</button>
				<ol>{ this.state.maps.map( (item, idx) => <MapCpItem key={item.name} index={idx} value={item} update={this.updateMapCpItems.bind(this)} maps={this.state.maps} load={this.loadMap.bind(this)} /> ) }</ol>
			</div>
		)
	}

	addNpc () {
		let name = this.state.newNpcName.trim(); 
		if (name.length) {
			this.setState({
				newNpcName: '',
				npcs: this.state.npcs.slice().concat({name: name}),
			}, () => {
				this.state.npcs.forEach((npc) => {
					if (!npc.url) return;

				})
			});
		}
	}

	renderCpNpcs () {
		return (
			<div id="npcs-cp">
				<div>NPCs {this.state.npcs && this.state.npcs.length}</div>
				<input onChange={this.handleText.bind(this, 'newNpcName')} value={this.state.newNpcName || ''} placeholder='NPC name' />
				<button onClick={this.addNpc.bind(this)}>Add NPC</button>
				<ol>{ this.state.npcs.map( (item, idx) => <NpcCpItem key={item.name} index={idx} value={item} /> ) }</ol>
			</div>
		)
	}

	renderCpPcs () {
		return (
			<div id="cps-cp">
			fds
			</div>
		)
	}

	updateMapCpItems (maps) {
		console.log('update called')
		this.setState({maps: maps});
	}

	loadMap (newMap, pristine) {
		let maps = this.state.maps.slice();
		if (this.state.map) {
			let index = this.state.maps.indexOf(this.state.map);
			let oldMapCopy = Object.assign(this.state.map);
			oldMapCopy.fogDots = Object.assign(this.state.fogDots);
			maps[index] = oldMapCopy;
		}
		let fogDots = pristine ? {} : (newMap.fogDots || {});
		this.setState({
			map: newMap,
			maps: maps,
			fogDots: fogDots,
		}, this.save.bind(this));
		this.drawMap(newMap);
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
		this.fogReset(true);
	}

	setTool (evt) {
		console.log(evt.target.value, evt.target);
		this.setState({ tool: evt.target.value });
	}
}

console.log('loaded src')

export default Game;
