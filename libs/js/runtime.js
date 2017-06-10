class Framboise {
  start() {
    let argv = this.mapLocationParameters(location.search),
      fuzzers,
      value,
      randomSeed = null

    try {
      fuzzers = this.parseParm('fuzzer', argv, this.parseFuzzers)
    } catch (e) {
      throw new Error(e)
    }

    value = this.parseParm('seed', argv, parseFloat)
    if (value) {
      randomSeed = value
    }

    let engine = new Engine(randomSeed)

    value = this.parseParm('max-commands', argv, parseInt)
    if (value) {
      engine.prefs.maxCommands = random.range(Math.round((value / 2)) / 2, value)
    }

    value = this.parseParm('timeout', argv, parseInt)
    if (value) {
      engine.prefs.reloadTimeout = value
    }

    engine.prefs.commands.settimeout = this.parseParm('with-set-timeout', argv, this.parseBoolean)

    engine.prefs.commands.setinterval = this.parseParm('with-set-interval', argv, this.parseBoolean)

    engine.prefs.commands.events = this.parseParm('with-events', argv, this.parseBoolean)

    window.debug = this.parseParm('debug', argv, this.parseBoolean)

    value = this.parseParm('ws-logger', argv, parseInt)
    if (value) {
      websocket = new WebSocket('ws://localhost:' + value + '/')
      websocket.onopen = e => {
        engine.initialize()
        engine.run(fuzzers)
      }
    } else {
      engine.initialize()
      engine.run(fuzzers)
    }

    return 0
  }

  isParameter(name, argv) {
    return argv.hasOwnProperty(name) && argv[name] !== undefined && argv[name]
  }

  parseParm(name, argv, cb) {
    if (this.isParameter(name, argv))
      return cb.call(this, argv[name])
    return null
  }

  mapLocationParameters(seq) {
    let dict = {}, i, pair
    seq = seq.substring(1).split('&')
    for (i = 0; i < seq.length; i++) {
      pair = seq[i].split('=')
      dict[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1])
    }
    return dict
  }

  parseBoolean(param) {
    param = '' + param
    return param ? (param.toLowerCase() === 'true') : false
  }

  parseProbabilityList(param) {
    let list = []
    param.split(',').forEach(value => {
      let pair = value.split(':')
      let probability = parseInt(pair[0])
      let name = pair[1]
      list.push([probability, name])
    })
    return list
  }

  parseFuzzers(param) {
    let fuzzers = this.parseProbabilityList(param), i

    for (i = 0; i < fuzzers.length; i++) {
      let name = 'fuzzer' + fuzzers[i][1]

      try {
        this.loadFuzzer(name, 'modules/' + fuzzers[i][1] + '/fuzzer.js')
      } catch (e) {
        throw new Error('Unable to load fuzzer named: ' + name)
      }

      if (!(window[name])) {
        logger.error('[✘] Fuzzer: ' + name)
        fuzzers.splice(i, 1)
        i -= 1
      } else {
        logger.dumpln('[✓] Fuzzer: ' + name)
        fuzzers[i][1] = window[name]
      }
    }

    return fuzzers
  }

  loadFuzzer(name, path) {
    function handler() {
      if (xhr.readyState === 4 /* complete */) {
        if (xhr.status === 200 || xhr.status === 0) {
          if (xhr.responseText || (!document.getElementById(name))) {
            let head = document.getElementsByTagName('HEAD').item(0)
            let script = document.createElement('script')
            script.type = 'text/javascript'
            script.id = name
            script.text = xhr.responseText
            head.appendChild(script)
          }
        } else {
          logger.error('XHR error: ' + xhr.statusText + ' (' + xhr.status + ')')
        }
      }
    };

    function getXMLHttpRequest() {
      if (window.location.protocol === 'file:' && 'ActiveXObject' in window) {
        return new window.ActiveXObject('Microsoft.XMLHTTP')
      } else {
        return new window.XMLHttpRequest()
      }
    }

    let xhr = getXMLHttpRequest()
    if (xhr != null) {
      xhr.open('GET', path, false)
      xhr.onreadystatechange = handler
      xhr.send(null)
    } else {
      logger.error('XMLHttpRequest() not supported.')
    }
  }
}


/*
 * The fuzzing engine.
 */
class Engine {
  constructor(seed) {
    random.init(seed)

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

  initialize() {
    o = new Objects() /* global */
    logger.separator()
    logger.testcase(logger.comment('Date: ' + new Date()))
    logger.testcase(logger.comment('Seed: ' + random.seed))
    if (window.debug) {
      logger.testcase('logger={}; logger.JSError=e=>{};')
    }
  }

  onInit(fuzzers) {
    let i, j, cmds, cmd
    for (i = 0; i < fuzzers.length; i++) {
      cmds = fuzzers[i][1].onInit()
      cmds = typeof(cmds) === 'string' ? [cmds] : cmds;
      if (Array.isArray(cmds)) {
        for (j = 0; j < cmds.length; j++) {
          cmd = cmds[j]
          if (cmd.length > 0) {
            fuzz_content_sink(cmd, this.prefs)
          }
        }
      }
    }
  }

  makeSubCommands(fuzzers) {
    let subCmds = [], maxCmds = random.range(1, 6), i, j, fuzzer, cmds, cmd

    for (i = 0; i < maxCmds; i++) {
      fuzzer = random.choose(fuzzers)
      cmds = fuzzer.makeCommand()
      cmds = typeof(cmds) === 'string' ? [cmds] : cmds
      if (Array.isArray(cmds)) {
        for (j = 0; j < cmds.length; j++) {
          cmd = cmds[j]
          if (cmd.length > 0) {
            subCmds.push(cmd)
          }
        }
      }
    }
    return subCmds.join('\n')
  }

  makeCommands(fuzzers) {
    let i, j, n, fuzzer, cmds, cmd

    for (i = 0; i < this.prefs.maxCommands; i++) {
      fuzzer = random.choose(fuzzers)
      cmds = fuzzer.makeCommand()
      cmds = typeof(cmds) === 'string' ? [cmds] : cmds
      if (Array.isArray(cmds)) {
        for (j = 0; j < cmds.length; j++) {
          cmd = cmds[j]
          if (cmd.length === 0) {
            continue
          }
          switch (random.number(16)) {
            case 0:
              if (this.prefs.commands.setinterval) {
                n = Math.random() * 100
                fuzz_content_sink('setInterval(' + Function(utils.script.safely(cmd)) + ', ' + n + ')', this.prefs)
              }
              break
            case 1:
              if (this.prefs.commands.settimeout) {
                n = Math.random() * 1000
                this.prefs.reloadTimeout += n
                fuzz_content_sink('setTimeout(' + Function(utils.script.safely(cmd)) + ', ' + n + ')', this.prefs)
              }
              break
            case 2:
              if (this.prefs.commands.events && 'Events' in fuzzer) {
                let objName = random.pick(utils.common.getKeysFromHash(fuzzer.Events))
                if (o.has(objName)) {
                  let evtName = random.pick(fuzzer.Events[objName])
                  let evtCmds = this.makeSubCommands(fuzzers)
                  let callback = 'function(e) { ' + evtCmds + '}'
                  let params = [utils.common.quote(evtName), callback]
                  fuzz_content_sink(o.pick(objName) + '.addEventListener' + utils.script.methodHead(params), this.prefs)
                }
              }
              if (this.prefs.commands.events && 'WindowEvents' in fuzzer) {
                let evtName = random.pick(fuzzer.WindowEvents)
                let evtCmds = this.makeSubCommands(fuzzers)
                let callback = 'function(e) { ' + evtCmds + '}'
                let params = [utils.common.quote(evtName), callback]
                fuzz_content_sink('window.addEventListener' + utils.script.methodHead(params), this.prefs)
              }
              break
            default:
              fuzz_content_sink(cmd, this.prefs)
          }
        }
      }
    }
  }

  onFinish(fuzzers) {
    let i, j, cmds

    for (i = 0; i < fuzzers.length; i++) {
      cmds = fuzzers[i][1].onFinish()
      cmds = typeof(cmds) === 'string' ? [cmds] : cmds
      if (Array.isArray(cmds)) {
        for (j = 0; j < cmds.length; j++) {
          if (cmds[j].length > 0) {
            fuzz_content_sink(cmds[j], this.prefs)
          }
        }
      }
    }
  }

  run(fuzzers) {
    this.onInit(fuzzers)
    this.makeCommands(fuzzers)
    this.onFinish(fuzzers)
    fuzz_content_sink('setTimeout(\'window.location.reload()\', ' + this.prefs.reloadTimeout + ')', this.prefs)
    logger.dumpln(logger.comment('### END OF TESTCASE'))
  }
}


function fuzz_content_sink(cmd, prefs) {
  if (prefs.commands.trycatch) {
    cmd = utils.script.safely(cmd)
  }

  logger.testcase(cmd)

  eval(cmd)
}


window.addEventListener('DOMContentLoaded', () => {
  framboise = new Framboise()

  try {
    framboise.start()
  } catch (e) {
    logger.error(e)
    return -1
  }
}, false)
