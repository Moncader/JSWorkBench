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
    this.target = null;
    this.targets = null;
  };

  GitHandler.prototype = new global.plugins.LocationHandler();

  GitHandler.prototype.setData = function(pRoot, pData) {
    this.root = pRoot;
    this.url = pData.url;
    if ('branch' in pData) {
      this.branch = pData.branch;
    }
    this.target = pData.target;
    this.targets = pData.targets;
  };

  GitHandler.prototype.hasBeenBuilt = function() {
    if (mBuildCache[this.url] !== void 0) {
      if (this.targets) {
        for (var i = 0, il = this.targets.length; i < il; i++) {
          if (mBuildCache[this.url].indexOf(this.targets[i]) > -1) {
            // TODO: Support this properly.
            // We should actually make a diff of what targets
            // need updating. Right now if only one has been built
            // we kill it there.
            return true;
          }
        }
      } else if (this.target) {
        if (mBuildCache[this.url].indexOf(this.target) > -1) {
          return true;
        }
      } else {
        if (mBuildCache[this.url] !== void 0) {
          return true;
        }
      }
    }
    return false;
  };

  GitHandler.prototype.execute = function() {
    var tRoot = this.root;

    var tOut = system("if [ -d '" + tRoot + "' ] ; then cd '" + tRoot + "' && git pull origin " + this.branch + "; else git clone -b " + this.branch + " " + this.url + " " + tRoot + '; fi');

    if (!this.config.isQuiet) print(tOut);

    tOut = system('cd ' + tRoot + ' && git submodule update --init');

    if (!this.config.isQuiet) print(tOut);

    var tCache = mBuildCache[this.url];
    if (tCache === void 0) {
      if (this.targets) {
        mBuildCache[this.url] = new Array(this.targets.length);
        for (var i = 0, il = this.targets.length; i < il; i++) {
          mBuildCache[this.url][i] = this.targets[i];
        }
      } else if (this.target) {
        mBuildCache[this.url] = [this.target];
      } else {
        mBuildCache[this.url] = [];
      }
    } else {
      if (this.targets) {
        for (var i = 0, il = this.targets.length; i < il; i++) {
          tCache.push(this.targets[i]);
        }
      } else if (this.target) {
        tCache.push(this.target);
      }
    }

    return true;
  };

  global.on('queryLocationHandlers', function(pHandlers) {
    pHandlers['git'] = GitHandler;
  });

}(this));
