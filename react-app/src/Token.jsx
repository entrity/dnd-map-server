import React from 'react';

class Token extends React.Component {
  constructor (props) {
    super(props);
    this.state = {};
  }

  onMouseUp (evt) {
    if (this.state.was)
      this.props.game.selectToken(this.props.token, false, evt.ctrlKey);
  }

  onMouseDown (evt) {
    this.setState({was: this.props.token.$selected});
    if (!this.props.token.$selected)
      this.props.game.selectToken(this.props.token, true, evt.ctrlKey);
  }

  render () {
    const mapId = this.props.game.state.mapId;
    const token = this.props.token;
    if (!token.url || !token.url.trim()) return null;
    if ([undefined, null, mapId].indexOf(token.mapId) >= 0) {
      const klasses = ['token',
        token.pc ? 'pc' : 'npc',
        token.$selected && 'selected',
      ];
      const divStyle = {
        left: token.x || 0,
        top: token.y || 0,
      };
      const imgStyle = {
        width: token.w || undefined,
        height: token.h || undefined,
      };
      return <div
        style={divStyle}
        title={token.name}
        className={klasses.join(' ')}
        onMouseUp={this.onMouseUp.bind(this)}
        onMouseDown={this.onMouseDown.bind(this)}>
        <img src={token.url} alt={token.name||''} style={imgStyle} />
      </div>
    } else return null;
  }
}
export default Token;
