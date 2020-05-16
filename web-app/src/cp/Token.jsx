import React from 'react';

class CpToken extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      name: this.token.name,
      url: this.token.url,
      h: this.token.h,
      w: this.token.w,
    }
  }

  handleTextBlur (evt) {
    let token = Object.assign(this.token, this.state);
    this.props.game.updateToken(token, this.index);
  }
  handleTextChange (key, evt) { this.state[key] = evt.target.value }
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
          <input type="checkbox" checked={!!this.token.pc} onChange={this.handleCheckbox.bind(this, 'pc')} />
          PC
        </label>

        <label>
          <input type="checkbox" checked={!!this.token.dead} onChange={this.handleCheckbox.bind(this, 'dead')} />
          Dead
        </label>

				<input size="10" placeholder="name" onBlur={this.handleTextBlur.bind(this)} onChange={this.handleTextChange.bind(this, 'name')} value={this.state.name||''} />
				<input size="10" placeholder="url" onBlur={this.handleTextBlur.bind(this)} onChange={this.handleTextChange.bind(this, 'url')} value={this.state.url||''} />
        height
        <input size="2" placeholder="height" onBlur={this.handleTextBlur.bind(this)} onChange={this.handleTextChange.bind(this, 'height')} value={this.state.h||''} />
        width
        <input size="2" placeholder="width" onBlur={this.handleTextBlur.bind(this)} onChange={this.handleTextChange.bind(this, 'width')} value={this.state.w||''} />
        
				<button onClick={this.delete.bind(this)}>Delete</button>
			</li>
		);
	}
}

export default CpToken;
