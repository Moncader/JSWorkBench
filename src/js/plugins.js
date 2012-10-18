/**
 * @author Jason Parrott
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  var stat = global.stat;

  global.on('parsedConfig', function(pConfig) {
    var tPluginDir = pConfig.properties.pluginDir || 'jsworkbench-plugins';

    if (!tPluginDir) {
      return;
    }

    var tLocationHandlers = null;

    for (var tPluginName in pConfig.plugins) {
      global.plugins.init(pConfig, tPluginName, false);
    }

    if (stat(tPluginDir) === null) {
      return;
    }

    var tFiles = global.system('find ' + tPluginDir + ' -type f -name \'*.js\'')
      .split(/\n/);

    for (var i = 0, il = tFiles.length; i < il; i++) {
      if (tFiles[i] === '') continue;

      try {
        evalFile(tFiles[i]);
      } catch (e) {
        global.print('Failed to load plugin ' + tFiles[i]);
        global.print(e);
        return;
      }
    }
  });
}(this));
