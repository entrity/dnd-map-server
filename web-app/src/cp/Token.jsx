import React from 'react';

class CpToken extends React.Component {
  constructor (props) {
    super(props);
  }

  handleTextChange (key, evt) {
    let token = Object.assign({}, this.token, {[key]: evt.target.value});
    this.props.game.updateToken(token, this.index);
  }
  handleCheckbox (key, evt) {
    let token = Object.assign(this.token);
    token[key] = evt.target.checked;
    this.props.game.updateToken(token, this.index);
  }

  get token () { return this.props.token }
  get index () { return this.props.index }
  get game () { return this.props.game }
  get name () { return this.token.name }
  get url () { return this.token.url }

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
        height <input size="2" placeholder="height" onChange={this.handleTextChange.bind(this, 'height')} value={this.token.h||''} />
        width <input size="2" placeholder="width" onChange={this.handleTextChange.bind(this, 'width')} value={this.token.w||''} />
        
				<button onClick={this.delete.bind(this)}>Delete</button>
			</li>
		);
	}
}

export default CpToken;
