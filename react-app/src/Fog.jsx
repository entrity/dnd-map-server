import React from 'react';
import Canvas from './Canvas.jsx';

class Fog extends Canvas {

  fill () {
    const ctx = this.getContext();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, this.w, this.h);
    return Promise.resolve();
  }

  load () {
    const dataUrl = this.props.game.map.fogUrl;
    return dataUrl ? this.drawImage(dataUrl) : this.fill();
  }

  render () {
    return <canvas id="fog" ref={this.canvasRef} className="passthrough" style={{opacity: this.gameState.fogOpacity}} />;
  }
}
export default Fog;
