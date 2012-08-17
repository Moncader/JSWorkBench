# Welcome to JSWorkBench

This README will attempt to explain what JSWorkBench is and how to use it with some more advanced features explained at the end.       

## What

JSWorkBench is a development tool for working with projects (usually code) on the command line.


## The Name

It's name was decided as so:
* JS
  * JavaScript (<http://en.wikipedia.org/wiki/JavaScript>)
  * Was mostly programmed in JavaScript
  * This tool can be used for many more things than just JavaScript.
* WorkBench (<http://en.wikipedia.org/wiki/Workbench>)


## Features

JSWorkBench provides many features that are outlined below. However it also provides a powerful plugin framework allowing you to customize your projects and build system as you please since it is quite impossible to know what every developer in the world wants.

### The List

* _TODO_


## How To Use

The basic usage of JSWorkBench involves executing it with a single action plus any arguments if there are any.

```bash
cd myproject
jsworkbench config listtargets
> target 1
> target 2
jsworkbench build target1
> Building target1
>
> # Compile stuff and such...
>
> Finished building target1
```

In this case the action was first config and the argument was listtargets. The next action was build and the argument was target1.

### Support Actions

Here is a list of all supported actions by default. Remember that you can add more via plugins.

#### help
Shows some help.

##### Arguments
* _None_

#### version
Shows the current version of JSWorkBench.

##### Arguments
* _None_

#### config
Allows you to view and edit the configuration of the current project.

##### Arguments
* *sub action* Can be one of the below:
  * *listtargets* Lists all supported targets of the project.

#### build
Build your project.

When using the build action you can specify a target inside the config file to build and produce the output that the build file specifies. If no target is specified, all targets for the current project wil be built in order.

##### Arguments
* *target* The target you want to build (_optional_)

#### clean
Delete all output and temporary files created after a build.

##### Arguments
* _None_


### Source
```bash
git clone git@github.com:Moncader/JSWorkBench.git
cd JSWorkBench
git submodule init --update
make v8
make jsexec
mv bin/jsworkbench WHERE/YOU/WANT/TO/INSTALL
```

## Hello World! Tutorial
```bash
# Make project directory
mkdir newproject

# Make some default layout
mkdir src
mkdir bin
# We are doing a JavaScript project so we use Google Closure Compiler
mkdir -p vendor/google-closure-compiler
cd vendor/google-closure-compiler
wget http://closure-compiler.googlecode.com/files/compiler-latest.zip && unzip compiler-latest.zip compiler.jar && rm compiler-latest.zip
cd ..
vim build.json
```

* Make the build.json file look like below, minus the comments (As they are not allowed in JSON files).

```javascript
{
  // Define properties that can be used throughout most of the file inside of strings using ${NAME} syntax
  "properties": {
    "vendorDir": "vendor",
    "binDir": "bin",
    "buildDir": "build",
    // Required for the closure compiler builder
    "closure-compiler-jar": "${vendorDir}/google-closure-compiler/compiler.jar"
  },

  // Define resources that can be shared and are globally accessable from all targets.
  "resources": {
  
    // A repository for working around bugs in various browsers or implementing modern standards.
    "TheatreScript": {
      // Required with all resources, the type says what kind of resource this is.
      // Type 'package' means that this is another JSWorkBench project outside of this project.
      "type": "package",
      
      // The location of the package. Currently only support git.
      "location": "git",
      
      // The git URL
      "url": "git@github.com:Moncader/TheatreScript.git"
    },

    "AlphabetJS": {
      "type": "package",
      "location": "git",
      "url": "git@github.com:Moncader/AlphabetJS.git",
      
      // You can also specify what branch
      "branch": "master",
      
      // As well as a specific target if you'd like only one instead of all of that projects targets.
      "target": "AlphabetJS"
    }
  },

  // In targets, we specify all the different 'targets' when you build this project.
  // A target's objective is to do 'something'. Usually create some output file.
  // You can have as many targets as you like.
  "targets": {
  
    // Define the package target (built by jsworkbench build package)
    "package": {
    
      // What 'builder' to use to build this target.
      // A builder knows how to take the resouces, outputs, and other data from this target
      // and do something with that information.
      // This time, we use the closure-compiler builder to build our JavaScript files
      // and output a single JavaScript file called package.js.
      "builder": "closure-compiler",
      
      // What this target outputs.
      "outputs": "${binDir}/package.js",
      
      // A list of resources this target will use to create the output.
      // They follow the same rules as the global resources.
      "resources": [
        {
          // Type reference will use a resource defined in the global resources
          // section of this file.
          "type": "reference",
          
          // The name of the global resource
          "name": "TheatreScript",
          
          // You can override settings in the global resource.
          // In this case, we want to build only the targets listed here.
          // You could also use the singular version (target) if you please.
          "targets": ["TheatreScript"]
        },

        {
          "type": "reference",
          "name": "AlphabetJS"
        },

        {
          // Type files.
          // Use the file system, relative to the current directory.
          "type": "files",
          
          // Where the include property will be relative to.
          // Defaults to the current directory.
          "root": "src",
          
          // A JavaScript RegExp string to use to check all files
          // inside of the root.
          // All files that pass this test will be passed to the builder
          // as resources to use.
          // There is also an 'exclude' that does the opposite (and has precendance over include).
          "include": "^.+\\.js$"
        }
      ]
    }
  }
}
```

* Then we can add some of our own source code and build the project!

```bash
echo "console.log('Hello, world!');" > src/hello.js
jsworkbench build
```

* You can now check inside of the 'bin' directory and see package.js there with all of our code!

#Plugin API#

With the plugin API, you can customize the entire JSWorkBench program in almost any way thinkable.

All you have to do is write some JavaScript.

##Setup##

First, in your JSWorkBench project's build.json file, you need to add one new property, 'pluginDir'.
```json
{
  "properties": {
    "pluginDir": "plugins"
  }
}
```

The value can be anything you want. It is relative to the root of your project.

After that, simply create JavaScript files as you please in any file system structure you want inside the pluginDir directory. All files inside it will be loaded automatically when JSWorkBench starts.

##Hello World Tutorial##

Let's create a sample plugin!

JSWorkBench has what are called _actions_. They can be registered at runtime when the program runs.

The default actions that you are used to are things like _help_, _version_, _config_, _build_, etc...

We are going to add a new action called _hello_. When JSWorkBench is run with that action, ie, _jsworkbench hello_, 'Hello, World!' will be printed to the screen. That's it!

###Create The File###
Any name will do, but we will create it as plugins/hello.js
```bash
touch plugins/hello.js
```

###Print To The Screen Function###
There are several built-in JavaScript functions in the global scope for you to use in your JavaScript files. Those are explained in detail later on. For now, we will use a function that simply prints to the screen (with a newline), _print_.

Open up hello.js in the editor of your choice.

```javascript
(function(global) {

  function printHello() {
    global.print('Hello, World!');
  }

}(this));
```

We now have a function to print 'Hello, World!' to the screen. Now to make that an action!

###Register The Action###
JSWorkBench has an event system that can be used through the three API calls _on(pEventName, pCallback)_, _off(pEventName, pCallback)_ and _fire(pEventName, pData)_.

You can use these functions freely can make your own events. However JSWorkBench also has it's own built-in events to let you know what's happening and sometimes to query plugins for some information.

This time, we will focus on only one event, _registerActions_.

Event _registerActions_ will pass an Object as a parameter to your callback. Add your callback function to a key with the same name as the action you want to register. Let's take a look.

```javascript
(function(global) {

  function printHello() {
    global.print('Hello, World!');
  }

  global.on('registerActions', function(pActions) {
    pActions['hello'] = printHello;
  });

}(this));
```

Done! We said when the _registerActions_ event occurs to call our annonymous function. That function takes the pActions Object which was passed to us. We simply add a new property to it called 'hello' that points to our printHello function created earlier.

So what's next? Nothing! Let's test it!

###Test It Out###
```bash
jsworkbench help
Usage: jsworkbench [-f BUILD_FILE] ACTION [arg1[, arg2...]
Actions are:
  version
  help
  hello  <--- hello is there!!!
  config
  clean
  build

jsworkbench hello
Hello, World!
```

##Built-in Functions##
Here is a list of all the built-in functions in the global scope for you to use in your plugins.

###print(pString)###
Prints the string _pString_ to the screen appened with a newline.

###input()###
Get's input from the user and returns a string that the user inputted. Input will be terminated with the return key.

###read(pFileName)###
Reads the file _pFileName_ and returns the file contents as a string.

###write(pFileName, pContents)###
Writes a file _pFileName_. If the file existed before, the previous contents will be erased. Writes _pContents_ to the file.

###fork()###
Forks the process. Same API as stdc.

###sleep(pTime)###
Makes the process sleep for _pTime_ seconds.

###system(pCommandString)###
Executes the command _pCommandString_ in the system command executor (like shell or cmd). Will return the stdout of the call and will not return until the process completes.

###chdir(pDirectory)###
Change the current working directory to _pDirectory_.

###getcwd()###
Returns the current working directory as a string.

###evalFileInSandbox(pFileName, pGlobalObject)###
Loads the file _pFileName_ and executes it. The global scope Object will be _pGlobalObject_. You are allowed to use closure.

###evalInSandbox(pCodeString, pGlobalObject)###
Executes the _pCodeString_. The global scope Object will be _pGlobalObject_. You are allowed to use closure.

###evalFile(pFileName)###
Loads the file _pFileName_ and executes it in the same context as the current script.

###args###
This is an Array of arguments that were passed on the command line **starting from after the action**. Meaning the arguments to the action.


##Built-in Events##
Here is a list of all the built-in events that you can use in your plugins.

###registerActions###
Fired when the system asks plugins to register their actions. Passes an Object. Add properties to that Object to create actions.

###queryBuilders###
Fired when the system asks plugins to register Builders. Passes an Object. Add properties to that Object to register your Builder. The value of the property should be a Constructor Function for your builder.

###queryResourceHandlers###
Fired when the system asks plugins to register ResourceHandlers. Passes an Object. Add properties to that Object to register your ResourceHandler. The value of the property should be a Constructor Function for your ResourceHandler.

###queryLocationHandlers###
Fired when the system asks plugins to register LocationHandlers for package resource types. Passes an Object. Add properties to that Object to register your LocationHandler. The value of the property should be a Constructor Function for your LocationHandler.

##Object Types##
There are several special Objects that you can make to further customize JSWorkBench besides actions. As shown in the list of events, there are things such as Builders, ResourceHandlers, LocationHandlers and more. This section will describe those Objects and how to implement them.

###Config###
```javascript
function Config() {
  /** The raw JSON Object of the build.json file. */
  this.raw = new Object();

  /** The processed properties of this Config. */
  this.properties = new Object();

  /** The processed resources of this Config. */
  this.resources = new Object();

  /** The processed targets of this Config. */
  this.targets = new Object();

  /** The WorkBench associated with this Config. */
  this.workbench = null;
}
Config.prototype = {
  /**
   * Expands a string replacing ${NAME} strings
   * with the corresponding property inside this Config.
   * @param {string} pString The string to expand.
   * @returns {string} The expanded string.
   */
  expand: function(pString) {},

  /**
   * Prints all targets of this Config to the screen.
   */
  printTargets: function() {},

  /**
   * Prints all properties of this Config to the screen.
   */
  printProperties: function() {}
}
```

###WorkBench###
A WorkBench is basically an instance of JSWorkBench itself.
It is an isolated environment to run JSWorkBench Actions and hold Config's from.
```javascript
function WorkBench() {
  /** This WorkBench's Config Object. */
  this.config;

  /** This WorkBench's Actions. */
  this.actions = new Object();
}

WorkBench.prototype = {
  /**
   * Initializes this WorkBench from the given config file.
   * @param {string} pConfigFile The file path to the config file to open.
   */
  load: function(pConfigFile) {},

  /**
   * Executes the given action that was previously registered
   * with this WorkBench.
   * @param {string} pName The name of the action to run.
   * @param {Array} pArguments An array of arguments that will be applied to the action's callback when run.
   */
  runAction: function(pName, pArguments) {}
};
```

###Builder###
```javascript
function Builder(pConfig) {}

Builder.prototype = {
  /**
   * Called by the system the pass the data from the target to this Builder.
   */
  setData: function(pData),

  /**
   * Called by the system to pass the outputs resolved by ResourceHandlers.
   * They will be either an Array or a single string of files to output.
   */
  setOutputs: function(pOutputs),

  /**
   * Called by the system to pass the resources resolved by ResourceHandlers.
   * Please see ResourceHandler for a description of the format of resources.
   */
  setResources: function(pResources),

  /**
   * Called to actually build the target.
   * Do whatever you want in here.
   */
  build: function() {}
};
```
Functions will be called in this order:
* setOutputs
* setResources
* build

###ResourceHandler###
```javascript
function ResourceHandler(pConfig) {}

ResourceHandler.prototype = {
  /**
   * Sets the custom data provided in the build file inside the current
   * resource's settings.
   * @param {Object} pData The data provided in the build file.
   * @param {string} pWorkspace A directory path that is prepared for you to do work inside of as a scratchpad.
   */
  setData: function(pData, pWorkspace),

  /**
   * Allows you to do any preparations before anyone get's any resources.
   */
  prepare: function(),

  /**
   * Called when someone wants the resources that this ResourceHandler is handling.
   * Should return an Array of resources. A resource is an Object that can hold any
   * data you want, but it is highly recommended to include the following
   * properties so most builders can interface with your resources:
   *     file: A file path string to a real file that holds this resource.
   *     outputCaptures: An Array of strings captured (usually by a RegExp) that the Builder can use when creating outputs.
   *     pathNamespace: (optional) If you want to interface with the JavaScript dependency resolver.
   */
  getResources: function() {}
};
```
Functions will be called in this order:
* setData
* prepare
* getResources

###LocationHandler###
LocationHandlers should prepare resources so that they are accessible by ResourceHandlers.
For example to download source code from a remote repository.
```javascript
function LocationHandler(pConfig) {}

LocationHandler.prototype = {
  /**
   * Passes the data specified in the build file along with a root workspace directory path.
   */
  setData: function(pRoot, pData),

  /**
   * Execute this LocationHandler.
   */
  execute: function()
};
```
Functions will be called in this order:
* setData
* execute
