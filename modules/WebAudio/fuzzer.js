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
  var makeFloat = [Make.float];
  var makeDouble = [makeFloat, Make.number, Make.tinyNumber];
  var makeNumber = [makeDouble];

  /* Flags */
  var isOfflineContext = false;
  var hasStarted = false;
  var hasEnded = false;

  /* Buffer related values for eg. AudioBuffer, Curve and WaveTable. */
  var maxChannelCount = 1048575;

  var makeBuffer = function() {
    return Random.choose([
      [10, makeAudioBuffer],
      [ 5, o.has("AudioBuffer") ? o.pick("AudioBuffer") : makeAudioBuffer]
    ]);
  };

  var makeChannelCount = [function() {
    return Random.choose([
      [50, 1],
      [10, Random.range(1, 3)],
      [10, Make.tinyNumber],
      [ 0, [Random.range(1, 32), makeNumber]],
      [ 0, Random.number(maxChannelCount)]
    ]);
  }];

  var makeBufferLength = [function() {
    return Random.choose([
      [30, Make.tinyNumber],
      [ 5, Random.number(65535)],
    ]);
  }];

  var makeSampleRate = [function() {
    // http://en.wikipedia.org/wiki/Sampling_rate#Audio
    var platformRates = [44100, 47250, 48000, 50000, 54000, 88200, 96000];
    if (Platform.isMozilla) {
      platformRates.concat([8000, 11025, 16000, 22050, 32000, 176400, 192000, 352800, Random.range(2, 1048575)])
    }
    if (Platform.isChrome) {
      platformRates.concat([Random.range(44100, 96000)])
    }
    return Random.choose([
      [10, Random.pick([48000, 44100])],
      [ 5, Random.pick(platformRates)]
    ]);
  }];

  var makeBufferValues = [function() {
    return Random.choose([
      [30, Make.float],
      [ 5, Random.index([-1.0, 1.0, makeNumber])]
    ]);
  }];

  var makeWaveTable = [function() {
    return Random.choose([
      [10, createWaveTable],
      [ 5, o.has("WaveTable") ? o.pick("WaveTable") : createWaveTable]
    ]);
  }];

  /* Constructor for base AudioContext. */
  function _AudioContext() {
    var audioContextMethod = Random.choose([
      [8, Platform.AudioContext],
      [4, Platform.OfflineAudioContext]
    ]);

    isOfflineContext = audioContextMethod.indexOf("Offline") > -1;

    var audioContextParams = [];

    if (Random.chance(4) || isOfflineContext) {
      audioContextParams = [
        makeChannelCount,
        makeBufferLength,
        makeSampleRate
      ];
    }

    if (isOfflineContext)
      return o.add("AudioContext") + " = new " + audioContextMethod + JS.methodHead(audioContextParams) + ";";
    else
      return o.add("AudioContext") + " = new " + audioContextMethod + "();";
  }

  /* Node constructors in AudioContext */
  function AudioBuffer() {
    var params = [makeChannelCount, makeBufferLength, makeSampleRate];
    return o.add("AudioBuffer") + " = " + o.pick("AudioContext") + ".createBuffer" + JS.methodHead(params) + ";";
  }

  function BufferSourceNode() {
    var cmd = [];
    cmd.push(o.add("BufferSourceNode") + " = " + o.pick("AudioContext") + ".createBufferSource();");
    if (Random.chance(2)) {
       cmd.push(o.add("AudioBuffer") + " = " + makeAudioBuffer());
    }
    return cmd;
  }

  function PannerNode() {
    return o.add("PannerNode") + " = " + o.pick("AudioContext") + ".createPanner();";
  }

  function AnalyserNode() {
    return o.add("AnalyserNode") + " = " + o.pick("AudioContext") + ".createAnalyser();";
  }

  function GainNode() {
    return o.add("GainNode") + " = " + o.pick("AudioContext") + ".createGain();";
  }

  function WaveShaperNode() {
    return o.add("WaveShaperNode") + " = " + o.pick("AudioContext") + ".createWaveShaper();";
  }

  function DelayNode() {
    var params = [Random.float];
    return o.add("DelayNode") + " = " + o.pick("AudioContext") + ".createDelay" + JS.methodHead(params) + ";";
  }

  function BiquadFilterNode() {
    return o.add("BiquadFilterNode") + " = " + o.pick("AudioContext") + ".createBiquadFilter();";
  }

  function ChannelSplitterNode() {
    var params = [
      Random.choose([
        [40, Random.range(1, 6)],
        [ 3, Random.range(2, 31)],
        [ 1, [makeNumber, Random.range(2, maxChannelCount)]]
      ])
    ];
    return o.add("ChannelSplitterNode") + " = " + o.pick("AudioContext") + ".createChannelSplitter" + JS.methodHead(params) + ";";
  }

  function ChannelMergerNode() {
    var params = [
      Random.choose([
        [40, Random.range(1, 6)],
        [ 3, Random.range(2, 31)],
        [ 1, [makeNumber, Random.range(2, maxChannelCount)]]
      ])
    ];
    return o.add("ChannelMergerNode") + " = " + o.pick("AudioContext") + ".createChannelMerger" + JS.methodHead(params) + ";";
  }

  function DynamicsCompressorNode() {
    return o.add("DynamicsCompressorNode") + " = " + o.pick("AudioContext") + ".createDynamicsCompressor();";
  }

  function ScriptProcessorNode() {
    var params = [
      Random.choose([
        [30, [0, 256, 512, 1024, 2048, 4096, 8192, 16384]],
        [ 1, makeNumber]
      ]),
      Random.choose([
        [30, 1],
        [10, Random.range(1, 6)],
        [ 1, [makeNumber, Random.range(2, maxChannelCount)]]
      ]),
      Random.choose([
        [30, 1],
        [10, Random.range(1, 6)],
        [ 1, [makeNumber, Random.range(2, maxChannelCount)]]
      ])
    ];
    return o.add("ScriptProcessorNode") + " = " + o.pick("AudioContext") + ".createScriptProcessor" + JS.methodHead(params) + ";";
  }

  function WaveTable() {
    var x = y = makeFloat32Array(Random.number(4096));
    var params = [x, y];
    return o.add("WaveTable") + " = " + o.pick("AudioContext") + ".createPeriodicWave" + JS.methodHead(params) + ";";
  }

  function OscillatorNode() {
    return o.add("OscillatorNode") + " = " + o.pick("AudioContext") + ".createOscillator();";
  }

  function ConvolverNode() {
    return o.add("ConvolverNode") + " = " + o.pick("AudioContext") + ".createConvolver();";
  }

  function MediaStreamAudioDestinationNode() {
    return o.add("MediaStreamAudioDestinationNode") + " = " + o.pick("AudioContext") + ".createMediaStreamDestination();";
  }

  function MediaElementAudioSourceNode() {
    var params = [o.pick('AudioElement')];
    return o.add("MediaElementAudioSourceNode") + " = " + o.pick("AudioContext") + ".createMediaElementSource" + JS.methodHead(params) + ";";
  }

  function MediaStreamAudioSourceNode() {
    var params = [o.pick('MediaStream')];
    return o.add("MediaStreamAudioSourceNode") + " = " + o.pick("AudioContext") + ".createMediaStreamSource" + JS.methodHead(params) + ";";
  }

  var AudioContextNodes = [
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
  ];

  var AudioNodesExcludeList = ["AudioBuffer", "WaveTable"];

  var AudioNodes = (function() {
    var nodes = [];
    for (var i=0; i<AudioContextNodes.length; i++) {
      if (AudioNodesExcludeList.indexOf(AudioContextNodes[i]) == -1) {
        nodes.push(AudioContextNodes[i]);
      }
    }
    return nodes;
  })();

  var AudioParamNodes = [
    "GainNode",
    "DelayNode",
    "BufferSourceNode",
    "DynamicsCompressorNode",
    "BiquadFilterNode",
    "OscillatorNode"
  ];

  if (Platform.isChrome || Platform.isSafari) {
    if (AudioContextNodes.indexOf("MediaStreamAudioSourceNode") > -1) {
      AudioContextNodes.splice(AudioContextNodes.indexOf("MediaStreamAudioSourceNode"), 1);
    }
  }

  /*
  ** Initialization
  ** Commands which shall be called at the beginning of a testcase.
  */
  function onInit()
  {
    var cmd = [];

    // Create AudioElement used for MediaStream* and MediaElement*.
    if (!o.has("AudioElement")) {
      cmd.push(o.add("AudioElement") + " = new Audio" + JS.methodHead([Make.audio()]));
    }

    if (!o.has("MediaStream") && Platform.isMozilla) {
        cmd.push(o.add("MediaStream") + " = " + o.pick("AudioElement") + "." + Platform.captureStreamUntilEnded + "()");
    }

    // Create base AudioContext object.
    if (!o.has("AudioContext")) {
      cmd.push(_AudioContext());
    }

    return cmd;
  }

  /*
  ** Main
  ** Command which shall be called after initialization.
  */
  function makeCommand()
  {
    var nodeName;

    // Create one or many constructor/s of an AudioContext node.
    if (!o.contains(AudioContextNodes)) {
      var cmd = [],
          pickedNodes = ["BufferSourceNode"],
          maxNodes = Random.range(1, AudioContextNodes.length);
      while (pickedNodes.length < maxNodes) {
        nodeName = Random.pick(AudioContextNodes);
        if (pickedNodes.indexOf(nodeName) == -1
            && Random.chance(6)) {
          pickedNodes.push(nodeName);
        }
      }
      pickedNodes.forEach(function(nodeName) {
        cmd = cmd.concat(eval(nodeName)());
      });
      return cmd;
    }

    if (Random.chance(64) && o.has("MediaStreamAudioDestinationNode")) {
      o.add("MediaStream", o.pick("MediaStreamAudioDestinationNode") + ".stream");
      return [
        o.pick("AudioElement") + "." + Platform.srcObject + " = " + o.pick("MediaStream") + ";",
        o.pick("AudioElement") + ".play();"
      ];
    }

    if (Random.chance(32) && o.has("BufferSourceNode")) {
      return setPlayState("start", "BufferSourceNode");
    }

    switch(Random.number(10)) {
      case 0:
        // Handle random methods of AudioContext objects.
        nodeName = Random.pick(o.contains(AudioContextNodes));
        try { return JS.methodCall(o.pick(nodeName), eval(nodeName + "Methods")); } catch (e) {}
      case 1:
        // Handle random attributes of AudioContext objects.
        nodeName = Random.pick(o.contains(AudioContextNodes));
        try { return JS.setAttribute(o.pick(nodeName), eval(nodeName + "Attributes")); } catch (e) {}
      case 2:
        // Handle methods of AudioNode object.
        var srcNodeName = Random.pick(o.contains(AudioNodes)),
            dstNodeName = Random.pick(o.contains(AudioNodes));
        if (srcNodeName && dstNodeName && (dstNodeName != "BufferSourceNode" && dstNodeName != "OscillatorNode")) {
          var dstNode = o.pick(dstNodeName);
          var srcNode = o.pick(srcNodeName);
          try {
            var outputChannel = Random.number(eval(srcNode + ".numberOfOutputs")); // todo: no target DOM eval()
            var inputChannel = Random.number(eval(dstNode + ".numberOfInputs"));
          } catch (e) {
            break;
          }
          var AudioNodeMethods = Random.choose([
            [30, {"connect": [dstNode, outputChannel, inputChannel]}],
            [ 2, {"disconnect": [outputChannel]}]
          ]);
          return JS.methodCall(o.pick(srcNodeName), AudioNodeMethods);
        }
        break;
      case 3:
        // Handle attributes of AudioNode object.
        nodeName = Random.pick(o.contains(AudioNodes));
        if (nodeName) {
          var node = Random.choose([
            [20, o.pick(nodeName)],
            [ 5, o.pick("AudioContext") + ".destination"]
          ]);
          return JS.setAttribute(node, AudioNodeAttributes);
        }
        break;
      case 4:
        // Handle AudioListener object.
        nodeName = o.pick("AudioContext") + ".listener";
        return Random.choose([
          [1, function() { return JS.setAttribute(nodeName, AudioListenerAttributes) }],
          [1, function() { return JS.methodCall(nodeName, AudioListenerMethods) }]
        ]);
        break;
      case 5:
        // Handle AudioNodes which have AudioParam objects.
        nodeName = Random.pick(o.contains(AudioParamNodes));
        if (nodeName) {
          var paramNode = o.pick(nodeName);
          switch(nodeName) {
            case "GainNode":
              paramNode += "." + Random.pick(["gain"]);
              break;
            case "DelayNode":
              paramNode += "." + Random.pick(["delayTime"]);
              break;
            case "BufferSourceNode":
              if (Platform.isMozilla) {
                paramNode += "." + Random.pick(["playbackRate"]);
              } else {
                paramNode += "." + Random.pick(["playbackRate", "gain"]);
              }
              break;
            case "DynamicsCompressorNode":
              paramNode += "." + Random.pick(["threshold", "knee", "ratio", "reduction", "attack", "release"]);
              break;
            case "BiquadFilterNode":
              paramNode += "." + Random.pick(["frequency", "detune", "Q", "gain"]);
              break;
            case "OscillatorNode":
              paramNode += "." + Random.pick(["frequency", "detune"]);
              break;
          }
          return Random.choose([
            [1, function() { return JS.setAttribute(paramNode, AudioParamAttributes) }],
            [1, function() { return JS.methodCall(paramNode, AudioParamMethods) }]
          ]);
        }
        break;
      case 7:
        // Handle BufferSource
        if (o.has("BufferSourceNode")) {
          var bufferSource = o.pick("BufferSourceNode");
          return [
            bufferSource + ".buffer = " + makeBuffer(),
            bufferSource + ".connect(" + o.pick("AudioContext") + ".destination);"
          ];
        }
        break;
      case 8:
        // Handle Audio|MediaElement
        if (o.has("AudioElement")) {
          return Random.choose([
            [1, function() { return JS.setAttribute(o.pick("AudioElement"), AudioElementAttributes)}],
            [1, function() { return JS.methodCall(o.pick("AudioElement"), AudioElementMethods) }]
          ]);
        }
        break;
      case 9:
        // Handle AudioBuffer
        if (o.has("BufferSourceNode")) {
         return Random.choose([
            [1, function() { return JS.setAttribute(o.pick("BufferSourceNode") + ".buffer", AudioBufferAttributes) }],
            [1, function() { return JS.methodCall(o.pick("BufferSourceNode") + ".buffer", AudioBufferMethods) }]
          ]);
        }
        break;
      /*
      case 10:
        // Neuter buffer
        var w = new Worker("neuter.js");
        var d = buffer.getChannelData(0).buffer;
        w.postMessage(d, [d]);
        gc();
        // neuter.js
        onmessage = function (event) { postMessage("Pong"); };
       */
    }

    return [];
  }


  /*
  ** De-initialization.
  ** Commands which shall be called at the end of a testcase.
  */
  function onFinish()
  {
    var cmd = [];

    if (Random.chance(64)) {
      var audioBuffer = makeFloat32Array() + ".buffer";
      var params = [audioBuffer, "" + Function(['decodedBuffer'], ''), "" + Function([''], '')];
      cmd.push(o.pick("AudioContext") + ".decodeAudioData" + JS.methodHead(params));
    }

    if (isOfflineContext && Random.chance(4)) {
      cmd.push(o.pick("AudioContext") + ".startRendering();");
    }

    if (o.has("BufferSourceNode")) {
      cmd = cmd.concat(setPlayState("start", "BufferSourceNode"));
    }

    return cmd;
  }


  /*
  ** Utility methods.
  */
  function makeAudioBuffer() {
    var channelCount = Random.pick(makeChannelCount),
        sampleRate = Random.pick([makeSampleRate, o.pick("AudioContext")+".sampleRate"]),
        bufferLength = Random.pick(makeBufferLength),
        bufferData = Random.pick([makeBufferValues]),
        params = [channelCount, bufferLength, sampleRate],
        src;

    src  = "var buffer = " + o.pick("AudioContext") + ".createBuffer" + JS.methodHead(params) + ";";
    src += "for(var c=0;c<" + channelCount + ";c++) {";
    src += "var data = buffer.getChannelData(c);";
    src += "for(var i=0;i<" + bufferLength + ";i++) {";
    src += "data[i] = " + makeMathExpr(["i", bufferData, bufferLength]);
    src += "}}return buffer;";

    return "" + new Function(src) + "()";
  }

  function makeFloat32Array(length) {
    var bufferData = Random.pick([makeBufferValues]),
        bufferLength = length || Random.pick(makeBufferLength),
        params = [bufferLength],
        src;

    src  = "var buffer=new Float32Array" + JS.methodHead(params) + ";";
    src += "for(var i=0;i<" + bufferLength + ";i++){";
    src += "buffer[i]=" + makeMathExpr(["i", bufferData, bufferLength]);
    src += "}return buffer;";

    return "" + new Function(src) + "()";
  }

  function makeUint8Array(length) {
    var bufferData = Random.pick([makeBufferValues]),
        bufferLength = length || Random.pick(makeBufferLength),
        params = [bufferLength],
        src;

    src  = "var buffer=new Uint8Array" + JS.methodHead(params) + ";";
    src += "for(var i=0;i<" + bufferLength + ";i++) {";
    src += "buffer[i]=Math.round(i " + Random.pick(Make.arithmeticOperator) + bufferData + ");";
    src += "}return buffer;";

    return "" + new Function(src) + "()";
  }

  function createWaveTable() {
    var imag = [], real = [], i, table = {};

    for (i=0; i<Random.pick(makeBufferLength); i++) { imag.push(Random.pick(makeBufferValues)); }
    for (i=0; i<Random.pick(makeBufferLength); i++) { real.push(Random.pick(makeBufferValues)); }

    switch (Random.number(32)) {
      case 0:
        table.imag = imag; break;
      case 1:
        table.real = real; break;
      case 2:
        table.fooo = imag; break;
      default:
        table.imag = imag;
        table.real = real;
    }

    return Utils.quote(table);
  }

  function makeMathExpr(withValues) {
    return Random.pick([
      //function() { return Random.pick([withValues]) },
      function() { return "Math.sin(" + Random.pick([withValues]) + ")" },
      function() { return Random.pick([withValues]) + " " + Random.pick(Make.arithmeticOperator) + " " + Random.pick([withValues]) },
      function() { return "Math." + Random.pick(["sin", "tan", "cos", "ceil"]) + "(" + makeMathExpr(withValues) +")"; },
      function() { return  "(" + makeMathExpr(withValues) + ")" + Random.pick(Make.arithmeticOperator) + "(" + makeMathExpr(withValues) + ")" }
    ]);
  }

  function setPlayState(wishState, nodeName) {
    var cmd = [], nodes = o.show(nodeName), i;

    if (!hasStarted && !hasEnded && wishState == "start") {
      for (i = 0; i < nodes.length; i++) {
        cmd.push(JS.methodCall(nodes[i].name, Random.choose([
          [10, {"start": [[0, Make.float]] }],
          [ 2, {"start": [[0, Make.float], [Make.float]] }],
          [ 2, {"start": [[0, Make.float], [Make.float], [Make.float]] }]
        ])));
      }
      hasStarted = true;
      return cmd;
    }

    if (hasStarted && !hasEnded && wishState == "stop") {
      for (i = 0; i < nodes.length; i++) {
        cmd.push(JS.methodCall(nodes[i].name, Random.choose([
          [10, {"stop": [[Make.float]] }],
          [ 2, {"stop": [[Make.float], [Make.float]] }],
          [ 2, {"stop": [[Make.float], [Make.float], [Make.float]] }]
        ])));
      }
      hasEnded = true;
      return cmd;
    }

    return cmd;
  }


  /*
  ** Methods and attributes of AudioContext members.
  */
  var AudioNodeAttributes = {
    "channelCount": [makeChannelCount],
    "channelCountMode": ["'max'", "'clamped-max'", "'explicit'"],
    "channelInterpretation": ["'speakers'", "'discrete'"]
  };

  var PannerNodeMethods = {
    "setOrientation": [[makeDouble, 1.0], [makeDouble, 0.0], [makeDouble, 0.0]],
    "setVelocity": [makeDouble, makeDouble, makeDouble],
    "setPosition": [makeDouble, makeDouble, makeDouble]
  };

  var PannerNodeAttributes = {
    "panningModel": ["'equalpower'", "'HRTF'", "'soundfield'"],
    "distanceModel": ["'linear'", "'inverse'", "'exponential'"],
    "refDistance": [makeDouble, 1.0],
    "maxDistance": [makeDouble, 100000.0],
    "rolloffFactor": [makeDouble, 1.0],
    "coneInnerAngle": [makeDouble, 360.0],
    "coneOuterAngle": [makeDouble, 360.0],
    "coneOuterGain": [makeDouble, 0.0]
  };

  var ScriptProcessorNodeAttributes = {
  };

  var ConvolverNodeAttributes = {
    "buffer": [makeBuffer],
    "normalize": ['true', 'false']
  };

  var BufferSourceNodeAttributes = {
    "buffer": [makeBuffer],
    "loop": ['true', 'false'],
    "loopStart": [makeDouble],
    "loopEnd": [makeDouble]
  };

  var AnalyserNodeAttributes = {
    "fftSize": [function() { return Random.choose([
        [20, Math.pow(2, Random.range(5, 11))],
        [ 5, makeNumber]
      ]);
    }],
    "minDecibels": [makeDouble],
    "maxDecibels": [makeDouble],
    "smoothingTimeConstant": [0, 1, makeDouble]
  };

  var AnalyserNodeMethods = {
    'getFloatFrequencyData': [makeFloat32Array],
    'getByteFrequencyData': [makeUint8Array],
    'getByteTimeDomainData': [makeUint8Array]
  };

  var BiquadFilterNodeMethods = {
    "getFrequencyResponse": [makeFloat32Array, makeFloat32Array, makeFloat32Array]
  };

  var BiquadFilterNodeAttributes = {
    "type": ["'lowpass'", "'highpass'", "'bandpass'", "'lowshelf'", "'highshelf'", "'peaking'", "'notch'", "'allpass'"]
  };

  var WaveShaperNodeAttributes = {
    "curve": [makeFloat32Array],
    "oversample": ["'none'", "'2x'", "'4x'"]
  };

  var OscillatorNodeAttributes = {
    "type": ["'sine'", "'square'", "'sawtooth'", "'triangle'", "'custom'"]
  };

  var OscillatorNodeMethods = {
    "start": [makeDouble],
    "stop": [makeDouble],
    "setPeriodicWave": [makeWaveTable]
  };

  var AudioListenerAttributes = {
    "dopplerFactor": [1.0, makeDouble],
    "speedOfSound": [343.3, makeDouble]
  };

  var AudioListenerMethods = {
    "setPosition": [makeDouble, makeDouble, makeDouble],
    "setOrientation": [makeDouble, makeDouble, makeDouble, makeDouble, makeDouble, makeDouble],
    "setVelocity": [makeDouble, makeDouble, makeDouble]
  };

  var AudioParamAttributes = {
    "value": [makeFloat]
  };

  var AudioParamMethods = {
    "setValueAtTime": [makeFloat, makeDouble],
    "linearRampToValueAtTime": [makeFloat, makeDouble],
    "exponentialRampToValueAtTime": [makeFloat, makeDouble],
    "setTargetAtTime": [makeFloat, makeDouble, makeDouble],
    "setValueCurveAtTime": [makeFloat32Array, makeDouble, makeDouble],
    "cancelScheduledValues": [makeDouble]
  };

  var AudioElementAttributes = {
    "defaultMuted": [Make.bool],
    "muted": [Make.bool],
    "volume": [makeFloat],
    "controls": [Make.bool],
    "loop": [Make.bool],
    "autoplay": [Make.bool],
    "playbackRate": [Make.float],
    "defaultPlaybackRate": [makeFloat],
    "currentTime": [Make.float],
    "preload": ['"auto"', '"metadata"', '"none"']
  };
  if (Platform.isMozilla) {
    Utils.mergeHash(AudioElementAttributes, {
      "mozFrameBufferLength": [makeNumber],
      "mozAudioChannelType": ['"normal"', '"content"', '"notification"', '"alarm"', '"telephony"', '"ringer"', '"publicnotification"'],
      "mozPreservesPitch": [Make.bool]
    });
  }

  var AudioElementMethods = {
    "pause": [],
    "load": []
  };
  if (Platform.isMozilla) {
    Utils.mergeHash(AudioElementMethods, {
      "mozCurrentSampleOffset": [],
      "mozWriteAudio": [makeFloat32Array],
      "mozSetup": [makeChannelCount, makeSampleRate],
      "mozGetMetadata": []
    });
  }

  var AudioBufferAttributes = {
  };
  if (Platform.isChrome) {
    Utils.mergeHash(AudioBufferAttributes, {
      "gain": [1.0, makeNumber]
    });
  }

  var AudioBufferMethods = {
    "copyFromChannel": [makeFloat32Array, makeChannelCount, makeNumber, makeNumber],
    "copyToChannel": [makeFloat32Array, makeChannelCount, makeNumber, makeNumber]
  };

  var Events = {
    "BufferSourceNode": ["ended"],
    "ScriptProcessorNode": ["audioprocess"]
  };

  return {
    onInit: onInit,
    makeCommand: makeCommand,
    onFinish: onFinish,
    Events: Events
  };
})();
