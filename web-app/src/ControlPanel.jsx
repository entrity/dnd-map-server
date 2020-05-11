import React from 'react';

class ControlPanel extends React.Component {
	constructor (props) {
		super(props);
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
				console.log(img);
				callback(img);
			}
		}
		reader.readAsDataURL(file);
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

export default ControlPanel;
