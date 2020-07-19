import React from 'react';
import Canvas from './Canvas.jsx';

class Overlay extends Canvas {
  constructor (props) {
    super(props);
    this.state = {};
  }

  /* Get drawing context (different from this component's context) */
  get drawCtx () { return this.props.game.drawRef.current.canvasRef.current.getContext('2d') }
  get fogCtx () { return this.props.game.fogRef.current.canvasRef.current.getContext('2d') }

  fogErase (x, y, r, r2, noEmit) {
    const ctx = this.fogCtx;
    if (!r) r = this.props.game.state.fogRadius;
    ctx.globalCompositeOperation = 'destination-out';
    let grad = ctx.createRadialGradient(x,y,r2||1, x,y,r*0.75);
    grad.addColorStop(0, 'rgba(0,0,0,255)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x-r,y-r,x+r,y+r);
    ctx.globalCompositeOperation = 'destination-over';
    this.props.game.updateMap(map => map.$fogChangedAt = new Date());
    if (!noEmit) this.props.game.websocket.pushFogErase(x, y, r, r2);
  }

  drawOrErase (x, y) {
    if (this.isEraser()) this.erase(x, y);
    else this.draw(x, y);
    this.props.game.updateMap(map => map.$drawChangedAt = new Date());
  }

  draw (x, y, opts, noEmit) {
    const game = this.props.game;
    const ctx = this.drawCtx;
    opts = Object.assign({
      x: x, y: y,
      color: game.state.drawColor,
      size: game.state.drawSize,
      x0: this.state.lastX || x,
      y0: this.state.lastY || y,
    }, opts);
    ctx.beginPath();
    ctx.moveTo(opts.x0, opts.y0);
    ctx.lineTo(x, y);
    ctx.strokeStyle = opts.color;
    ctx.lineWidth = opts.size;
    ctx.stroke();
    if (!noEmit) {
      this.setState({lastX: x, lastY: y});
      this.props.game.websocket.pushDraw(opts);
    }
  }

  erase (x, y, r, noEmit) {
    const radius = r || this.props.game.state.drawSize;
    this.drawCtx.clearRect(x-radius, y-radius, radius*2, radius*2);
    if (!noEmit) this.props.game.websocket.pushErase(x, y, radius);
  }

  isEraser () { return this.props.game.state.subtool === 'eraser' }

  setPointerOutline (x, y, color, radius) {
    if (color == null) return;
    const ctx = this.canvasRef.current.getContext('2d');
    ctx.strokeStyle = color;
    ctx.lineWidth = '3';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2*Math.PI);
    ctx.stroke();
    ctx.closePath();
  }

  render () {
    let klass;
    switch (this.props.game.state.tool) {
      case 'fog':
      case 'draw':
        klass = ''
        break;
      default:
        klass = 'gone';
    }
    return <canvas id="overlay" ref={this.canvasRef} className={klass} />;
  }
}
export default Overlay;
