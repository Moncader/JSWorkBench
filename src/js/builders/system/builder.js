/**                                                                                                                                    
 * @author Jason Parrott                                                                                                               
 *                                                                                                                                     
 * Copyright (C) 2012 Jason Parrott.                                                                                                   
 * This code is licensed under the zlib license. See LICENSE for details.                                                              
 */


(function(global) {

  var system = global.system;

  global.plugins.SystemBuilder = SystemBuilder;

  function SystemBuilder(pConfig) {
    this.config = pConfig;
    this.command = '_invalid_';
    this.outputs = new Array();
    this.resources = new Array();
  }

  SystemBuilder.prototype = new global.plugins.Builder();

  SystemBuilder.prototype.setData = function(pData) {
    if (!pData.command) {
      print('The system builder requires a "command" property.');
      return false;
    }
    this.command = pData.command;
  };

  SystemBuilder.prototype.setOutputs = function(pOutputs) {
    for (var i = 0, il = pOutputs.length; i < il; i++) {
      this.outputs[i] = "'" + pOutputs[i] + "'";
    }
  };

  SystemBuilder.prototype.setResources = function(pResources) {
    for (var i = 0, il = pResources.length; i < il; i++) {
      this.resources[i] = "'" + pResources[i].file + "'";
    }
  };

  SystemBuilder.prototype.buildDry = function() {
    print('The system builder does not support dry builds.');
    return false;
  };

  SystemBuilder.prototype.build = function() {
    return system(
      this.command +
      ' ' +
      this.resources.join(' ') +
      ' -- ' +
      this.outputs.join(' ')
    )
    .split('\n')
    .filter(function(pEntry) {
      if (!pEntry) return false;
      return true;
    });
  };

  global.on('queryBuilders', function(pBuilders) {
    pBuilders.system = SystemBuilder;
  });

}(this));
