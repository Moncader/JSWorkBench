/**                                                                                                                                    
 * @author Jason Parrott                                                                                                               
 *                                                                                                                                     
 * Copyright (C) 2012 Jason Parrott.                                                                                                   
 * This code is licensed under the zlib license. See LICENSE for details.                                                              
 */


(function(global) {
  var print = global.print,
  system = global.system;

  global.plugins.ClosureCompilerBuilder = ClosureCompilerBuilder;

  /**
   * @constructor
   * @lends {plugins.Builder}
   */
  function ClosureCompilerBuilder(pConfig) {
    this.output = '';
    this.resources = new Array();
    this.data = {
      strict: true,
      extraArgs: pConfig.properties['closure-compiler-extra-args'] || '',
      compilationLevel: pConfig.properties['closure-compiler-compilation-level'] || 'SIMPLE_OPTIMIZATIONS'
    };
    this.config = pConfig;
  }

  ClosureCompilerBuilder.prototype = new global.plugins.Builder();

  ClosureCompilerBuilder.prototype.setData = function(pData) {
    var tData = this.data;
    if (pData.strict !== void 0) tData.strict = pData.strict;
    if (pData.extraArgs !== void 0) tData.extraArgs = pData.extraArgs;
    if (pData.compilationLevel !== void 0) tData.compilationLevel = pData.compilationLevel;
  };

  ClosureCompilerBuilder.prototype.setOutputs = function(pOutputs) {
    this.output = new Array(pOutputs.length);
    for (var i = 0, il = pOutputs.length; i < il; i++) {
      this.output[i] = pOutputs[i];
    }
  };

  ClosureCompilerBuilder.prototype.setResources = function(pResources) {
    this.resources.length = 0;

    if (this.output.length === 1) {
      pResources = global.util.resolveJavaScriptFileOrder(pResources, this.config.isQuiet);
    }

    for (var i = 0, il = pResources.length; i < il; i++) {
      this.resources[i] = pResources[i].file;
    }
  };

  ClosureCompilerBuilder.prototype.buildDry = function() {
    return this.output;
  };

  ClosureCompilerBuilder.prototype.build = function() {
    var tJarFile = this.config.properties['closure-compiler-jar'];

    if (system('test -f ' + tJarFile + '; echo $?')[0] !== '0') {
      if (!this.config.isQuiet) print('Downloading Google Closure Compiler...');
      var tOutput = system('curl http://closure-compiler.googlecode.com/files/compiler-latest.zip -o compiler-latest.zip && unzip compiler-latest.zip compiler.jar && rm compiler-latest.zip && mkdir -p $(dirname ' + tJarFile + ') && mv compiler.jar ' + tJarFile);
      if (!this.config.isQuiet) print(tOutput);
      if (system('test -f ' + tJarFile + '; echo $?')[0] !== '0') {
        print('Could not download the closure compiler. Aborting.');
        return false;
      }
    }

    var tCmdLine = [
      'java -jar',
      tJarFile,
      '--language_in ' + (this.data.strict ? 'ECMASCRIPT5_STRICT' : 'ECMASCRIPT5'),
      '--compilation_level=' + this.data.compilationLevel,
      this.data.extraArgs
    ].join(' ');

    var self = this;

    function execute(pBase, pOutput, pResources) {
      system('mkdir -p $(dirname ' + pOutput + ')');
      var tCmdLineString =
        pBase +
        ' --js_output_file=' +
        pOutput +
        ' ' +
        pResources;

      if (!self.config.isQuiet) print(tCmdLineString);
      var tStdout = system(tCmdLineString);
      if (!self.config.isQuiet) print(tStdout);
    }

    for (var i = 0, il = this.output.length; i < il; i++) {
    }


    if (this.output.length === 1) {
      if (system('test -f ' + this.output[0] + '; echo $?')[0] === '0') {
        if (!global.util.outputNeedsUpdate(this.output[0], this.resources)) {
          return this.output;
        }
      }
      execute(tCmdLine, this.output[0], this.resources.join(' '));
    } else {
      for (var i = 0, il = this.output.length; i < il; i++) {
        if (system('test -f ' + this.output[i] + '; echo $?')[0] === '0') {
          if (!global.util.outputNeedsUpdate(this.output[i], [this.resources[i]])) {
            continue;
          }
        }
        execute(tCmdLine, this.output[i], this.resources[i]);
      }
    }

    return this.output;
  };

  global.on('queryBuilders', function(pBuilders) {
    pBuilders['closure-compiler'] = ClosureCompilerBuilder;
  });
}(this));
