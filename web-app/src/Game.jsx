import React from 'react';
import MapCpItem from './MapCpItem.jsx';
import { fog } from './Fog.jsx';

class Game extends React.Component {
	ws = new WebSocket('ws://localhost:8000/');

	constructor (props) {
		super(props);
		this.isHost = !!props.host;
		this.addMap = this.addMap.bind(this);
		this.setTool = this.setTool.bind(this);
		this.drawMap = this.drawMap.bind(this);
		this.handleCheckbox = this.handleCheckbox.bind(this);
		this.handleTextField = this.handleTextField.bind(this);
		this.onMouseUp = this.onMouseUp.bind(this);
		this.onMouseDown = this.onMouseDown.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.onClick = this.onClick.bind(this);
		let defaultMap = {
			name: '(default)',
			url: "/FFtri9T.png",
		};
		this.state = {x: -1, y: -1, tool: 'fog',
		radius: 55,
		fogOpacity: 0.5,
		newMapName: '',
		maps: [defaultMap, {name: 'kiwi', url: '/kiwi.jpeg'}],
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
		this.overlay = document.getElementById('overlay');
		this.overlay.addEventListener('mouseup', this.onMouseUp);
		this.overlay.addEventListener('mousedown', this.onMouseDown);
		this.overlay.addEventListener('mousemove', this.onMouseMove);
		this.drawMap();
	}

	onMouseMove (evt) {
		let x = evt.offsetX, y = evt.offsetY;
		this.setState({x: x, y: y});
		if (this.state.tool == 'fog') {
			this.setPointerOutline();
			if (this.state.clickOn) fog.erase(x, y, this.state.radius); 
		}
	}
	onMouseUp (evt) { this.setState({ clickOn: false }) }
	onMouseDown (evt) { this.setState({ clickOn: true }) }
	onClick (evt) {
		let x = evt.offsetX, y = evt.offsetY;
		if (this.state.tool == 'fog') {
			fog.erase(x, y, this.state.radius); 
		}
	}
	
	setPointerOutline () {
		this.overlay.width = this.overlay.width;
		let ctx = this.overlay.getContext('2d');
		ctx.strokeStyle = 'yellow'
		ctx.lineWidth = '2'
		ctx.beginPath();
		ctx.arc(this.state.x, this.state.y, this.state.radius, 0, 2*Math.PI);
		ctx.stroke();
		ctx.closePath();
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
		this.state.newMapName = '';
		this.setState({ maps: [{name: name}].concat(this.state.maps||[]) });
	}

	drawMap (map) {
		if (!map) map = this.state.map;
		if (!map) return;
		let img = new Image();
		const ctx = this.mapCanvas.getContext('2d');
		img.onload = () => {
			this.resizeCanvases(img.width, img.height);
			ctx.drawImage(img, 0, 0);
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

	handleTextField (evt) {
		let key = evt.target.dataset.field;
		this.setState({[key]: evt.target.value});
		if (key == 'fogOpacity') document.getElementById('canvas-fog').style.opacity = evt.target.value;
	}
	handleCheckbox (evt) {
		let key = evt.target.dataset.field;
		this.setState({[key]: evt.target.checked});
	}

	render () {
		return (
			<div style={{"position": "relative"}}>
 				<canvas id="canvas-map" />
				<canvas id="canvas-npcs" />
				<canvas id="canvas-fog" className="passthrough" />
				<canvas id="canvas-pcs" />
				<canvas id="overlay" />
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
					<button onClick={fog.reset}>Reset Fog</button>
					<input onChange={this.handleTextField} data-field="fogOpacity" value={this.state.fogOpacity} size="2" />
					<label>
						<input type="radio" name="tool" value="fog" onChange={this.setTool} />
						fog
					</label>
					<label>
						<input type="radio" name="tool" value="move" onChange={this.setTool} />
						move
					</label>
					<input onChange={this.handleTextField} data-field="radius" value={this.state.radius} size="2" />
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
				<table>
					<tbody>
						<tr>
							<th>Maps {this.state.maps && this.state.maps.length}</th>
						</tr>
						<tr>
							<td>
								<input onChange={this.handleTextField} data-field="newMapName" value={this.state.newMapName} />
								<button onClick={this.addMap}>Add map</button>
								<ol>{ this.state.maps.map( item => <MapCpItem key={item.name} value={item} update={this.updateMapCpItems.bind(this)} maps={this.state.maps} load={this.loadMap.bind(this)} /> ) }</ol>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		)
	}

	renderCpNpcs () {
		return (
			<div id="npcs-cp">
			fds
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

	loadMap (map) {
		this.setState({map: map});
		this.drawMap(map);
	}

	resizeCanvases (w, h) {
		console.log('resizing canvas');
		document.querySelectorAll('canvas').forEach(canvas => {
			canvas.width = w || window.innerWidth;
			canvas.height = h || window.innerHeight;
		});
		fog.reset();
	}

	setTool (evt) {
		console.log(evt.target.value, evt.target);
		this.setState({ tool: evt.target.value });
		this.overlay.style.zIndex = evt.target.value == 'fog' ? 11 : 0;
	}
}

console.log('loaded src')

export default Game;
