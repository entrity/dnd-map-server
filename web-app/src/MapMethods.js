import { deepCopy } from './Helper.js';
import { NotificationManager } from 'react-notifications';
import 'react-notifications/lib/notifications.css';

class MapMethods {
  drawMap () {
    return new Promise((resolve, reject) => {
      if (!this.map) {
        NotificationManager.error(`Tried to draw map, but \`this.map\` was missing (${this.state.mapIndex})`, 'drawMap')
        return reject();
      }
      this.resizeCanvases();
      const mapCanvas = this.mapCanvasRef.current;
      if (!this.map.url || this.map.url.trim().length === 0) {
        resolve();
      } else {
        NotificationManager.info(this.map.url, 'Drawing map', 700);
        const ctx = mapCanvas.getContext('2d');
        let img = new Image();
        img.onload = () => {
          let w = this.map.w || img.width;
          let h = this.map.h || img.height;
          this.resizeCanvases(img.width, this.map.h || img.height);
          ctx.drawImage(img, this.map.x || 0, this.map.y || 0, w, h);
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

  loadMap (mapIndex) {
    return new Promise((resolve, reject) => {
      if (mapIndex === undefined) mapIndex = this.state.mapIndex || 0;
      let map = this.maps[mapIndex];
      if (!map) {
        NotificationManager.error(`Attempted to load non-existant map ${mapIndex}`, 'loadMap');
        console.error('Attempted to load non-existant map');
        if (!this.maps.length)
          reject();
        else
          map = this.maps[0];
      }
      /* Dump tokens' states */
      let oldMap = this.map;
      let tokens = deepCopy(this.tokens);
      if (oldMap && oldMap.name)
        this.dumpTokensForMap(oldMap.name, tokens);
      /* Load tokens' states */
      this.loadTokensForMap(map.name, tokens);
      /* Dump drawing's state */
      if (oldMap && this.state.isInitialLoadFinished)
        oldMap.drawingUrl = this.dumpDrawing();
      /* Set new state */
      let state = { mapIndex: mapIndex, fogLoaded: false, tokens: tokens };
      this.setState(state, (() => {
        this.loadFog(this.map && this.map.fogUrl)
        .catch(() => { console.error('failed to loadfog') })
        .then(this.drawMap.bind(this))
        .then(() => {
          this.loadDrawing(); /* Load pencil drawing's state */
          /* Finish */
          if (!this.state.isInitialLoadFinished) {
            this.setState({isInitialLoadFinished: true}, () => {
              NotificationManager.success('Initial load completed');
            });
          }
          resolve();
        });
      }));
    })
  }

  updateMap (idx, attrs) {
    return new Promise((resolve, reject) => {
      let maps = deepCopy(this.maps);
      Object.assign(maps[idx], attrs);
      this.setState({maps: maps}, () => { resolve(this) });
    });
  }

  dumpDrawing () { return this.drawCanvasRef.current.toDataURL('image/jpg', 0.6) }

  loadDrawing () {
    let dataUrl = this.map.drawingUrl;
    console.log(this.map.url || 'Whiteboard', !!this.map.drawingUrl)
    this.clearDrawing();
    if (dataUrl) {
      let ctx = this.drawCanvasRef.current.getContext('2d');
      return new Promise((resolve, reject) => {
          let img = new Image();
          img.onload = () => { ctx.drawImage(img, 0, 0); resolve() }
          img.src = dataUrl;
      });
    }
  }

  clearDrawing (needConfirmation) {
    if (needConfirmation && !window.confirm('Really delete this drawing?')) return;
    const drawCanvas = this.drawCanvasRef.current;
    let w = drawCanvas.width; drawCanvas.width = w; /* clear (reset) canvas */
  }
}
export default MapMethods;
