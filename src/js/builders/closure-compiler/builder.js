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
    var tCmdLine = [
      'java -jar',
      this.config.properties['closure-compiler-jar'],
      '--language_in ' + (this.data.strict ? 'ECMASCRIPT5_STRICT' : 'ECMASCRIPT5'),
      '--compilation_level=' + this.data.compilationLevel,
      this.data.extraArgs
    ].join(' ');

    var self = this;

    function execute(pBase, pOutput, pResources) {
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

    if (this.output.length === 1) {
      execute(tCmdLine, this.output[0], this.resources.join(' '));
    } else {
      for (var i = 0, il = this.output.length; i < il; i++) {
        execute(tCmdLine, this.output[i], this.resources[i]);
      }
    }

    return this.output;
  };

  global.on('queryBuilders', function(pBuilders) {
    pBuilders['closure-compiler'] = ClosureCompilerBuilder;
  });
}(this));
