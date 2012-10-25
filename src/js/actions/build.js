/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */


(function(global) {
  var print = global.print;

  global.on('registerActions', function(pActions) {

    function buildTarget(pTarget, pConfig) {
      pConfig.properties.targetId = pTarget.id;
      var tTargetName = pConfig.properties.target;

      if (!pConfig.isQuiet) print('Building target ' + pTarget.id + ' (' + tTargetName + ')...');

      var tBuilderType = pTarget.builder || pConfig.properties.defaultBuilder;
      var tBuilders = new Object();

      global.fire('queryBuilders', tBuilders);

      if (!(tBuilderType in tBuilders)) {
        print('The specified builder (' + tBuilderType + ") is not supported.\nSupported types are:");
        for (var k in tBuilders) {
          print('  ' + k);
        }
        return;
      }

      var tBuilder = new tBuilders[tBuilderType](pConfig);

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

        var tNeedsPrepare = false;
        if (global.stat(tWorkspace) === null) {
          tNeedsPrepare = true;
          system("mkdir -p '" + tWorkspace + "'");
        }

        var tResourceHandler = new tResourceHandlers[tResource.type](pConfig);
        tResourceHandler.setData(tResource, tWorkspace);

        if (tNeedsPrepare === true) {
          if (!tResourceHandler.prepare()) {
            return;
          }
        }

        /*var tSeparateNamespace = tResourceHandler.needSeparateNamespace();
        var resourceTracker = global.util.resourceTracker;
        if (tSeparateNamespace) {
          resourceTracker.push(tWorkspace);
        }*/

        var tPartialResourceList = tResourceHandler.getResources();
        for (var j = 0, jl = tPartialResourceList.length; j < jl; j++) {
          tPartialResourceList[j].resourceIndex = i;
        }
        /*tPartialResourceList = resourceTracker.trackAndProcess(tPartialResourceList);
        if (tSeparateNamespace) {
          resourceTracker.pop();
        }*/

        tResourceList = tResourceList.concat(tPartialResourceList);
      }

      /*if (tResourceList.length === 0) {
        if (!pConfig.isQuiet) print('Skipping target ' + pTarget.id + ' (' + tTargetName + ') to avoid redundancy.');
        return [pConfig.expand(pTarget.outputs)];
      }
      tResourceList = resourceTracker.trackAndProcess(tResourceList, true);
      */
      if (tBuilder.setData(pTarget) === false) {
        throw new Error('Setting data for builder failed.');
      }

      if (tBuilder.setResources(tResourceList) === false) {
        throw new Error('Setting resources for builder failed.');
      }

      var tOutputs;

      if ((tOutputs = (pConfig.isDry ? tBuilder.getOutputs() : tBuilder.build())) === false) {
        throw new Error('Building target ' + pTarget.id + ' (' + tTargetName + ') failed.');
      }

      if (!pConfig.isQuiet) print('Finished building target ' + pTarget.id + ' (' + tTargetName + ').');

      return tOutputs;
    }

    pActions.build = function(pConfig) {
      var tArguments = Array.prototype.slice.call(arguments, 1)
            .filter(function(pArg) {
              if (pArg[0] !== '-') {
                return true;
              }
              return false;
            });

      if (tArguments.length === 0) {
        if (typeof pConfig.raw.defaultTarget === 'string') {
          return pActions.build(pConfig, pConfig.raw.defaultTarget);
        }

        print('Please select a target. Valid targets are:');
        pConfig.printTargets();

        return null;
      } else {
        var tOutputs = new Array();
        var tTargets = pConfig.targets;

        for (var i = 0, il = tArguments.length; i < il; i++) {
          var tTarget = tArguments[i];
          var tGotOne = false;
          for (var k in tTargets) {
            var tResult = tTargets[k].regex.exec(tTarget);
            if (tResult) {
              tGotOne = true;
              pConfig.properties.target = tTarget;
              for (var j = 1, jl = tResult.length; j < jl; j++) {
                pConfig.properties['target.' + j] = tResult[j];
              }
              tOutputs = tOutputs.concat(buildTarget(tTargets[k], pConfig));
            }
          }
          if (tGotOne === false) {
            print('The target ' + tTarget + ' did not have any matches. Valid targets are:');
            pConfig.printTargets();
          }
        }

        return tOutputs;
      }

      return null;
    };
  });

}(this));
