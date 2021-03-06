/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */


(function(global) {

  global.plugins.TargetsResourceHandler = TargetsResourceHandler;

  function TargetsResourceHandler(pConfig) {
    this.config = pConfig;
    this.targets = new Array();
  }

  TargetsResourceHandler.prototype = new global.plugins.ResourceHandler();

  TargetsResourceHandler.prototype.setData = function(pData, pWorkspace) {
    if (!pData.targets) {
      return;
    }

    var tTargets = pData.targets;
    for (var i = 0, il = tTargets.length; i < il; i++) {
      this.targets[i] = tTargets[i];
    }
  };

  TargetsResourceHandler.prototype.prepare = function() {
    for (var i = 0, il = this.targets.length; i < il; i++) {
      if (this.config.targets[this.targets[i]] === void 0) {
        print('The target ' + this.targets[i] + ' does not exist.');
        return false;
      }
    }
    return true;
  };

  TargetsResourceHandler.prototype.getResources = function() {
    var tResources = new Array();

    for (var i = 0, il = this.targets.length; i < il; i++) {
      if (!this.config.isQuiet) print('Building dependency\n');

      var tTarget = this.config.targets[this.targets[i]];
      var tBuildOutputs = this.config.workbench.runAction('build', [tTarget.id, '--first-only']);

      for (var j = 0, jl = tBuildOutputs.length; j < jl; j++) {
        tResources.push({
          file: tBuildOutputs[j]
        });
      }
    }

    return tResources;
  };

  global.on('queryResourceHandlers', function(pHandlers) {
    pHandlers.targets = TargetsResourceHandler;
  });

}(this));
