import React from 'react';
import Background from './Background.jsx';
import Drawing from './Drawing.jsx';
import Fog from './Fog.jsx';
import Overlay from './Overlay.jsx';
import ControlPanel from './ControlPanel.jsx';

class Game extends React.Component {

  _development () {
    let tokens = [
      {name: 'bar', pc: 0, all: true},
      {name: 'foo', url: '/belmont.jpg', all: true},
      {name: 'arr', pc: 1, all: true},
      {name: 'win', pc: 1, url: '/redhead.jpg', y: 50, x: 90, w: 64, h:64, all: true},
    ];
    let defaultMap = {
      url: "/FFtri9T.png",
      spawnX: 40, spawnY: 80, $id: 2,
    };
    let kiwiMap = {
      name: 'kiwi', url: '/kiwi.jpeg', $id: 1,
    };
    return new Promise(res => {
      this.setState({
        maps: Object.fromEntries([defaultMap, kiwiMap].map(m => [m.$id, m])),
        tokens: tokens,
      }, res);
    });
  }

  constructor (props) {
    super(props);
    window.game = this;
    const params = new URLSearchParams(window.location.href.replace(/.*\?/, ''));
    this.bgRef = React.createRef();
    this.fogRef = React.createRef();
    this.drawRef = React.createRef();
    this.state = {
      isHost: true, /* todo */
      fogOpacity: 0.5,
      fogUrl: undefined, /* data url */
      isFogLoaded: false,
      showMapsMenu: false,
      showTokensMenu: false,
      isFirstLoadDone: false, /* Ensure we don't overwrite localStorage before load is done */
      room: params.get('room') || 'defaultRoom',
    };
  }

  componentDidMount () {
    this._development().then(() => {
      this.loadMap(this.state.maps[2]);
    })
    window.addEventListener('beforeunload', this.saveToLocalStorage.bind(this));
    window.addEventListener('resize', this.onResize.bind(this));
    // this.addControlsCallbacks();
    // this.mapCanvasRef.current.addEventListener('click', ((evt) => {
    //   this.setState({showMapsMenu: false});
    //   this.setState({showTokensMenu: false});
    // }));
    // this.setState({fogLoaded: false}, () => {
    //   console.log('Attempting to load from localStorage')
    //   /* load map from storage, if any */
    //   this.loadLocalStorage().catch(() => {
    //     console.log('Attempting to load default map')
    //     this.loadMap(); /* load default map */
    //   }).then(() => { console.log('...loaded from localStorage') });
    // });
  }

  componentWillUnmount () {
    console.log('unmounting', this)
    window.removeEventListener('beforeunload', Game.saveLocalStorage.bind(this));
    // window.removeEventListener('resize', Game.onResize.bind(this));
    // this.removeControlsCallbacks();
    this.saveLocalStorage();
  }

  onResize () { this.loadMap(null, true) }

  /* From playarea to state */
  saveMap () {
    const mapsCopy = JSON.parse(JSON.stringify(this.state.maps));
    const map = mapsCopy[this.state.mapId];
    map.fogUrl = this.fogRef.current.buildDataUrl();
    map.drawUrl = this.drawRef.current.buildDataUrl();
    return new Promise((resolve, reject) => {      
      this.setState({ maps: mapsCopy }, resolve);
    });
  }

  /* From state to playarea */
  loadMap (map, skipSave) {
    if (!map) map = this.map;
    if (!map) return Promise.reject('no map');
    const needsSave = this.state.isFirstLoadDone && !skipSave;
    const savePromise = needsSave ? this.saveMap() : Promise.resolve();
    return savePromise.then(() => {
      return new Promise((resolve, reject) => {
        const startStateAttrs = { mapId: map.$id, isFogLoaded: false };
        const finishStateAttrs = { isFirstLoadDone: true, isFogLoaded: true };
        this.setState(startStateAttrs, () => {
          /* Load bg first because that resizes the canvases */
          this.bgRef.current.load().then(() => {
            Promise.all([
              this.fogRef.current.load(),
              this.drawRef.current.load(),
            ]).then(() => {
              this.setState(finishStateAttrs);
            });
          });
        });
      });
    });
  }

  toJson () {
    return JSON.stringify({
      maps: this.state.maps,
      mapId: this.map && this.map.$id,
      tokens: this.state.tokens,
    });
  }

  fromJson (json) {
    const overrides = {};
    const data = Object.assign(JSON.parse(json), overrides);
    return new Promise(resolve => {
      this.setState(data, () => resolve(this.loadMap()));
    });
  }

  saveToLocalStorage () {
    if (this.state.isFirstLoadDone)
      localStorage.set(this.state.room, this.toJson());
  }

  loadFromLocalStorage () {
    return this.fromJson(localStorage.get(this.state.room));
  }

  get map () {
    let map = this.state.maps[this.state.mapId];
    return map || Object.values(this.state.maps)[0];
  }

  onBgClick () {
    this.setState({
      showMapsMenu: false,
      showTokensMenu: false,
    });
  }

  render () {
    try {
      return (
        <div id="game">
          <Background game={this} ref={this.bgRef} />
          <div className={this.state.isFogLoaded ? '' : 'gone'}>
            <Drawing game={this} ref={this.drawRef} />
            <Fog game={this} ref={this.fogRef} />
            {this.renderTokens()}
            {this.renderCursors()}
            <Overlay game={this} />
          </div>
          <ControlPanel game={this} />
        </div>
      );
    } catch (ex) {
      console.error(ex);
      console.error('Exception in `render`. Clearing localStorage...');
      localStorage.removeItem(this.state.room);
    }
  }

  renderCursors () {
    return null;
  }

  renderTokens () {
    return null;
  }
}
export default Game;
