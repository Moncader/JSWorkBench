/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */


(function(global) {

  global.plugins.OutputResourceHandler = OutputResourceHandler;

  function OutputResourceHandler(pConfig) {
    this.config = pConfig;
    this.includes = new Array();
    this.excludes = new Array();
  }

  OutputResourceHandler.prototype = new global.plugins.ResourceHandler();

  OutputResourceHandler.prototype.setData = function(pData, pWorkspace) {
    if ('include' in pData) {
      if (typeof pData.include === 'string') {
        this.includes[0] = new RegExp(this.config.expand(pData.include));
      } else {
        for (var i = 0, il = pData.include.length; i < il; i++) {
          this.includes[i] = new RegExp(this.config.expand(pData.include[i]));
        }
      }
    }

    if ('exclude' in pData) {
      if (typeof pData.include === 'string') {
        this.excludes[0] = new RegExp(this.config.expand(pData.exclude));
      } else {
        for (var i = 0, il = pData.exclude.length; i < il; i++) {
          this.excludes[i] = new RegExp(this.config.expand(pData.exclude[i]));
        }
      }
    }
  };

  OutputResourceHandler.prototype.prepare = function() {
    return true;
  };

  OutputResourceHandler.prototype.getResources = function() {
    var tIncludes = this.includes;
    var tIncludesLength = tIncludes.length;
    var tExcludes = this.excludes;
    var tExcludesLength = tExcludes.length;
    var tResources = [];
    var tOutputs = this.config.outputTracker.getAll();
    var i, il;

    if (tIncludesLength > 0) {
      tOutputs = tOutputs.filter(function(pElement) {
        for (i = 0; i < tIncludesLength; i++) {
          if (!tIncludes[i].test(pElement)) {
            return false;
          }
        }
        return true;
      });
    }

    if (tExcludesLength > 0) {
      tOutputs = tOutputs.filter(function(pElement) {
        for (i = 0; i < tExcludesLength; i++) {
          if (tExcludes[i].test(pElement)) {
            return false;
          }
        }
        return true;
      });
    }

    for (i = 0, il = tOutputs.length; i < il; i++) {
      tResources[i] = {
        file: tOutputs[i]
      };
    }

    return tResources;
  };

  global.on('queryResourceHandlers', function(pHandlers) {
    pHandlers.output = OutputResourceHandler;
  });

}(this));
