class Map {
	constructor (data) {
		this.pcs = [];
		this.npcs = [];
		this.pristineNpcs = [];
		this.fogDots = {};
		for (var key in (data||{})) this[key] = data[key];
	}
}

/*
	Map
		name
		url
		fogDots
		pcs
		npcs
		pristineNpcs
*/

export default Map;
