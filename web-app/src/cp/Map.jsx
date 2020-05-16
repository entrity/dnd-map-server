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

	delete () {
    let maps = JSON.parse(JSON.stringify(this.game.maps));
    delete maps[this.name];
    this.game.setState({maps: maps});
  }
  editPristine (evt) {
    this.game.setState({edit: 'pristine'}, () => {
      this.game.loadMap(this.name, 'pristine');
    });
  }
  loadPristine (evt) {
    this.game.setState({edit: 'snapshots'}, () => {
      this.game.loadMap(this.name, 'snapshots', true);
    });
  }
  loadSnapshots (evt) {
    this.game.setState({edit: 'snapshots'}, () => {
      this.game.loadMap(this.name, 'snapshots');
    });
  }

	render () {
		return (
			<li>
				<button onClick={this.editPristine.bind(this)}>Edit Pristine</button>
				<input placeholder="name" onChange={this.handleText.bind(this, 'name')} value={this.name} />
				<input placeholder="url" onChange={this.handleText.bind(this, 'url')} value={this.url} />
        <button onClick={this.loadPristine.bind(this)}>Load Pristine</button>
				<button onClick={this.loadSnapshots.bind(this)}>Load Active</button>
				<button onClick={this.delete.bind(this)}>Delete</button>
			</li>
		);
	}
}

export default CpMap;
