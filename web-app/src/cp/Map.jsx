import React from 'react';

function deepCopy (argument) { return JSON.parse(JSON.stringify(argument)) }

class CpMap extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      name: this.props.name,
      url: this.map.url,
    }
  }

  handleTextChange (key, evt) { this.state[key] = evt.target.value }
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
    this.game.setState({pristine: pristine, snapshots: snapshots});
  }

  get map () { return this.props.map }
  get maps () { return this.game.state.pristine }
  get name () { return this.props.name }
  get game () { return this.props.game }

	delete () {
    let maps = deepCopy(this.maps);
    delete maps[this.name];
    this.game.setState({pristine: maps});
  }
  editPristine (evt) {
    this.game.setState({edit: 'pristine', tool: 'move'}, () => {
      this.game.loadMap(this.name, 'pristine');
    });
  }
  loadPristine (evt) {
    if (window.confirm('Overwrite snapshot?'))
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
				<input size="10" onBlur={this.handleTextBlur.bind(this)} placeholder="name" onChange={this.handleTextChange.bind(this, 'name')} value={this.state.name||''} />
				<input size="10" onBlur={this.handleTextBlur.bind(this)} placeholder="url" onChange={this.handleTextChange.bind(this, 'url')} value={this.state.url||''} />
        <button onClick={this.loadPristine.bind(this)}>Load Pristine</button>
				<button onClick={this.loadSnapshots.bind(this)}>Load Active</button>
				<button onClick={this.delete.bind(this)}>Delete</button>
			</li>
		);
	}
}

export default CpMap;
