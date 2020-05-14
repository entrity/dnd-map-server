import React from 'react';

class Token extends React.Component {
  constructor (props) {
    super(props);
    this.myRef = React.createRef();
    this.onDrag = this.onDrag.bind(this);
  }

  componentDidMount () {
    const node = this.myRef.current;    
    node.addEventListener('click', this.onClick.bind(this));
    node.addEventListener('mouseover', this.onMouseUp.bind(this));
    node.addEventListener('mouseout', this.onMouseUp.bind(this));
    node.addEventListener('mousedown', this.onMouseDown.bind(this));
    node.addEventListener('mouseup', this.onMouseUp.bind(this));
  }

  onClick (evt) {
    this.onMouseDown(evt);
    this.onMouseUp(evt);
  }
  onDrag (evt) {
    console.log(this.startX, evt.pageX, evt.offsetX, evt.clientX)
    let obj = Object.assign(this.props.obj, {
      x: evt.pageX - this.startX,
      y: evt.pageY - this.startY,
    });
    console.log(obj)
    this.props.update(obj);
  }
  onMouseDown (evt) {
    this.props.select(this.props.obj)
    this.myRef.current.addEventListener('mousemove', this.onDrag);
    console.log('aded histener')
    this.startX = evt.pageX - evt.target.offsetLeft;
    this.startY = evt.pageY - evt.target.offsetTop;
  }
  onMouseUp (evt) {
    this.myRef.current.removeEventListener('mousemove', this.onDrag);
    console.log('---- histener')
  }

  render () {
    return (
      <div ref={this.myRef}
        className={this.props.selected ? 'selected' : ''}
        style={{top: this.props.obj.y, left: this.props.obj.x}}>
        <img src={this.props.obj.url} alt={this.props.obj.name} className="passthrough" />
      </div>  
    );
  }
}

export default Token;
