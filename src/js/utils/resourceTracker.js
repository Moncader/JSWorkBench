(function(global) {

  mProcessedResources = {global:{}};
  mStack = ['global'];
  mStack.current = function () {return this[this.length - 1]};

  global.util.resourceTracker = {

    trackAndProcess : function(pResources, pNoTrack) {
      var prev;
      pResources.sort(function (a, b) {
          if (a.file < b.file) {
            return -1;
          } else if (a.file > b.file) {
            return 1;
          }
          return 0;
        });

      return pResources.filter(function (e) {
          if (e.file === prev 
            || (pNoTrack ? false
              : e.file in mProcessedResources[mStack.current()])) {
            return false;
          }
          prev = e.file;
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
