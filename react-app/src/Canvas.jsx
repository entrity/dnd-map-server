import React from 'react';

class Canvas extends React.Component {
  constructor (props) {
    super(props);
    this.canvasRef = React.createRef();
  }

  buildDataUrl () { return this.getCanvas().toDataURL('image/webp', 0.5) }

  clear () {
    let node = this.canvasRef.current;
    let w = node.width;
    node.width = w; /* reset */
  }

  get gameState () { return this.props.game.state }
  get h () { return this.getCanvas().height }
  get map () { return this.props.game.map }
  get w () { return this.getCanvas().width }

  getCanvas () { return this.canvasRef.current }

  getContext () { return this.getCanvas().getContext('2d') }

  drawImage (url, which) {
    /* Handle 'whiteboard' (no bg img) */
    if (!url || url.trim().length === 0) {
      if (this.resizeCanvases) this.resizeCanvases(); /* Clear canvas */
      return Promise.resolve(this.map.w, this.map.h);
    }
    /* Handle ordinary image */
    return new Promise((resolve, reject) => {
      const ctx = this.getContext();
      const img = new Image();
      img.onload = () => {
        let w = this.map.w;
        let h = this.map.h;
        if (!w && !h) {
          w = img.width;
          h = img.height;
        } else if (!w)
          w = h * img.width / img.height;
        else if (!h)
          h = w * img.height / img.width;
        const promise = this.resizeCanvases ? this.resizeCanvases(w, h) : Promise.resolve();
        promise.then(() => {
          ctx.drawImage(img, this.map.x || 0, this.map.y || 0, w, h);
          resolve(w, h);
        });
      }
      img.onerror = (err) => {
        console.error(`Unable to draw image.`, img.src);
        if (which) {
          console.error(`Deleting ${which}Url...`);
          this.props.game.updateMap(map => delete map[`${which}Url`]);
        }
        reject(`Unable to draw ${which}Url`);
      }
      img.src = url;
    });
  }
}

export default Canvas;
