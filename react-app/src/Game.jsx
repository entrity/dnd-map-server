import React from 'react';
import Background from './Background.jsx';
import Drawing from './Drawing.jsx';
import Fog from './Fog.jsx';
import Overlay from './Overlay.jsx';
import ControlPanel from './ControlPanel.jsx';
import Token from './Token.jsx';

class Game extends React.Component {

  constructor (props) {
    super(props);
    window.game = this;
    const params = new URLSearchParams(window.location.href.replace(/.*\?/, ''));
    this.isHost = params.get('host');
    this.cpRef = React.createRef();
    this.bgRef = React.createRef();
    this.fogRef = React.createRef();
    this.drawRef = React.createRef();
    this.overlayRef = React.createRef();
    this.state = {
      maps: {},
      tokens: [],
      cursors: [],
      cursorSize: 50,
      fogOpacity: 0.5,
      fogUrl: undefined, /* data url */
      fogRadius: 33,
      isFogLoaded: false,
      isFirstLoadDone: false, /* Ensure we don't overwrite localStorage before load is done */
      drawColor: 'purple',
      drawSize: 44,
      tool: 'move',
      room: params.get('room') || 'defaultRoom',
    };
  }

  componentDidMount () {
    this.loadFromLocalStorage();
    window.addEventListener('beforeunload', this.saveToLocalStorage.bind(this));
    window.addEventListener('resize', this.onResize.bind(this));
  }

  componentWillUnmount () {
    window.removeEventListener('beforeunload', this.saveToLocalStorage.bind(this));
    window.removeEventListener('resize', this.onResize.bind(this));
    this.saveToLocalStorage();
  }

  initAsDev () {
    if (!window.confirm('Reset?')) return null;
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

  updateTokens (callback) {
    const tokensCopy = JSON.parse(JSON.stringify(this.state.tokens));
    tokensCopy.forEach(callback);
    this.setState({tokens: tokensCopy});
  }

  updateToken (token, callback) {
    const tokenIdx = this.state.tokens.indexOf(token);
    const tokensCopy = JSON.parse(JSON.stringify(this.state.tokens));
    const tokenCopy = tokensCopy[tokenIdx];
    callback(tokenCopy, tokenIdx, tokensCopy);
    this.setState({tokens: tokensCopy});
  }

  selectToken (token, trueFalse, multiSelect) {
    if (!token.pc && !this.isHost) return;
    const tokenIdx = this.state.tokens.indexOf(token);
    this.updateTokens((copy, $i) => {
      if (tokenIdx === $i) {
        if (trueFalse === undefined || trueFalse === null) trueFalse = !copy.$selected;
        copy.$selected = trueFalse;
      } else if (!multiSelect)
        copy.$selected = false;
      if (copy.$selected) { /* set initial coords (for drag) */
        copy.$x0 = copy.x;
        copy.$y0 = copy.y;
      }
    });
  }

  dragSelectedTokens (evt) {
    if (this.state.tool !== 'move') return;
    const downX = this.state.downX, downY = this.state.downY;
    this.updateTokens(token => {
      if (token.$selected) {
        token.x = token.$x0 + evt.pageX - downX;
        token.y = token.$y0 + evt.pageY - downY;
      }
    });
  }

  onResize () { this.loadMap(null, true) }

  onMouseDown (evt) {
    if (evt.buttons & 1) this.setState({
      lastX: evt.pageX, lastY: evt.pageY,
      downX: evt.pageX, downY: evt.pageY,
    });
  }

  onMouseMove (evt) {
    const overlay = this.overlayRef.current;
    if (overlay.canvasRef && overlay.canvasRef.current) overlay.clear();
    let x = evt.pageX, y = evt.pageY;
    switch (this.isHost ? this.state.tool : 'move') {
      case 'fog':
        if (evt.buttons & 1) overlay.fogErase(x, y);
        overlay.setPointerOutline(x, y, 'yellow', this.state.fogRadius);
        break;
      case 'draw':
        if (evt.buttons & 1) overlay.drawOrErase(x, y);
        overlay.setPointerOutline(x, y, this.state.drawColor, this.state.drawSize);
        break;
      case 'move':
        if (evt.buttons & 1) this.dragSelectedTokens(evt);
      default: return;
    }
    this.setState({lastX: evt.pageX, lastY: evt.pageY});
  }

  /* Copy maps and dump current map, suitable for save to state or localStorage */
  dumpMaps () {
    let mapId = this.state.mapId;
    /* Infer map id if it's not set */
    if (undefined === mapId) mapId = Object.keys(this.state.maps).find(key => this.state.maps[key] === this.map);
    const mapsCopy = JSON.parse(JSON.stringify(this.state.maps));
    const map = mapsCopy[mapId];
    if (!map) return Promise.resolve(); /* Map may have been deleted*/
    map.fogUrl = this.fogRef.current.buildDataUrl();
    map.drawUrl = this.drawRef.current.buildDataUrl();
    return mapsCopy;
  }

  /* From playarea to state */
  saveMap () {
    return new Promise((resolve, reject) => {      
      this.setState({ maps: this.dumpMaps() }, resolve);
    });
  }

  /* From state to playarea */
  loadMap (map, skipSave) {
    if (!map) map = this.map;
    if (!map) return Promise.reject('no map');
    if (undefined === map.$id) map.$id = Object.keys(this.state.maps).find(key => this.state.maps[key] === this.map);
    const needsSave = this.state.isFirstLoadDone && !skipSave;
    const savePromise = needsSave ? this.saveMap() : Promise.resolve();
    return savePromise.then(() => {
      return new Promise((resolve, reject) => {
        console.log('loading $id', map.$id);
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
      maps: this.dumpMaps(),
      mapId: this.map && this.map.$id,
      tokens: this.state.tokens, /* todo: rm $selected, etc s.t. other players aren't affected */
    });
  }

  fromJson (json) {
    const overrides = {};
    const data = Object.assign(JSON.parse(json)||{}, overrides);
    return new Promise(resolve => {
      this.setState(data, () => resolve(this.loadMap()));
    });
  }

  saveToLocalStorage () {
    if (this.state.isFirstLoadDone) {
      console.log('Saving game to local storage');
      localStorage.setItem(this.state.room, this.toJson());
    }
  }

  loadFromLocalStorage () {
    console.log('Loading game from local storage');
    return this.fromJson(localStorage.getItem(this.state.room));
  }

  get map () {
    let map = this.state.maps[this.state.mapId];
    return map || Object.values(this.state.maps)[0];
  }

  render () {
    const goneKlass = this.state.isFogLoaded ? null : 'gone';
    try {
      return (
        <div id="game" onMouseMove={this.onMouseMove.bind(this)} onMouseDown={this.onMouseDown.bind(this)}>
          <Background game={this} ref={this.bgRef} className={goneKlass} />
          <div className={goneKlass}>
            <Drawing game={this} ref={this.drawRef} />
            {this.renderTokens()}
            <Fog game={this} ref={this.fogRef} />
            {this.renderCursors()}
            <Overlay game={this} ref={this.overlayRef} />{/* Holds outline for fog & draw tools */}
          </div>
          <ControlPanel game={this} ref={this.cpRef} />
        </div>
      );
    } catch (ex) {
      console.error(ex);
      console.error('Exception in `render`. Clearing localStorage...');
      localStorage.removeItem(this.state.room);
    }
  }

  renderCursors () {
    const deadline = new Date() - 30000;
    const state = this.state;
    const cursors = this.state.cursors.filter(cur => cur.time > deadline);
    return <div id="cursors">
      {cursors.map((cur, $i) => {
        const divStyle = {
          top: cur.y, left: cur.x,
        };
        const imgStyle = {
          fontSize: state.cursorSize || undefined,
        };
        return <div key={`cursor${$i}`} style={divStyle} className="cursor">
          <span role="img" aria-label="pointer" style={imgStyle}>&#x1f5e1;</span>
          {cur.u}
        </div>
      })}
    </div>;
  }

  renderTokens () {
    return <div id="tokens">
      {this.state.tokens.map((token, $i) => (
        <Token key={`Token${$i}`} token={token} game={this} />
      ))}
    </div>;
  }
}
export default Game;
