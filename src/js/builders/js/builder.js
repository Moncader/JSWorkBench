/**
 * @author Jason Parrott
 *
 * Copyright (C) 2013 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */


(function(global) {

  var mBuildDepth = 0;

  var mFiles = [];

  var mSymbols = {};

  /**
   * @class
   * @extends {plugins.Builder}
   */
  var JSBuilder = (function(pSuper) {
    function JSBuilder(pConfig) {
      pSuper.call(this, pConfig);

      this.output = '';

      this.data = {
        strict: true,
        minify: true
      };

      mBuildDepth++;
    }

    JSBuilder.prototype = Object.create(pSuper.prototype);

    JSBuilder.prototype.setData = function(pData) {
      var tData = this.data;

      if (pData.outputs) {
        this.output = this.config.expand(pData.outputs);
      }

      if (pData.strict !== void 0) {
        tData.strict = pData.strict;
      }

      if (pData.minify !== void 0) {
        tData.minify = pData.minify;
      }
    };

    JSBuilder.prototype.setResources = function(pResources) {
      var tFile, tRealPath;
      var tFiles = mFiles;

      for (var i = 0, il = pResources.length; i < il; i++) {
        tFile = pResources[i].file;

        if (stat(tFile) === null) {
          throw Error('Resource for JSBuilder ' + tFile + ' does not exist. Aborting...');
        }

        tRealPath = global.realpath(tFile);

        if (tFiles.indexOf(tRealPath) === -1) {
          tFiles.push(tRealPath);
        }
      }

      if (!this.output) {
        this.output = this.config.expand('${binDir}/${target}.js');
      }
    };

    JSBuilder.prototype.getOutputs = function() {
      mBuildDepth--;

      if (mBuildDepth === 0) {
        reset();
        return [this.output];
      }

      return [];
    };

    function reset() {
      mFiles.length = 0;
      mSymbols = {};
      mBuildDepth = 0;
    }

    JSBuilder.prototype.build = function() {
      var i, il, j, jl;
      var tOutput;
      var tOutputFile;
      var tSource;
      var esprima = global.esprima;
      var tAST;

      mBuildDepth--;

      if (mBuildDepth === 0) {
        tOutput = '';
        tOutputFile = this.output;

        if (!global.util.outputNeedsUpdate(tOutputFile, mFiles)) {
          tOutputFile.skipped = true;
          reset();
          return [tOutputFile];
        }

        for (i = 0, il = mFiles.length; i < il; i++) {
          tSource = global.read(mFiles[i]);

          try {
            tAST = esprima.parse(tSource, {
              postProcess: handleNode
            });
          } catch (e) {
            print('Failed to parse ' + mFiles[i]);
            print(e);
            reset();
            return false;
          }

          //print(JSON.stringify(mScope, null, 2));

          var tRequires = {};
          var tNamespace = buildNamespace(mScope, [{}], tRequires);

          //print(JSON.stringify(tNamespace, null, 2));
          //print(JSON.stringify(tRequires, null, 2));

          //print(JSON.stringify(tAST, null, 2));

          tOutput += '\n' + global.read(mFiles[i]);
        }

        global.system('mkdir -p $(dirname ' + tOutputFile + ')');

        global.write(tOutputFile, tOutput);

        reset();

        return [tOutputFile];
      }

      return [];
    };

    return JSBuilder;
  })(plugins.Builder);

  function findReference(pName, pScopeChain, pFindParent) {
    var tScope;
    var tParts = pName.split('.');
    var i, j, jl;
    var tReference = null;

    for (i = pScopeChain.length - 1; i >= 0; i--) {
      tScope = pScopeChain[i];

      if (tParts[0] in tScope) {
        tReference = tScope[tParts[0]];

        for (j = 1, jl = tParts.length - (pFindParent ? 1 : 0); j < jl; j++) {
          if (!tReference.hasOwnProperty(tParts[j])) {
            return null;
          }

          tReference = tParts[j];
        }
      }
    }

    return tReference;
  }

  function requireNamespace(pName, pRequires, pRequireParent) {
    var tParts = pName.split('.');

    if (tParts.length > 1) {
      pRequires[tParts.slice(0, tParts.length - (pRequireParent ? 1 : 0)).join('.')] = true;
    }
  }

  function defineNamespace(pName, pRoot) {
    var tParts = pName.split('.');

    for (var i = 0, il = tParts.length; i < il; i++) {
      pRoot = pRoot[tParts[i]] = (pRoot[tParts[i]] || {});
    }
  }

  function buildNamespace(pScope, pScopeChain, pRequires) {
    var tMembers = pScope.members;
    var tAssigns = pScope.assigns;
    var tScopes = pScope.scopes;
    var tScopeObject = pScopeChain[pScopeChain.length - 1];
    var tFirstReference, tSecondReference;
    var i, il, k;

    for (k in tMembers) {
      tScopeObject[k] = {};

      if (tMembers[k]) {
        tFirstReference = findReference(tMembers[k], pScopeChain);
        if (tFirstReference !== null) {
          tScopeObject[k] = tFirstReference;
        } else {
          requireNamespace(tMembers[k], pRequires);
        }
      }
    }

    for (k in tAssigns) {
      tFirstReference = findReference(k, pScopeChain, true);

      if (tFirstReference === null) {
        defineNamespace(k, pScopeChain[0]);
        requireNamespace(k, pRequires, true);
      }

      if (tAssigns[k] === null) {
        defineNamespace(k, pScopeChain[pScopeChain.length - 1]);
      } else {
        tSecondReference = findReference(tAssigns[k], pScopeChain);

        if (tSecondReference === null) {
          requireNamespace(tAssigns[k], pRequires);
          defineNamespace(tAssigns[k], pScopeChain[0]);
        } else if (tFirstReference !== null) {
          tFirstReference[k] = tSecondReference;
        }
      }
    }

    for (i = 0, il = tScopes.length; i < il; i++) {
      pScopeChain.push({});
      buildNamespace(tScopes[i], pScopeChain, pRequires);
      pScopeChain.pop();
    }

    return pScopeChain[0];
  }

  function resolveNode(pNode) {
    var tString = null;

    switch (pNode.type) {
      case 'Literal':
        return null;
      case 'Identifier':
        tString = pNode.name;
        break;
      case 'MemberExpression':
        if (pNode.computed === false) {
          tString = resolveNode(pNode.object) + '.' + resolveNode(pNode.property);
        } else {
          tString = resolveNode(pNode.object);
        }
        break;
    }

    return tString;
  }

  var mScope = {
    scopes: [],
    members: {},
    assigns: {},
    refs: []
  };

  var mScopeStack = [];
  var tPreviousDepth = 0;

  function handleNode(pNode) {
    var tDepth = pNode.depth;
    var tNewScope;

    if (tDepth > tPreviousDepth) {
      tPreviousDepth = tDepth;
      mScopeStack.push(mScope);
      tNewScope = {
        scopes: [],
        members: {},
        assigns: {},
        refs: []
      };
      mScope.scopes.push(tNewScope);
      mScope = tNewScope;
    } else if (tDepth < tPreviousDepth) {
      tPreviousDepth = tDepth;
      mScope = mScopeStack.pop();
    }

    switch (pNode.type) {
      case 'MemberExpression':
        mScope.refs.push(resolveNode(pNode));
        break;
      case 'VariableDeclarator':
        mScope.members[pNode.id.name] = pNode.init ? resolveNode(pNode.init) : null;
        break;
      case 'FunctionDeclaration':
      case 'FunctionExpression':
        if (pNode.id) {
          mScope.members[pNode.id.name] = null;
        }

        for (i = 0, il = pNode.params.length; i < il; i++) {
          mScope.scopes[mScope.scopes.length - 1].members[pNode.params[i].name] = null;
        }
        break;
      case 'AssignmentExpression':
        mScope.assigns[resolveNode(pNode.left)] = resolveNode(pNode.right);
        break;
    }

    return pNode;
  }

  global.plugins.JSBuilder = JSBuilder;

  global.on('queryBuilders', function(pBuilders) {
    pBuilders['js'] = JSBuilder;
  });

}(this));
