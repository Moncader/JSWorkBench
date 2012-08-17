/**                                                                                                                                    
 * @author Jason Parrott                                                                                                               
 *                                                                                                                                     
 * Copyright (C) 2012 Jason Parrott.                                                                                                   
 * This code is licensed under the zlib license. See LICENSE for details.                                                              
 */


(function(global) {
  var system = global.system;
  var print = global.print;

  global.on('registerActions', function(pActions) {
    pActions.clean = function(pConfig) {
      var tTargets = pConfig.targets;
      for (var k in tTargets) {
        var tDir = pConfig.expand(tTargets[k].outputs);
        if (typeof tDir !== 'string' || tDir === '/' || tDir === '~') continue;
        print(system("rm -rf '" + tDir + "'"));
      }
      print(system("rm -rf '" + (pConfig.properties.buildDir || 'build') + "'"));
    };
  });

}(this));
