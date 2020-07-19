import React from 'react';
import Canvas from './Canvas.jsx';

class Fog extends Canvas {

  fill () {
    const ctx = this.getContext();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, this.w, this.h);
    this.props.game.updateMap(map => map.$fogChangedAt = new Date());
    return Promise.resolve();
  }

  load () {
    const dataUrl = this.props.game.map.fogUrl;
    if (dataUrl) {
      return new Promise((resolve, reject) => {
        return this.drawImage(dataUrl, 'fog')
        .then(resolve)
        .catch(() => this.fill().then(resolve));
      });
    } else return this.fill();
  }

  render () {
    const fogOpacity = this.props.game.isHost ? this.gameState.fogOpacity : 1;
    return <canvas id="fog" ref={this.canvasRef} className="passthrough" style={{opacity: fogOpacity}} />;
  }
}
export default Fog;
