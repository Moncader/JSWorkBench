/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  var initPlugin = global.plugins.init = function (pConfig, pName, pUpdate) {
    var tPluginDir = pConfig.properties.pluginDir || 'jsworkbench-plugins';

    if (!tPluginDir) {
      return;
    }

    var tPlugin = pConfig.plugins[pName];

    if (pUpdate || stat(tPluginDir + '/' + pName) === null) {
      if (!pConfig.isQuiet) {
        print('Initializing plugin ' + pName);
      }

      var tLocationHandlers = {};
      global.fire('queryLocationHandlers', tLocationHandlers);

      var tLocation = pConfig.expand(tPlugin.location);

      if (!(tLocation in tLocationHandlers)) {
        print('Invalid location type. The valid location types are:');
        for (var k in tLocationHandlers) {
          print('  ' + k);
        }
        return false;
      }

      var tHandler = new tLocationHandlers[tLocation](pConfig);
      tHandler.setData(tPluginDir + '/' + pName, tPlugin);

      if (tHandler.execute() === false) {
        global.print('Failed to initialize plugin ' + pName);
      }
    }
  }

  var mActions = {
    update: updatePlugins
  };

  function updatePlugins(pConfig) {
    for (var tPluginName in pConfig.plugins) {
      initPlugin(pConfig, tPluginName, true);
    }
  }

  function pluginsAction(pConfig, pSubaction) {
    if (!(pSubaction in mActions)) {
      print('Subaction required.');
      print('Subactions are:');
      for (var k in mActions) {
        print('  ' + k);
      }
    } else {
      mActions[pSubaction](pConfig);
    }
  }

  global.on('registerActions', function(pActions) {
    pActions.plugins = pluginsAction;
  });

}(this));