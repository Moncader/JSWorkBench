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
              //postProcess: handleNode
            });
          } catch (e) {
            print('Failed to parse ' + mFiles[i]);
            print(e);
            reset();
            return false;
          }

          var tState = new State({

          });

          print(mFiles[i]);
          print('AST');
          safePrint(tAST);
          resolveAST(tAST, tState);
          print('GLOBALS');
          safePrint(tState.exportGlobal());
          print('REQUIRES');
          safePrint(tState.requires);
          //print(JSON.stringify(mScope, null, 2));

          /*var tRequires = {};
          var tNamespace = {};
          tNamespace['this'] = tNamespace;
          var tNamespace = buildNamespace(mScope, [tNamespace], tRequires);

          print(mFiles[i]);
          print('SCOPES');
          safePrint(mScope);
          print('NAMESPACES');
          safePrint(tNamespace);
          print('REQUIRES');
          safePrint(tRequires);*/

          //print(JSON.stringify(tAST, null, 2));

          //tOutput += '\n' + global.read(mFiles[i]);
        }

        //global.system('mkdir -p $(dirname ' + tOutputFile + ')');

        //global.write(tOutputFile, tOutput);

        reset();

        return [tOutputFile];
      }

      return [];
    };

    return JSBuilder;
  })(plugins.Builder);

  /**
   * @constructor
   * @param {object} pGlobal The global namespace.
   */
  function State(pGlobal) {
    pGlobal = new Value(pGlobal);
    this.global = pGlobal;
    this.requires = {};

    var tGlobalScope = new Scope(pGlobal, []);
    tGlobalScope.members = pGlobal;

    this.scopes = [tGlobalScope];
  }

  State.prototype.exportGlobal = function() {
    var tCache = [];
    var tValueCache = [];

    function exportObject(pObject) {
      var tValue = pObject.value;
      var tType = typeof tValue;
      var tReturn;
      var tIndex;

      if (tType === 'undefined') {
        return '__undefined__';
      } else if (tValue === null) {
        return null;
      } else if (tType === 'object') {
        if (tValue.__proto__ === Array.prototype) {
          if ((tIndex = tCache.indexOf(tValue)) !== -1) {
            return tValueCache[tIndex];
          }

          var tReturn = new Array(tValue.length);

          tCache.push(tValue);
          tValueCache.push(tReturn);

          for (var i = 0, il = tValue.length; i < il; i++) {
            tReturn[i] = exportObject(tValue[i]);
          }
          return tReturn;
        } else {
          if ((tIndex = tCache.indexOf(tValue)) !== -1) {
            return tValueCache[tIndex];
          }

          var tReturn = {};

          tCache.push(tValue);
          tValueCache.push(tReturn);

          for (var k in tValue) {
            tReturn[k] = exportObject(tValue[k]);
          }
          return tReturn;
        }
      } else {
        return tValue;
      }
    }
    return exportObject(this.global);
  };

  State.prototype.require = function(pAST) {
    this.requires[pAST] = true;
  }

  State.prototype.pushScope = function(pThisMember) {
    this.scopes.push(new Scope(pThisMember, this.scopes.slice(0)));
  };

  State.prototype.popScope = function() {
    this.scopes.pop();
  }

  State.prototype.assign = function(pName, pValue) {
    var tScopes = this.scopes;
    var tMembers;
    var i;

    if (pName instanceof Value) {
      pName = pName.value;
    }

    this.scopes[this.scopes.length - 1].members.value[pName] = pValue;
  };

  State.prototype.resolve = function(pValue) {
    var tScopes = this.scopes[this.scopes.length - 1].scopeChain;
    var tScope;
    var i;
    var tName;

    if (pValue instanceof Value) {
      if (typeof pValue.value !== 'string') {
        return pValue;
      }
      tName = pValue.value;
    } else {
      pValue = new Value(pValue);
    }

    for (i = tScopes.length - 1; i >= 0; i--) {
      tScope = tScopes[i];
      if (tScope.members.value.hasOwnProperty(tName)) {
        return tScope.members.value[tName];
      }
    }

    pValue.isSet = false;

    return pValue;
  };

  State.prototype.setReturn = function(pValue) {
    this.scopes[this.scopes.length - 1].returnValue = pValue;
  };

  State.prototype.getReturn = function() {
    return this.scopes[this.scopes.length - 1].returnValue;
  };

  State.prototype.getThis = function() {
    return this.scopes[this.scopes.length - 1].thisMember;
  }

  /**
   * @constructor
   */
  function Scope(pThisMember, pScopeChain) {
    this.scopeChain = pScopeChain;
    this.thisMember = pThisMember;
    this.members = new Value({});
    this.returnValue = UNDEFINED();
  }

  function resolveAST(pAST, pState) {
    var tType = pAST.type;
    var tArray, tArray2;
    var i, il, k;
    var tLength;
    var tResolved, tResolved2;
    var func;

    switch (tType) {
      case 'Program':
      case 'BlockStatement':
        tArray = pAST.body;
        for (i = 0, il = tArray.length; i < il; i++) {
          resolveAST(tArray[i], pState);
        }
        break;
      case 'ExpressionStatement':
        return resolveAST(pAST.expression, pState);
      case 'CallExpression':
        pState.pushScope(pAST.callee);

        tArray = pAST.arguments;
        tArray2 = [];

        for (i = 0, il = tArray.length; i < il; i++) {
          tArray2[i] = pState.resolve(resolveAST(tArray[i], pState));
        }

        pState.assign('arguments', new Value(tArray2));

        tResolved = pState.resolve(resolveAST(pAST.callee, pState));
        if (!tResolved.isSet) {
          return UNDEFINED();
        }

        tResolved = tResolved.value();

        pState.popScope();

        return tResolved;
      case 'FunctionExpression':
      case 'FunctionDeclaration':
        func = new Value(function() {
          pState.pushScope(func);

          if (tType === 'FunctionExpression' && pAST.id) {
            pState.assign(pAST.id.name, func);
          }

          tResolved = pState.resolve('arguments');

          if (tResolved) {
            tArray = tResolved.value;
            tLength = tArray.length;
            tArray2 = pAST.params;
            for (i = 0, il = tArray2.length; i < il; i++) {
              if (i < tLength) {
                pState.assign(tArray2[i].name, tArray[i]);
              } else {
                pState.assign(tArray2[i].name, UNDEFINED());
              }
            }
          }

          resolveAST(pAST.body, pState);

          var tReturn = pState.getReturn();

          pState.popScope();

          return tReturn;
        });

        if (tType === 'FunctionDeclaration' && pAST.id) {
          pState.assign(pAST.id.name, func);
        }

        return func;
      case 'VariableDeclaration':
        tArray = pAST.declarations;

        for (i = 0, il = tArray.length; i < il; i++) {
          tResolved = UNDEFINED();
          if (tArray[i].init) {
            tResolved = pState.resolve(resolveAST(tArray[i].init, pState));
            if (!tResolved.isSet) {
              pState.require(tArray[i].init);
            }
          }
          pState.assign(tArray[i].id.name, tResolved);
        }
        break;
      case 'AssignmentExpression':
        tResolved = pState.resolve(resolveAST(pAST.left, pState));

        if (!tResolved.isSet) {
          //pState.require(pAST.left);
        }

        tResolved2 = pState.resolve(resolveAST(pAST.right, pState));

        if (!tResolved2.isSet) {
          pState.require(pAST.right);
          return tResolved2;
        }

        tResolved.set(tResolved2.value);

        return tResolved2;
      case 'MemberExpression':
        tResolved = pState.resolve(resolveAST(pAST.object, pState));

        if (!tResolved.isSet) {
          pState.require(pAST.object);
          return tResolved;
        }

        tResolved2 = pState.resolve(resolveAST(pAST.property, pState));

        if (!tResolved2.isSet) {
          //pState.require(pAST.property);
          tResolved2 = tResolved.value[tResolved2.value + ''] = new Value({});
          tResolved2.isSet = false;
          return tResolved2;
        }

        return tResolved.value[tResolved2.value + ''];
      case 'Identifier':
        tResolved = new Value(pAST.name);
        tResolved.isSet = false;
        return tResolved;
      case 'ThisExpression':
        return pState.getThis();
      case 'Literal':
        return new Value(pAST.value);
      case 'ObjectExpression':
        tResolved = {};
        for (i = 0, il = pAST.properties.length; i < il; i++) {
          tResolved[resolveAST(pAST.properties[i].key).value] = pState.resolve(resolveAST(pAST.properties[i].value));
        }
        return new Value(tResolved);
      case 'ArrayExpression':
        tArray = [];
        for (i = 0, il = pAST.elements.length; i < il; i++) {
          tArray[i] = pState.resolve(resolveAST(pAST.elements[i]));
        }
        return new Value(tArray);
      default:
        return UNDEFINED();
    }

    return void 0;
  }

  function Value(pValue) {
    this.value = pValue;
    this.isSet = true;
  }

  Value.prototype.set = function(pValue) {
    this.value = pValue;
    this.isSet = true;
  };

  function UNDEFINED() {
    return new Value(void 0);
  };

  function NULL() {
    return new Value(null);
  };

  var mCache = [];

  function safePrint(pObject) {
    print(JSON.stringify(pObject, function(pKey, pValue) {
      if (typeof pValue === 'object' && pValue !== null) {
        if (mCache.indexOf(pValue) !== -1) {
          return '... (circular reference to object)';
        }

        mCache.push(pValue);
      } else if (typeof pValue === 'function') {
        if (mCache.indexOf(pValue) !== -1) {
          return '... (circular reference to function)';
        }

        mCache.push(pValue);

        var tObject = {};

        for (var k in pValue) {
          tObject[k] = pValue[k];
        }

        return tObject;
      }

      return pValue;
    }, 2));

    mCache.length = 0;
  }

  global.plugins.JSBuilder = JSBuilder;

  global.on('queryBuilders', function(pBuilders) {
    pBuilders['js'] = JSBuilder;
  });

}(this));
