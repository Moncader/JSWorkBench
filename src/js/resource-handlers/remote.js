/**                                                                                                                                    
 * @author Jason Parrott                                                                                                               
 *                                                                                                                                     
 * Copyright (C) 2012 Jason Parrott.                                                                                                   
 * This code is licensed under the zlib license. See LICENSE for details.                                                              
 */


(function(global) {
  var print = global.print;
  var getcwd = global.getcwd;
  var chdir = global.chdir;

  global.plugins.RemoteResourceHandler = RemoteResourceHandler;
  
  var FileResourceHandler = global.plugins.FileResourceHandler;

  function RemoteResourceHandler(pConfig) {
    this.data = null;
    this.workspace = '';
    this.config = pConfig;
    this.hasBeenBuilt = false;
  }

  RemoteResourceHandler.prototype = new FileResourceHandler();

  RemoteResourceHandler.prototype.setData = function(pData, pWorkspace) {
    FileResourceHandler.prototype.setData.call(this, pData);

    if (!('location' in pData)) {
      throw new Error('remote type needs to have a "location" setting.');
    }
    this.data = pData;
    this.workspace = pWorkspace;
    this.root = pWorkspace + '/remote/' + this.root;
  };

  RemoteResourceHandler.prototype.prepare = function() {
    var tLocation = this.config.expand(this.data.location);
    var tLocationHandlers = new Object();

    global.fire('queryLocationHandlers', tLocationHandlers);

    if (!(tLocation in tLocationHandlers)) {
      print('Invalid location type. The valid location types are:');
      for (var k in tLocationHandlers) {
        print('  ' + k);
      }
      return false;
    }

    var tHandler = new tLocationHandlers[tLocation](this.config);
    tHandler.setData(this.workspace + '/remote', this.data);
    if ((this.hasBeenBuilt = tHandler.hasBeenBuilt()) === true) {
      return true;
    }
    return tHandler.execute();
  };

  RemoteResourceHandler.prototype.getResources = function() {
    if (this.hasBeenBuilt === true) {
      return new Array(0);
    }

    var tResources = FileResourceHandler.prototype.getResources.call(this);

    return tResources;
  };

  global.on('queryResourceHandlers', function(pHandlers) {
    pHandlers['remote'] = RemoteResourceHandler;
  });

}(this));
