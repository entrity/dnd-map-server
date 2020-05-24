
class FogMethods {
	fogReset (opts) {
		resetFog();
		this.setState({fogLoaded: true});
		if (!opts || !opts.noEmit) this.state.websocket.sendFre();
	}

	fogErase (x, y, radius, noEmit) {
		if (!radius) radius = this.state.radius;
		fogErase(x, y, radius);
		if (!noEmit) this.state.websocket.sendFog(x, y, radius);
	}

	fogUrl () { return getFogCanvas().toDataURL('image/webp', 0.25) }
	loadFog (dataUrl) {
		console.log('called loadFogUrl', dataUrl && dataUrl.substr(0, 55))
		let ctx = getFogContext('2d');
		ctx.globalCompositeOperation = 'destination-over';
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, 9999, 9999);
		return new Promise((resolve, reject) => {
			if (dataUrl) {
				let img = new Image();
				img.onload = () => {
					ctx.clearRect(0, 0, img.width, img.height);
					ctx.globalCompositeOperation = 'destination-over';
					ctx.drawImage(img, 0, 0);
					this.setState({fogLoaded: true});
					resolve();
				}
				img.src = dataUrl;
			} else {
				this.setState({fogLoaded: true});
				resolve();
			}
		});
	}
}

/* Legacy */
function fogErase (x, y, r, r2) {
	let context = getFogContext();
	if (!context) return;
	context.globalCompositeOperation = 'destination-out';
	let grad = context.createRadialGradient(x,y,r2||1, x,y,r*0.75);
	grad.addColorStop(0, 'rgba(0,0,0,255)');
	grad.addColorStop(1, 'rgba(0,0,0,0)');
	context.fillStyle = grad;
	context.fillRect(x-r,y-r,x+r,y+r);
	context.globalCompositeOperation = 'destination-over';
}
function getFogCanvas () { return document.getElementById('canvas-fog') }
function getFogContext () {
	let canvas = getFogCanvas();
	return canvas && canvas.getContext('2d');
}
function resetFog () {
	let context = getFogContext();
	if (!context) return;
	getFogCanvas().style.border = '3px dashed red'
	context.globalCompositeOperation = 'destination-over';
	context.fillStyle = 'black';
	context.fillRect(0, 0, 9999, 9999);
}

export default FogMethods;
