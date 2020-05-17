import React from 'react';

class CpToken extends React.Component {
  constructor (props) {
    super(props);
  }

  handleChange (key, value) {
    let token = Object.assign({}, this.token, {[key]: value});
    this.game.updateToken(token, this.index);
  }
  handleTextChange (key, evt) { this.handleChange(key, evt.target.value) }
  handleNumChange (key, defaultVal, evt) { this.handleChange(key, parseInt(evt.target.value) || defaultVal) }
  handleCheckbox (key, evt) { this.handleChange(key, evt.target.checked) }

  get token () { return this.props.token }
  get index () { return this.props.index }
  get game () { return this.props.game }
  get name () { return this.token.name }
  get url () { return this.token.url }

  select () { this.game.selectToken(this.props.index) }

	delete () {
    let tokens = JSON.parse(JSON.stringify(this.game.tokens));
    tokens.splice(this.index, 1);
    this.game.updateMap({tokens: tokens});
  }

	render () {
		return (
			<li>
        <label>
          <input type="checkbox" checked={!!this.token.pc} onChange={this.handleCheckbox.bind(this, 'pc')} /> PC
        </label>
        <label>
          <input type="checkbox" checked={!!this.token.dead} onChange={this.handleCheckbox.bind(this, 'dead')} /> Dead
        </label>

				<input size="10" placeholder="name" onChange={this.handleTextChange.bind(this, 'name')} value={this.token.name||''} />
				<input size="10" placeholder="url" onChange={this.handleTextChange.bind(this, 'url')} value={this.token.url||''} />

        <span role="img" arial-label="height">&#x2195;</span>
        <input size="1" placeholder="h" onChange={this.handleNumChange.bind(this, 'h', undefined)} value={this.token.h||''} />
        <span role="img" arial-label="width">&#x2194;</span>
        <input size="1" placeholder="w" onChange={this.handleNumChange.bind(this, 'w', undefined)} value={this.token.w||''} />
        
        x <input size="1" placeholder="x" onChange={this.handleNumChange.bind(this, 'x', 0)} value={this.token.x||''} />
        y <input size="1" placeholder="y" onChange={this.handleNumChange.bind(this, 'y', 0)} value={this.token.y||''} />
        {this.renderSelectButton()}
				<button onClick={this.delete.bind(this)}><span role="img" arial-label="Delete">&#x1f5d1;</span></button>
			</li>
		);
	}

  renderSelectButton () {
    if (this.token !== this.game.token) {
      return (
        <button onClick={this.select.bind(this)}><span role="img" arial-label="Select token">&#x1F5e1;</span></button>
      )
    }
  }
}

export default CpToken;
