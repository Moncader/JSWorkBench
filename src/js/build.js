(function(global) {
  var print = global.print;

  global.on('registerActions', function(pActions) {

    function generateOutputs(pConfig, pOutputs, pInputs) {
      var tNewOutputs = new Array();
      var tEditedOutput = false;

      for (var i = 0, il = pInputs.length; i < il; i++) {
        var tOutputCaptures = pInputs[i].outputCaptures;
        if (tOutputCaptures) {
          tEditedOutput = true;
          var tNewOutputEntry = pOutputs;
          for (var j = 0, jl = tOutputCaptures.length; j < jl; j++) {
            tNewOutputEntry = tNewOutputEntry.replace(new RegExp('\\$' + (j + 1), 'g'), tOutputCaptures[j]);
          }
          
          tNewOutputs.push(pConfig.expand(tNewOutputEntry));
        }
      }

      return tEditedOutput === true ? tNewOutputs : [pConfig.expand(pOutputs)];
    }

    function buildTarget(pTarget, pConfig) {
      if (!pConfig.isQuiet) print('Building target ' + pTarget.id);
      pConfig.properties.targetId = pTarget.id;

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
          tResourceId = pTarget.id + '__resource_' + i;
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

        system('mkdir -p ' + tWorkspace);

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
      
      var tOutputs = generateOutputs(pConfig, pTarget.outputs, tResourceList);

      if (tBuilder.setData(pTarget) === false) {
        throw new Error('Setting data for builder failed.');
      }

      if (tBuilder.setOutputs(tOutputs) === false) {
        throw new Error('Setting outputs for builder failed.');
      }

      if (tBuilder.setResources(tResourceList) === false) {
        throw new Error('Setting resources for builder failed.');
      }

      var tFinalOutputs;

      if ((tFinalOutputs = (pConfig.isDry ? tBuilder.buildDry() : tBuilder.build())) === false) {
        throw new Error('Building target ' + pTarget.id + ' failed.');
      }

      if (!pConfig.isQuiet) print('Finished building target ' + pTarget.id);

      return tFinalOutputs;
    }

    pActions.build = function(pConfig, pTarget) {
      if (!pTarget) {
        var tOutputs = new Array();
        for (var i in pConfig.targets) {
          var tTarget = pConfig.targets[i];
          tOutputs = tOutputs.concat(buildTarget(tTarget, pConfig));
        }
        return tOutputs;
      } else {
        var tTarget = pConfig.targets[pTarget];
        if (!tTarget) {
          print('The target ' + pTarget + ' does not exist. Valid targets are:');
          pConfig.printTargets();
        } else {
          return buildTarget(tTarget, pConfig);
        }
      }

      return null;
    };
  });

}(this));
