(function(global) {

  function init() {

  }

  global.on('registerActions', function(pActions) {
    pActions.init = init;
  });

}(this));
