import React from 'react';

class CpMap extends React.Component {
  handleText (key, evt) {
    let map = Object.assign(this.props.map);
    map[key] = evt.target.value;
    this.props.game.updateMap(map, this.props.name);
  }

  get game () { return this.props.game }
  get name () { return this.props.name }
  get url () { return this.props.map.url }

	delete () {  this.props.delete(this.props.map) }
  load (evt, pristine) { this.game.load(this.props.map, pristine) }

	render () {
		return (
			<li>
				<button onClick={this.load.bind(this, true)}>Edit Pristine</button>
				<input placeholder="name" onChange={this.handleText.bind(this, 'name')} value={this.name} />
				<input placeholder="url" onChange={this.handleText.bind(this, 'url')} value={this.url} />
        <button onClick={this.game.loadMap.bind(this.game, this.name)}>Load Pristine</button>
				<button onClick={this.game.loadMap.bind(this.game, this.name, true)}>Load Active</button>
				<button onClick={this.props.delete}>Delete</button>
			</li>
		);
	}
}

export default CpMap;
