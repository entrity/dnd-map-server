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

  fogErase (x, y, r, r2) {
    const ctx = this.fogCtx;
    if (!r) r = this.props.game.state.fogRadius;
    ctx.globalCompositeOperation = 'destination-out';
    let grad = ctx.createRadialGradient(x,y,r2||1, x,y,r*0.75);
    grad.addColorStop(0, 'rgba(0,0,0,255)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x-r,y-r,x+r,y+r);
    ctx.globalCompositeOperation = 'destination-over';
  }

  draw (x, y) {
    const game = this.props.game;
    const ctx = this.drawCtx;
    ctx.beginPath();
    ctx.moveTo(this.state.lastX || x, this.state.lastY || y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = game.state.drawColor;
    ctx.lineWidth = game.state.drawSize;
    ctx.stroke();
    this.setState({lastX: x, lastY: y});
  }

  erase (x, y) {
    let radius = this.props.game.state.drawSize;
    this.drawCtx.clearRect(x-radius, y-radius, radius*2, radius*2);
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

  onMouseDown (evt) {
    if (evt.buttons & 1) this.setState({lastX: evt.pageX, lastY: evt.pageY});
  }

  onMouseMove (evt) {
    this.clear();
    const game = this.props.game;
    if (!game.state || !game.state.tool) return;
    let x = evt.pageX, y = evt.pageY;
    switch (game.state.tool) {
      case 'fog':
        if (evt.buttons & 1) this.fogErase(x, y);
        this.setPointerOutline(x, y, 'yellow', game.state.fogRadius);
        break;
      case 'draw':
        if (evt.buttons & 1) {
          if (this.isEraser()) this.erase(x, y);
          else this.draw(x, y);
        }
        let color = game.state.drawColor;
        this.setPointerOutline(x, y, color, game.state.drawSize);
        break;
      default: break;
    }
  }

  render () {
    return <canvas id="overlay"
      ref={this.canvasRef}
      onMouseMove={this.onMouseMove.bind(this)}
      onMouseDown={this.onMouseDown.bind(this)}
    />;
  }
}
export default Overlay;
