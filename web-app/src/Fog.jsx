import React from 'react';

class Fog extends React.Component {
	constructor (props) {
		super(props);
		this.state = {};
	}

	componentDidMount () {
		this.resetFog();
		this.props.setCursor(0,0);
		let self = this;
		this.getFog().addEventListener('mousemove', evt => {
			let x = evt.offsetX, y = evt.offsetY;
			this.props.setCursor(x, y);
			if (self.state.isErasing) this.fogDot(x, y, 38);
		})
		this.getFog().addEventListener('mousedown', evt => {
			this.setState(Object.assign(self.state, {isErasing: true}));
			let x = evt.offsetX, y = evt.offsetY;
			this.props.setCursor(x, y);
			if (self.state.isErasing) this.fogDot(x, y, 38);
		})
		this.getFog().addEventListener('mouseup', evt => {
			this.setState(Object.assign(self.state, {isErasing: false}));
		})
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

    render () {
    	return (
    		<canvas id="canvas-fog" />
    	);
    }
}

export default Fog;
