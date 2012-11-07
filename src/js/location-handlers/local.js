/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */


(function(global) {
  var system = global.system,
  print = global.print;

  function LocalHandler(pConfig) {
    this.config = pConfig;
    this.path = '';
  };

  LocalHandler.prototype = new global.plugins.LocationHandler();

  LocalHandler.prototype.setData = function(pRoot, pData) {
    this.path = pData.path;
    if (!this.path) {
      return false;
    }

    return this.path;
  };

  LocalHandler.prototype.execute = function() {
    if (global.stat(this.path) === null) {
      print('Local path does not exist.');
      return false;
    }
    return true;
  };

  global.on('queryLocationHandlers', function(pHandlers) {
    pHandlers['local'] = LocalHandler;
  });

}(this));
