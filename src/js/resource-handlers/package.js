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
    this.workspace = pWorkspace;
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

    var tHandler = new tLocationHandlers[tLocation](this.config);
    tHandler.setData(this.workspace + '/package', this.data);
    if ((this.hasBeenBuilt = tHandler.hasBeenBuilt()) === true) {
      return true;
    }
    return tHandler.execute();
  };

  PackageResourceHandler.prototype.getResources = function() {
    if (this.hasBeenBuilt === true) {
      return new Array(0);
    }

    var tCurrentWorkingDirectory = getcwd();
    chdir(this.workspace + '/package');

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
            file: this.workspace + '/package/' + tOutputs[k]
          });
        }
      }
    } else {
      var tOutputs = tPackageWorkBench.runAction('build', [this.data.target]);
      for (var k = 0, kl = tOutputs.length; k < kl; k++) {
        tResources.push({
          file: this.workspace + '/package/' + tOutputs[k]
        });
      }
    }

    chdir(tCurrentWorkingDirectory);

    return tResources;
  };

  PackageResourceHandler.prototype.needSeparateNamespace = function() {
    return true; 
  };

  global.on('queryResourceHandlers', function(pHandlers) {
    pHandlers['package'] = PackageResourceHandler;
  });

}(this));
