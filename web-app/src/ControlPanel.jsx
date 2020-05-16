import React from 'react';
import CpMap from './cp/Map.jsx';
import CpToken from './cp/Token.jsx';

function deepCopy (argument) { return JSON.parse(JSON.stringify(argument)) }

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
    if (!name && !name.length) return;
    let tokens = deepCopy(this.tokens);
    tokens.push({name: name});
    console.log('Adding token', name, tokens)
    this.game.updateMap({tokens: tokens});
  }

  reset () {
    if (window.confirm('Delete local storage?')) {
      localStorage.clear();
      window.location.reload();
    }
  }

  render () {
    if (this.game.state.showHud && this.game.isHost)
      return (
        <div>
          <table>
            <thead>
              <tr>
                <th>Subs</th>
                <th>Fog</th>
                <th>Tools</th>
                <th>RESET</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <label>
                    <input type="checkbox" onChange={this.handleCheckbox.bind(this, 'showMapsMenu')} checked={!!this.game.state.showMapsMenu} />
                    Maps...
                  </label>
                  <label>
                    <input type="checkbox" onChange={this.handleCheckbox.bind(this, 'showTokensMenu')} checked={!!this.game.state.showTokensMenu} />
                    Toks...
                  </label>
                </td>
                <td>
                  {this.renderEditControls()}
                </td>
                <td>
                  <button onClick={this.game.fogReset.bind(this.game)}>Reset Fog</button>
                  <input onChange={this.handleText.bind(this, 'fogOpacity')} value={this.game.state.opacity} size="2" placeholder="fog" />
                  <input onChange={this.handleText.bind(this, 'radius')} value={this.game.state.radius} size="2" placeholder="radius" />
                </td>
                <td>
                  <button onClick={this.reset.bind(this)}>RESET</button>
                </td>
              </tr>
            </tbody>
          </table>
          {this.renderMaps()}
          {this.renderTokens()}
        </div>
      )
    else
      return null;
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
            <input type="radio" name="tool" onChange={this.setTool.bind(this, 'fog')} checked={this.game.state.tool == 'fog'} />
            fog
          </label>
          <label>
            <input type="radio" name="tool" onChange={this.setTool.bind(this, 'move')} checked={this.game.state.tool == 'move'} />
            move
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
    if (this.game.state.showTokensMenu)
      return (
        <div id="tokens-cp">
          <div>Tokens {this.tokensN} {this.game.state.edit} {this.game.state.mapName}</div>

          <input onChange={this.handleLocalText.bind(this, 'newTokenName')} value={this.state.newTokenName || ''} placeholder='Token name' />
          <button onClick={this.addToken.bind(this)}>Add token</button>

          <ol>
            { this.game.tokens.map((token, index) =>
              <CpToken
                key={index}
                index={index}
                token={token}
                game={this.game} />
            )}
          </ol>
        </div>
      );
    else
      return null;
  }
}

export default ControlPanel;
