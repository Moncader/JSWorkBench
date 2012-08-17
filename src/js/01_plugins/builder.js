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
     * Called by the system to pass the outputs resolved by ResourceHandlers.
     * @param {Array.<string>} pOutputs An array of strings of outputs.
     * @return {bool} Return false on failure. Anything else is a pass.
     */
    setOutputs: function(pOutputs) {},

    /**
     * Called by the system to pass the resources resolved by ResourceHandlers.
     * Please see ResourceHandler for a description of the format of resources.
     * @param {Array.<Object>} pResources
     * @return {bool} Return false on failure. Anything else is a pass.
     */
    setResources: function(pResources) {},

    /**
     * Called by the system do a dry build (run with --dry).
     * This function should not output any files and should attempt
     * to return the list of files that it would have outputted if
     * it was a real build.
     * @return {Array.<string>} The list of would-be outputted files.
     */
    buildDry: function() {},

    /**
     * Called to actually build the target.
     * Do whatever you want in here.
     * @return {bool|Array.<string>} Return false on failure. Otherwise return an array of actually outputted files.
     */
    build: function() {}
  };

}(this));
