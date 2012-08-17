(function(global) {
  var system = global.system,
  print = global.print;

  function GitHandler(pConfig) {
    this.url = '';
    this.branch = 'master';
    this.root = '';
    this.config = pConfig;
  };

  GitHandler.prototype = new global.plugins.LocationHandler();

  GitHandler.prototype.setData = function(pRoot, pData) {
    this.root = pRoot;
    this.url = pData.url;
    if ('branch' in pData) {
      this.branch = pData.branch;
    }
  };

  GitHandler.prototype.execute = function() {
    var tRoot = this.root;

    var tOut = system("if [ -d '" + tRoot + "' ] ; then cd '" + tRoot + "' && git pull origin " + this.branch + "; else git clone -b " + this.branch + " " + this.url + " " + tRoot + '; fi');

    if (!this.config.isQuiet) print(tOut);

    tOut = system('cd ' + tRoot + ' && git submodule update --init');

    if (!this.config.isQuiet) print(tOut);

    return true;
  };

  global.on('queryLocationHandlers', function(pHandlers) {
    pHandlers['git'] = GitHandler;
  });

}(this));
