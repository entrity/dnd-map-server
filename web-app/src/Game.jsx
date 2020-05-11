import React from 'react';
import Fog from './Fog.jsx';

class Game extends React.Component {
	ws = new WebSocket('ws://localhost:8000/');

	constructor (props) {
		super(props);
		this.isHost = !!props.host;
		this.resizeCanvases = this.resizeCanvases.bind(this);
		this.setMap = this.setMap.bind(this);
		this.setCursor = this.setCursor.bind(this);
		this.fog = React.createRef();
		this.selfRef = React.createRef();
		this.state = {};
	}

	componentDidMount () {
		/* Define websockets callbacsk */
		this.ws.onopen = () => {
			console.log('opened WebSocket');
		}
		this.ws.onmessage = evt => {
			console.log('got msg', evt.data);
		}
		this.ws.onclose = () => {
			console.log('closed');
		}
		setInterval( _ =>{
	        this.ws.send( Math.random() )
	    }, 2000 )
	    this.resizeCanvases();
	    /* Define window callbacks */
	    window.addEventListener('resize', this.resizeCanvases);
	    /* Define canvas callbacks */
	}

	draw (img, canvasId) {
		console.log(`drawing to ${canvasId}`);
		let canvas = document.getElementById(canvasId || 'canvas-map');
		let context = canvas.getContext('2d');
		context.drawImage(img, 0, 0);
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

	render() {
	    return (
	    	<div style={{"position": "relative"}}>
				<canvas id="canvas-map" />
				<canvas id="canvas-npcs" />
				<Fog ref={this.selfRef} setCursor={this.setCursor} />
				<canvas id="canvas-pcs" />
			    <div id="control-panel">
					<input type='file' id='file-select' />
					<button onClick={this.setMap}>Sm</button>
					<button onClick={this.resetFog}>Rf</button>
					<span>X {this.state.x} / Y {this.state.y}</span>
			    </div>
			</div>
	    );
    }

    getFog () { return document.getElementById('canvas-fog') }
    resetFog () { this.selfRef.current && this.selfRef.current.resetFog() }

    resizeCanvases () {
    	console.log('resizing canvas');
    	document.querySelectorAll('canvas').forEach(canvas => {
    		canvas.width = (this.map && this.map.width) || window.innerWidth;
    		canvas.height = (this.map && this.map.height) || window.innerHeight;
    	});
    	this.resetFog();
    }

	setMap (evt) {
		this.getImg(img => {
			this.map = img;
			this.resizeCanvases();
			this.draw(img);
		});
	}

	setCursor (x, y) {
		this.setState({ x: x, y: y, })
	}
}

console.log('loaded src')

export default Game;
