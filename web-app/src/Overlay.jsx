import React from 'react';

class Overlay extends React.Component {
  constructor (props) {
    super(props);
    this.myRef = React.createRef();
  }

  componentDidMount () {
    const node = this.myRef.current;
    node.width = this.props.width;
    node.height = this.props.height;
    node.addEventListener('click', this.onClick.bind(this))
    node.addEventListener('mousemove', this.onMouseMove.bind(this))
    node.addEventListener('mousedown', this.onMouseDown.bind(this))
    node.addEventListener('mouseUp', this.onMouseUp.bind(this))
  }

  onMouseMove (evt) {
    let x = evt.offsetX, y = evt.offsetY;
    this.setState({x: x, y: y});
    this.setPointerOutline();
    if (this.state.clickOn) this.props.fogErase(x, y);
  }

  onMouseUp (evt) { this.setState({ clickOn: false }) }

  onMouseDown (evt) { this.setState({ clickOn: true }) }

  onClick (evt) { this.props.fogErase(evt.offsetX, evt.offsetY) }

  setPointerOutline () {
    const node = this.myRef.current;
    node.width = node.width;
    let ctx = node.getContext('2d');
    ctx.strokeStyle = 'yellow'
    ctx.lineWidth = '2'
    ctx.beginPath();
    ctx.arc(this.state.x, this.state.y, this.props.radius, 0, 2*Math.PI);
    ctx.stroke();
    ctx.closePath();
  }

  render () {
    return (<canvas id="overlay" ref={this.myRef} />);
  }
}

export default Overlay;
