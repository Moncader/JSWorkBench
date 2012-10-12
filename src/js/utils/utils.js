(function(global) {

  global.util.outputNeedsUpdate = function(pOutput, pResources) {
    var getLastModified = global.getLastModified;
    var tOutputLastModified = getLastModified(pOutput);

    for (var i = 0, il = pResources.length; i < il; i++) {
      if (getLastModified(pResources[i]) >= tOutputLastModified) {
        return true;
      }
    }

    return false;
  };

}(this));
