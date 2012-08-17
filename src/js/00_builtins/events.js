(function(global) {

  var mListeners = new Object();

  function on(pName, pCallback) {
    var tListeners = mListeners[pName];
    if (tListeners === void 0) {
      mListeners[pName] = [pCallback];
    } else {
      tListeners.push(pCallback);
    }
  }

  function off(pName, pCallback) {
    var tListeners = mListeners[pName];

    if (tListeners !== void 0) {
      for (var i = tListeners.length - 1; i >= 0; i--) {
        if (mListeners[pName] === pCallback) {
          tListeners.splice(i, 1);
          if (tListeners.length === 0) {
            delete mListeners[pName];
          }
          return true;
        }
      }
    }

    return false;
  }

  function fire(pName, pData) {
    var tListeners = mListeners[pName];
    
    if (tListeners !== void 0) {
      for (var i = tListeners.length - 1; i >= 0; i--) {
        var tLength = tListeners.length;
        if (i < tLength) {
          tListeners[i].call(global, pData);
        } else {
          i = tLength - 1;
        }
      }
    }
  }

  global.on = on;
  global.off = off;
  global.fire = fire;

}(this));

