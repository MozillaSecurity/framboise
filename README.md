![Logo](http://people.mozilla.com/~cdiehl/img/framboise.png)


[![Current Release](https://img.shields.io/github/release/mozillasecurity/framboise.svg)](https://img.shields.io/github/release/mozillasecurity/framboise.svg)
[![IRC](https://img.shields.io/badge/IRC-%23fuzzing-1e72ff.svg?style=flat)](https://www.irccloud.com/invite?channel=%23fuzzing&amp;hostname=irc.mozilla.org&amp;port=6697&amp;ssl=1)


### Run in Docker
```bash
docker run -e FUZZER_MAX_RUNTIME=600 -it --rm taskclusterprivate/framboise:latest ./framboise.py -settings settings/framboise.linux.docker.yaml -fuzzer 
1:Canvas2D -debug -restart
```


### Setup for MacOS and Linux

```bash
git clone https://github.com/mozillasecurity/framboise.git
cd framboise/framboise
./setup.py
```

### Setup for Windows

1. Ensure [Python](https://www.python.org/downloads/windows/) is installed.
2. Download the [pip](https://bootstrap.pypa.io/get-pip.py) package manager.
2. Run these commands in the Command Prompt (**Start Menu** > **`cmd`**):

    ```bash
    git clone https://github.com/MozillaSecurity/framboise.git
    cd framboise/framboise
    python get-pip.py
    ./setup.py
    ```
3. Disable **User Account Control (UAC)**:
    * **Control Panel** > **User Accounts and Family Safety** > **User Accounts**
    * Change **User Account Control** settings
    * Set to **Never Notify**

5. Edit `settings/framboise-{platform}.yaml` with your own paths to the target applications.


### Sample Module 

```javascript
/*
 * XyzAPI References
 *
 * WebIDL:
 * Specification:
 *
**/

var fuzzerXyz = (function() {
  /*
  ** Initialization
  ** Commands which shall be called at the beginning of a testcase.
  */
  function onInit()
  {
    let cmd = []

    return cmd
  }

  /*
  ** Main
  ** Command which shall be called after initialization.
  */
  function makeCommand()
  {
    let cmd = []

    return cmd
  }

  /*
  ** De-initialization.
  ** Commands which shall be called at the end of a testcase.
  */
  function onFinish()
  {
    let cmd = []

    return cmd
  }

  /*
  ** Methods and attributes.
  */
  let ObjectMethods = {
    'name': ['a', function() { return 'and_b' }, make.number.any]
  }

  let ObjectAttributes = {
    'name': ['a', 'or_b', 'or_c']
  }

  let Events = {
    'object_name': ['name']
  }

  return {
    onInit: onInit,
    makeCommand: makeCommand,
    onFinish: onFinish,
    Events: Events
  }
})()
```

### Usage Examples

The default target is set to Firefox, and the settings file points to `settings/framboise.yaml`; therefore both flags are omitted in the following examples.

Run a single fuzzer module:

```bash
./framboise.py -fuzzer 1:WebGL
```

Run a specific configuration setup of a target:

```bash
./framboise.py -fuzzer 1:Canvas2D -setup inbound64-release
```

Run multiple fuzzing modules in multiple worker instances and restart the target once a crash occurred:

```bash
./framboise.py -fuzzer 1:MediaSource,1:WebVTT,1:MediaRecorder -worker 3 -restart
```

Run a testcase against the target:

```bash
./framboise.py -testcase ~/path/to/testcase.html
```

Simply launch the target:
```bash
./framboise.py -launch
```


### Help Menu

```
usage: framboise.py [-h] [-fuzzer list] [-target name] [-setup name]
                    [-worker #] [-testcase file] [-launch] [-restart]
                    [-timeout #] [-websocket-port #] [-update name] [-list]
                    [-settings file] [-debug] [-max-commands #]
                    [-random-seed #] [-with-set-timeout] [-with-set-interval]
                    [-with-events] [-version]

Framboise Client

optional arguments:
  -h, --help          show this help message and exit
  -fuzzer list        syntax: weighting:module [,...] (default: None)
  -target name        target application (default: firefox)
  -setup name         target environment (default: default)
  -worker #           number of worker instances (default: 1)
  -testcase file      open target app with provided testcase (default: None)
  -launch             launch the target app only (default: False)
  -restart            restart crashed worker (default: False)
  -timeout #          timeout for reload (default: 0)
  -websocket-port #   WebSocket monitor port (default: None)
  -update name        run update script for target (default: None)
  -list               show a list of available modules (default: False)
  -settings file      custom settings file (default:
                      settings/framboise.darwin.yaml)
  -debug              print out JS errors (default: False)
  -max-commands #     maximum amount of commands (default: 100)
  -random-seed #      seed used for the PRNG (default: None)
  -with-set-timeout   make use of setTimeout() (default: False)
  -with-set-interval  make use of setInterval() (default: False)
  -with-events        make use of addEventListener() (default: False)
  -version            show program's version number and exit
```
