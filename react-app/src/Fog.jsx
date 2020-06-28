import React from 'react';
import Canvas from './Canvas.jsx';

class Fog extends Canvas {

  load () {
    const dataUrl = this.gameState.fogUrl;
    if (dataUrl)
      return this.drawImage(dataUrl);
    else {
      const ctx = this.getContext();
      ctx.globalCompositeOperation = 'destination-over';
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, this.w, this.h);
      return Promise.resolve();
    }
  }

  render () {
    return <canvas id="fog" ref={this.canvasRef} className="passthrough" style={{opacity: this.gameState.fogOpacity}} />;
  }
}
export default Fog;
