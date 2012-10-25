(function(global) {

  var realpath = global.realpath;

  var mTrackedOutputs = {};

  global.util.outputTracker = {

    track: function(pOutputs) {
      var tTracked;
      var tPath;

      for (var i = 0, il = pOutputs.length; i < il; i++) {
        tPath = realpath(pOutputs.file);
        tTracked = mTrackedOutputs[tPath];
        if (tTracked !== void 0) {
          tTracked++;
        } else {
          mTrackedOutputs[tPath] = 1;
        }
      }
    },

    get: function(pFile) {
      return mTrackedOutputs[realpath(pFile)] || 0;
    },

    clear: function() {
      mTrackedOutputs = {};
    }
  };

}(this));
