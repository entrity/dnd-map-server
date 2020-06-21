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
    this.bgRef = React.createRef();
    this.fogRef = React.createRef();
    this.drawingRef = React.createRef();
    this.state = {
      isFogLoaded: false,
      showMapsMenu: false,
      showTokensMenu: false,
      isFirstLoadDone: false, /* Ensure we don't overwrite localStorage before load is done */
    };
  }

  componentDidMount () {
    this._development().then(() => {
      console.log('dev loadlaoded', this);
      // console.log(this.state.maps[1])
      // console.log(this.state.maps[2])
      this.loadMap(this.state.maps[2]);
    })
    // window.addEventListener('beforeunload', this.saveLocalStorage.bind(this));
    // window.addEventListener('resize', this.drawMap.bind(this));
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
    // window.removeEventListener('beforeunload', this.saveLocalStorage.bind(this));
    // window.removeEventListener('resize', this.drawMap.bind(this));
    // this.removeControlsCallbacks();
    // this.saveLocalStorage();
  }

  loadMap (map) {
    return new Promise((resolve, reject) => {
      this.setState({mapId: (map || this.map).$id}, () => {
        this.bgRef.current.load().then(() => {
          this.fogRef.current.load();
          this.setState({isFirstLoadDone: true});
        });
      });
    });
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
        <div id="wrapper">
          <Background game={this} ref={this.bgRef} />
          <div className={this.state.fogLoaded || 'gone'}>
            <Drawing game={this} ref={this.drawingRef} />
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
      localStorage.removeItem(this.room);
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
