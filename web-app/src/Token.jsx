import React from 'react';

class Token extends React.Component {
  constructor (props) {
    super(props);
    this.myRef = React.createRef();
    this.onDrag = this.onDrag.bind(this);
  }

  get game () { return this.props.game }
  get token () { return this.props.token }

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
    let obj = Object.assign(this.token, {
      x: evt.pageX - this.startX,
      y: evt.pageY - this.startY,
    });
    this.game.updateToken(obj);
  }
  onMouseDown (evt) {
    this.game.selectToken(this.props.index);
    this.myRef.current.addEventListener('mousemove', this.onDrag);
    this.startX = evt.pageX - evt.target.offsetLeft;
    this.startY = evt.pageY - evt.target.offsetTop;
  }
  onMouseUp (evt) {
    this.myRef.current.removeEventListener('mousemove', this.onDrag);
  }

  render () {
    let klass = [
      this.props.selected ? 'selected' : '',
      this.token.pc ? 'pc' : '',
      'token'
    ].join(' ');
    let imgKlass = [
      this.token.dead ? 'dead' : '',
      'token passthrough',
    ].join(' ');
    return (
      <div ref={this.myRef}
        className={klass}
        style={{top: this.token.y, left: this.token.x}}>
        <img
          src={this.token.url}
          alt={this.token.name}
          className={imgKlass} />
      </div>  
    );
  }
}

export default Token;
