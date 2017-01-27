var framboise = null;

function Framboise() { }

Framboise.prototype.start = function () {
  var argv = this.mapLocationParameters(location.search),
      fuzzers, value,
      randomSeed = null,
      engine = new Engine();
  fuzzers = this.parseParm("fuzzer", argv, this.parseFuzzers);
  if (fuzzers.length == 0) {
    return -1;
  }
  value = this.parseParm("max-commands", argv, parseInt);
  if (value) {
    engine.prefs.maxCommands = Random.range(Math.round((value / 2)) / 2, value);
  }
  value = this.parseParm("seed", argv, parseFloat);
  if (value) {
    randomSeed = value;
  }
  value = this.parseParm("timeout", argv, parseInt);
  if (value) {
    engine.prefs.reloadTimeout = value;
  }
  engine.prefs.commands.settimeout = this.parseParm("with-set-timeout", argv, this.parseBoolean);
  engine.prefs.commands.setinterval = this.parseParm("with-set-interval", argv, this.parseBoolean);
  engine.prefs.commands.events = this.parseParm("with-events", argv, this.parseBoolean);
  window.debug = this.parseParm("debug", argv, this.parseBoolean);
  value = this.parseParm("ws-logger", argv, parseInt);
  if (value) {
    websocket = new WebSocket("ws://localhost:" + value + "/");
    websocket.onopen = function (e) {
      engine.initialize(randomSeed);
      engine.run(fuzzers);
    }
  } else {
    engine.initialize(randomSeed);
    engine.run(fuzzers);
  }
  return 0;
};

Framboise.prototype.isParameter = function (name, argv) {
  return argv.hasOwnProperty(name) && argv[name] !== undefined && argv[name];
};

Framboise.prototype.parseParm = function (name, argv, cb) {
  if (this.isParameter(name, argv))
    return cb.call(this, argv[name]);
  return null;
};

Framboise.prototype.mapLocationParameters = function (seq) {
  var dict = {}, i, pair;
  seq = seq.substring(1).split("&");
  for (i = 0; i < seq.length; i++) {
    pair = seq[i].split('=');
    dict[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
  }
  return dict;
};

Framboise.prototype.parseProbabilityList = function (param) {
  var list = [];
  param.split(",").forEach(function (value) {
    var pair = value.split(":");
    var probability = parseInt(pair[0]);
    var name = pair[1];
    list.push([probability, name]);
  });
  return list;
};

Framboise.prototype.parseFuzzers = function (param) {
  var fuzzers = this.parseProbabilityList(param), i, name;
  for (i = 0; i < fuzzers.length; i++) {
    name = "fuzzer" + fuzzers[i][1];
    try {
      this.loadPlugin(name, "modules/" + fuzzers[i][1] + "/fuzzer.js");
    } catch (e) {
    }
    if (!(name in window)) {
      Logger.error("Fuzzer: " + name + " (failed)");
      fuzzers.splice(i, 1);
      i -= 1;
    } else {
      Logger.dumpln("Fuzzer: " + name + " (loaded)");
      fuzzers[i][1] = window[name];
      if ("dependsOnModules" in fuzzers[i][1]) {
        this.loadPluginDependencies(fuzzers[i][1]);
      }
    }
  }
  return fuzzers;
};

Framboise.prototype.parseBoolean = function (param) {
  param = "" + param;
  return param ? (param.toLowerCase() == "true") : false
};

Framboise.prototype.loadPlugin = function (name, path) {
  function handler() {
    if (xhr.readyState == 4 /* complete */) {
      if (xhr.status == 200 || xhr.status == 0) {
        if (xhr.responseText || (!document.getElementById(name))) {
          var head = document.getElementsByTagName('HEAD').item(0);
          var script = document.createElement("script");
          script.type = "text/javascript";
          script.id = name;
          script.text = xhr.responseText;
          head.appendChild(script);
        }
      } else {
        Logger.error('XHR error: ' + xhr.statusText + ' (' + xhr.status + ')');
      }
    }
  }

  function getXMLHttpRequest() {
    if (window.location.protocol == "file:" && "ActiveXObject" in window) {
        return new window.ActiveXObject("Microsoft.XMLHTTP");
    } else {
        return new window.XMLHttpRequest();
    }
  }

  var xhr = getXMLHttpRequest();
  if (xhr != null) {
    xhr.open('GET', path, false);
    xhr.onreadystatechange = handler;
    xhr.send(null);
  } else {
    Logger.error("XMLHttpRequest() not supported.")
  }
};

Framboise.prototype.loadPluginDependencies = function(fuzzer) {
  var j, dependingModules = fuzzer.dependsOnModules, name;
  for (j = 0; j < dependingModules.length; j++) {
    name = "fuzzer" + fuzzer.dependsOnModules[j];
    if (name in window) {
      continue;
    }
    try {
      this.loadPlugin(name, "modules/" + fuzzer.dependsOnModules[j] + "/fuzzer.js");
    } catch (e) {
    }
    if (name in window) {
      Logger.dumpln("+ dependency: " + name + " (loaded)");
    } else {
      Logger.error("+ dependency: " + name + " (failed)");
    }
  }
};

function Engine() {
  this.prefs = {
    reloadTimeout: 0,
    maxCommands: 30,
    commands: {
      trycatch: true,
      settimeout: true,
      setinterval: true,
      forcegc: false,
      events: true
    }
  }
}

Engine.prototype.initialize = function (seed) {
  Random.init(seed);
  o = new Objects();
  Logger.separator();
  Logger.testcase(Logger.comment("Date: " + new Date()));
  Logger.testcase(Logger.comment("Seed: " + Random.seed));
  if (window.debug) {
    Logger.testcase("Logger={}; Logger.JSError=function(e){};");
  }
};

Engine.prototype.onInit = function (fuzzers) {
  var i, j, cmds, cmd;
  for (i = 0; i < fuzzers.length; i++) {
    cmds = fuzzers[i][1].onInit();
    cmds = typeof(cmds) == "string" ? [cmds] : cmds;
    if (Array.isArray(cmds)) {
      for (j = 0; j < cmds.length; j++) {
        cmd = cmds[j];
        if (cmd.length > 0) {
          this.fuzz(cmd);
        }
      }
    }
  }
};

Engine.prototype.makeSubCommands = function (fuzzers) {
  var subCmds = [], maxCmds = Random.range(1, 6), i, j, fuzzer, cmds, cmd;
  for (i = 0; i < maxCmds; i++) {
    fuzzer = Random.choose(fuzzers);
    cmds = fuzzer.makeCommand();
    cmds = typeof(cmds) == "string" ? [cmds] : cmds;
    if (Array.isArray(cmds)) {
      for (j = 0; j < cmds.length; j++) {
        cmd = cmds[j];
        if (cmd.length > 0) {
          subCmds.push(cmd);
        }
      }
    }
  }
  return subCmds.join("\n");
};

Engine.prototype.makeCommands = function (fuzzers) {
  var i, j, n, fuzzer, cmds, cmds;
  for (i = 0; i < this.prefs.maxCommands; i++) {
    fuzzer = Random.choose(fuzzers);
    cmds = fuzzer.makeCommand();
    cmds = typeof(cmds) == "string" ? [cmds] : cmds;
    if (Array.isArray(cmds)) {
      for (j = 0; j < cmds.length; j++) {
        cmd = cmds[j];
        if (cmd.length == 0) {
          continue;
        }
        switch(Random.number(16)) {
          case 0:
            if (this.prefs.commands.setinterval) {
              n = Math.random() * 100;
              this.fuzz("setInterval(" + Function(JS.safely(cmd)) + ", " + n + ")");
            }
            break;
          case 1:
            if (this.prefs.commands.settimeout) {
              n = Math.random() * 1000;
              this.prefs.reloadTimeout += n;
              this.fuzz("setTimeout(" + Function(JS.safely(cmd)) + ", " + n + ")");
            }
            break;
          case 2:
            if (this.prefs.commands.events && "Events" in fuzzer) {
              var objName = Random.pick(Utils.getKeysFromHash(fuzzer.Events));
              if (o.has(objName)) {
                var evtName = Random.pick(fuzzer.Events[objName]);
                var evtCmds = this.makeSubCommands(fuzzers);
                var callback = "function(e) { " + evtCmds + "}";
                var params = [Utils.quote(evtName), callback];
                this.fuzz(o.pick(objName) + ".addEventListener" + JS.methodHead(params));
              }
            }
            if (this.prefs.commands.events && "WindowEvents" in fuzzer) {
              var evtName = Random.pick(fuzzer.WindowEvents);
              var evtCmds = this.makeSubCommands(fuzzers);
              var callback = "function(e) { " + evtCmds + "}";
              var params = [Utils.quote(evtName), callback];
              this.fuzz("window.addEventListener" + JS.methodHead(params));
            }
            break;
          default:
            this.fuzz(cmd);
        }
      }
    }
  }
};

Engine.prototype.fuzz = function (cmd) {
  if (this.prefs.commands.trycatch) {
    cmd = JS.safely(cmd);
  }
  Logger.testcase(cmd);
  eval(cmd);
};

Engine.prototype.onFinish = function (fuzzers) {
  var i, j, cmds;
  for (i = 0; i < fuzzers.length; i++) {
    cmds = fuzzers[i][1].onFinish();
    cmds = typeof(cmds) == "string" ? [cmds] : cmds;
    if (Array.isArray(cmds)) {
      for (j = 0; j < cmds.length; j++) {
        if (cmds[j].length > 0) {
          this.fuzz(cmds[j]);
        }
      }
    }
  }
};

Engine.prototype.run = function (fuzzers) {
  this.onInit(fuzzers);
  this.makeCommands(fuzzers);
  this.onFinish(fuzzers);
  this.fuzz('setTimeout("window.location.reload()", ' + this.prefs.reloadTimeout + ')');
  Logger.dumpln(Logger.comment("### END OF TESTCASE"));
};

document.addEventListener("DOMContentLoaded", function () {
  framboise = new Framboise();
  framboise.start();
}, false);
