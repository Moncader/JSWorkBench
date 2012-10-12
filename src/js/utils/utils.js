(function(global) {

  global.util.outputNeedsUpdate = function(pOutput, pResources) {
    var stat = global.stat;
    var tOutputStat = stat(pOutput);
    if (tOutputStat === null) {
      return true;
    }

    var tOutputLastModified = tOutputStat.mtime;

    for (var i = 0, il = pResources.length; i < il; i++) {
      var tResourceStat = stat(pResources[i]);
      if (tResourceStat === null) {
        continue;
      }
      if (tResourceStat.mtime >= tOutputLastModified) {
        return true;
      }
    }

    return false;
  };

}(this));
