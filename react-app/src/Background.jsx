import React from 'react';
import Canvas from './Canvas.jsx';

class Background extends Canvas {

  load () {
    console.log('bg load', this.map);
    if (!this.map) {
      /* Handle missing map */
      console.error('no map');
      // NotificationManager.error(`Tried to draw map, but \`this.map\` was missing (${this.state.mapId})`, 'drawMap')
      return Promise.reject();
    }
    /* Handle 'whiteboard' (no bg img) */
    if (!this.map.url || this.map.url.trim().length === 0)
      return Promise.resolve(this.map.w, this.map.h);
    /* Handle map with background */
    else
      return this.drawImage(this.map.url);
  }

  buildDataUrl () {
    throw new Error('not implemented');
  }

  onClick () {
    this.props.game.setState({
      showMapsMenu: false,
      showTokensMenu: false,
    });
  }

  resizeCanvases (w, h) {
    return new Promise((resolve, reject) => {
      if (!w) w = (this.map && this.map.w) || window.innerWidth;
      if (!h) h = (this.map && this.map.h) || window.innerHeight;
      let canvases = document.querySelectorAll('canvas');
      if (canvases[0].width === w || canvases[0].height === h)
        resolve();
      else
        this.props.game.setState({ w: w, h: h, isFogLoaded: false }, () => {
          canvases.forEach(canvas => { canvas.width = w; canvas.height = h; });
          resolve();
        });
    });
  }

  render () {
    return <canvas id="bg" ref={this.canvasRef} onClick={this.onClick.bind(this)} />;
  }
}
export default Background;
