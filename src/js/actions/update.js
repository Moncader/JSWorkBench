/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  function update(pTarget, pConfig) {
    pConfig.properties.targetId = pTarget.id;
    var tTargetName = pConfig.properties.target;

    if (!pConfig.isQuiet) print('Updating target ' + pTarget.id + ' (' + tTargetName + ')...');

    var tResources = pTarget.resources;
    if (!tResources) {
      tResources = [];
    }

    var tResourceHandlers = new Object();

    global.fire('queryResourceHandlers', tResourceHandlers);

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
            '/resources/' + tResourceId;

      if (global.stat(tWorkspace) === null) {
        system("mkdir -p '" + tWorkspace + "'");
      }

      var tResourceHandler = new tResourceHandlers[tResource.type](pConfig);
      tResourceHandler.setData(tResource, tWorkspace);
      if (!tResourceHandler.prepare()) {
        print('Failed to prepare resource. Aborting.');
        return;
      }
    }

    if (!pConfig.isQuiet) print('Finished updating target ' + pTarget.id + ' (' + tTargetName + ').');
  }

  global.on('registerActions', function(pActions) {
    pActions.update = function updateAction(pConfig) {
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
              } else if (pArg.indexOf('--commit=') === 0) {
                var tCommit = pArg.substring(9);
                pConfig.dateTime = global.util.gitCommitDate(tCommit);
                global.util.gitUpdateCurrentBranch(tCommit);
                pConfig.ignoreLocal = true;
                tFirstOnly = true;
              } else if (pArg.indexOf('--date-time=') === 0) {
                pConfig.dateTime = pArg.substring(12);
                pConfig.ignoreLocal = true;
                tFirstOnly = true;
              } else if (pArg.indexOf('--ignore-local') === 0) {
                pConfig.ignoreLocal = true;
              }
              return false;
            });

      if (tArguments.length === 0) {
        if (typeof pConfig.raw.defaultTarget === 'string') {
          updateAction(pConfig, pConfig.raw.defaultTarget);
          return;
        }

        print('Please select a target. Valid targets are:');
        pConfig.printTargets();
      } else {
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
                  pActions.update(pConfig, tDepends[j], '--first-only');
                }
              }

              pConfig.properties.target = tTarget;
              for (var i = 1, il = tResult.length; i < il; i++) {
                pConfig.properties['target.' + i] = tResult[i];
              }
              update(tTargetData, pConfig);

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
      }
    };
  });

}(this));
