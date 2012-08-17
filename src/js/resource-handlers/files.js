/**                                                                                                                                    
 * @author Jason Parrott                                                                                                               
 *                                                                                                                                     
 * Copyright (C) 2012 Jason Parrott.                                                                                                   
 * This code is licensed under the zlib license. See LICENSE for details.                                                              
 */


(function(global) {
  var system = global.system;

  global.plugins.FileResourceHandler = FileResourceHandler;

  function FileResourceHandler(pConfig) {
    this.includes = new Array();
    this.files = new Array();
    this.excludes = new Array();
    this.root = '';
    this.config = pConfig;
  }

  FileResourceHandler.prototype = new global.plugins.ResourceHandler();

  FileResourceHandler.prototype.setData = function(pData) {
    if (!(('include' in pData) || ('files' in pData))) {
      throw new Error('files type needs to have an "include" or a "files" setting.');
    }
    this.root = 'root' in pData ? this.config.expand(pData.root) : '.';

    if (pData.files !== void 0) {
      for (var i = 0, il = pData.files.length; i < il; i++) {
        this.files[i] = this.config.expand(pData.files[i]);
      }
    }

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

  FileResourceHandler.prototype.prepare = function() {
    return true;
  };

  FileResourceHandler.prototype.getResources = function() {
    var tIncludes = this.includes;
    var tIncludesLength = tIncludes.length;
    var tExcludes = this.excludes;
    var tExcludesLength = tExcludes.length;
    var tRoot = this.root;
    var tFiles;

    if (this.files.length === 0) {
      var tFilesString = system('cd ' + tRoot + " && find . -type f");
      tFiles = tFilesString
      .substring(2, tFilesString.length - 1)
      .replace(/\.\//g, '')
        .split(/\n/)
      .filter(function(pElement) {
        for (var i = 0; i < tIncludesLength; i++) {
          if (!tIncludes[i].test(pElement)) {
            return false;
          }
        }
        return true;
      });
    } else {
      tFiles = this.files.filter(function(pElement) {
        for (var i = 0; i < tIncludesLength; i++) {
          if (!tIncludes[i].test(pElement)) {
            return false;
          }
        }
        return true;
      });
    }

    if (tExcludesLength > 0) {
      tFiles = tFiles.filter(function(pElement) {
        for (var i = 0; i < tExcludesLength; i++) {
          if (tExcludes[i].test(pElement)) {
            return false;
          }
        }
        return true;
      });
    }

    var tResources = new Array(tFiles.length);

    for (var i = 0, il = tFiles.length; i < il; i++) {
      tResources[i] = {
        file: tRoot + '/' + tFiles[i],
        pathNamespace: tFiles[i].replace(/\..+$/, '')
      };

      if (tIncludesLength !== 0) {
        var tMatches = tIncludes[0].exec(tFiles[i]);
        if (tMatches !== null && tMatches.length > 1) {
          var tCaptures = new Array(tMatches.length - 1);
          for (var j = 0, jl = tCaptures.length; j < jl; j++) {
            tCaptures[j] = tMatches[j + 1];
          }
          tResources[i].outputCaptures = tCaptures;
        }
      }
    }

    return tResources;
  };

  global.on('queryResourceHandlers', function(pHandlers) {
    pHandlers['files'] = FileResourceHandler;
  });

}(this));
