/**                                                                                                                                    
 * @author Jason Parrott                                                                                                               
 *                                                                                                                                     
 * Copyright (C) 2012 Jason Parrott.                                                                                                   
 * This code is licensed under the zlib license. See LICENSE for details.                                                              
 */


(function(global) {
  var print = global.print,
      read = global.read;

  function resolveJavaScriptFileOrder(pFiles, pIsQuiet) {
    var tFiles = [[]];
    var tResult = new Array();

    for (var i = 0, il = pFiles.length; i < il; i++) {
      if (pFiles[i].resourceIndex) {
        if (!tFiles[pFiles[i].resourceIndex]) {
          tFiles[pFiles[i].resourceIndex] = [pFiles[i]];
        } else {
          tFiles[pFiles[i].resourceIndex].push(pFiles[i]);
        }
      } else {
        tFiles[0].push(pFiles[i]);
      }
    }

    for (var i = 0, il = tFiles.length; i < il; i++) {
      if (!tFiles[i]) continue;
      tResult = tResult.concat(resolve(tFiles[i], pIsQuiet));
    }

    return tResult;
  }

  function resolve(pFiles, pIsQuiet) {
    var tNamespaces = new Array();
    var i, il;

    if (pFiles.length === 0) {
      return pFiles;
    }

    for (i = 0, il = pFiles.length; i < il; i++) {
      tNamespaces.push(pFiles[i].pathNamespace ? pFiles[i].pathNamespace : pFiles[i].file.replace(/\.js$/, ''));
    };

    var tCurrentFile = null,
        tCurrentNamespace = null,
        tDeps = new Object();

    var tSandboxGlobal = {
      use: function() {
        for (var i = 0, il = arguments.length; i < il; i++) {
          var tRequires = arguments[i];
          if (tNamespaces.indexOf(tRequires) === -1) {
            throw tCurrentFile + ' requires ' + tRequires + ' but doesn\'t exist! Exiting...';
          }

          if (!pIsQuiet) print('    requires ' + tRequires);

          if (!(tCurrentNamespace in tDeps)) {
            tDeps[tCurrentNamespace] = [tRequires];
          } else {
            tDeps[tCurrentNamespace].push(tRequires);
          }
        }
      }
    };

    for (i = 0; i < il; i++) {
      tCurrentFile = pFiles[i];
      tCurrentNamespace = tNamespaces[i];
      if (!pIsQuiet) print('Evaluating ' + tCurrentFile.file + ' (' + tCurrentNamespace + ')...');
      try {
        evalFileInSandbox(tCurrentFile.file, tSandboxGlobal);
      } catch (e) {} // ignore errors cause we don't care.
      if (!pIsQuiet) print('');
    }

    var tCompileOrder = new Array(),
        tCheckingDeps = new Array();

    for (i = 0, il = tNamespaces.length; i < il; i++) {
      if (!(tNamespaces[i] in tDeps)) {
        tCompileOrder.push(pFiles[i]);
      }
    }

    function addDeps(pNamespace) {
      var tNamespaceDeps = tDeps[pNamespace];
      for (var i = 0, il = tNamespaceDeps.length; i < il; i++) {
        var tRequires = tNamespaceDeps[i];
        var tFile = pFiles[tNamespaces.indexOf(tRequires)];
        if (tCompileOrder.indexOf(tFile) === -1) {
          addDeps(tRequires);
          tCompileOrder.push(tFile);
        }
      };
    }

    for (var tNamespace in tDeps) {
      addDeps(tNamespace);
    }

    for (var tNamespace in tDeps) {
      var tSelf = pFiles[tNamespaces.indexOf(tNamespace)];
      if (tCompileOrder.indexOf(tSelf) === -1) {
        tCompileOrder.push(tSelf);
      }
    }

    return tCompileOrder;
  }

  global.util.resolveJavaScriptFileOrder = resolveJavaScriptFileOrder;

}(this));

