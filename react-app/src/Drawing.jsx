import React from 'react';
import Canvas from './Canvas.jsx';

class Drawing extends Canvas {

  load () {
    const dataUrl = this.props.game.map.drawUrl;
    if (dataUrl)
      return this.drawImage(dataUrl, 'draw');
    else
      return Promise.resolve();
  }

  render () {
    return <canvas id="draw" ref={this.canvasRef} className="passthrough" />;
  }
}
export default Drawing;
