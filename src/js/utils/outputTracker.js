(function(global) {

  var realpath = global.realpath;

  global.util.OutputTracker = OutputTracker;

  function OutputTracker() {
    this.trackedOutputs = {};
  }

  OutputTracker.prototype.track = function(pOutputs) {
    var tTracked;
    var tPath;
    var tOutput;
    var tTrackedOutputs = this.trackedOutputs;

    for (var i = 0, il = pOutputs.length; i < il; i++) {
      tOutput = pOutputs[i];
      if (typeof tOutput === 'string') {
        tPath = realpath(tOutput);
      } else {
        tPath = realpath(tOutput.file);
      }
      tTracked = tTrackedOutputs[tPath];
      if (tTracked !== void 0) {
        tTrackedOutputs[tPath]++;
      } else {
        tTrackedOutputs[tPath] = 1;
      }
    }
  };

  OutputTracker.prototype.get = function(pFile) {
    return this.trackedOutputs[realpath(pFile)] || 0;
  };

  OutputTracker.prototype.getAll = function() {
    var tTrackedOutputs = this.trackedOutputs;
    var tOutputs = [];

    for (var k in tTrackedOutputs) {
      tOutputs.push(k);
    }

    return tOutputs;
  };

  OutputTracker.prototype.clear = function() {
    this.trackedOutputs = {};
  };

}(this));
