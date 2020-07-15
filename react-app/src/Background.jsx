import React from 'react';
import Canvas from './Canvas.jsx';

class Background extends Canvas {

  load () {
    if (!this.map) {
      /* Handle missing map */
      console.error('no map');
      // NotificationManager.error(`Tried to draw map, but \`this.map\` was missing (${this.state.mapId})`, 'drawMap')
      return Promise.reject();
    }
    return this.drawImage(this.map.url);
  }

  onClick (evt) {
    this.props.game.cpRef.current.setState({
      toggleOnMaps: false,
      toggleOnTokens: false,
    });
    this.props.game.updateTokens(token => token.$selected = false);
  }

  resizeCanvases (w, h) {
    return new Promise((resolve, reject) => {
      if (!w) w = (this.map && this.map.w) || window.innerWidth;
      if (!h) h = (this.map && this.map.h) || window.innerHeight;
      let canvases = document.querySelectorAll('canvas');
      if (canvases[0].width === w || canvases[0].height === h)
        resolve(w, h);
      else
        this.props.game.setState({ w: w, h: h, isFogLoaded: false }, () => {
          canvases.forEach(canvas => { canvas.width = w; canvas.height = h; });
          resolve(w, h);
        });
    });
  }

  render () {
    return <canvas id="bg" ref={this.canvasRef} onClick={this.onClick.bind(this)} />;
  }
}
export default Background;
