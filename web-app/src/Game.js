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
		      <ControlPanel />
	      </div>
	    );
  }
}

class ControlPanel extends React.Component {
	images = {};
	map = null;
	fog = null;

	constructor (props) {
		super(props);
		this.setMap = this.setMap.bind(this);
	}

	getImg (callback) {
		let el = document.querySelector('#file-select');
		let file = el.files && el.files[0];
		console.log(el, file);
		if (!el.files) return;
		let reader = new FileReader();
		let img = new Image();
		reader.onload = evt => {
			if (evt.target.readyState == FileReader.DONE) {
				img.src = evt.target.result;
				callback(img);
			}
		}
		reader.readAsDataURL(file);
	}

	setMap (evt) {
		this.getImg(img => {
			this.map = img;
		});
	}

	render () {
		return (
			<div>
				<input type='file' id='file-select' />
				<button onClick={this.setMap}>Sm</button>
			</div>
		);
	}
}
console.log('loaded src')

export default Game;
