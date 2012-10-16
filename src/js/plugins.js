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
      var tPlugin = pConfig.plugins[tPluginName];

      if (stat(tPluginDir + '/' + tPluginName) === null) {
        if (!pConfig.isQuiet) {
          print('Initializing plugin ' + tPluginName);
        }

        if (tLocationHandlers === null) {
          tLocationHandlers = {};
          global.fire('queryLocationHandlers', tLocationHandlers);
        }

        var tLocation = pConfig.expand(tPlugin.location);

        if (!(tLocation in tLocationHandlers)) {
          print('Invalid location type. The valid location types are:');
          for (var k in tLocationHandlers) {
            print('  ' + k);
          }
          return false;
        }

        var tHandler = new tLocationHandlers[tLocation](pConfig);
        tHandler.setData(tPluginDir + '/' + tPluginName, tPlugin);

        if (tHandler.execute() === false) {
          global.print('Failed to initialize plugin ' + tPluginName);
        }
      }
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
