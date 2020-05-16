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
    if (!this.state.newTokenName || this.state.newTokenName.trim() === '') return;
    let tokens = deepCopy(this.tokens);
    tokens.push({name: this.state.newTokenName.trim()});
    this.game.setState({tokens: tokens});
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
            <input type="checkbox" onChange={this.handleCheckbox.bind(this, 'showMapsMenu')} checked={!!this.game.state.showMapsMenu} />
            Maps...
          </label>
          <label>
            <input type="checkbox" onChange={this.handleCheckbox.bind(this, 'showTokensMenu')} checked={!!this.game.state.showTokensMenu} />
            Toks...
          </label>
          <button onClick={this.game.fogReset.bind(this.game)}>Reset Fog</button>
          <button onClick={this.reset.bind(this)}>RESET</button>
          <input onChange={this.handleText.bind(this, 'fogOpacity')} value={this.game.state.opacity} size="2" placeholder="fog" />
          {this.renderEditControls()}
          <input onChange={this.handleText.bind(this, 'radius')} value={this.game.state.radius} size="2" placeholder="radius" />
        </div>
        {this.renderMaps()}
        {this.renderTokens()}
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
          <div>Tokens {this.tokensN}</div>

          <input onChange={this.handleLocalText.bind(this, 'newTokenName')} value={this.state.newTokenName || ''} placeholder='Token name' />
          <button onClick={this.addToken.bind(this)}>Add token</button>

          <ol>
            { this.tokens.map((token, index) =>
              <CpToken
                key={index}
                index={index}
                token={token}
                game={this.game} />
            )}
          </ol>
        </div>
      );
  }
}

export default ControlPanel;
