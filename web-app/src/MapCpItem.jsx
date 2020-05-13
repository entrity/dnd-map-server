import React from 'react';

class MapCpItem extends React.Component {
	constructor (props) {
		super(props);
	}

	deleteItem () {
		let name = this.props.value.name;
		let maps = this.props.maps.slice().filter(m => {
			return m.name !== name;
		})
		this.props.update(maps);
	}

	handleText (evt) {
		let name = this.props.value.name;
		let maps = this.props.maps.slice(); // copy maps for immutability
		maps.forEach(map => {
			if (map.name === name)
				map[evt.target.dataset.field] = evt.target.value;
		});
		this.props.update(maps);	
	}

	load (evt, pristine) { this.props.load(this.props.value, pristine) }
	loadPristine (evt) { this.load(evt, true) }

	render () {
		return (
			<li>
				<button onClick={this.loadPristine.bind(this)}>Load Pristine</button>
				<input placeholder="name" onChange={this.handleText.bind(this)} data-field="name" value={this.props.value.name} />
				<input placeholder="url" onChange={this.handleText.bind(this)} data-field="url" value={this.props.value.url} />
				<button onClick={this.load.bind(this)}>Load Active</button>
				<button onClick={this.deleteItem.bind(this)}>Delete</button>
			</li>
		);

	}

}

export default MapCpItem;