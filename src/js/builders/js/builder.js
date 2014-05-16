/**
 * @author Jason Parrott
 *
 * Copyright (C) 2013 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global, evalGlobal) {

  var mBuildDepth = 0;

  var mFiles = [];

  /**
   * @class
   * @extends {plugins.Builder}
   */
  var JSBuilder = (function(pSuper) {
    function JSBuilder(pConfig) {
      if (!global.acorn) {
        evalGlobal(readAsset('acorn.js'));
      }

      if (!global.rejs) {
        evalGlobal(readAsset('rejs.js'));
      }

      pSuper.call(this, pConfig);

      this.output = '';

      this.data = {
        strict: true,
        minify: true,
        exports: null
      };

      this.workspace = '';

      mBuildDepth++;
    }

    JSBuilder.prototype = Object.create(pSuper.prototype);

    JSBuilder.prototype.setData = function(pData, pWorkspace) {
      var tData = this.data;
      this.workspace = pWorkspace;

      if (pData.outputs) {
        this.output = this.config.expand(pData.outputs);
      }

      if (pData.strict !== void 0) {
        tData.strict = pData.strict;
      }

      if (pData.minify !== void 0) {
        tData.minify = pData.minify;
      }

      if (pData.exports !== void 0) {
        tData.exports = pData.exports;
      }
    };

    JSBuilder.prototype.setResources = function(pResources) {
      var tFile, tRealPath;
      var tFiles = mFiles;

      for (var i = 0, il = pResources.length; i < il; i++) {
        tFile = pResources[i].file;

        if (stat(tFile) === null) {
          throw Error('Resource for JSBuilder ' + tFile + ' does not exist. Aborting...');
        }

        tRealPath = global.realpath(tFile);

        if (tFiles.indexOf(tRealPath) === -1) {
          tFiles.push(tRealPath);
        }
      }

      if (!this.output) {
        this.output = this.config.expand('${binDir}/${target}.js');
      }
    };

    JSBuilder.prototype.getOutputs = function() {
      mBuildDepth--;

      if (mBuildDepth === 0) {
        reset();
        return [this.output];
      }

      return [];
    };

    function reset() {
      mFiles.length = 0;
      mBuildDepth = 0;
    }

    function createCacheReader(pBuilder) {
      return function(pKey) {
        var tFileMTime = stat(pKey).mtime;
        var tFileStatsName = pBuilder.workspace + '/' + pKey.replace(/\//g, '_');
        var tFileStatsStat;

        if ((tFileStatsStat = stat(tFileStatsName)) === null || tFileStatsStat.mtime < tFileMTime) {
          return null;
        }

        return read(tFileStatsName);
      }
    }

    function createCacheWriter(pBuilder) {
      return function(pKey, pData) {
        var tFileStatsName = pBuilder.workspace + '/' + pKey.replace(/\//g, '_');
        
        write(tFileStatsName, pData);
      }
    }

    JSBuilder.prototype.build = function() {
      mBuildDepth--;

      if (mBuildDepth === 0) {
        var tOutputFile = this.output;

        if (!global.util.outputNeedsUpdate(tOutputFile, mFiles)) {
          tOutputFile.skipped = true;
          reset();

          return [tOutputFile];
        }

        var tReJSOptions = {
          readCache: createCacheReader(this),
          writeCache: createCacheWriter(this),
          log: print
        };

        var tResolver = new rejs.Resolver(tReJSOptions);
        var tUnsortedFiles = {};
        var tFileName;
        var i, il;

        for (i = 0, il = mFiles.length; i < il; i++) {
          tFileName = mFiles[i];
          tUnsortedFiles[tFileName] = global.read(tFileName);
        }

        var tSortedFiles = tResolver.resolve(tUnsortedFiles, this.data.exports);
        tOutput = '';

        for (i = 0, il = tSortedFiles.length; i < il; i++) {
          print(tSortedFiles[i]);

          tOutput += '\n' + tUnsortedFiles[tSortedFiles[i]];
        }

        system('mkdir -p $(dirname ' + tOutputFile + ')');

        write(tOutputFile, tOutput);

        reset();

        return [tOutputFile];
      }

      return [];
    };

    return JSBuilder;
  })(plugins.Builder);

  global.plugins.JSBuilder = JSBuilder;

  global.on('queryBuilders', function(pBuilders) {
    pBuilders['js'] = JSBuilder;
  });

}(this, function() {
  eval.apply(this, arguments);
}));
