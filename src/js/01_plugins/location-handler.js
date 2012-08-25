/**                                                                                                                                    
 * @author Jason Parrott                                                                                                               
 *                                                                                                                                     
 * Copyright (C) 2012 Jason Parrott.                                                                                                   
 * This code is licensed under the zlib license. See LICENSE for details.                                                              
 */


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
     * Returns true if this location has
     * already been built once or more.
     * This is used to avoid including code in your output
     * multiple times.
     * @return {bool} If the location has been built before.
     */
    hasBeenBuilt: function() {
      return false;
    },

    /**
     * Execute this LocationHandler.
     */
    execute: function() {}
  };

}(this));
