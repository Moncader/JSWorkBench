/**
 * @author Jason Parrott
 *
 * Copyright (C) 2013 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */


(function(global) {

  var mBuildDepth = 0;

  var mFiles = [];

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

      this.workspace = '';

      mBuildDepth++;
    }

    JSBuilder.prototype = Object.create(pSuper.prototype);

    JSBuilder.prototype.setData = function(pData, pWorkspace) {
      var tData = this.data;
      this.workspace = pWorkspace;

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
      mBuildDepth = 0;
    }

    /**

    topological sort

    L ← Empty list that will contain the sorted nodes
    S ← Set of all nodes with no incoming edges
    for each node n in S do
        visit(n)
    function visit(node n)
        if n has not been visited yet then
            mark n as visited
            for each node m with an edge from n to m do
                visit(m)
            add n to L

    */
    function sortFiles(pFiles) {
      var i, j, jl;
      var il = pFiles.length;
      // The sorted node list. (L)
      var tSorted = new Array();
      var tFile;
      var tStats;
      var tExports;
      var tRequires;
      var tArray;
      var cExportMap = {};
      var cRequireMap = {};
      var tNode;
      var tStartNodes = [];

      function Node(pFile) {
        this.file = pFile;
        this.visited = false;
      }

      function visit(pNode) {
        var tRequireMap = cRequireMap;
        var i, il, j, jl;
        var tExports;
        var tRequiringNodes;

        if (pNode.visited === false) {
          pNode.visited = true;
          tExports = pNode.file.stats.exports;

          for (i = 0, il = tExports.length; i < il; i++) {
            tRequiringNodes = tRequireMap[tExports[i]];

            if (tRequiringNodes === void 0) {
              // Nobody requires this export. Skip.
              continue;
            }

            delete tRequireMap[tExports[i]];

            /*
              for each node m with an edge from n to m do
                  visit(m)
             */
            for (j = 0, jl = tRequiringNodes.length; j < jl; j++) {
              visit(tRequiringNodes[j]);
            }
          }

          tSorted.push(pNode.file);
        }
      }

      for (i = 0; i < il; i++) {
        tFile = pFiles[i];
        tStats = tFile.stats;
        tExports = tStats.exports;
        tRequires = tStats.requires;

        tNode = new Node(tFile);

        // Make a map of all exported symbols to their files.
        for (j = 0, jl = tExports.length; j < jl; j++) {
          if (tExports[j] in cExportMap) {
            print('WARNING: ' + tExports[j] + ' redelcared in ' + tFile.file);
          }
          cExportMap[tExports[j]] = tNode;
        }

        // Make a map of all required symbols to their files.
        for (j = 0, jl = tRequires.length; j < jl; j++) {
          tArray = cRequireMap[tRequires[j]] = (cRequireMap[tRequires[j]] || []);
          tArray.push(tNode);
        }

        // This creates the S set.
        if (tStats.requires.length === 0) {
          tStartNodes.push(tNode);
        }
      }

      /*
        for each node n in S do
          visit(n)
       */
      for (i = 0, il = tStartNodes.length; i < il; i++) {
        visit(tStartNodes[i]);
      }

      if (Object.keys(cRequireMap).length > 0) {
        print('UNRESOLVED REQUIREMENTS');
        safePrint(Object.keys(cRequireMap));
      }

      return tSorted.reverse();
    }


    var mDefaultExterns = [
      'es3.js',
      'es5.js',
      'w3c_dom1.js',
      'w3c_dom2.js',
      'w3c_dom3.js',
      'w3c_event.js',
      'html5.js',
      'w3c_anim_timing.js',
      'window.js'
    ];

    var mGlobalScopeASTCache = null;

    function createGlobalScope() {
      var tExternsJS = '';
      var tAST = mGlobalScopeASTCache;
      var tGlobalScope;
      var tPredefines;
      var esprima = global.esprima;

      for (var i = 0, il = mDefaultExterns.length; i < il; i++) {
        tExternsJS += global.readAsset(mDefaultExterns[i]);
      }

      if (tAST === null) {
        try {
          tAST = mGlobalScopeASTCache = esprima.parse(tExternsJS);
        } catch (e) {
          print('Failed to init global scope!');
          print(e);
          reset();
          return false;
        }
      }

      mNativeMode = true;

      tPredefines = new Value({});

      tGlobalScope = new Scope(tPredefines, []);
      tGlobalScope.members = tPredefines;

      tGlobalScope.addAST(tAST);
      tGlobalScope.interpret();

      mNativeMode = false;

      return tGlobalScope;
    }

    JSBuilder.prototype.build = function() {
      var i, il, j, jl, k;
      var tOutput;
      var tOutputFile;
      var tSource;
      var esprima = global.esprima;
      var tAST;
      var tSortedFiles = [];
      var tCachedStats;
      var tFileName;
      var tFileMTime;
      var tFileStatsName;
      var tFileStatsStat;

      mBuildDepth--;

      if (mBuildDepth === 0) {
        tOutputFile = this.output;

        if (!global.util.outputNeedsUpdate(tOutputFile, mFiles)) {
          tOutputFile.skipped = true;
          reset();
          return [tOutputFile];
        }

        for (i = 0, il = mFiles.length; i < il; i++) {
          tFileName = mFiles[i];
          tFileMTime = stat(tFileName).mtime;
          tSource = global.read(tFileName);
          tFileStatsName = this.workspace + '/' + tFileName.replace(/\//g, '_');

          if ((tFileStatsStat = stat(tFileStatsName)) === null || tFileStatsStat.mtime < tFileMTime) {
            try {
              tAST = esprima.parse(tSource);
            } catch (e) {
              print('Failed to parse ' + tFileName);
              print(e);
              reset();
              return false;
            }

            //print(tFileName);

            //print('AST');
            //safePrint(tAST);

            var tDefaultMembers = createGlobalScope().members;
            var tGlobalScope = new Scope(tDefaultMembers, []);
            tGlobalScope.members = tDefaultMembers;
            tGlobalScope.addAST(tAST);
            tGlobalScope.interpret();

            var tStats = exportStats(tGlobalScope);

            tSortedFiles.push({
              file: tFileName,
              source: tSource,
              stats: tStats
            });
            //print('GLOBALS');
            //safePrint(tStats.exports);
            //safePrint(tStats.global);
            //print('REQUIRES');
            //safePrint(tStats.requires);

            delete tStats.global;

            global.write(tFileStatsName, JSON.stringify(tStats));
          } else {
            tSortedFiles.push({
              file: tFileName,
              source: tSource,
              stats: JSON.parse(global.read(tFileStatsName))
            });
          }
        }

        tSortedFiles = sortFiles(tSortedFiles);
        tOutput = '';

        for (i = 0, il = tSortedFiles.length; i < il; i++) {
          print(tSortedFiles[i].file);

          tOutput += '\n' + tSortedFiles[i].source;
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


  function exportStats(pScope) {
    var tCache = [];
    var tValueCache = [];
    var tNamespaceStack = [];
    var tRequires = [];
    var tExports = [];

    function exportObject(pObject) {
      if (!pObject) {
        print(tNamespaceStack.join('.'));
      }
      var tValue = pObject.value;
      var tType = typeof tValue;
      var tReturn;
      var tIndex;
      var tObject;
      var tKeys;
      var i, il, k;

      if (pObject.isRequired === true && pObject.isNative === false && tNamespaceStack[tNamespaceStack.length - 1] !== 'prototype') {
        tRequires.push(tNamespaceStack.join('.'));
      }

      if (pObject.isSet === true && tNamespaceStack.length > 0 && pObject.isNative === false) {
        tExports.push(tNamespaceStack.join('.'));
      }

      if (tType === 'undefined') {
        if (!pObject.isSet) {
          return void 0;
        }
        return '__undefined__';
      } else if (tValue === null) {
        if (!pObject.isSet) {
          return void 0;
        }
        return null;
      } else if (tType === 'object' || tType === 'function') {
        if (tValue.__proto__ === Array.prototype) {
          if ((tIndex = tCache.indexOf(tValue)) !== -1) {
            return tValueCache[tIndex];
          }

          tReturn = new Array(tValue.length);

          tCache.push(tValue);
          tValueCache.push(tReturn);

          for (i = 0, il = tValue.length; i < il; i++) {
            tObject = exportObject(tValue[i]);

            if (tObject !== void 0) {
              tReturn[i] = tObject;
            }
          }
          return tReturn;
        } else {
          if ((tIndex = tCache.indexOf(tValue)) !== -1) {
            return tValueCache[tIndex];
          }

          tReturn = {};

          tCache.push(tValue);
          tValueCache.push(tReturn);

          tKeys = Object.keys(tValue);
          for (i = 0, il = tKeys.length; i < il; i++) {
            tNamespaceStack.push(tKeys[i]);

            tObject = exportObject(tValue[tKeys[i]]);

            if (tObject !== void 0) {
              tReturn[tKeys[i]] = tObject;
            }

            tNamespaceStack.pop();
          }

          if (tType === 'function') {
            tReturn.prototype = {};

            tValue = tValue.prototype.value;

            if (!tValue) {
              return tReturn;
            }

            tNamespaceStack.push('prototype');

            tKeys = Object.keys(tValue);
            for (i = 0, il = tKeys.length; i < il; i++) {
              tNamespaceStack.push(tKeys[i]);
              tObject = exportObject(tValue[tKeys[i]]);

              if (tObject !== void 0) {
                tReturn.prototype[tKeys[i]] = tObject;
              }

              tNamespaceStack.pop();
            }

            tNamespaceStack.pop();
          }

          return tReturn;
        }
      } else {
        if (!pObject.isSet) {
          return void 0;
        }
        return tValue;
      }
    }

    return {
      global: exportObject(pScope.members),
      requires: tRequires,
      exports: tExports
    };
  };

  var mASTProperties = [
    'elements',
    'left',
    'right',
    'body',
    'callee',
    'arguments',
    'param',
    'test',
    'consequent',
    'alternate',
    'expression',
    'init',
    'update',
    'params',
    'defaults',
    'object',
    'property',
    'properties',
    'argument',
    'key',
    'value',
    'expressions',
    'discriminant',
    'cases',
    'block',
    'guardedHandlers',
    'handlers',
    'finalizer',
    'declarations'
  ];


  /**
   * @constructor
   */
  function Scope(pThisMember, pScopeChain) {
    this.scopeChain = pScopeChain;

    if (!(pThisMember instanceof Value)) {
      pThisMember = new Value(pThisMember);
    }

    this.thisMember = pThisMember;
    this.members = new Value({});
    this.returnValue = new Value(void 0);
    this.ast = [];
  }

  Scope.prototype.clone = function() {
    var tScope = new Scope(this.thisMember, this.scopeChain);
    tScope.members.copy(this.members);
    tScope.returnValue = this.returnValue;
    tScope.ast = this.ast;
    return tScope;
  };

  Scope.prototype.newChildScope = function(pThisMember) {
    var tScope = new Scope(pThisMember, this.scopeChain.slice(0));
    tScope.scopeChain.push(this);
    return tScope;
  };

  Scope.prototype.assign = function(pName, pValue) {
    if (pName instanceof Value) {
      pName = pName.value;
    }

    this.members.value[pName] = pValue;
  };

  Scope.prototype.resolve = function(pValue) {
    var tScope = this;
    var tScopes = tScope.scopeChain;
    var i;
    var tName;

    if (pValue instanceof Value) {
      if (pValue.isLiteral) {
        return pValue;
      }

      if (typeof pValue.value !== 'string') {
        return pValue;
      }
      tName = pValue.value;
    } else {
      tName = pValue;
      pValue = UNDEFINED();
    }

    if (tScope.members.value.hasOwnProperty(tName)) {
      return tScope.members.value[tName];
    }

    for (i = tScopes.length - 1; i >= 0; i--) {
      tScope = tScopes[i];
      
      if (tScope.members.value.hasOwnProperty(tName)) {
        return tScope.members.value[tName];
      }
    }

    pValue = new Value({}, false, false);

    tScope.assign(tName, pValue);

    return pValue;
  };

  Scope.prototype.addAST = function(pASTArray) {

    var tSelf = this;

    function preProcessAST(pAST) {
      var tType;
      var tAST;
      var tNewScope;
      var i, il, j;
      var tFunction;
      var tTemp;

      var tASTProperties = mASTProperties;
      var tASTPropertiesLength = tASTProperties.length;

      if (pAST.__proto__ !== Array.prototype) {
        pAST = [pAST];
      }

      for (i = 0, il = pAST.length; i < il; i++) {
        tAST = pAST[i];
        tType = tAST.type;

        if (tType === 'VariableDeclarator') {
          tSelf.assign(tAST.id.name, UNDEFINED());
        } else if (tType === 'FunctionDeclaration') {
          tNewScope = tSelf.newChildScope({});
          tFunction = createFunction(tNewScope, tAST.id.name, tAST.params, tAST.body);
          tNewScope.thisMember = tFunction;
          tSelf.assign(tAST.id.name, tFunction);

          if (mNativeMode === true && tSelf.scopeChain.length === 0) {
            // Hacks to populate the VM.
            switch (tAST.id.name) {
              case 'Object':
                tTemp = tSelf.objectPrototype = tNewScope.resolve('prototype');
                break;
              case 'Function':
                tTemp = tSelf.functionPrototype = tNewScope.resolve('prototype');
                break;
            }
          }
        } else if (tType === 'FunctionExpression') {
          // ignore
        } else {
          for (j = 0; j < tASTPropertiesLength; j++) {
            if (tAST[tASTProperties[j]]) {
              preProcessAST(tAST[tASTProperties[j]]);
            }
          }
        }
      }
    }

    if (pASTArray.__proto__ !== Array.prototype) {
      pASTArray = [pASTArray];
    }

    this.ast = this.ast.concat(pASTArray);

    preProcessAST(pASTArray);
  };

  Scope.prototype.interpret = function() {
    var tASTArray = this.ast;
    var tAST;
    var i, il;

    for (i = 0, il = tASTArray.length; i < il; i++) {
      tAST = tASTArray[i];
      this.handle(tAST);
    }
  };

  Scope.prototype.handle = function(pAST) {
    var tType = pAST.type;
    var tResolved;

    if (tType in this) {
      return this[tType](pAST);
    }

    if (tType === 'FunctionDeclaration' || tType === 'EmptyStatement') {
      return UNDEFINED();
    }

    // Default handler
    tResolved = UNDEFINED();

    var tASTProperties = mASTProperties;
    var tASTPropertiesLength = tASTProperties.length;

    for (var i = 0; i < tASTPropertiesLength; i++) {
      if (pAST[tASTProperties[i]]) {
        tResolved = this.handle(pAST[tASTProperties[i]]);
      }
    }
    return tResolved;
  };

  Scope.prototype.handleAndResolve = function(pAST) {
    var tResult = this.handle(pAST);
    
    return this.resolve(tResult);
  };

  function createFunction(pScope, pId, pParams, pBody) {
    var tFunction = new Value(function(pScope) {
      var tResolved;
      var tArguments;
      var tLength;

      if (pId) {
        pScope.assign(pId, tFunction);
      }

      tResolved = pScope.resolve('arguments');
      if (tResolved && pParams) {
        tArguments = tResolved.value;
        tLength = tArguments.length;
        for (i = 0, il = pParams.length; i < il; i++) {
          if (i < tLength) {
            pScope.assign(pParams[i].name, tArguments[i]);
          } else {
            pScope.assign(pParams[i].name, new Value(void 0));
          }
        }
      }

      pScope.ast = [];
      pScope.addAST(pBody);
      pScope.interpret();

      return pScope.returnValue;
    });

    tFunction.scope = pScope;

    tFunction.value.prototype = new Value({});

    return tFunction;
  }

  var mNativeMode = false;

  function Value(pValue, pIsSet, pIsLiteral) {
    this.value = pValue;
    this.proto = null;
    this.isLiteral = typeof pIsLiteral !== 'boolean' ? false : pIsLiteral;
    this.isSet = typeof pIsSet !== 'boolean' ? true : pIsSet;
    this.isRequired = false;
    this.isNative = mNativeMode;
  }

  Value.prototype.require = function() {
    this.isRequired = true;
    this.value = {};
  };

  Value.prototype.set = function(pValue) {
    this.value = pValue;
    this.isSet = true;
  };

  Value.prototype.copy = function(pValue) {
    this.value = pValue.value;
    this.proto = pValue.proto;
    this.isLiteral = pValue.isLiteral;
    this.isSet = pValue.isSet;
    this.isRequired = pValue.isRequired;
    this.isNative = pValue.isNative;

    if ('scope' in pValue) {
      this.scope = pValue.scope;
    } else if ('scope' in this) {
      delete this.scope;
    }
  };

  Value.prototype.newCopy = function() {
    var tValue = new Value();
    for (var k in this) {
      tValue[k] = this[k]
    }
    return tValue;
  }

  function UNDEFINED() {
    return new Value({}, false);
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

  // HANDLERS FOR AST

  var p = Scope.prototype;

  p.Program = p.BlockStatement = function(pAST) {
    var tArray = pAST.body;
    for (var i = 0, il = tArray.length; i < il; i++) {
      this.handle(tArray[i]);
    }
  };

  p.ExpressionStatement = function(pAST) {
    return this.handle(pAST.expression);
  };

  p.NewExpression = p.CallExpression = function(pAST) {
    var tArray = pAST.arguments;
    var tArray2 = [];
    var tResolved;
    var tReturn;
    var tPrototype;
    var tNewThis;
    var i, il, k;
    var tScope;
    var tBackupScope = null;

    for (i = 0, il = tArray.length; i < il; i++) {
      tResolved = tArray2[i] = this.handleAndResolve(tArray[i]);
      if (!tResolved.isSet) {
        if (!tResolved.isRequired) {
          tResolved.require();
        }
      }
    }

    tResolved = this.handleAndResolve(pAST.callee);

    if (!tResolved.isSet) {
      if (!tResolved.isRequired) {
        tResolved.require();
      }

      tResolved = createFunction(this.newChildScope({}), null, [], []);
    }

    tScope = tResolved.scope;

    if (!tScope) {
      return UNDEFINED();
    }

    if (pAST.type === 'NewExpression') {
      tBackupScope = tScope;
      tScope = tResolved.scope = tScope.clone();
      tScope.members = new Value({});
      tPrototype = tResolved.value.prototype;
      tNewThis = tScope.thisMember = new Value({});

      for (k in tPrototype.value) {
        tNewThis.value[k] = tPrototype.value[k].newCopy();
        tNewThis.value[k].isSet = true;
        tNewThis.value[k].isRequired = false;
      }

      tNewThis.proto = tPrototype;
    }

    tScope.assign('arguments', new Value(tArray2));

    tReturn = tResolved.value(tScope);

    if (tBackupScope !== null) {
      tResolved.scope = tBackupScope;
    }

    if (pAST.type === 'NewExpression') {
      return tScope.thisMember;
    }

    return tReturn;
  };

  p.FunctionExpression = function(pAST) {
    var tNewScope = this.newChildScope({});
    var tFunction = createFunction(tNewScope, pAST.id ? pAST.id.name : void 0, pAST.params, pAST.body);
    tNewScope.thisMember = tFunction;
    return tFunction;
  };

  p.VariableDeclaration = function(pAST) {
    var tArray = pAST.declarations;
    var tResolved;
    var i, il;

    for (i = 0, il = tArray.length; i < il; i++) {
      if (tArray[i].init) {
        tResolved = this.handleAndResolve(tArray[i].init);

        if (!tResolved.isSet) {
          if (!tResolved.isRequired) {
            tResolved.require();
          }
          this.assign(tArray[i].id.name, new Value(tResolved.value));
        } else {
          this.assign(tArray[i].id.name, tResolved);
        }
      } else {
        tResolved = new Value(void 0);
        this.assign(tArray[i].id.name, tResolved);
      }
    }

    return tResolved;
  };

  p.AssignmentExpression = function(pAST) {
    var tResolved = this.handleAndResolve(pAST.left);
    var tResolved2 = this.handleAndResolve(pAST.right);

    if (!tResolved2.isSet && !tResolved2.isRequired) {
      tResolved2.require();
    }

    tResolved.copy(tResolved2);

    return tResolved;
  };

  function resolveInPrototypeChain(pChain, pName) {
    if (!pChain.value) {
      return UNDEFINED();
    }

    var tValue = pChain.value[pName];

    if (tValue) {
      return tValue;
    }

    if (pChain.proto) {
      return resolveInPrototypeChain(pChain.proto, pName);
    }

    return UNDEFINED();
  }

  p.MemberExpression = function(pAST) {
    var tName;
    var tProperty;
    var tResolved = this.handleAndResolve(pAST.object);

    if (!tResolved.isSet && !tResolved.isRequired) {
      if (pAST.object.type === 'Identifier') {
        this.assign(pAST.object.name, tResolved);
      }

      tResolved.require();
    }

    if (pAST.computed) {
      tProperty = this.handleAndResolve(pAST.property);

      if (!tProperty.isSet) {
        if (!tProperty.isRequired) {
          tProperty.require();
        }

        return UNDEFINED();
      }

      tName = tProperty.value + '';
    } else {
      if (pAST.property.type === 'Identifier') {
        tName = pAST.property.name;
      } else {
        tName = this.handleAndResolve(pAST.property).value + '';
      }
    }

    if (tResolved.value === void 0 || tResolved.value === null) {
      print('Attempt to get ' + tName + ' of non value. Returning UNDEFINED');
      return UNDEFINED();
    }

    try {
      if (!tResolved.value[tName]) {
        if (!tResolved.proto) {
          tResolved = tResolved.value[tName] = UNDEFINED();
        } else {
          tResolved = tResolved.value[tName] = resolveInPrototypeChain(tResolved.proto, tName);
        }
      } else if (!tResolved.value[tName].isSet) {
        tResolved = new Value(tResolved.value[tName].value);
      } else {
        tResolved = tResolved.value[tName];
      }
    } catch (e) {
      print('Error thrown in MemberExpression: ' + e.toString());
    }

    return tResolved;
  };

  p.Identifier = function(pAST) {
    return new Value(pAST.name, false);
  };

  p.ThisExpression = function(pAST) {
    return this.thisMember;
  };

  p.Literal = function(pAST) {
    return new Value(pAST.value, true, true);
  };

  p.ObjectExpression = function(pAST) {
    var tResolved = {};
    var i, il;

    for (i = 0, il = pAST.properties.length; i < il; i++) {
      tResolved[this.handle(pAST.properties[i].key).value] = this.handleAndResolve(pAST.properties[i].value);
    }

    return new Value(tResolved, true, true);
  };

  p.ArrayExpression = function(pAST) {
    var tArray = [];
    var i, il;

    for (i = 0, il = pAST.elements.length; i < il; i++) {
      tArray[i] = this.handleAndResolve(pAST.elements[i]);
    }

    return new Value(tArray, true, true);
  };

  p.IfStatement = function(pAST) {
    var tResolved;

    this.handle(pAST.test);

    this.handle(pAST.consequent);

    if (pAST.alternate) {
      this.handle(pAST.alternate);
    }
  };

  p.ForInStatement = function(pAST) {
    var tLeft = this.handleAndResolve(pAST.left);
    var tResolved = this.handleAndResolve(pAST.right);

    if (!tResolved.isSet && !tResolved.isRequired) {
      tResolved.require();
      return;
    }

    for (var k in tResolved.value) {
      tLeft.set(k);

      this.handle(pAST.body);
    }
  };

  p.ReturnStatement = function(pAST) {
    if (pAST.argument === null) {
      this.returnValue = UNDEFINED();
    } else {
      this.returnValue = this.handleAndResolve(pAST.argument);
    }
  };


  global.plugins.JSBuilder = JSBuilder;

  global.on('queryBuilders', function(pBuilders) {
    pBuilders['js'] = JSBuilder;
  });

}(this));
