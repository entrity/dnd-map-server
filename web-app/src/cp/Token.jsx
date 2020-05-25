import React from 'react';
import { deepCopy } from '../Helper.js';

class CpToken extends React.Component {
  constructor (props) {
    super(props);
    this.state = {};
  }
  handleChange (key, value) {
    let token = Object.assign({}, this.token, {[key]: value});
    this.game.updateToken(token, this.index);
  }
  handleTextChange (key, evt) { this.handleChange(key, evt.target.value) }
  handleNumChange (key, defaultVal, evt) { this.handleChange(key, parseInt(evt.target.value) || defaultVal) }
  handleCheckbox (key, evt) { this.handleChange(key, evt.target.checked) }

  toggleMapInclusion (mapName, evt) {
    let token = deepCopy(this.token);
    if (!token.maps) token.maps = {};
    token.maps[mapName] = evt.target.checked;
    this.game.updateToken(token, this.index);
  }

  get token () { return this.props.token }
  get index () { return this.props.index }
  get game () { return this.props.game }
  get name () { return this.token.name }
  get url () { return this.token.url }

  select () { this.game.selectToken(this.props.index) }

  delete () {
    let tokens = deepCopy(this.game.tokens);
    tokens.splice(this.index, 1);
    this.game.setState({tokens: tokens});
  }

  toggleMapsList (evt) { this.setState({isMapsListShown: evt.target.checked}) }

  render () {
    let isHost = this.game.isHost;
    let klass = isHost ? null : 'gone';
    return (
      <li>
        <label title="PC" className={klass}>
          <input type="checkbox" checked={!!this.token.pc} onChange={this.handleCheckbox.bind(this, 'pc')} />
          <span role="img" arial-label="pc">&#x1f469;</span>
        </label>
        <label title="Dead" className={klass}>
          <input type="checkbox" checked={!!this.token.dead} onChange={this.handleCheckbox.bind(this, 'dead')} />
          <span role="img" arial-label="dead">&#x1F47B;</span>
        </label>
        <label title="Include NPC in all maps" className={klass}>
          <input type="checkbox" checked={!!this.token.allMaps} onChange={this.handleCheckbox.bind(this, 'allMaps')}
          disabled={this.token.pc} />
          <span role="img" arial-label="allMaps">&#x1F4af;</span>
        </label>
        <label title="Show maps for inclusion" className={klass}>
          <input type="checkbox" checked={this.state.isMapsListShown} onChange={this.toggleMapsList.bind(this)}
          disabled={this.token.pc || this.token.allMaps} />
          <span role="img" arial-label="List Maps">&#x1F30d;</span>
        </label>

        <input size="4" placeholder="name" onChange={this.handleTextChange.bind(this, 'name')} value={this.token.name||''} />
        <input size="15" placeholder="url" onChange={this.handleTextChange.bind(this, 'url')} value={this.token.url||''} />

        <span role="img" arial-label="height">&#x2195;</span>
        <input type="number" placeholder="h" onChange={this.handleNumChange.bind(this, 'h', undefined)} value={this.token.h||''} />
        <span role="img" arial-label="width">&#x2194;</span>
        <input type="number" placeholder="w" onChange={this.handleNumChange.bind(this, 'w', undefined)} value={this.token.w||''} />
        
        x <input type="number" placeholder="x" onChange={this.handleNumChange.bind(this, 'x', 0)} value={this.token.x||''} />
        y <input type="number" placeholder="y" onChange={this.handleNumChange.bind(this, 'y', 0)} value={this.token.y||''} />
        {isHost ? this.renderSelectButton() : ''}
        <button title="Delete" className={klass} onClick={this.delete.bind(this)}><span role="img" arial-label="Delete">&#x1f5d1;</span></button>
        {this.renderMapsList()}
      </li>
    );
  }

  renderMapsList () {
    return (this.game.isHost && this.state.isMapsListShown)
      ? (<div class="token-maps-list">
          {this.game.maps.map((map, index) => {
            return (<div>
              <label>
                <input type="checkbox"
                checked={this.token.maps && this.token.maps[map.name]}
                onChange={this.toggleMapInclusion.bind(this, map.name)} />
                {map.name || map.url}
              </label>
            </div>)
          })}
      </div>)
      : null
  }

  renderSelectButton () {
    return (
      <button title="select"
      disabled={this.token.isSelected || !this.game.isTokenOnMap(this.token) || !this.token.url}
      onClick={this.select.bind(this)}><span role="img" arial-label="Select token">&#x1F5e1;</span></button>
    )
  }
}

export default CpToken;
