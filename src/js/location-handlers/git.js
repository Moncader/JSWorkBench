/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */


(function(global) {
  var system = global.system,
  print = global.print;

  var mBuildCache = new Object();

  function GitHandler(pConfig) {
    this.url = '';
    this.branch = 'master';
    this.root = '';
    this.config = pConfig;
  };

  GitHandler.prototype = new global.plugins.LocationHandler();

  GitHandler.prototype.setData = function(pRoot, pData) {
    this.root = pRoot;
    this.url = pData.url;
    if ('branch' in pData) {
      this.branch = pData.branch;
    }
  };

  GitHandler.prototype.execute = function() {
    var tRoot = this.root;
    var tDateTime = this.config.dateTime;

    var tCommand = "if [ -d '" + tRoot + "' ] ; then cd '" + tRoot + "' && git pull origin " + this.branch + "; else git clone -b " + this.branch + " " + this.url + " " + tRoot + '; fi';
    print(tCommand);
    var tOut = system(tCommand);

    if (!this.config.isQuiet) print(tOut);

    if (tDateTime) {
      tCommand = 'cd ' + tRoot + ' && git rev-list -n 1 --before="' + tDateTime + '" ' + this.branch;
      if (!this.config.isQuiet) print(tCommand);
      var tCommit = tOut = system(tCommand);
      if (!this.config.isQuiet) print(tOut);
      tCommand = 'cd ' + tRoot + ' && git reset --hard ' + tCommit;
      if (!this.config.isQuiet) print(tCommand);
      tOut = system(tCommand);
      if (!this.config.isQuiet) print(tOut);
    }

    tOut = system('cd ' + tRoot + ' && git submodule update --init');

    if (!this.config.isQuiet) print(tOut);

    return true;
  };

  global.on('queryLocationHandlers', function(pHandlers) {
    pHandlers['git'] = GitHandler;
  });

}(this));
