/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */


(function(global) {

  global.plugins.Builder = Builder;

  /**
   * @constructor
   * @param {Config} pConfig The config object to use.
   */
  function Builder(pConfig) {}

  Builder.prototype = /** @lends {Builder.prototype} */ {
    /**
     * Called by the system the pass the data from the target to this Builder.
     * @param {Object} pData The data given from the config file.
     * @return {bool} Return false on failure. Anything else is a pass.
     */
    setData: function(pData) {},

    /**
     * Called by the system to pass the resources resolved by ResourceHandlers.
     * Please see ResourceHandler for a description of the format of resources.
     * @param {Array.<Object>} pResources
     * @return {bool} Return false on failure. Anything else is a pass.
     */
    setResources: function(pResources) {},

    /**
     * Called by the system to get the outputs resolved by this Builder.
     * @return {Array.<Object>} The list of files that would be outputted.
     */
    getOutputs: function() {},

    /**
     * Called to actually build the target.
     * Do whatever you want in here.
     * @return {bool|Array.<string>} Return false on failure. Otherwise return an array of actually outputted files.
     */
    build: function() {}
  };

}(this));
