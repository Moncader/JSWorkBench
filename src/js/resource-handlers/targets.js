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
    var tResources = new Array(),
      getDest = function (pSrc, pPrefix) {
          var tIndex = pSrc.lastIndexOf('/') + 1;
          return pSrc.slice(0, tIndex) + pPrefix + pSrc.slice(tIndex);
        };

    for (var i = 0, il = this.targets.length; i < il; i++) {
      print('Building dependency\n');
      var tTarget = this.config.targets[this.targets[i]];
      var tOutputs = this.config.workbench.runAction('build', [tTarget.id]);
      for (var j = 0, jl = tOutputs.length; j < jl; j++) {
        if (tOutputs[j].skipped !== true 
          && system('test -f ' + tOutputs[j] + '; echo $?')[0] === '0') {
          // Renaming is required here because closuer-compiler doesn't allow input and output files to have the same name.
          var tSrc = tOutputs[j];
          var tDest = getDest(tSrc, tTarget.id + '_');
          while (system('test -f ' + tDest + '; echo $?')[0] === '0') {
            tDest = getDest(tDest, '_');
          }
          global.system('mv ' + tSrc + ' ' + tDest);
          tResources.push({file: tDest});
          global.util.resourceTracker.clear(tDest);
        }
      }
    }

    return tResources;
  };

  global.on('queryResourceHandlers', function(pHandlers) {
    pHandlers.targets = TargetsResourceHandler;
  });

}(this));
