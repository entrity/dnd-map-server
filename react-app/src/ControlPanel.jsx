import React from 'react';

function Button(props) {
  const {title, value, onClick, isSelected, ..._} = props;
  return <button title={title} onClick={onClick} className={isSelected ? 'selected' : null}><span role="img" aria-label={title}>{value}</span></button>;  
}

function ToolButton(props) {
  const {cp, title, value, game, ..._} = props;
  const isSelected = title === cp.props.game.state.tool;
  const onClick = cp.setTool.bind(cp, title);
  return <Button title={title} value={props.value.toString()} onClick={onClick} isSelected={isSelected} />;
}

function ToggleButton(props) {
  const {cp, title, value, ..._} = props;
  const toggleKey = `toggleOn${title}`;
  const onClick = () => { cp.setState({[toggleKey]: !cp.state[toggleKey]}) };
  const isSelected = cp.state[toggleKey];
  return <Button title={title} value={value} onClick={onClick} isSelected={isSelected} />;
}

class Map extends React.Component {
  get map () { return this.props.game.state.maps[this.props.mapId] }

  onTextChange (key, evt) {
    const game = this.props.game;
    const mapsCopy = JSON.parse(JSON.stringify(game.state.maps));
    mapsCopy[this.props.mapId][key] = evt.target.value;
    game.setState({maps: mapsCopy});
  }

  load () { this.props.game.loadMap(this.map) }

  delete () {
    if (prompt('Delete map?')) {
      const game = this.props.game;
      const mapsCopy = JSON.parse(JSON.stringify(game.state.maps));
      delete mapsCopy[this.props.mapId];
      const newState = {maps: mapsCopy};
      if (game.mapId === this.props.mapId)
        newState.mapId = Object.keys(newState.maps)[0];
      game.setState(newState);
    }
  }

  render () {
    const game = this.props.game
    const isSelected = game.state.mapId === this.props.mapId;
    return <div className={isSelected ? 'selected' : null}>
      {this.props.mapId}
      <input value={this.map.name} placeholder="Map name" size="8" onChange={this.onTextChange.bind(this, 'name')} />
      <input value={this.map.url} placeholder="Map url" size="8" onChange={this.onTextChange.bind(this, 'url')} />
      <Button title="Load map" value="&#x1f23a;" onClick={this.load.bind(this)} />
      <Button title="Delete map" value="&#x1f5d1;" onClick={this.delete.bind(this)} />
    </div>
  }
}

class ControlPanel extends React.Component {
  constructor (props) {
    super(props);
    this.state = {fogDiameter: 33};
  }

  get tool () { return this.props.game.state.tool }

  setTool (tool) { this.props.game.setState({tool: tool}) }

  onTextChange (key, evt) { this.setState({[key]: evt.target.value}) }

  createMap () {
    const game = this.props.game;
    const mapsCopy = JSON.parse(JSON.stringify(game.state.maps));
    const mapId = Object.keys(mapsCopy).length + 1;
    const newMap = {name: this.state.newMapName, $id: mapId};
    mapsCopy[mapId] = newMap;
    game.setState({maps: mapsCopy});
    this.setState({newMapName: undefined});
  }

  resetFog () { /*todo*/ }

  renderToolSelect () {
    return (<span id="tools">
      <ToolButton title="move" value="&#x1f9f3;" cp={this} />
      <ToolButton title="draw" value="&#x1f58d;" cp={this} />
      <ToolButton title="fog"  value="&#x1f32c;" cp={this} />
    </span>)
  }

  renderToggles () {
    return (<span id="toggles">
      <ToggleButton title="Maps" value="&#x1f5fa;" cp={this} />
      <ToggleButton title="Tokens" value="&#x265f;" cp={this} />
    </span>)
  }

  renderToolControls () {
    switch (this.tool) {
      case 'draw':
        return (<span>
          <Button title="erase" value="&#x1f9fd;" />
          <Button title="draw" value="&#x1f58d;" />
        </span>)
      case 'move':
        return null;
      case 'fog':
        return (<span>
          <Button title="reset fog" onClick={this.resetFog.bind(this)} value="&#x1f300;" />
          <input size="3" title="fog diameter" value={this.state.fogDiameter} onChange={this.onTextChange.bind(this, 'fogDiameter')} type="number" />
        </span>);
      default: return null;
    }
  }

  renderMaps () {
    const maps = this.props.game.state.maps;
    const keys = maps && Object.keys(maps);
    return (<div>
      <hr />
      <div>
        <input placeholder="Map name" onChange={this.onTextChange.bind(this, 'newMapName')} />
        <Button title="Create new map" value="&#x2795;" onClick={this.createMap.bind(this)} />
        {keys && keys.map((mapId, $i) => (
          <Map key={`map${$i}`} mapId={mapId} game={this.props.game} />
        ))}
      </div>
    </div>)
  }

  renderTokenSelect () {
    return (<div>
      <hr />
      {/*<Button title="draw" value="&#x1f9fd;" />*/}
    </div>)
  }

  render () {
    return (<div id="control-panel">
      {this.renderToggles()}
      |||
      {this.renderToolSelect()}
      |||
      {this.renderToolControls()}
      {this.renderMaps()}
      {this.renderTokenSelect()}
    </div>);
  }
}
export default ControlPanel;
