import React from 'react';
import CpMap from './cp/Map.jsx';
import CpToken from './cp/Token.jsx';
import { deepCopy } from './Helper.js';

class ControlPanel extends React.Component {
  constructor (props) {
    super(props);
    this.state = {};
  }

  get game () { return this.props.game }
  get maps () { return (this.game && this.game.state.pristine) || {} }
  get mapsN () { return this.maps && Object.keys(this.maps).length }
  get tokens () { return (this.game && this.game.tokens) || [] }
  get tokensN () { return this.tokens && this.tokens.length }

  handleLocalText (key, evt) { this.setState({ [key]: evt.target.value.trim() })}
  handleNameChange (evt) {
    if (this.game.state.websocket)
      this.game.state.websocket.sendChn(this.game.state.username, evt.target.value);
    this.handleText('username', evt);
  }
  handleCheckbox (key, evt) { this.game.setState({ [key]: evt.target.checked }) }
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

  addToken () {
    let name = this.state.newTokenName && this.state.newTokenName.trim();
    if (!name || !name.length) return;
    let tokens = deepCopy(this.tokens);
    tokens.push({name: name});
    console.log('Adding token', name, tokens)
    this.game.updateMap({tokens: tokens});
  }

  toggleHud (value) { this.game.setState({showHud: value}) }

  reset () {
    if (window.confirm('Delete local storage?')) {
      localStorage.clear();
      window.location.reload();
    }
  }

  requestRefresh () { this.game.state.websocket.sendReq() }
  pushRefresh () { this.game.state.websocket.sendRef() }

  render () {
    if (this.game.state.showHud && this.game.isHost)
      return (
        <div>
          <table rules="cols" id="main-cp">
            <tbody>
              <tr>
                <td>
                  <label title="show maps menu">
                    <input type="checkbox" onChange={this.handleCheckbox.bind(this, 'showMapsMenu')} checked={!!this.game.state.showMapsMenu} />&#x1f5fa;
                  </label>
                  <label title="show tokens menu">
                    <input type="checkbox" onChange={this.handleCheckbox.bind(this, 'showTokensMenu')} checked={!!this.game.state.showTokensMenu} />&#x2657;
                  </label>
                </td>
                <td>
                  <label title="share cursor">
                    <input type="checkbox" onChange={this.handleCheckbox.bind(this, 'shareCursor')} checked={!!this.game.state.shareCursor} />&#x1f5e1;
                  </label>
                </td>
                <td>
                  {this.renderEditControls()}
                </td>
                <td>
                  <button onClick={this.game.fogReset.bind(this.game)} title="reset fog"><span role="img" aria-label="reset fog">&#x2601;</span></button>
                  <input type="number" min="0" max="1" step="0.05" onChange={this.handleText.bind(this, 'fogOpacity')} value={this.game.state.opacity} size="2" placeholder="fog" />
                  <input type="number" min="1" step="5" onChange={this.handleText.bind(this, 'radius')} value={this.game.state.radius} size="2" placeholder="radius" />
                </td>
                <td>
                  <button title="refresh from localStorage" onClick={this.reset.bind(this)}><span role="img" aria-label="resfresh from local storage">&#127744;</span></button>
                  <button title="push current state to all peers" onClick={this.pushRefresh.bind(this)}><span role="img" aria-label="push to peers">&#11145;</span></button>
                  <input placeholder="Name" size="6" value={this.game.state.username||''} onChange={this.handleText.bind(this, 'username')} />
                  <span>{this.game.state.cursorX},{this.game.state.cursorY}</span>
                </td>
              </tr>
            </tbody>
          </table>
          {this.renderSelectedTokens()}
          {this.renderMaps()}
          {this.renderTokens()}
        </div>
      )
    else if (this.game.state.showHud)
      return (<div>
        <button title="hide" onClick={this.toggleHud.bind(this, false)}><span role="img" aria-label="hide controls">&#x1F611;</span></button>
        <label>Name</label>
        <input placeholder="Name" value={this.game.state.username||''} onChange={this.handleNameChange.bind(this)} />
        <button title="request refresh from DM" onClick={this.requestRefresh.bind(this)}><span role="img" aria-label="request refresh from DM">&#x1F4AB;&#x1F9DA;&#x1F9D9;</span></button>
        {this.renderSelectedTokens()}
      </div>);
    else
      return (<div>
        <button onClick={this.toggleHud.bind(this, true)} style={{opacity: 0.3}}><span role="img" aria-label="toggle controls visibility">&#x1F644;</span></button>
        {this.renderSelectedTokens()}
      </div>);
  }

  renderSelectedTokens () {
    return (
      <div>{this.game.tokens.map((token, idx) =>
        (token.isSelected && this.game.isTokenOnMap(token))
        ? <CpToken key={idx} index={idx} token={token} game={this.game}/>
        : null
      )}</div>
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
          <label title="'Fog' tool">
            <input type="radio" name="tool" onChange={this.setTool.bind(this, 'fog')} checked={this.game.state.tool === 'fog'} />&#x26c5;
          </label>
          <label title="'Move' tool">
            <input type="radio" name="tool" onChange={this.setTool.bind(this, 'move')} checked={this.game.state.tool === 'move'} />&#x1f91a;
          </label>
        </span>
      );
    }
  }

  renderMaps () {
    if (this.game.state.showMapsMenu)
      return (
        <div id="maps-cp">
          <div>Maps {this.mapsN}</div>

          <input onChange={this.handleLocalText.bind(this, 'newMapName')} value={this.state.newMapName || ''} placeholder='Map name' />
          <button onClick={this.addMap.bind(this)}>Add map</button>

          <ol>
            { Object.keys(this.maps).map((key) =>
              <CpMap
                key={key}
                name={key}
                map={this.maps[key]}
                game={this.game} />
            )}
          </ol>
        </div>
      );
  }

  renderTokens () {
    if (this.game.state.showTokensMenu && !this.game.token)
      return (
        <div id="tokens-cp">
          <div>Tokens {this.tokensN} {this.game.state.edit} {this.game.state.mapName}</div>

          <input onChange={this.handleLocalText.bind(this, 'newTokenName')} value={this.state.newTokenName || ''} placeholder='Token name' />
          <button onClick={this.addToken.bind(this)}>Add token</button>

          <ol>
            { this.game.tokens.map((token, index) =>
              <CpToken key={index} index={index} token={token} game={this.game} />
            )}
          </ol>
        </div>
      );
    else
      return null;
  }
}

export default ControlPanel;
