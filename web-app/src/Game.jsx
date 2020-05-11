import React from 'react';

class Game extends React.Component {
	ws = new WebSocket('ws://localhost:8000/');

	constructor (props) {
		super(props);
		this.isHost = !!props.host;
		this.resizeCanvases = this.resizeCanvases.bind(this);
		this.setMap = this.setMap.bind(this);
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
		console.log('rendering rgame')
	    return (
	    	<div style={{"position": "relative"}}>
				<canvas id="canvas-map" />
				<canvas id="canvas-npcs" />
				<canvas id="canvas-fog" />
				<canvas id="canvas-pcs" />
			    <div id="control-panel">
					<input type='file' id='file-select' />
					<button onClick={this.setMap}>Sm</button>
					<button onClick={this.resetFog}>Rf</button>
			    </div>
			</div>
	    );
    }

    getFog () { return document.getElementById('canvas-fog') }

    /* Fuzzy erase a circle of fog */
    fogDot (x, y, r, r2) {
    	let context = this.getFog().getContext('2d');
    	context.globalCompositeOperation = 'destination-out';
    	let grad = context.createRadialGradient(x,y,r2||1, x,y,r*0.75);
    	grad.addColorStop(0, 'rgba(0,0,0,255)');
    	grad.addColorStop(1, 'rgba(0,0,0,0)');
    	context.fillStyle = grad;
    	context.fillRect(x-r,y-r,x+r,y+r);
    	context.globalCompositeOperation = 'destination-over';
    }

    resetFog () {
    	console.log('setting fog');
    	let context = this.getFog().getContext('2d');
    	this.getFog().style.border = '3px dashed red'
		this.getFog().style.opacity = 0.75;
    	context.globalCompositeOperation = 'destination-over';
    	context.fillStyle = 'black';
    	context.fillRect(0, 0, 9999, 9999);
    	this.fogDot(111,111,88);
    	this.fogDot(111,161,88);
    	this.fogDot(141,111,88);
    }

    resizeCanvases () {
    	console.log('resizing canvas');
		this.resetFog();
    	document.querySelectorAll('canvas').forEach(canvas => {
    		canvas.width = (this.map && this.map.width) || window.innerWidth;
    		canvas.height = (this.map && this.map.height) || window.innerHeight;
    	});
		this.resetFog();
    }

	setMap (evt) {
		this.getImg(img => {
			this.map = img;
			this.resetFog();
			this.resizeCanvases();
			this.draw(img);
			this.resetFog();
		});
	}
}

console.log('loaded src')

export default Game;
