(function(global) {
  var print = global.print,
      read = global.read,
      fire = global.fire,
      args = global.args;

  function getVersion() {
    return '1.0';
  }
  global.getVersion = getVersion;

  function printVersion() {
    print(getVersion());
  }
  global.printVersion = printVersion;

  function main() {
    var tWorkBench = new WorkBench();

    function printUsage() {
      print("Usage: jsworkbench [-f BUILD_FILE] [--dry] ACTION [arg1[, arg2...]");
      print("Actions are:");
      for (var k in tWorkBench.actions) {
        print(' ' + k);
      }
    }

    tWorkBench.actions.help = printUsage;

    if (!tWorkBench.load()) {
      printUsage();
      return 1;
    }

    if (args.length < 2) {
      printUsage();
      return 2;
    }

    var tActionName = args[1];
    args.splice(0, 2);

    if (tWorkBench.runAction(tActionName, args) === false) {
      printUsage();
      return 3;
    }
  }
  global.main = main;

}(this));

