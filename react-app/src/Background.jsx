import React from 'react';

class Background extends React.Component {

  constructor (props) {
    super(props);
    this.canvasRef = React.createRef();
  }

  get map () { return this.props.game.map }

  load () {
    console.log('bg load', this.map);
    return new Promise((resolve, reject) => {
      /* Handle missing map */
      if (!this.map) {
        // NotificationManager.error(`Tried to draw map, but \`this.map\` was missing (${this.state.mapId})`, 'drawMap')
        console.error('no map');
        return reject();
      }
      this.resizeCanvases();
      /* Handle 'whiteboard' (no bg img) */
      if (!this.map.url || this.map.url.trim().length === 0)
        resolve(this.map.w, this.map.h);
      /* Handle map with background */
      else {
        // NotificationManager.info(this.map.url, 'Drawing map', 700);
        const ctx = this.canvasRef.current.getContext('2d');
        let img = new Image();
        img.onload = () => {
          let w = this.map.w || img.width;
          let h = this.map.h || img.height;
          this.resizeCanvases(w, h);
          ctx.drawImage(img, this.map.x || 0, this.map.y || 0, w, h);
          resolve(w, h);
        }
        img.onerror = () => {
          // NotificationManager.error(`${img.src && img.src.substr(0,155)}...`, 'drawMap: bad url');
          console.error(`Unable to draw image`, img.src);
          reject();
        }
        img.src = this.map.url;
      }
    })
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
