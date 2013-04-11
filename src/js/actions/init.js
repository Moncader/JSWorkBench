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
    pActions.test = function() {
      var tLib = dlopen('/opt/X11/lib/libglut.dylib', 0);

      if (tLib === null) {
        print(dlerror());
        throw new Error("FAIL TO LOAD DL");
      }

      var glutInit = dlsym(tLib, 'glutInit');
      var glutInitDisplayMode = dlsym(tLib, 'glutInitDisplayMode');
      var glutInitWindowSize = dlsym(tLib, 'glutInitWindowSize');
      var glutInitWindowPosition = dlsym(tLib, 'glutInitWindowPosition');
      var glutInitDisplayMode = dlsym(tLib, 'glutInitDisplayMode');
      var glutCreateWindow = dlsym(tLib, 'glutCreateWindow');
      var glutMainLoop = dlsym(tLib, 'glutMainLoop');

      if (glutInit === null) {
        print(dlerror());
        throw new Error("FAIL TO LOAD SYM");
      }
    };
  });

}(this));
