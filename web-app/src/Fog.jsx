/* Fuzzy erase a circle of fog */
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
	getFog().style.opacity = 0.75;
	context.globalCompositeOperation = 'destination-over';
	context.fillStyle = 'black';
	context.fillRect(0, 0, 9999, 9999);
}
export const fog = {
	reset: resetFog,
	erase: fogErase,
};
export default fog;
window.fogErase = fogErase