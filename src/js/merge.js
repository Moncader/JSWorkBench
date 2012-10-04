/**                                                                                                                                    
 * @author Jason Parrott                                                                                                               
 *                                                                                                                                     
 * Copyright (C) 2012 Jason Parrott.                                                                                                   
 * This code is licensed under the zlib license. See LICENSE for details.                                                              
 */


(function(global) {
  var print = global.print;

  global.on('registerActions', function(pActions) {

    function mergeTarget(pTarget, pConfig) {
      pConfig.properties.targetId = pTarget.id;
      var tTargetName = pConfig.properties.target;

      if (!pConfig.isQuiet) print('Merge target ' + pTarget.id + ' (' + tTargetName + ')...');

      var tResourceHandlers = new Object();
      
      global.fire('queryResourceHandlers', tResourceHandlers);

      var tResources = pTarget.resources;
      var tResourceList = new Array();

      var tGlobalResources = pConfig.resources;

      for (var i = 0, il = tResources.length; i < il; i++) {
        var tResource = tResources[i];
        var tResourceId;
        if (tResource.type === 'reference') {
          if (!tResource.name) {
            print('The name of the reference needs to be specified.');
            return;
          }
          if (!(tResource.name in tGlobalResources)) {
            print('The given resource "' + tResource.name + '" does not exist.');
            return;
          }
          tResourceId = tResource.name;
          var tNewResource = tGlobalResources[tResource.name];
          for (var k in tResource) {
            if (k !== 'type' && k !== 'name') {
              tNewResource[k] = tResource[k];
            }
          }
          tResource = tNewResource;
        } else {
          tResourceId = tTargetName + '__resource_' + i;
        }

        tResource.id = tResourceId;

        if (!(tResource.type in tResourceHandlers)) {
          print('The specified resource handler (' + tResource.type + ") is not supported.\nSupported types are:");
          for (var k in tResourceHandlers) {
            print('  ' + k);
          }
          return;
        }

        var tWorkspace = (pConfig.properties.buildDir || 'build') +
              '/' + tResourceId;

        system("mkdir -p '" + tWorkspace + "'");

        var tResourceHandler = new tResourceHandlers[tResource.type](pConfig);
        tResourceHandler.setData(tResource, tWorkspace);
        if (!tResourceHandler.prepare()) {
          return;
        }

        var tPartialResourceList = tResourceHandler.getResources();
        for (var j = 0, jl = tPartialResourceList.length; j < jl; j++) {
          tPartialResourceList[j].resourceIndex = i;
        }

        tResourceList = tResourceList.concat(tPartialResourceList);
      }

      if (!pConfig.isQuiet) print('Finished building target ' + pTarget.id + ' (' + tTargetName + ').');

      return tResourceList;
    }

    pActions.merge = function(pConfig, pTarget) {
      var tTargets = pConfig.targets;
      var tResources= new Array();
      for (var k in tTargets) {
        var tResult = tTargets[k].regex.exec(pTarget);
        if (tResult) {
          pConfig.properties.target = pTarget;
          for (var i = 1, il = tResult.length; i < il; i++) {
            pConfig.properties['target.' + i] = tResult[i];
          }
          tResources = tResources.concat(mergeTarget(tTargets[k], pConfig));
        }
      }
      return tResources;
    };
  });

}(this));
