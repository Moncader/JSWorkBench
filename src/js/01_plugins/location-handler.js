(function(global) {

  global.plugins.LocationHandler = LocationHandler;

  /**
   * @constructor
   * @param {Config} pConfig
   */
  function LocationHandler(pConfig) {}

  LocationHandler.prototype = /** @lends {plugins.LocationHandler#} */ {
    /**
     * Passes the data specified in the build file along with a root workspace directory path.
     * @param {string} pRoot The root directory for working with.
     * @param {Object} pData The data pass from the config file.
     */
    setData: function(pRoot, pData) {},

    /**
     * Execute this LocationHandler.
     */
    execute: function() {}
  };

}(this));
