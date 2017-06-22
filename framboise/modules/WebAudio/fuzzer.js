/*
 * WebAudio References
 *
 * Specification: https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html
 * MDN: https://developer.mozilla.org/en-US/docs/Web_Audio_API
 * Mochitests: ./mach mochitest-plain content/media/webaudio/test/
 * WebIDLs: dom/webidl/Audio*
 * Firefox implementation (1): http://hg.mozilla.org/integration/mozilla-inbound/file/tip/content/media/webaudio
 * Firefox implementation (2): https://bugzilla.mozilla.org/showdependencytree.cgi?id=779297&hide_resolved=1
 * Webkit implementation: https://github.com/WebKit/webkit/tree/master/Source/WebCore/Modules/webaudio
 * Chromium implementation: src/third_party/WebKit/Source/modules/webaudio/*.idl
 * WebKit layout tests: https://github.com/WebKit/webkit/tree/master/LayoutTests/webaudio
 * Firefox environment: NSPR_LOG_MODULES=AudioStream:5
 *
**/

var fuzzerWebAudio = (function() {
  let makeFloat = [make.number.float]
  let makeDouble = [makeFloat, make.number.any, make.number.tiny]
  let makeNumber = [makeDouble]

  /* Flags */
  let isOfflineContext = false
  let hasStarted = false
  let hasEnded = false

  /* Buffer related values for eg. AudioBuffer, Curve and WaveTable. */
  let maxChannelCount = 1048575

  let makeBuffer = function() {
    return random.choose([
      [10, makeAudioBuffer],
      [ 5, o.has("AudioBuffer") ? o.pick("AudioBuffer") : makeAudioBuffer]
    ])
  }

  let makeChannelCount = [function() {
    return random.choose([
      [50, 1],
      [10, random.range(1, 3)],
      [10, make.number.tiny],
      [ 0, [random.range(1, 32), makeNumber]],
      [ 0, random.number(maxChannelCount)]
    ])
  }]

  let makeBufferLength = [function() {
    return random.choose([
      [30, make.number.tiny],
      [ 5, random.number(65535)],
    ])
  }]

  let makeSampleRate = [function() {
    // http://en.wikipedia.org/wiki/Sampling_rate#Audio
    let platformRates = [44100, 47250, 48000, 50000, 54000, 88200, 96000]
    if (utils.platform.isMozilla) {
      platformRates.concat([8000, 11025, 16000, 22050, 32000, 176400, 192000, 352800, random.range(2, 1048575)])
    }
    if (utils.platform.isChrome) {
      platformRates.concat([random.range(44100, 96000)])
    }
    return random.choose([
      [10, random.pick([48000, 44100])],
      [ 5, random.pick(platformRates)]
    ])
  }]

  let makeBufferValues = [function() {
    return random.choose([
      [30, make.number.float],
      [ 5, random.item([-1.0, 1.0, makeNumber])]
    ])
  }]

  let makeWaveTable = [function() {
    return random.choose([
      [10, createWaveTable],
      [ 5, o.has("WaveTable") ? o.pick("WaveTable") : createWaveTable]
    ])
  }]

  /* Constructor for base AudioContext. */
  function _AudioContext() {
    let audioContextMethod = random.choose([
      [8, utils.platform.AudioContext],
      [4, utils.platform.OfflineAudioContext]
    ])

    isOfflineContext = audioContextMethod.indexOf("Offline") > -1

    let audioContextParams = []

    if (random.chance(4) || isOfflineContext) {
      audioContextParams = [
        makeChannelCount,
        makeBufferLength,
        makeSampleRate
      ]
    }

    if (isOfflineContext)
      return o.add("AudioContext") + " = new " + audioContextMethod + utils.script.methodHead(audioContextParams) + ";"
    else
      return o.add("AudioContext") + " = new " + audioContextMethod + "();"
  }

  /* Node constructors in AudioContext */
  function AudioBuffer() {
    let params = [makeChannelCount, makeBufferLength, makeSampleRate]
    return o.add("AudioBuffer") + " = " + o.pick("AudioContext") + ".createBuffer" + utils.script.methodHead(params) + ";"
  }

  function BufferSourceNode() {
    let cmd = []
    cmd.push(o.add("BufferSourceNode") + " = " + o.pick("AudioContext") + ".createBufferSource();")
    if (random.chance(2)) {
       cmd.push(o.add("AudioBuffer") + " = " + makeAudioBuffer())
    }
    return cmd
  }

  function PannerNode() {
    return o.add("PannerNode") + " = " + o.pick("AudioContext") + ".createPanner();"
  }

  function AnalyserNode() {
    return o.add("AnalyserNode") + " = " + o.pick("AudioContext") + ".createAnalyser();"
  }

  function GainNode() {
    return o.add("GainNode") + " = " + o.pick("AudioContext") + ".createGain();"
  }

  function WaveShaperNode() {
    return o.add("WaveShaperNode") + " = " + o.pick("AudioContext") + ".createWaveShaper();"
  }

  function DelayNode() {
    let params = [make.number.float]
    return o.add("DelayNode") + " = " + o.pick("AudioContext") + ".createDelay" + utils.script.methodHead(params) + ";"
  }

  function BiquadFilterNode() {
    return o.add("BiquadFilterNode") + " = " + o.pick("AudioContext") + ".createBiquadFilter();"
  }

  function ChannelSplitterNode() {
    let params = [
      random.choose([
        [40, random.range(1, 6)],
        [ 3, random.range(2, 31)],
        [ 1, [makeNumber, random.range(2, maxChannelCount)]]
      ])
    ]
    return o.add("ChannelSplitterNode") + " = " + o.pick("AudioContext") + ".createChannelSplitter" + utils.script.methodHead(params) + ";"
  }

  function ChannelMergerNode() {
    let params = [
      random.choose([
        [40, random.range(1, 6)],
        [ 3, random.range(2, 31)],
        [ 1, [makeNumber, random.range(2, maxChannelCount)]]
      ])
    ]
    return o.add("ChannelMergerNode") + " = " + o.pick("AudioContext") + ".createChannelMerger" + utils.script.methodHead(params) + ";"
  }

  function DynamicsCompressorNode() {
    return o.add("DynamicsCompressorNode") + " = " + o.pick("AudioContext") + ".createDynamicsCompressor();"
  }

  function ScriptProcessorNode() {
    let params = [
      random.choose([
        [30, [0, 256, 512, 1024, 2048, 4096, 8192, 16384]],
        [ 1, makeNumber]
      ]),
      random.choose([
        [30, 1],
        [10, random.range(1, 6)],
        [ 1, [makeNumber, random.range(2, maxChannelCount)]]
      ]),
      random.choose([
        [30, 1],
        [10, random.range(1, 6)],
        [ 1, [makeNumber, random.range(2, maxChannelCount)]]
      ])
    ]
    return o.add("ScriptProcessorNode") + " = " + o.pick("AudioContext") + ".createScriptProcessor" + utils.script.methodHead(params) + ";"
  }

  function WaveTable() {
    let x = y = makeFloat32Array(random.number(4096))
    let params = [x, y]
    return o.add("WaveTable") + " = " + o.pick("AudioContext") + ".createPeriodicWave" + utils.script.methodHead(params) + ";"
  }

  function OscillatorNode() {
    return o.add("OscillatorNode") + " = " + o.pick("AudioContext") + ".createOscillator();"
  }

  function ConvolverNode() {
    return o.add("ConvolverNode") + " = " + o.pick("AudioContext") + ".createConvolver();"
  }

  function MediaStreamAudioDestinationNode() {
    return o.add("MediaStreamAudioDestinationNode") + " = " + o.pick("AudioContext") + ".createMediaStreamDestination();"
  }

  function MediaElementAudioSourceNode() {
    let params = [o.pick('AudioElement')]
    return o.add("MediaElementAudioSourceNode") + " = " + o.pick("AudioContext") + ".createMediaElementSource" + utils.script.methodHead(params) + ";"
  }

  function MediaStreamAudioSourceNode() {
    let params = [o.pick('MediaStream')]
    return o.add("MediaStreamAudioSourceNode") + " = " + o.pick("AudioContext") + ".createMediaStreamSource" + utils.script.methodHead(params) + ";"
  }

  let AudioContextNodes = [
    //"AudioBuffer",                      // https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html#AudioBuffer
    "BufferSourceNode",                   // https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html#AudioBufferSourceNode-section
    "PannerNode",                         // https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html#PannerNode
    "AnalyserNode",                       // https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html#AnalyserNode
    "GainNode",                           // https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html#GainNode
    "DelayNode",                          // https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html#DelayNode
    "BiquadFilterNode",                   // https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html#BiquadFilterNode
    "DynamicsCompressorNode",             // https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html#DynamicsCompressorNode
    "ScriptProcessorNode",                // https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html#ScriptProcessorNode
    "WaveShaperNode",                     // https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html#WaveShaperNode
    "WaveTable",                          // https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html#WaveTable
    "ChannelSplitterNode",                // https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html#ChannelSplitterNode
    "ChannelMergerNode",                  // https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html#ChannelMergerNode
    "ConvolverNode",                      // https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html#ConvolverNode
    "OscillatorNode",                     // https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html#OscillatorNode
    "MediaStreamAudioDestinationNode",    // https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html#MediaStreamAudioDestinationNode
    "MediaStreamAudioSourceNode",         // https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html#MediaStreamAudioSourceNode
    "MediaElementAudioSourceNode"         // https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html#MediaElementAudioSourceNode
  ]

  let AudioNodesExcludeList = ["AudioBuffer", "WaveTable"]

  let AudioNodes = (function() {
    let nodes = []
    for (let i=0; i<AudioContextNodes.length; i++) {
      if (AudioNodesExcludeList.indexOf(AudioContextNodes[i]) === -1) {
        nodes.push(AudioContextNodes[i])
      }
    }
    return nodes
  })()

  let AudioParamNodes = [
    "GainNode",
    "DelayNode",
    "BufferSourceNode",
    "DynamicsCompressorNode",
    "BiquadFilterNode",
    "OscillatorNode"
  ]

  if (utils.platform.isChrome || utils.platform.isSafari) {
    if (AudioContextNodes.indexOf("MediaStreamAudioSourceNode") > -1) {
      AudioContextNodes.splice(AudioContextNodes.indexOf("MediaStreamAudioSourceNode"), 1)
    }
  }

  /*
  ** Initialization
  ** Commands which shall be called at the beginning of a testcase.
  */
  function onInit()
  {
    let cmd = []

    // Create AudioElement used for MediaStream* and MediaElement*.
    if (!o.has("AudioElement")) {
      cmd.push(o.add("AudioElement") + " = new Audio" + utils.script.methodHead([make.files.audio()]))
    }

    if (!o.has("MediaStream") && utils.platform.isMozilla) {
        cmd.push(o.add("MediaStream") + " = " + o.pick("AudioElement") + "." + utils.platform.captureStreamUntilEnded + "()")
    }

    // Create base AudioContext object.
    if (!o.has("AudioContext")) {
      cmd.push(_AudioContext())
    }

    return cmd
  }

  /*
  ** Main
  ** Command which shall be called after initialization.
  */
  function makeCommand()
  {
    let nodeName

    // Create one or many constructor/s of an AudioContext node.
    if (!o.contains(AudioContextNodes)) {
      let cmd = [],
          pickedNodes = ["BufferSourceNode"],
          maxNodes = random.range(1, AudioContextNodes.length)
      while (pickedNodes.length < maxNodes) {
        nodeName = random.pick(AudioContextNodes)
        if (pickedNodes.indexOf(nodeName) === -1
            && random.chance(6)) {
          pickedNodes.push(nodeName)
        }
      }
      pickedNodes.forEach(function(nodeName) {
        cmd = cmd.concat(eval(nodeName)())
      })
      return cmd
    }

    if (random.chance(64) && o.has("MediaStreamAudioDestinationNode")) {
      o.add("MediaStream", o.pick("MediaStreamAudioDestinationNode") + ".stream")
      return [
        o.pick("AudioElement") + "." + utils.platform.srcObject + " = " + o.pick("MediaStream") + ";",
        o.pick("AudioElement") + ".play();"
      ]
    }

    if (random.chance(32) && o.has("BufferSourceNode")) {
      return setPlayState("start", "BufferSourceNode")
    }

    switch(random.number(10)) {
      case 0:
        // Handle random methods of AudioContext objects.
        nodeName = random.pick(o.contains(AudioContextNodes))
        try { return utils.script.methodCall(o.pick(nodeName), eval(nodeName + "Methods")) } catch (e) {}
      case 1:
        // Handle random attributes of AudioContext objects.
        nodeName = random.pick(o.contains(AudioContextNodes))
        try { return utils.script.setAttribute(o.pick(nodeName), eval(nodeName + "Attributes")) } catch (e) {}
      case 2:
        // Handle methods of AudioNode object.
        let srcNodeName = random.pick(o.contains(AudioNodes)),
            dstNodeName = random.pick(o.contains(AudioNodes))
        if (srcNodeName && dstNodeName && (dstNodeName != "BufferSourceNode" && dstNodeName != "OscillatorNode")) {
          let dstNode = o.pick(dstNodeName)
          let srcNode = o.pick(srcNodeName)
          let outputChannel, inputChannel
          try {
            outputChannel = random.number(eval(srcNode + ".numberOfOutputs")) // todo: no target DOM eval()
            inputChannel = random.number(eval(dstNode + ".numberOfInputs"))
          } catch (e) {
            break
          }
          let AudioNodeMethods = random.choose([
            [30, {"connect": [dstNode, outputChannel, inputChannel]}],
            [ 2, {"disconnect": [outputChannel]}]
          ])
          return utils.script.methodCall(o.pick(srcNodeName), AudioNodeMethods)
        }
        break
      case 3:
        // Handle attributes of AudioNode object.
        nodeName = random.pick(o.contains(AudioNodes))
        if (nodeName) {
          let node = random.choose([
            [20, o.pick(nodeName)],
            [ 5, o.pick("AudioContext") + ".destination"]
          ])
          return utils.script.setAttribute(node, AudioNodeAttributes)
        }
        break
      case 4:
        // Handle AudioListener object.
        nodeName = o.pick("AudioContext") + ".listener"
        return random.choose([
          [1, function() { return utils.script.setAttribute(nodeName, AudioListenerAttributes) }],
          [1, function() { return utils.script.methodCall(nodeName, AudioListenerMethods) }]
        ])
        break
      case 5:
        // Handle AudioNodes which have AudioParam objects.
        nodeName = random.pick(o.contains(AudioParamNodes))
        if (nodeName) {
          let paramNode = o.pick(nodeName)
          switch(nodeName) {
            case "GainNode":
              paramNode += "." + random.pick(["gain"])
              break
            case "DelayNode":
              paramNode += "." + random.pick(["delayTime"])
              break
            case "BufferSourceNode":
              if (utils.platform.isMozilla) {
                paramNode += "." + random.pick(["playbackRate"])
              } else {
                paramNode += "." + random.pick(["playbackRate", "gain"])
              }
              break
            case "DynamicsCompressorNode":
              paramNode += "." + random.pick(["threshold", "knee", "ratio", "reduction", "attack", "release"])
              break
            case "BiquadFilterNode":
              paramNode += "." + random.pick(["frequency", "detune", "Q", "gain"])
              break
            case "OscillatorNode":
              paramNode += "." + random.pick(["frequency", "detune"])
              break
          }
          return random.choose([
            [1, function() { return utils.script.setAttribute(paramNode, AudioParamAttributes) }],
            [1, function() { return utils.script.methodCall(paramNode, AudioParamMethods) }]
          ])
        }
        break
      case 7:
        // Handle BufferSource
        if (o.has("BufferSourceNode")) {
          let bufferSource = o.pick("BufferSourceNode")
          return [
            bufferSource + ".buffer = " + makeBuffer(),
            bufferSource + ".connect(" + o.pick("AudioContext") + ".destination);"
          ]
        }
        break
      case 8:
        // Handle Audio|MediaElement
        if (o.has("AudioElement")) {
          return random.choose([
            [1, function() { return utils.script.setAttribute(o.pick("AudioElement"), AudioElementAttributes)}],
            [1, function() { return utils.script.methodCall(o.pick("AudioElement"), AudioElementMethods) }]
          ])
        }
        break
      case 9:
        // Handle AudioBuffer
        if (o.has("BufferSourceNode")) {
         return random.choose([
            [1, function() { return utils.script.setAttribute(o.pick("BufferSourceNode") + ".buffer", AudioBufferAttributes) }],
            [1, function() { return utils.script.methodCall(o.pick("BufferSourceNode") + ".buffer", AudioBufferMethods) }]
          ])
        }
        break
      /*
      case 10:
        // Neuter buffer
        let w = new Worker("neuter.js")
        let d = buffer.getChannelData(0).buffer
        w.postMessage(d, [d])
        gc()
        // neuter.js
        onmessage = function (event) { postMessage("Pong"); }
       */
    }

    return []
  }


  /*
  ** De-initialization.
  ** Commands which shall be called at the end of a testcase.
  */
  function onFinish()
  {
    let cmd = []

    if (random.chance(64)) {
      let audioBuffer = makeFloat32Array() + ".buffer"
      let params = [audioBuffer, "" + Function(['decodedBuffer'], ''), "" + Function([''], '')]
      cmd.push(o.pick("AudioContext") + ".decodeAudioData" + utils.script.methodHead(params))
    }

    if (isOfflineContext && random.chance(4)) {
      cmd.push(o.pick("AudioContext") + ".startRendering();")
    }

    if (o.has("BufferSourceNode")) {
      cmd = cmd.concat(setPlayState("start", "BufferSourceNode"))
    }

    return cmd
  }


  /*
  ** Utility methods.
  */
  function makeAudioBuffer() {
    let channelCount = random.pick(makeChannelCount),
        sampleRate = random.pick([makeSampleRate, o.pick("AudioContext")+".sampleRate"]),
        bufferLength = random.pick(makeBufferLength),
        bufferData = random.pick([makeBufferValues]),
        params = [channelCount, bufferLength, sampleRate],
        src

    src  = "var buffer = " + o.pick("AudioContext") + ".createBuffer" + utils.script.methodHead(params) + ";"
    src += "for(var c=0;c<" + channelCount + ";c++) {"
    src += "var data = buffer.getChannelData(c);"
    src += "for(var i=0;i<" + bufferLength + ";i++) {"
    src += "data[i] = " + makeMathExpr(["i", bufferData, bufferLength])
    src += "}}return buffer;"

    return "" + new Function(src) + "()"
  }

  function makeFloat32Array(length) {
    let bufferData = random.pick([makeBufferValues]),
        bufferLength = length || random.pick(makeBufferLength),
        params = [bufferLength],
        src

    src  = "var buffer=new Float32Array" + utils.script.methodHead(params) + ";"
    src += "for(var i=0;i<" + bufferLength + ";i++){"
    src += "buffer[i]=" + makeMathExpr(["i", bufferData, bufferLength])
    src += "}return buffer;"

    return "" + new Function(src) + "()"
  }

  function makeUint8Array(length) {
    let bufferData = random.pick([makeBufferValues]),
        bufferLength = length || random.pick(makeBufferLength),
        params = [bufferLength],
        src

    src  = "var buffer=new Uint8Array" + utils.script.methodHead(params) + ";"
    src += "for(var i=0;i<" + bufferLength + ";i++) {"
    src += "buffer[i]=Math.round(i " + random.pick(make.text.arithmeticOperator) + bufferData + ");"
    src += "}return buffer;"

    return "" + new Function(src) + "()"
  }

  function createWaveTable() {
    let imag = [], real = [], i, table = {}

    for (i=0; i<random.pick(makeBufferLength); i++) { imag.push(random.pick(makeBufferValues)) }
    for (i=0; i<random.pick(makeBufferLength); i++) { real.push(random.pick(makeBufferValues)) }

    switch (random.number(32)) {
      case 0:
        table.imag = imag
        break
      case 1:
        table.real = real
        break
      case 2:
        table.fooo = imag
        break
      default:
        table.imag = imag
        table.real = real
    }

    return utils.common.quote(table)
  }

  function makeMathExpr(withValues) {
    return random.pick([
      //function() { return random.pick([withValues]) },
      function() { return "Math.sin(" + random.pick([withValues]) + ")" },
      function() { return random.pick([withValues]) + " " + random.pick(make.text.arithmeticOperator) + " " + random.pick([withValues]) },
      function() { return "Math." + random.pick(["sin", "tan", "cos", "ceil"]) + "(" + makeMathExpr(withValues) +")" },
      function() { return  "(" + makeMathExpr(withValues) + ")" + random.pick(make.text.arithmeticOperator) + "(" + makeMathExpr(withValues) + ")" }
    ])
  }

  function setPlayState(wishState, nodeName) {
    let cmd = [], nodes = o.show(nodeName), i

    if (!hasStarted && !hasEnded && wishState === "start") {
      for (i = 0; i < nodes.length; i++) {
        cmd.push(utils.script.methodCall(nodes[i].name, random.choose([
          [10, {"start": [[0, make.number.float]] }],
          [ 2, {"start": [[0, make.number.float], [make.number.float]] }],
          [ 2, {"start": [[0, make.number.float], [make.number.float], [make.number.float]] }]
        ])))
      }
      hasStarted = true
      return cmd
    }

    if (hasStarted && !hasEnded && wishState === "stop") {
      for (i = 0; i < nodes.length; i++) {
        cmd.push(utils.script.methodCall(nodes[i].name, random.choose([
          [10, {"stop": [[make.number.float]] }],
          [ 2, {"stop": [[make.number.float], [make.number.float]] }],
          [ 2, {"stop": [[make.number.float], [make.number.float], [make.number.float]] }]
        ])))
      }
      hasEnded = true
      return cmd
    }

    return cmd
  }


  /*
  ** Methods and attributes of AudioContext members.
  */
  let AudioNodeAttributes = {
    "channelCount": [makeChannelCount],
    "channelCountMode": ["'max'", "'clamped-max'", "'explicit'"],
    "channelInterpretation": ["'speakers'", "'discrete'"]
  }

  let PannerNodeMethods = {
    "setOrientation": [[makeDouble, 1.0], [makeDouble, 0.0], [makeDouble, 0.0]],
    "setVelocity": [makeDouble, makeDouble, makeDouble],
    "setPosition": [makeDouble, makeDouble, makeDouble]
  }

  let PannerNodeAttributes = {
    "panningModel": ["'equalpower'", "'HRTF'", "'soundfield'"],
    "distanceModel": ["'linear'", "'inverse'", "'exponential'"],
    "refDistance": [makeDouble, 1.0],
    "maxDistance": [makeDouble, 100000.0],
    "rolloffFactor": [makeDouble, 1.0],
    "coneInnerAngle": [makeDouble, 360.0],
    "coneOuterAngle": [makeDouble, 360.0],
    "coneOuterGain": [makeDouble, 0.0]
  }

  let ScriptProcessorNodeAttributes = {
  }

  let ConvolverNodeAttributes = {
    "buffer": [makeBuffer],
    "normalize": ['true', 'false']
  }

  let BufferSourceNodeAttributes = {
    "buffer": [makeBuffer],
    "loop": ['true', 'false'],
    "loopStart": [makeDouble],
    "loopEnd": [makeDouble]
  }

  let AnalyserNodeAttributes = {
    "fftSize": [function() { return random.choose([
        [20, Math.pow(2, random.range(5, 11))],
        [ 5, makeNumber]
      ])
    }],
    "minDecibels": [makeDouble],
    "maxDecibels": [makeDouble],
    "smoothingTimeConstant": [0, 1, makeDouble]
  }

  let AnalyserNodeMethods = {
    'getFloatFrequencyData': [makeFloat32Array],
    'getByteFrequencyData': [makeUint8Array],
    'getByteTimeDomainData': [makeUint8Array]
  }

  let BiquadFilterNodeMethods = {
    "getFrequencyResponse": [makeFloat32Array, makeFloat32Array, makeFloat32Array]
  }

  let BiquadFilterNodeAttributes = {
    "type": ["'lowpass'", "'highpass'", "'bandpass'", "'lowshelf'", "'highshelf'", "'peaking'", "'notch'", "'allpass'"]
  }

  let WaveShaperNodeAttributes = {
    "curve": [makeFloat32Array],
    "oversample": ["'none'", "'2x'", "'4x'"]
  }

  let OscillatorNodeAttributes = {
    "type": ["'sine'", "'square'", "'sawtooth'", "'triangle'", "'custom'"]
  }

  let OscillatorNodeMethods = {
    "start": [makeDouble],
    "stop": [makeDouble],
    "setPeriodicWave": [makeWaveTable]
  }

  let AudioListenerAttributes = {
    "dopplerFactor": [1.0, makeDouble],
    "speedOfSound": [343.3, makeDouble]
  }

  let AudioListenerMethods = {
    "setPosition": [makeDouble, makeDouble, makeDouble],
    "setOrientation": [makeDouble, makeDouble, makeDouble, makeDouble, makeDouble, makeDouble],
    "setVelocity": [makeDouble, makeDouble, makeDouble]
  }

  let AudioParamAttributes = {
    "value": [makeFloat]
  }

  let AudioParamMethods = {
    "setValueAtTime": [makeFloat, makeDouble],
    "linearRampToValueAtTime": [makeFloat, makeDouble],
    "exponentialRampToValueAtTime": [makeFloat, makeDouble],
    "setTargetAtTime": [makeFloat, makeDouble, makeDouble],
    "setValueCurveAtTime": [makeFloat32Array, makeDouble, makeDouble],
    "cancelScheduledValues": [makeDouble]
  }

  let AudioElementAttributes = {
    "defaultMuted": [make.number.bool],
    "muted": [make.number.bool],
    "volume": [makeFloat],
    "controls": [make.number.bool],
    "loop": [make.number.bool],
    "autoplay": [make.number.bool],
    "playbackRate": [make.number.float],
    "defaultPlaybackRate": [makeFloat],
    "currentTime": [make.number.float],
    "preload": ['"auto"', '"metadata"', '"none"']
  }
  if (utils.platform.isMozilla) {
    utils.common.mergeHash(AudioElementAttributes, {
      "mozFrameBufferLength": [makeNumber],
      "mozAudioChannelType": ['"normal"', '"content"', '"notification"', '"alarm"', '"telephony"', '"ringer"', '"publicnotification"'],
      "mozPreservesPitch": [make.number.bool]
    })
  }

  let AudioElementMethods = {
    "pause": [],
    "load": []
  }
  if (utils.platform.isMozilla) {
    utils.common.mergeHash(AudioElementMethods, {
      "mozCurrentSampleOffset": [],
      "mozWriteAudio": [makeFloat32Array],
      "mozSetup": [makeChannelCount, makeSampleRate],
      "mozGetMetadata": []
    })
  }

  let AudioBufferAttributes = {
  }
  if (utils.platform.isChrome) {
    utils.common.mergeHash(AudioBufferAttributes, {
      "gain": [1.0, makeNumber]
    })
  }

  let AudioBufferMethods = {
    "copyFromChannel": [makeFloat32Array, makeChannelCount, makeNumber, makeNumber],
    "copyToChannel": [makeFloat32Array, makeChannelCount, makeNumber, makeNumber]
  }

  let Events = {
    "BufferSourceNode": ["ended"],
    "ScriptProcessorNode": ["audioprocess"]
  }

  return {
    onInit: onInit,
    makeCommand: makeCommand,
    onFinish: onFinish,
    Events: Events
  }
})()
