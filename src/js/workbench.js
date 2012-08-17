(function(global) {

  function WorkBench() {
    this.config = new Object();
    this.actions = {
      version: printVersion
    };
  }
  WorkBench.prototype = {
    /**
     * Initializes this WorkBench from the given config file.
     * @param {string} pConfigFile The file path to the config file to open.
     */
    load: function(pConfigFile) {
      var tConfig;

      try {
        tConfig = this.config = parseConfig(pConfigFile);
      } catch (e) {
        print('Could not find config file.' + (pConfigFile ? ' (' + pConfigFile + ')' : ''));
        return false;
      }

      tConfig.workbench = this;

      fire('registerActions', this.actions);

      return true;
    },

    /**
     * Executes the given action that was previously registered
     * with this WorkBench.
     * @param {string} pName The name of the action to run.
     * @param {Array} pArguments An array of arguments that will be applied to the action's callback when run.
     * @return {*} Returns whatever the given action returns.
     */
    runAction: function(pName, pArguments) {
      var tAction = this.actions[pName];
      if (typeof tAction !== 'function') {
        print('The given action (' + pName + ') does not exist.');
        return;
      }

      return tAction.apply(global, [this.config].concat(pArguments));
    }
  };

  global.WorkBench = WorkBench;

}(this));
