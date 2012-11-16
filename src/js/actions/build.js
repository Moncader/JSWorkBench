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

      if (!tBuilderType) {
        if (pTarget.depends) {
          return [];
        } else {
          print('No Builder was specified for the target ' + tTargetName + '.');
          return;
        }
      }

      var tResources = pTarget.resources;
      if (!tResources) {
        tResources = [];
      }

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

      var tResourceList = new Array();

      var tGlobalResources = pConfig.resources;

      for (var i = 0, il = tResources.length; i < il; i++) {
        var tResource = tResources[i];
        var tResourceName = tResource.name;
        var tResourceId;
        var tResourceOverriden = false;
        var k;
        if (tResource.type === 'reference') {
          if (!tResourceName) {
            print('The name of the reference needs to be specified.');
            return;
          }
          if (!(tResourceName in tGlobalResources)) {
            print('The given resource "' + tResourceName + '" does not exist.');
            return;
          }

          tResourceId = tResourceName;

          var tNewResource = JSON.parse(JSON.stringify(tGlobalResources[tResourceName]));
          for (k in tResource) {
            if (k !== 'type' && k !== 'name') {
              tNewResource[k] = tResource[k];
            }
          }
          tResource = tNewResource;

          if (pConfig.locals.resources && (tResourceName in pConfig.locals.resources)) {
            tResourceOverriden = true;
            tNewResource = JSON.parse(JSON.stringify(pConfig.locals.resources[tResourceName]));
            for (k in tNewResource) {
              tResource[k] = tNewResource[k];
            }
          }
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

        var tNeedsPrepare = tResourceOverriden;
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

        var tPartialResourceList = tResourceHandler.getResources();
        for (var j = 0, jl = tPartialResourceList.length; j < jl; j++) {
          tPartialResourceList[j].resourceIndex = i;
        }

        tResourceList = tResourceList.concat(tPartialResourceList);
      }

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

      pConfig.outputTracker.track(tOutputs);

      if (pTarget.module === true) {
        return [];
      }

      return tOutputs;
    }

    pActions.build = function(pConfig) {
      var tFirstOnly = false;

      var tArguments = Array.prototype.slice.call(arguments, 1)
            .filter(function(pArg) {
              if (!pArg) {
                return false;
              }

              if (pArg[0] !== '-') {
                return true;
              } else if (pArg === '--first-only') {
                tFirstOnly = true;
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
            var tTargetData = tTargets[k];
            var tResult = tTargetData.regex.exec(tTarget);
            if (tResult) {
              tGotOne = true;

              if (tTargetData.depends) {
                var tDepends = tTargetData.depends;
                for (var j = 0, jl = tDepends.length; j < jl; j++) {
                  pActions.build(pConfig, tDepends[j], '--first-only');
                }
              }

              pConfig.properties.target = tTarget;
              for (var j = 1, jl = tResult.length; j < jl; j++) {
                pConfig.properties['target.' + j] = tResult[j];
              }
              tOutputs = tOutputs.concat(buildTarget(tTargetData, pConfig));

              if (tFirstOnly) {
                break; // continue to next defined target. Don't continue matching this one.
              }
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
