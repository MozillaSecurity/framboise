Framboise
=========

![](http://people.mozilla.com/~cdiehl/img/framboise.jpg)



###Setup for OSX and Linux
---

    sudo easy_install pip
    ./setup.py



###Setup for Windows
---


    Download: https://bootstrap.pypa.io/get-pip.py
    python get-pip.py

    ./setup.py


Disable UAC

    -> Control Panel\User Accounts and Family Safety\User Accounts
    -> Change User Account Control settings
    -> Never notify



Edit settings/framboise-{platform}.yaml with your own paths to the target applications.



###Usage Examples
---

The default target is set to Firefox and the settings file points to "settings/framboise.yaml" therefore those both flags are omitted in the following examples.


Run a single fuzzer module

    ./framboise.py -fuzzer 1:WebGL

Run a specific configuration setup of a target

    ./framboise.py -fuzzer 1:Canvas2D -setup inbound64-release

Run multiple fuzzing modules in multiple worker instances and restart the target once a crash occurred

    ./framboise.py -fuzzer 1:MediaSource,1:WebVTT,1:MediaRecorder -worker 3 -restart

Run a testcase against the target

    ./framboise.py -testcase ~/path/to/testcase.html



###Help Menu
---

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
