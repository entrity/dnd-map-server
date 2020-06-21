import React from 'react';

class Fog extends React.Component {

  load () {
    console.error('todo')
  }

  render () {
    return <canvas id="fog" className="passthrough" style={{opacity: this.props.game.state.fogOpacity}} />;
  }
}
export default Fog;
