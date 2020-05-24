import React from 'react';
import { deepCopy } from '../Helper.js';

class CpMap extends React.Component {
  constructor (props) {
    super(props);
    this.state = {};
  }

  get url () { return this.map.url }
  get map () { return this.props.map }
  get maps () { return this.game.state.pristine }
  get name () { return this.props.name }
  get game () { return this.props.game }
  get websocket () { return this.game && this.game.state.websocket }


  handleTextChange (key, evt) { this.setState({[key]: evt.target.value}) }
  handleTextBlur (evt) {
    let pristine = deepCopy(this.game.state.pristine);
    let snapshots = deepCopy(this.game.state.snapshots);
    let oldName = this.props.name;
    let newName = this.state.name;
    let attrs = Object.assign(this.state);
    delete attrs.name;
    let map = Object.assign(this.map, attrs);
    delete pristine[oldName];
    pristine[newName] = map;
    snapshots[newName] = snapshots[oldName];
    delete snapshots[oldName];
    this.game.setState({pristine: pristine, snapshots: snapshots}, () => {
      this.game.saveLocalStorage();
    });
  }

  delete () {
    if (window.confirm('Do you want to delete this map?')) {
      let maps = deepCopy(this.maps);
      delete maps[this.name];
      this.game.setState({pristine: maps});
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
      this.game.loadMap(this.name, 'pristine');
    });
  }
  loadPristine (evt) {
    if (window.confirm('Overwrite snapshot?'))
      this.game.setState({edit: 'snapshots'}, () => {
        let opts = {forceCopy: true};
        if (this.game.isHost && this.websocket)
          opts.cb = this.websocket.sendRef.bind(this.websocket);
        this.game.loadMap(this.name, 'snapshots', opts);
      });
  }
  loadSnapshots (evt) {
    this.game.setState({edit: 'snapshots'}, () => {
      let opts = {}
      if (this.game.isHost && this.websocket)
        opts.cb = this.websocket.sendRef.bind(this.websocket);
      this.game.loadMap(this.name, 'snapshots', opts);
    });
  }

  render () {
    return (
      <li>
        <button onClick={this.editPristine.bind(this)}><span aria-label="edit pristine" title="Edit 'pristine' map" role="img">&#x1f4dd;</span></button>
        <input size="10" onBlur={this.handleTextBlur.bind(this)} placeholder="name" onChange={this.handleTextChange.bind(this, 'name')} value={this.state.name||''} />
        <input size="10" onBlur={this.handleTextBlur.bind(this)} placeholder="url" onChange={this.handleTextChange.bind(this, 'url')} value={this.state.url||''} />
        <button onClick={this.loadPristine.bind(this)}><span aria-label="load pristine" title="Load pristine map" role="img">&#x25b6;</span></button>
        <button onClick={this.loadSnapshots.bind(this)}><span aria-label="load snapshot" title="Load map snapshot" role="img">&#x1f4f7;</span></button>
        <button onClick={this.duplicate.bind(this)}><span aria-label="Duplicate map" title="Duplicate map" role="img">&#x1f4cb;</span></button>
        <button onClick={this.delete.bind(this)}><span aria-label="Delete map" title="Delete map" role="img">&#x1f5d1;</span></button>
      </li>
    );
  }
}

export default CpMap;
