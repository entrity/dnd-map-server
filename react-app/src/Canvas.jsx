import React from 'react';

class Canvas extends React.Component {
  constructor (props) {
    super(props);
    this.canvasRef = React.createRef();
  }

  get gameState () { return this.props.game.state }
  get h () { return this.getCanvas().height }
  get map () { return this.props.game.map }
  get w () { return this.getCanvas().width }

  getCanvas () { return this.canvasRef.current }
  getContext () { return this.getCanvas().getContext('2d') }

  drawImage (url) {
    return new Promise((resolve, reject) => {
      const ctx = this.getContext();
      const img = new Image();
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
      img.src = url;
    });
  }
}

export default Canvas;
