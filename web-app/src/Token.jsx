import React from 'react';

class Token extends React.Component {
  constructor (props) {
    super(props);
    this.myRef = React.createRef();
    this.state = {};
  }

  get canGrab () { return this.token.pc || this.game.isHost }
  get game () { return this.props.game }
  get token () { return this.props.token }

  componentDidMount () {
    const node = this.myRef.current;
    node.addEventListener('mousedown', this.onMouseDown.bind(this));
  }

  onMouseDown (evt) {
    if (!this.token.isSelected)
      this.game.selectToken(this.props.index, evt);
  }

  render () {
    let klass = [
      this.token.isSelected ? 'selected' : '',
      this.token.pc ? 'pc' : 'npc',
      this.canGrab ? 'grabbable' : '',
      'token',
    ].join(' ');
    let imgKlass = [
      this.token.dead ? 'dead' : '',
      'token passthrough',
    ].join(' ');
    return (
      <div ref={this.myRef}
        className={klass}
        style={{top: this.token.y||0, left: this.token.x||0}}>
        <img
          style={{height: this.token.h, width: this.token.w}}
          src={this.token.url}
          alt={this.token.name}
          className={imgKlass} />
      </div>  
    );
  }
}

export default Token;
