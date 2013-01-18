
var window = this;

window.window = window;
window.self = window;

(function(){
  for (var k in Window.prototype) {
    window[k] = Window.prototype[k];
  }
}());

window.document = new Document();
window.document.defaultView = window;

window.name = '';

window.location = {
  assign: function() {},
  replace: function() {},
  reload: function() {},
  href: '',
  protocol: '',
  host: '',
  hostname: '',
  port: '',
  pathname: '',
  search: '',
  hash: ''
};

window.history = new History();

window.locationbar = null;
window.menubar = null;
window.personalbar = null;
window.scrollbars = null;
window.statusbar = null;
window.toolbar = null;
window.stats = '';

window.close = function() {};
window.stop = function() {};
window.focus = function() {};
window.blur = function() {};

window.frames = window;
window.length = 0;

window.top = window;
window.opener = null;
window.parent = window;
window.frameElement = null;

window.open = function() {};

window.navigator = {};
window.external = {};

window.applicationCache = new DOMApplicationCache();

window.alert = function() {};
window.confirm = function() {};
window.prompt = function() {};
window.print = function() {};
window.showModalDialog = function() {};

window.postMessage = function() {};