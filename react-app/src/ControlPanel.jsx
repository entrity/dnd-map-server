import React from 'react';

function Button(props) {
  const {title, value, onClick, isSelected, style, disabled, ..._} = props;
  return <button title={title} onClick={onClick} className={isSelected ? 'selected' : null} style={style} disabled={disabled}><span role="img" aria-label={title}>{value}</span></button>;
}

function ToolButton(props) {
  const {cp, title, value, game, ..._} = props;
  const isSelected = title === cp.props.game.state.tool;
  const onClick = cp.setGameState.bind(cp, 'tool', title);
  return <Button title={title} value={value.toString()} onClick={onClick} isSelected={isSelected} />;
}

function ToggleButton(props) {
  const {cp, title, value, ..._} = props;
  const toggleKey = `toggleOn${title}`;
  const onClick = () => { cp.setState({[toggleKey]: !cp.state[toggleKey]}) };
  const isSelected = cp.state[toggleKey];
  return <Button title={title} value={value} onClick={onClick} isSelected={isSelected} />;
}

class MapConfig extends React.Component {
  onTextChange (key, evt) {
    const game = this.props.game;
    const mapsCopy = JSON.parse(JSON.stringify(game.state.maps));
    mapsCopy[this.props.mapId][key] = evt.target.value;
    game.setState({maps: mapsCopy});
  }

  load () { this.props.game.loadMap(this.props.map) }

  delete () {
    if (window.confirm('Delete map?')) {
      const game = this.props.game;
      const mapsCopy = JSON.parse(JSON.stringify(game.state.maps));
      delete mapsCopy[this.props.mapId];
      const newState = {maps: mapsCopy};
      if (game.state.mapId === this.props.mapId)
        newState.mapId = Object.keys(newState.maps)[0];
      game.setState(newState);
    }
  }

  render () {
    if (!this.props.map) return null;
    const game = this.props.game
    const isSelected = game.state.mapId === this.props.mapId;
    return <div className={isSelected ? 'selected' : null}>
      {this.props.mapId} {this.props.map.$id}
      <input value={this.props.map.name||''} placeholder="Map name" size="8" onChange={this.onTextChange.bind(this, 'name')} />
      <input value={this.props.map.url||''} placeholder="Map url" size="8" onChange={this.onTextChange.bind(this, 'url')} />
      <Button title="Load map" value="&#x1f23a;" onClick={this.load.bind(this)} />
      <Button title="Delete map" value="&#x1f5d1;" onClick={this.delete.bind(this)} />
    </div>
  }
}

class TokenConfig extends React.Component {
  update (callback) {
    this.props.game.updateToken(this.props.token, callback);
  }

  onMapSelect (evt) {
    let value = evt.target.value;
    if (Object.keys(this.props.game.state.maps).indexOf(value) < 0)
      value = undefined;
    this.update(token => token.mapId = value);
  }

  onToggle (key) {
    this.update(token => token[key] = !token[key]);
  }

  onIntegerChange (key, evt) {
    this.update(token => token[key] = parseInt(evt.target.value) || undefined);
  }

  onTextChange (key, evt) {
    this.update(token => token[key] = evt.target.value);
  }

  selectToken (token, evt) {
    this.props.game.selectToken(token, undefined, true);
  }

  render () {
    const token = this.props.token;
    if (!token) return null;
    const game = this.props.game;
    const maps = game.state.maps;
    return <div className="tokenConfig">
      {<Button value={token.pc ? "\u{1f236}" : "\u{1f21a}"} onClick={this.onToggle.bind(this, 'pc')} title="pc/npc" />}
      {<Button value={token.$selected ? "\u{1f22f}" : "\u{1f233}"} onClick={this.selectToken.bind(this, token)} title="(un)select" />}
      {<Button value={token.ko ? "\u{1f940}" : "\u{1f339}"} onClick={this.onToggle.bind(this, 'ko')} title="alive/dead" />}
      <input value={token.name||''} placeholder="Name" size="8" onChange={this.onTextChange.bind(this, 'name')} />
      <input value={token.url||''} placeholder="Url" size="8" onChange={this.onTextChange.bind(this, 'url')} />
      wh:
      <input value={token.w||''} placeholder="w" className="text2" onChange={this.onIntegerChange.bind(this, 'w')} type="number" step="5" title="width" />
      <input value={token.h||''} placeholder="h" className="text2" onChange={this.onIntegerChange.bind(this, 'h')} type="number" step="5" title="height" />
      xy:
      <input value={token.x||''} placeholder="x" className="text2" onChange={this.onIntegerChange.bind(this, 'x')} type="number" title="x coord" />
      <input value={token.y||''} placeholder="y" className="text2" onChange={this.onIntegerChange.bind(this, 'y')} type="number" title="y coord" />
      <select defaultValue={token.mapId} onChange={this.onMapSelect.bind(this)} title="which map(s)">
        <option>(all)</option>
        {Object.keys(maps).map((key, $i) => (
          <option key={$i} value={key}>
            {maps[key].name || maps[key].url || '(unnamed)'}
          </option>
        ))}
      </select>
    </div>
  }
}

class ControlPanel extends React.Component {
  constructor (props) {
    super(props);
    this.state = {fogDiameter: 33};
  }

  get tool () { return this.props.game.state.tool }

  toggleHidden () { this.setState({hidden: !this.state.hidden}) }

  setGameState (key, value) { this.props.game.setState({[key]: value}) }

  setGameInt (key, evt) { debugger; this.props.game.setState({[key]: parseInt(evt.target.value) || undefined}) }

  setGameText (key, evt) { this.props.game.setState({[key]: evt.target.value}) }

  onTextChange (key, evt) { this.setState({[key]: evt.target.value}) }

  createMap () {
    const game = this.props.game;
    const mapsCopy = JSON.parse(JSON.stringify(game.state.maps||{}));
    const mapId = 1 + Object.keys(mapsCopy).reduce((m, x) => Math.max(m, x), 0);
    const newMap = {name: this.state.newMapName, $id: mapId};
    mapsCopy[mapId] = newMap;
    game.setState({maps: mapsCopy});
    this.setState({newMapName: undefined});
  }

  createToken () {
    const game = this.props.game;
    const tokensCopy = JSON.parse(JSON.stringify(game.state.tokens||[]));
    tokensCopy.push({name: this.state.newTokenName});
    game.setState({tokens: tokensCopy});
    this.setState({newTokenName: undefined});
  }

  resetFog () { this.props.game.fogRef.current.fill(); }

  setFogOpacity (evt) {
    const newOpacity = evt.target.value;
    if (!isNaN(newOpacity))
      this.props.game.setState({fogOpacity: newOpacity});
  }

  copyJson () {
    const json = this.props.game.toJson();
    window.navigator.clipboard.writeText(json);
  }

  pasteJson () {
    if (window.confirm('Do you really want to overwrite this game with what\'s in your clipboard?')) {
      const json = window.navigator.clipboard.readText();
      this.props.game.fromJson(json);
    }
  }

  renderToolSelect () {
    return (<span id="tools">
      <ToolButton title="move" value="&#x1f9f3;" cp={this} />
      <ToolButton title="draw" value="&#x1f58d;" cp={this} />
      <ToolButton title="fog"  value="&#x1f32c;" cp={this} />
    </span>)
  }

  renderToolControls () {
    const game = this.props.game;
    switch (this.tool) {
      case 'draw':
        return (<span>
          <Button title="eraser" value="&#x1f9fd;" onClick={this.setGameState.bind(this, 'subtool', 'eraser')} isSelected={game.state.subtool === 'eraser'} />
          <Button title="pencil" value="&#x1f58d;" onClick={this.setGameState.bind(this, 'subtool', 'pencil')} isSelected={game.state.subtool === 'pencil'} />
          <input size="3" title="draw size" value={game.state.drawSize} onChange={this.onTextChange.bind(game, 'drawSize')} type="number" step="3" min="1" />
          <input size="3" title="draw color" value={game.state.drawColor} onChange={this.onTextChange.bind(game, 'drawColor')} />
          <Button style={{backgroundColor: game.state.drawColor}} value="&#x1f58c;" disabled />
        </span>)
      case 'move':
        return null;
      case 'fog':
        return (<span>
          <Button title="reset fog" onClick={this.resetFog.bind(this)} value="&#x1f300;" />
          <input size="3" title="fog radius" value={game.state.fogRadius||0} onChange={this.onTextChange.bind(game, 'fogRadius')} type="number" step="5" min="1" />
          <input size="3" title="fog opacity" step="0.05" min="0" max="1" value={game.state.fogOpacity} onChange={this.setFogOpacity.bind(this)} type="number" />
        </span>);
      default: return null;
    }
  }

  renderMaps () {
    if (!this.state.toggleOnMaps) return null;
    const maps = this.props.game.state.maps;
    const keys = maps && Object.keys(maps);
    return (<div>
      <hr />
      <div>
        <input placeholder="New map name (optional)" onChange={this.onTextChange.bind(this, 'newMapName')} />
        <Button title="Create new map" value="&#x2795;" onClick={this.createMap.bind(this)} />
        {keys && keys.map((mapId, $i) => (
          <MapConfig key={`map${$i}`} mapId={mapId} map={maps[mapId]} game={this.props.game} />
        ))}
      </div>
    </div>)
  }

  renderUser () {
    if (!this.state.toggleOnUser) return null;
    const game = this.props.game;
    return <div>
      <hr />
      <input title="User name" placeholder="User name" value={game.state.username||''} onChange={this.setGameText.bind(this, 'username')} />
      <ToggleButton title="Share mouse (cursor)" value="&#x1f401;" cp={this} />
      <input title="Cursor size" value={game.state.cursorSize||''} onChange={this.setGameInt.bind(this, 'cursorSize')} type="number" min="0" />
      <hr />
      <Button title="Redo as dev" value="&#x1f530;" onClick={game.initAsDev.bind(game)} />
      <Button title="Copy JSON to clipboard" value="&#x1f46f;" onClick={this.copyJson.bind(this)} />
      <Button title="Paste JSON from clipboard" value="&#x1f4cb;" onClick={this.pasteJson.bind(this)} />
    </div>;
  }

  renderTokens () {
    if (!this.state.toggleOnTokens) return null;
    return (<div>
      <hr />
      <input placeholder="New token name (optional)" onChange={this.onTextChange.bind(this, 'newTokenName')} />
      <Button title="Create new token" value="&#x2795;" onClick={this.createToken.bind(this)} />
      {this.props.game.state.tokens.length}
      {this.props.game.state.tokens.map((token, $i) => (
        <TokenConfig key={`token${$i}`} token={token} game={this.props.game} />
      ))}
    </div>)
  }

  render () {
    const toggleHiddenButton = <Button value="&#x1f441;" onClick={this.toggleHidden.bind(this)} title="show/hide control panel" />;
    if (this.state.hidden)
      return <div id="control-panel">{toggleHiddenButton}</div>
    const game = this.props.game;
    if (game.isHost)
      return <div id="control-panel">
        {toggleHiddenButton}
        |||
        <span id="toggles">
          <ToggleButton title="User" value="&#x1f9d9;" cp={this} />
          <ToggleButton title="Maps" value="&#x1f5fa;" cp={this} />
          <ToggleButton title="Tokens" value="&#x265f;" cp={this} />
        </span>
        |||
        {this.renderToolSelect()}
        |||
        {this.renderToolControls()}
        {this.renderMaps()}
        {this.renderTokens()}
        {this.renderUser()}
      </div>;
    else
      return <div id="control-panel">
        {toggleHiddenButton}
        <input title="User name" placeholder="User name" value={game.state.username||''} onChange={this.setGameText.bind(this, 'username')} />
        <input title="Cursor size" value={game.state.cursorSize||''} onChange={this.setGameInt.bind(this, 'cursorSize')} type="number" min="0" />
      </div>
  }
}
export default ControlPanel;
