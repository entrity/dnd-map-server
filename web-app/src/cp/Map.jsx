import React from 'react';
import { deepCopy } from '../Helper.js';

class CpMap extends React.Component {

  get url () { return this.map.url }
  get map () { return this.props.map }
  get maps () { return this.game.maps }
  get name () { return this.map.name }
  get game () { return this.props.game }
  get websocket () { return this.game && this.game.state.websocket }

  handleTextChange (key, evt) { this.update(key, evt.target.value) }
  handleGeometryChange (key, defaultVal, evt) {
    this.update(key, parseInt(evt.target.value) || defaultVal)
    .then((game) => {
      if (game.state.mapIndex === this.props.index) game.loadMap();
    });
  }
  update (key, value) { return this.game.updateMap(this.props.index, {[key]: value}) }

  delete () {
    if (window.confirm('Do you want to delete this map?')) {
      let thisMap = this.map;
      let maps = deepCopy(this.maps.filter(map => map !== thisMap));
      this.game.setState({maps: maps});
    }
  }

  duplicate () {
    let maps = deepCopy(this.maps);
    let copy = deepCopy(this.map);
    maps.push(copy);
    this.game.setState({maps: maps});
  }


  loadSnapshot (evt) {
    let websocket = this.game.isHost && this.websocket;
    this.game.loadMap(this.props.index, 'snapshots').then(() => {
      if (websocket) websocket.sendRef.bind(this.websocket);
    });
  }

  klass () { return (this.game.map === this.map) ? 'selected' : null }

  render () {
    return (
      <li className={this.klass()}>
        <input type="text" size="2" placeholder="name" onChange={this.handleTextChange.bind(this, 'name')} value={this.map.name||''} />
        <input type="text" size="25" placeholder="url" onChange={this.handleTextChange.bind(this, 'url')} value={this.map.url||''} />
        <button onClick={this.loadSnapshot.bind(this)}><span aria-label="load snapshot" title="Load map snapshot" role="img">&#x25b6;</span></button>
        <button onClick={this.duplicate.bind(this)}><span aria-label="Duplicate map" title="Duplicate map" role="img">&#x1f4cb;</span></button>
        <button onClick={this.delete.bind(this)}><span aria-label="Delete map" title="Delete map" role="img">&#x1f5d1;</span></button>

        <span role="img" arial-label="height">&#x2195;</span>
        <input type="number" placeholder="h" onChange={this.handleGeometryChange.bind(this, 'h', undefined)} value={this.map.h||''} />
        <span role="img" arial-label="width">&#x2194;</span>
        <input type="number" placeholder="w" onChange={this.handleGeometryChange.bind(this, 'w', undefined)} value={this.map.w||''} />
        x <input type="number" placeholder="x" onChange={this.handleGeometryChange.bind(this, 'x', 0)} value={this.map.x||''} />
        y <input type="number" placeholder="y" onChange={this.handleGeometryChange.bind(this, 'y', 0)} value={this.map.y||''} />

      </li>
    );
  }
}

export default CpMap;
