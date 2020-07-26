function guid () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (window.crypto.getRandomValues(new Uint32Array(1))[0] * Math.pow(2,-32) * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8); /* eslint-disable-line no-mixed-operators */
    return v.toString(16);
  });
}
export default guid;
