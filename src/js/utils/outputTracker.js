(function(global) {

  var realpath = global.realpath;

  var mTrackedOutputs = {};

  global.util.outputTracker = {

    track: function(pOutputs) {
      var tTracked;
      var tPath;
      var tOutput;

      for (var i = 0, il = pOutputs.length; i < il; i++) {
        tOutput = pOutputs[i];
        if (typeof tOutput === 'string') {
          tPath = realpath(tOutput);
        } else {
          tPath = realpath(tOutput.file);
        }
        tTracked = mTrackedOutputs[tPath];
        if (tTracked !== void 0) {
          mTrackedOutputs[tPath]++;
        } else {
          mTrackedOutputs[tPath] = 1;
        }
      }
    },

    get: function(pFile) {
      return mTrackedOutputs[realpath(pFile)] || 0;
    },

    getAll: function() {
      var tOutputs = [];

      for (var k in mTrackedOutputs) {
        tOutputs.push(k);
      }

      return tOutputs;
    },

    clear: function() {
      mTrackedOutputs = {};
    }
  };

}(this));
