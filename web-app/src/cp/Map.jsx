import React from 'react';
import { deepCopy } from '../Helper.js';

class CpMap extends React.Component {

  get url () { return this.map.url }
  get map () { return this.props.map }
  get maps () { return this.game.maps }
  get name () { return this.map.name }
  get game () { return this.props.game }
  get websocket () { return this.game && this.game.state.websocket }

  handleTextChange (key, evt) { this.game.updateMap(this.props.index, {[key]: evt.target.value}) }

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

  editPristine (evt) {
    this.game.setState({edit: 'pristine', tool: 'move'}, () => {
      this.game.loadMap(this.map, 'pristine');
    });
  }

  loadSnapshot (evt) {
    this.game.setState({edit: 'snapshots'}, () => {
      let websocket = this.game.isHost && this.websocket;
      this.game.loadMap(this.map, 'snapshots').then(() => {
        if (websocket) websocket.sendRef.bind(this.websocket);
      });
    });
  }

  klass () { return (this.game.map === this.map) ? 'selected' : null }

  render () {
    return (
      <li className={this.klass()}>
        <button onClick={this.editPristine.bind(this)}><span aria-label="edit pristine" title="Edit 'pristine' map" role="img">&#x1f4dd;</span></button>
        <input type="text" size="2" placeholder="name" onChange={this.handleTextChange.bind(this, 'name')} value={this.map.name|''} />
        <input type="text" size="25" placeholder="url" onChange={this.handleTextChange.bind(this, 'url')} value={this.map.url||''} />
        <button onClick={this.loadSnapshot.bind(this)}><span aria-label="load snapshot" title="Load map snapshot" role="img">&#x25b6;</span></button>
        <button onClick={this.duplicate.bind(this)}><span aria-label="Duplicate map" title="Duplicate map" role="img">&#x1f4cb;</span></button>
        <button onClick={this.delete.bind(this)}><span aria-label="Delete map" title="Delete map" role="img">&#x1f5d1;</span></button>
      </li>
    );
  }
}

export default CpMap;
