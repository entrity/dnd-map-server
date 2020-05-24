class FogMethods {
	fogReset (opts) {
		resetFog();
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
		fogErase(x, y, radius);
		this.updateMap({fog: dots});
		if (!noEmit) this.state.websocket.sendFog(x, y, radius);
	}
}

/* Legacy */
function fogErase (x, y, r, r2) {
	let context = getContext();
	if (!context) return;
	context.globalCompositeOperation = 'destination-out';
	let grad = context.createRadialGradient(x,y,r2||1, x,y,r*0.75);
	grad.addColorStop(0, 'rgba(0,0,0,255)');
	grad.addColorStop(1, 'rgba(0,0,0,0)');
	context.fillStyle = grad;
	context.fillRect(x-r,y-r,x+r,y+r);
	context.globalCompositeOperation = 'destination-over';
}
function getFog () { return document.getElementById('canvas-fog') }
function getContext () {
	let canvas = getFog();
	return canvas && canvas.getContext('2d');
}
function resetFog () {
	let context = getContext();
	if (!context) return;
	getFog().style.border = '3px dashed red'
	context.globalCompositeOperation = 'destination-over';
	context.fillStyle = 'black';
	context.fillRect(0, 0, 9999, 9999);
}

export default FogMethods;
