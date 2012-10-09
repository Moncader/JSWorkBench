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
      print('Building dependency\n');
      var tTarget = this.config.targets[this.targets[i]];
      var tOutputs = this.config.workbench.runAction('build', [tTarget.id]);
      for (var j = 0, jl = tOutputs.length; j < jl; j++) {
        if (tOutputs[j].skipped !== true) {
          // Renaming in case the because closuer-compiler doesn't allow input and output files to have the same name.
          var tIndex = tOutputs[j].lastIndexOf('/') + 1;
          var tNewName = tOutputs[j].slice(0, tIndex) + '_' + tOutputs[j].slice(tIndex);
          if (system('test -f ' + tNewName + '; echo $?')[0] === '0'
            && system('test -f ' + tOutputs[j] + '; echo $?')[0] !== '0') {
            tOutputs[j] = tNewName;
          } else if (system('test -f ' + tOutputs[j] + '; echo $?')[0] === '0') {
            global.system('mv ' + tOutputs[j] + ' ' + (tOutputs[j] = tNewName));
          }
        }
        tResources.push({
          file: tOutputs[j]
        });
        global.util.negateProcessed(tOutputs[j]);
      }
    }

    return tResources;
  };

  global.on('queryResourceHandlers', function(pHandlers) {
    pHandlers.targets = TargetsResourceHandler;
  });

}(this));
