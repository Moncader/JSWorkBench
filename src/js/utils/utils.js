(function(global) {

  global.util.outputNeedsUpdate = function(pOutput, pResources) {
    var getLastModified = global.getLastModified;
    var tOutputLastModified = getLastModified(pOutput);

    for (var i = 0, il = pResources.length; i < il; i++) {
      if (getLastModified(pResources[i]) > tOutputLastModified) {
        return true;
      }
    }

    return false;
  };

  global.util.removeRedundantResources = function(pResources) {
    var prev;

    pResources.sort(function (a, b) {
        if (a.file < b.file) {
          return -1;
        } else if (a.file > b.file) {
          return 1;
        }
        return 0;
      });

    return pResources.filter(function (e) {
        if (e == prev) {
          return false;
        }
        prev = e;
        return true;
      });
  };

}(this));
