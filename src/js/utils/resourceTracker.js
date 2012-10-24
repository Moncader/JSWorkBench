(function(global) {

  mProcessedResources = {global:{}};
  mStack = ['global'];
  mStack.current = function () {return this[this.length - 1]};

  global.util.resourceTracker = {

    trackAndProcess : function(pResources, pNoTrack) {
      // Removing redundancy with preserving order.
      return pResources.filter(function (e) {
          if (!pNoTrack &&
              e.file in mProcessedResources[mStack.current()]) {
            return false;
          }
          pNoTrack || (mProcessedResources[mStack.current()][e.file] = true);
          return true;
        });
    },

    clear : function(pResource) {
        delete mProcessedResources[mStack.current()][pResource];
    },
    push : function(pPackage) {
      mStack.push(pPackage);
      if (pPackage in mProcessedResources === false) {
        mProcessedResources[pPackage] = {};
      }
    },
    pop : function() {
      if (mStack.length > 1) {
        mStack.pop();
      }
    }
  };

}(this));
