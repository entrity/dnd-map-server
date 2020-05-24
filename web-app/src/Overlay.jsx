import React from 'react';

class Overlay extends React.Component {
  constructor (props) {
    super(props);
    this.myRef = React.createRef();
  }

  get game () { return this.props.game }
  get className () { return this.game.state.tool !== 'fog' ? 'gone' : '' }

  componentDidMount () {
    const node = this.myRef.current;
    console.log('Overlaid')
    node.width = this.game.state.w;
    node.height = this.game.state.h;
    node.addEventListener('mousemove', this.onMouseMove.bind(this))
  }

  onMouseMove (evt) {
    let x = evt.offsetX, y = evt.offsetY;
    this.setState({x: x, y: y});
    this.setPointerOutline();
    if (this.state.clickOn) this.game.fogErase(x, y);
  }

  setPointerOutline () {
    const node = this.myRef.current;
    let w = node.width; node.width = w; /* reset */
    let ctx = node.getContext('2d');
    ctx.strokeStyle = 'yellow'
    ctx.lineWidth = '2'
    ctx.beginPath();
    ctx.arc(this.state.x, this.state.y, this.game.state.radius, 0, 2*Math.PI);
    ctx.stroke();
    ctx.closePath();
  }

  render () {
    return (<canvas id="overlay" ref={this.myRef} className={this.className} />);
  }
}

export default Overlay;
