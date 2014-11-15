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

  global.util.gitCommitDate = function(pCommit, pAuthorDate) {
    var tDateFormat = 'cd';
    if (pAuthorDate) {
      tDateFormat = 'ad';
    }
    return system('git show --format=format:"%' + tDateFormat + '" ' + pCommit + ' | head -n 1').trim();
  };

  global.util.gitUpdateCurrentBranch = function(pCommit) {
    system('git reset --hard ' + pCommit);
  };

}(this));
