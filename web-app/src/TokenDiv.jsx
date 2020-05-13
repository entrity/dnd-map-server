import React from 'react';
import ReactDOM from 'react-dom';

class Token extends React.Component {
  constructor (props) {
    super(props);
    this.name = props.obj.name;
    this.url = props.obj.url;
    this.x = props.obj.x;
    this.y = props.obj.y;
  }

  componentDidMount () {
    // const node = ReactDOM.findDOMNode(this);
    // node.addEventListener('click', (evt => {
    //   console.log('clicked', this);

    // }).bind(this))
    // node.addEventListener('mousedown', (evt => {
    //   console.log('clicked', this);
    //   this.props.mouseDown();
    // }).bind(this))
  }

  render () {
    return (
      <img src={this.url} style={{top: this.y, left: this.x}} />
    );
  }
}

class TokenDiv extends React.Component {
  mouseDown (item) {
    this.setState({selected: item}, (() => {
          console.log(this.state)
        }).bind(this))
  }

  render () {
    return (
      <div id={this.props.id}>
        { this.props.tokens
          .filter(obj => { return obj.url })
          .map((item, idx) => <Token key={item.name} obj={item}
            mouseDown={this.mouseDown.bind(this, item)}
          />) }
      </div>
    );
  }
}

export default TokenDiv;
