import React from 'react';
import CpMap from './cp/Map.jsx';

class ControlPanel extends React.Component {
  constructor (props) {
    super(props);
    this.state = {};
  }

  get game () { return this.props.game }
  get maps () { return this.game && this.game.state.maps }
  get mapsN () { return this.maps && Object.keys(this.maps).length }

  handleCheckbox (key, evt) { this.setState({ [key]: evt.target.checked }) }
  handleLocalText (key, evt) { this.setState({ [key]: evt.target.value.trim() })}

  handleText (key, evt) { this.game.setState({[key]: evt.target.value}) }
  setTool (tool) { this.game.setState({tool: tool}) }

  addMap () {
    if (!this.state.newMapName || this.state.newMapName.trim() === '') return;
    let maps = Object.assign(this.maps || {});
    maps[[this.state.newMapName.trim()]] = {};
    this.game.setState({maps: maps});
  }
  updateMapConfig (idx, map) {
    let maps = this.props.state.maps.slice();
    maps[idx] = Object.assign(map);
    this.game.setState({maps: maps});
  }
  deleteMap (map) {
    let maps = this.props.state.maps.filter(item => {
      return item.name !== map.name
    });
    this.props.setState({maps: maps});
  }

  reset () {
    if (window.confirm('Delete local storage?')) {
      localStorage.clear();
      window.location.reload();
    }
  }

  render () {
    return (
      <div>
        <div>
          <label>
            <input type="checkbox" onChange={this.handleCheckbox.bind(this, 'showMaps')} />
            Maps...
          </label>
          <button onClick={this.game.fogReset.bind(this.game)}>Reset Fog</button>
          <button onClick={this.reset.bind(this)}>RESET</button>
          <input onChange={this.handleText.bind(this, 'fogOpacity')} value={this.game.state.opacity} size="2" placeholder="fog" />
          {this.renderEditControls()}
          <input onChange={this.handleText.bind(this, 'radius')} value={this.game.state.radius} size="2" placeholder="radius" />
        </div>
        {this.renderMaps()}
      </div>
    )
  }

  renderEditControls () {
    switch (this.game.state.edit) {
    case 'pristine':
      return (
        <span>
          <button>copy2snap</button>
        </span>
      );
    default:
      return (
        <span>
          <label>
            <input type="radio" name="tool" onChange={this.setTool.bind(this, 'fog')} />
            fog
          </label>
          <label>
            <input type="radio" name="tool" onChange={this.setTool.bind(this, 'move')} />
            move
          </label>
        </span>
      );
    }
  }

  renderMaps () {
    if (this.state.showMaps)
      return (
        <div id="maps-cp">
          <div>Maps {this.mapsN}</div>

          <input onChange={this.handleLocalText.bind(this, 'newMapName')} value={this.state.newMapName || ''} placeholder='Map name' />
          <button onClick={this.addMap.bind(this)}>Add map</button>

          <ol>
            { Object.keys(this.game.maps||[]).map((key) =>
              <CpMap
                key={key}
                name={key}
                map={this.game.maps[key]}
                game={this.game} />
            )}
          </ol>
        </div>
      );
  }
}

export default ControlPanel;
