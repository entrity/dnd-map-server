import { deepCopy } from './Helper.js';
import { NotificationManager } from 'react-notifications';
import 'react-notifications/lib/notifications.css';

class MapMethods {
	drawMap () {
		return new Promise((resolve, reject) => {
			if (!this.map) {
				NotificationManager.error('Tried to draw map, but `this.map` was missing', 'drawMap')
				return reject();
			}
			const canvas = this.mapCanvasRef.current;
			if (!this.map.url || this.map.url.trim().length === 0) {
				NotificationManager.info('Whiteboard');
				let w = canvas.width; canvas.width = w; /* clear (reset) canvas */
			} else {
				NotificationManager.info(this.map.url, 'Drawing map', 700);
				const ctx = canvas.getContext('2d');
				let img = new Image();
				img.onload = () => {
					this.resizeCanvases(img.width, img.height);
					ctx.drawImage(img, 0, 0);
					if (!this.state.isInitialLoadFinished) this.setState({isInitialLoadFinished: true});
					resolve();
				}
				img.onerror = () => {
					NotificationManager.error(`${img.src && img.src.substr(0,155)}...`, 'drawMap: bad url');
					console.error(`Unable to draw image`, img.src);
					reject();
				}
				img.src = this.map.url;
			}
		})
	}

	loadMap (map, edit='snapshots') {
		return new Promise((resolve, reject) => {
			if (!map) map = this.maps[0];
			if (!map) {
				NotificationManager.error('Attempted to load non-existant map', 'loadMap');
				console.error('Attempted to load non-existant map');
				reject();
			}
			/* Dump tokens' states */
			let oldMap = this.state.map;
			let tokens = deepCopy(this.tokens);
			if (oldMap && oldMap.name)
				this.dumpTokensForMap(oldMap.name, tokens);
			/* Load tokens' states */
			this.loadTokensForMap(map.name, tokens);
			/* Dump drawing's state */
			if (oldMap && oldMap.name)
				oldMap.drawingUrl = this.dumpDrawing();
			/* Set new state */
			let state = { map: map, edit: edit, fogLoaded: false, tokens: tokens };
			this.setState(state, ((arg) => {
				this.loadFog(this.map && this.map.fogUrl)
				.catch(() => { console.error('failed to loadfog') })
				.then(this.drawMap.bind(this))
				.then(() => {
					this.loadDrawing(); /* Load drawing's state*/
					resolve();
				});
			}));
		})
	}

  updateMap (idx, attrs) {
    let maps = deepCopy(this.maps);
    Object.assign(maps[idx], attrs);
    this.setState({maps: maps});
  }
}
export default MapMethods;
