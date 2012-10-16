/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */


(function(global) {

  function WorkBench() {
    this.config = new Object();
    this.commands = {
      version: printVersion
    };
    this.actions = {};
  }
  WorkBench.prototype = {
    /**
     * Initializes this WorkBench from the given config file.
     * @param {string} pConfigFile The file path to the config file to open.
     */
    load: function(pConfigFile) {
      try {
        var tConfig = this.config = parseConfig(pConfigFile);
        tConfig.workbench = this;
      } catch (e) {
        this.config = null;
      }

      fire('registerCommands', this.commands);
      fire('registerActions', this.actions);

      return true;
    },

    runCommand: function(pName, pArguments) {
      var tCommand = this.commands[pName];
      if (typeof tCommand !== 'function') {
        print('The given command (' + pName + ') does not exist.');
        return false;
      }

      return tCommand.apply(global, pArguments);
    },

    /**
     * Executes the given action that was previously registered
     * with this WorkBench.
     * @param {string} pName The name of the action to run.
     * @param {Array} pArguments An array of arguments that will be applied to the action's callback when run.
     * @return {*} Returns whatever the given action returns.
     */
    runAction: function(pName, pArguments) {
      if (this.config === null) {
        print('Actions require a config file and there was none found.');
        return false;
      }

      var tAction = this.actions[pName];
      if (typeof tAction !== 'function') {
        print('The given action (' + pName + ') does not exist.');
        return false;
      }

      return tAction.apply(global, [this.config].concat(pArguments));
    }
  };

  global.WorkBench = WorkBench;

}(this));
