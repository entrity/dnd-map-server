import React from 'react';

class Game extends React.Component {
	ws = new WebSocket('ws://localhost:8000/');

	componentDidMount () {
		this.ws.onopen = () => {
			console.log('opened WebSocket');
		}
		this.ws.onmessage = evt => {
			console.log('got msg', evt.data);
		}
		this.ws.onclose = () => {
			console.log('closed');
		}
		setInterval( _ =>{
        this.ws.send( Math.random() )
    }, 2000 )
	}
	render() {
		console.log('rendering rgame')
	    return (
	      <div className="shopping-list">
	        <h1>Shopping List for {this.props.name}</h1>
	        <ul>
	          <li>Instagram</li>
	          <li>WhatsApp</li>
	          <li>Oculus</li>
	        </ul>
	      </div>
	    );
  }
}
console.log('loaded src')

export default Game;
