/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */


(function(global) {
  var print = global.print;
  var getcwd = global.getcwd;
  var chdir = global.chdir;

  global.plugins.PackageResourceHandler = PackageResourceHandler;

  function PackageResourceHandler(pConfig) {
    this.data = null;
    this.config = null;
    this.workspace = '';
    this.config = pConfig;
    this.hasBeenBuilt = false;
  }

  PackageResourceHandler.prototype = new global.plugins.ResourceHandler();

  PackageResourceHandler.prototype.setData = function(pData, pWorkspace) {
    if (!('location' in pData)) {
      throw new Error('package type needs to have a "location" setting.');
    }
    this.data = pData;
    this.workspace = pWorkspace + '/package';
  };

  PackageResourceHandler.prototype.prepare = function() {
    var tLocation = this.config.expand(this.data.location);
    var tLocationHandlers = new Object();

    global.fire('queryLocationHandlers', tLocationHandlers);

    if (!(tLocation in tLocationHandlers)) {
      print('Invalid location type. The valid location types are:');
      for (var k in tLocationHandlers) {
        print('  ' + k);
      }
      return false;
    }

    var tOverriden = false;
    var tHandler = new tLocationHandlers[tLocation](this.config);
    var tResult = tHandler.setData(this.workspace, this.data);
    if (tResult === false) {
      throw new Error('Failed to set data of package.');
    } else if (typeof tResult === 'string') {
      tOverriden = true;
      this.workspace = tResult;
    }
    if (tHandler.execute() === false) {
      return false;
    }

    var tCurrentWorkingDirectory = getcwd();
    chdir(this.workspace);

    var tPackageWorkBench = new WorkBench();
    if (!tPackageWorkBench.load(this.data.buildFile)) {
      throw new Error('Failed to get resources of package.');
    }
    var tPackageConfig = tPackageWorkBench.config;
    tPackageConfig.isDry = this.config.isDry;
    tPackageConfig.isQuiet = this.config.isQuiet;

    if (tOverriden === false) {
      if (this.data.targets) {
        var tTargets = this.data.targets;
        for (var i = 0, il = tTargets.length; i < il; i++) {
          tPackageWorkBench.runAction('update', [tTargets[i]]);
        }
      } else {
        tPackageWorkBench.runAction('update', [this.data.target]);
      }
    }

    chdir(tCurrentWorkingDirectory);

    return true;
  };

  PackageResourceHandler.prototype.getResources = function() {
    if (this.hasBeenBuilt === true) {
      return new Array(0);
    }

    var tCurrentWorkingDirectory = getcwd();
    chdir(this.workspace);

    var tPackageWorkBench = new WorkBench();
    if (!tPackageWorkBench.load(this.data.buildFile)) {
      throw new Error('Failed to get resources of package.');
    }
    var tPackageConfig = tPackageWorkBench.config;
    tPackageConfig.isDry = this.config.isDry;
    tPackageConfig.isQuiet = this.config.isQuiet;
    var tResources = new Array();
    var tTarget, tOutputs;

    if (this.data.targets) {
      var tTargets = this.data.targets;
      for (var i = 0, il = tTargets.length; i < il; i++) {
        var tOutputs = tPackageWorkBench.runAction('build', [tTargets[i]]);
        for (var k = 0, kl = tOutputs.length; k < kl; k++) {
          tResources.push({
            file: this.workspace + '/' + tOutputs[k]
          });
        }
      }
    } else {
      var tOutputs = tPackageWorkBench.runAction('build', [this.data.target]);
      for (var k = 0, kl = tOutputs.length; k < kl; k++) {
        tResources.push({
          file: this.workspace + '/' + tOutputs[k]
        });
      }
    }

    chdir(tCurrentWorkingDirectory);

    return tResources;
  };

  global.on('queryResourceHandlers', function(pHandlers) {
    pHandlers['package'] = PackageResourceHandler;
  });

}(this));
