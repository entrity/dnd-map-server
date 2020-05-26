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
  get maps () { return (this.game && this.game.maps) || [] }
  get tokens () { return (this.game && this.game.tokens) || [] }
  get tokensN () { return this.tokens && this.tokens.length }

  handleLocalText (key, evt) { this.setState({ [key]: evt.target.value && evt.target.value.trim() })}
  handleNameChange (evt) {
    if (this.game.state.websocket)
      this.game.state.websocket.sendChn(this.game.state.username, evt.target.value);
    this.handleText('username', evt);
  }
  handleCheckbox (key, evt) { this.game.setState({ [key]: evt.target.checked }) }
  handleText (key, evt) { this.game.setState({[key]: evt.target.value}) }
  setTool (tool) { this.game.setState({tool: tool}) }
  setSubtool (subtool) { this.game.setState({subtool: subtool}) }

  addMap () {
    let maps = deepCopy(this.maps);
    maps.push({url: this.state.newMapUrl && this.state.newMapUrl.trim()});
    this.game.setState({maps: maps});
  }

  addToken () {
    let tokens = deepCopy(this.tokens);
    tokens.push({url: this.state.newTokenUrl.trim()});
    this.game.setState({tokens: tokens});
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

  renderDmTools () {
    if (this.game.isHost) return (
      <div>
        <table rules="cols" id="main-cp">
          <tbody>
            <tr>
              <td>
                <label title="show maps menu">
                  <input type="checkbox" onChange={this.handleCheckbox.bind(this, 'showMapsMenu')} checked={!!this.game.state.showMapsMenu} />&#x1f5fa;
                </label>
                <label title="show tokens menu">
                  <input type="checkbox" onChange={this.handleCheckbox.bind(this, 'showTokensMenu')} checked={!!this.game.state.showTokensMenu} />&#x1f458;
                </label>
              </td>
              <td>
                <label title="share cursor">
                  <input type="checkbox" onChange={this.handleCheckbox.bind(this, 'shareCursor')} checked={!!this.game.state.shareCursor} />&#x1f5e1;
                </label>
              </td>
              <td>
                <label title="'Fog' tool">
                  <input type="radio" name="tool" onChange={this.setTool.bind(this, 'fog')} checked={this.game.state.tool === 'fog'} />&#x26c5;
                </label>
                <label title="'Move' tool">
                  <input type="radio" name="tool" onChange={this.setTool.bind(this, 'move')} checked={this.game.state.tool === 'move'} />&#x1f91a;
                </label>
                <label title="'Draw' tool">
                  <input type="radio" name="tool" onChange={this.setTool.bind(this, 'draw')} checked={this.game.state.tool === 'draw'} />&#x1f58d;
                </label>
              </td>
              <td>
                <button onClick={this.game.fogReset.bind(this.game)} title="reset fog"><span role="img" aria-label="reset fog">&#x2601;</span></button>
                <input type="number" min="0" max="1" step="0.05" onChange={this.handleText.bind(this, 'fogOpacity')} value={this.game.state.opacity} size="2" placeholder="fog" />
                <input type="number" min="1" step="5" onChange={this.handleText.bind(this, 'radius')} value={this.game.state.radius} size="2" placeholder="radius" />
              </td>
              <td>
                <button title="push current state to all peers" onClick={this.pushRefresh.bind(this)}><span role="img" aria-label="push to peers">&#11145;</span></button>
                <input placeholder="Name" size="6" value={this.game.state.username||''} onChange={this.handleText.bind(this, 'username')} />
                <span>{this.game.state.cursorX},{this.game.state.cursorY}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  renderDrawTools () {
    if (this.game.state.tool === 'draw') return (
      <div>
        <label title="pencil color">
          <input type="text" title="pencil color" size="4" value={this.game.state.pencilColor} onChange={this.handleText.bind(this, 'pencilColor')} />
          <span style={{backgroundColor: this.game.state.pencilColor}}>color</span>
        </label>
        <label title="pencil">
          <input type="radio" name="drawTool" checked={this.game.state.subtool === 'pencil'} onChange={this.setSubtool.bind(this, 'pencil')} />
          <span role="img" aria-label="pencil">&#x1f58d;</span>
        </label>
        <label title="eraser">
          <input type="radio" name="drawTool" checked={this.game.state.subtool === 'eraser'} onChange={this.setSubtool.bind(this, 'eraser')} />
          <span role="img" aria-label="eraser">&#x1f4a8;</span>
        </label>
        <label title="draw size">
          <input type="number" min="1" value={this.game.state.drawSize} onChange={this.handleText.bind(this, 'drawSize')} />
        </label>
        <span title="clear drawing">
          <button onClick={this.game.clearDrawing.bind(this.game, true)}>Clear</button>
        </span>
      </div>
    )
  }

  renderPlayerTools () {
    if (!this.game.isHost) return (
      <div>
        <button title="hide" onClick={this.toggleHud.bind(this, false)}><span role="img" aria-label="hide controls">&#x1F611;</span></button>
        <label>Name</label>
        <input placeholder="Name" value={this.game.state.username||''} onChange={this.handleNameChange.bind(this)} />
        <button title="request refresh from DM" onClick={this.requestRefresh.bind(this)}><span role="img" aria-label="request refresh from DM">&#x1F4AB;&#x1F9DA;&#x1F9D9;</span></button>
      </div>
      )
  }

  renderHudToggle () {
    if (!this.game.state.showHud) return (
      <button onClick={this.toggleHud.bind(this, true)} style={{opacity: 0.3}}><span role="img" aria-label="toggle controls visibility">&#x1F644;</span></button>
    )
  }

  render () {
    if (this.game.state.showHud) return (
      <div>
        {this.renderDmTools()}
        {this.renderPlayerTools()}
        {this.renderDrawTools()}
        {this.renderMaps()}
        {this.renderTokens()}
        {this.renderSelectedTokens()}
      </div>
    )
    else
      return this.renderHudToggle();
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

  renderMaps () {
    if (this.game.state.showMapsMenu)
      return (
        <div id="maps-cp">
          <div>Maps {this.mapsN}</div>

          <input onChange={this.handleLocalText.bind(this, 'newMapUrl')} value={this.state.newMapUrl || ''} placeholder='Map URL' />
          <button onClick={this.addMap.bind(this)}>Add map (empty url means "whiteboard")</button>

          <ol>
            { this.maps.map((map, index) =>
              <CpMap key={index} index={index} map={map} game={this.game} />
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

          <input onChange={this.handleLocalText.bind(this, 'newTokenUrl')} value={this.state.newTokenUrl || ''} placeholder='Token name' />
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
