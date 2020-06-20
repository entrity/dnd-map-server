import React from 'react';

/* Used for fog and draw. Should be not-displayed when tool is 'move' */

class Overlay extends React.Component {
  constructor (props) {
    super(props);
    this.myRef = React.createRef();
    this.state = {};
  }

  get game () { return this.props.game }

  componentDidMount () {
    const node = this.myRef.current;
    node.width = this.game.state.w;
    node.height = this.game.state.h;
    node.addEventListener('mousemove', this.onMouseMove.bind(this))
    node.addEventListener('mousedown', this.onMousedown.bind(this))
  }

  onMousedown (evt) {
    if (evt.buttons & 1) this.setState({lastX: evt.offsetX, lastY: evt.offsetY});
  }

  onMouseMove (evt) {
    this.clear();
    if (!this.game.state || !this.game.state.tool) return;
    let x = evt.offsetX, y = evt.offsetY;
    switch (this.game.state.tool) {
      case 'fog':
        if (evt.buttons & 1) this.game.fogErase(x, y);
        this.setPointerOutline(x, y, 'yellow', this.game.state.radius);
        break;
      case 'draw':
        if (evt.buttons & 1) {
          if (this.isEraser()) this.erase(x, y);
          else this.draw(x, y);
        }
        let color = this.game.state.pencilColor;
        this.setPointerOutline(x, y, color, this.game.state.drawSize);
        break;
      default: break;
    }
  }

  /* Get drawing context (different from this component's context) */
  get ctx () { return this.game.drawCanvasRef.current.getContext('2d') }

  isEraser () { return this.game.state.subtool === 'eraser' }
  isPencil () { return this.game.state.subtool === 'pencil' }

  clear () {
    let node = this.myRef.current;
    let w = node.width;
    node.width = w; /* reset */
  }

  draw (x, y) {
    let ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(this.state.lastX || x, this.state.lastY || y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = this.game.state.pencilColor;
    ctx.lineWidth = this.game.state.drawSize;
    ctx.stroke();
    this.setState({lastX: x, lastY: y});
  }

  erase (x, y) {
    let radius = this.game.state.drawSize;
    this.ctx.clearRect(x-radius, y-radius, radius*2, radius*2);
  }

  getContext () { return this.myRef.current.getContext('2d') }

  setPointerOutline (x, y, color, radius) {
    if (color == null) return;
    let ctx = this.getContext();
    ctx.strokeStyle = color;
    ctx.lineWidth = '2';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2*Math.PI);
    ctx.stroke();
    ctx.closePath();
  }

  render () {
    if (this.game.state.tool == 'move')
      return null;
    else
      return (<canvas id="overlay" ref={this.myRef} />);
  }
}

export default Overlay;
