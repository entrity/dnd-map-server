import { deepCopy } from './Helper.js';
import { NotificationContainer, NotificationManager } from 'react-notifications';
import 'react-notifications/lib/notifications.css';

class MapMethods {
	drawMap () {
		return new Promise((resolve, reject) => {
			if (!this.map || !this.map.url) {
				NotificationManager.error('Tried to draw map, but `this.map` or `this.map.url` was missing', 'drawMap')
				reject();
			}
			let img = new Image();
			const ctx = this.mapCanvasRef.current.getContext('2d');
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
			let state = { map: map, edit: edit, fogLoaded: false, tokens: tokens };
			this.setState(state, ((arg) => {
				this.loadFog(this.map && this.map.fogUrl)
				.catch(() => { console.error('failed to loadfog') })
				.then(this.drawMap.bind(this))
				.then(() => { resolve() });
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
