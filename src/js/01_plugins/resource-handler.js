/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */


(function(global) {

  global.plugins.ResourceHandler = ResourceHandler;

  /**
   * @constructor
   * @param {Config} pConfig
   */
  function ResourceHandler(pConfig) {}

  ResourceHandler.prototype = /** @lends {plugins.ResourceHandler#} */ {
    /**
     * Sets the custom data provided in the build file inside the current
     * resource's settings.
     * @param {Object} pData The data provided in the build file.
     * @param {string} pWorkspace A directory path that is prepared for you to do work inside of as a scratchpad.
     */
    setData: function(pData, pWorkspace) {},

    /**
     * Allows you to do any preparations before anyone get's any resources.
     */
    prepare: function() {},

    /**
     * Called when someone wants the resources that this ResourceHandler is handling.
     * Should return an Array of resources. A resource is an Object that can hold any
     * data you want, but it is highly recommended to include the following
     * properties so most builders can interface with your resources:
     *     file: A file path string to a real file that holds this resource.
     *     outputCaptures: An Array of strings captured (usually by a RegExp) that the Builder can use when creating outputs.
     *     pathNamespace: (optional) If you want to interface with the JavaScript dependency resolver.
     * @return {Array.<Object>}
     */
    getResources: function() {
      return new Array();
    }
  };

}(this));
