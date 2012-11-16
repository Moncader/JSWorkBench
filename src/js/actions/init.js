/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  function init(pBuildFileName) {
    if (!pBuildFileName) {
      pBuildFileName = 'build.json';
    }

    var tConfig = {
      defaultTarget: 'all',

      properties: {
        sourceDir: 'src',
        buildDir: 'build',
        binDir: 'bin',
        vendorDir: 'vendor'
      },

      resources: {

      },

      plugins: {

      },

      targets: {
        all: {
          builder: 'FILL_ME_IN',
          resources: [
            {
              type: 'files',
              root: '${sourceDir}',
              include: '.+'
            }
          ]
        }
      }
    };

    global.write(pBuildFileName, JSON.stringify(tConfig, null, '  '));
  }

  global.on('registerCommands', function(pActions) {
    pActions.init = init;
  });

}(this));
