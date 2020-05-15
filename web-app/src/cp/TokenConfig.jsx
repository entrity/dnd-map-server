import React from 'react';

class TokenConfig extends React.Component {
  constructor (props) {
    super(props);
    let token = this.props.token;
    this.state = {
      name: (token && token.name) || '',
      url: (token && token.url) || '',
    };
  }

  get game () { return this.props.game }
  get token () { return this.props.token }

  handleText (key, evt) {
    console.log(key, evt.target.value)
    this.setState({[key]: evt.target.value})
  }

  /* Onblur */
  saveToGame () { this.game.updateToken(this.state) }
  delete () { this.game.deleteToken() }

  render () {
    return (
      <div id="token-config">
        <input placeholder="name" value={this.state.name} onChange={this.handleText.bind(this, 'name')} />
        <input placeholder="url" value={this.state.url} onChange={this.handleText.bind(this, 'url')} />
        <button onClick={this.save.bind(this)}>Save</button>
        <button onClick={this.delete.bind(this)}>Delete</button>
      </div>
    );
  }
}

export default TokenConfig;
