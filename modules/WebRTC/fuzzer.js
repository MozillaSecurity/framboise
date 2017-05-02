/*
WebRTC JSEP Reference

Specification
  https://w3c.github.io/webrtc-pc/
  https://tools.ietf.org/html/draft-ietf-rtcweb-jsep
  https://www.w3.org/TR/mediacapture-streams/

Mochitests
  ./mach mochitest-plain dom/media/tests

Implementation
  Bugzilla: http://mzl.la/13AEjJo

WebIDLs
  dom/webidl/MediaStreamTrack.webidl

  dom/webidl/RTCPeerConnection.webidl
  dom/webidl/RTCIdentityAssertion.webidl
  dom/webidl/RTCCertificate.webidl
  dom/webidl/RTCRtpReceiver.webidl
  dom/webidl/RTCDataChannelEvent.webidl
  dom/webidl/RTCPeerConnectionIceEvent.webidl
  dom/webidl/RTCIceCandidate.webidl
  dom/webidl/RTCSessionDescription.webidl
  dom/webidl/RTCTrackEvent.webidl
  dom/webidl/RTCConfiguration.webidl
  dom/webidl/RTCPeerConnectionStatic.webidl
  dom/webidl/RTCRtpSender.webidl
  dom/webidl/RTCIdentityProvider.webidl
  dom/webidl/RTCStatsReport.webidl

  dom/webidl/DataChannel.webidl
  dom/webidl/DataErrorEvent.webidl
  dom/webidl/DataContainerEvent.webidl
  dom/webidl/DataTransfer.webidl

Preferences
  media.peerconnection.enabled
  media.peerconnection.identity.enabled
  media.getusermedia.screensharing.enabled
  media.getusermedia.screensharing.allowed_domains

Example Session
  http://git.io/f-z3uA

Live Session
  https://apprtc.appspot.com
*/

var fuzzerWebRTC = (function() {
  var builtPeerConnectionChain = false;

  function onInit()
  {
    var cmd = [];

    if (!o.has("VideoElement")) {
      cmd.push(o.add("VideoElement") + " = document.createElement('video');");
      cmd.push(JS.addElementToBody(o.pick("VideoElement", false)));
    }

    if (!o.has("PeerConnection")) {
      cmd.push(makePeerConnection());
    }

    if (!o.has("DataChannel")) {
      cmd.push(makeDataChannel());
    }

    return cmd;
  }


  function makeCommand()
  {
    var cmd = [];

    if (!builtPeerConnectionChain) {
      builtPeerConnectionChain = true;
      return makePeerConnectionHandshake();
    }

    return cmd;
  }


  function onFinish()
  {
    var cmd = [];

    return cmd;
  }

  /*
  ** Utility methods.
  */
  function maybeDoSomethingMore(chance) {
    var cmd = [];
    if (Random.chance(chance)) {
      var choice = Random.range(0, 32);
      if (choice == 0 && o.has("PeerConnection")) {
        cmd.push(JS.methodCall(o.pick("PeerConnection"), PeerConnectionMethods));
      }
      if (choice == 1 && o.has("PeerConnection")) {
        cmd.push(JS.methodCall(o.pick("PeerConnection"), DataChannelMethods));
      }
      if (choice == 2 && o.has("VideoElement")) {
        cmd.push(JS.methodCall(o.pick("VideoElement"), MediaElementMethods));
      }
      if (choice == 3 && o.has("VideoElement")) {
        cmd.push(JS.setAttribute(o.pick("VideoElement"), MediaElementAttributes));
      }
      if (choice == 4 && o.has("DataChannel")) {
        cmd.push(JS.methodCall(o.pick("DataChannel"), DataChannelMethods));
      }
      if (choice == 5 && o.has("DataChannel")) {
        cmd.push(JS.setAttribute(o.pick("DataChannel"), DataChannelAttributes));
      }
      if (choice == 6) {
        cmd.push(makeInvalidIceCandidate());
      }
      if (choice == 7) {
        cmd.push(makeInvalidSessionDescription());
      }
      if (choice == 8) {
        cmd.push(makeInvalidPeerConnection());
      }
    }
    return cmd.join("\n");
  }

  function rndNumberValueRange() {
    return {'min': Make.number(), 'max': Make.number()};
  }

  function rndFloatValueRange() {
    return {'min': Make.float(), 'max': Make.float()};
  }

  function makeMediaTrackConstraints() {
    var mandatory = {}, optional = [], constraints = {}, keys;

    keys = Random.some(Utils.shuffle(Utils.getKeysFromHash(MediaTrackConstraints)));
    for (var i=0; i<keys.length; i++) {
      mandatory[keys[i]] = Random.pick(MediaTrackConstraints[keys[i]]);
    }
    constraints["mandatory"] = mandatory;

    keys = Random.some(Utils.shuffle(Utils.getKeysFromHash(MediaTrackConstraints)));
    for (var j=0; j<keys.length; j++) {
      var hash = {}, key = Random.index(keys);
      hash[key] = Random.pick(MediaTrackConstraints[key]);
      optional.push(hash);
    }
    constraints["optional"] = optional;

    return constraints;
  }

  function makeMediaStreamConstraints() {
    var _constraints = makeMediaTrackConstraints(), constraints = {};

    if (Random.chance(16)) {
      constraints["picture"] = true;
    } else {
      constraints = JS.makeConstraint(["video", "audio"], [_constraints]);
    }
    if (Random.chance(16)) {
      constraints["fake"] = true;
    }

    return Utils.quote(constraints);
  }

  function makeMediaConstraints() {
    var constraints = JS.makeConstraint(MandatoryMediaConstraints, [true, false]);
    return Utils.quote(constraints);
  }

  function randomCallback() {
    return Random.pick([
      function() {
        // Prevent "IPeerConnection.initialize" errors.
        return "" + Function(["e"], JS.safely(closePeerConnection()));
      },
      function() {
        return "" + Function(["e"], "");
      },
      function() {
        return "" + Function(["e"], maybeDoSomethingMore(8));
      }
    ]);
  }

  function closePeerConnection() {
    var cmd = [];
    for(var i=0; i<o.count("PeerConnection"); i++) {
      cmd.push(o.show("PeerConnection")[i].name + ".close();");
    }
    return cmd.join("\n");
  }

  function makePeerConnection() {
    var constraints = {};
    if (Platform.isChrome) {
      constraints["mandatory"] = [JS.makeConstraint(["DtlsSrtpKeyAgreement", [true, false]])];
    }
    return o.add("PeerConnection") + " = new " + Platform.PeerConnection + JS.methodHead([Utils.quote(constraints)]) + ";";
  }

  function makeDataChannel() {
    var constraints = {
      protocol:   Random.pick(["text/plain", "text/chat", Make.mimeType]),
      negotiated: Make.bool(),
      id:         Make.number(),
      ordered:    Make.bool()
    };
    // optionally include either |maxRetransmits| or |maxRetransmitTime|
    constraints[Random.pick(['maxRetransmits', 'maxRetransmitTime'])] = Make.number();
    return o.add("DataChannel") + " = " + o.pick("PeerConnection") + ".createDataChannel" + JS.methodHead([Make.quotedString, Utils.quote(constraints)]) + ";";
  }

  function makePeerConnectionHandshake() {
    function step0() {
      var body = [];
      body.push(o.add("Sender") + "=" + o.pick("PeerConnection") + ".addTrack" + JS.methodHead(["stream.getAudioTracks()[0]", "stream"]) + ";");
      body.push(o.add("Sender") + "=" + o.pick("PeerConnection") + ".addTrack" + JS.methodHead(["stream.getVideoTracks()[0]", "stream"]) + ";");
      body.push(o.pick("PeerConnection") + ".addStream" + JS.methodHead(["stream", makeMediaConstraints]) + ";");
      o.add("LocalMediaStream", "stream");
      if (o.has("VideoElement")) {
        body.push(o.pick("VideoElement") + ".mozSrcObject = stream;");
        body.push(o.pick("VideoElement") + ".play();");
      }
      body.push(maybeDoSomethingMore(8));
      body.push(step1());
      return "" + Function(["stream"], body.join("\n"));
    }

    function step1() {
      var params = [step2, randomCallback,makeMediaConstraints];
      return o.pick("PeerConnection") + ".createOffer" + JS.methodHead(params);
    }

    function step2() {
      var params = ["offer", step3, randomCallback];
      var body = [];
      if (Random.chance(8)) {
        body.push("offer = " + makeInvalidSessionDescription());
      }
      body.push(o.pick("PeerConnection") + ".setLocalDescription" + JS.methodHead(params));
      return Function(["offer"], body.join("\n"));
    }

    function step3() {
      var params = ["offer", step4, randomCallback];
      /* XXX: patch SDP, i.e:
      descriptor.sdp = descriptor.sdp.replace(/(a=fmtp:126.*)\r\n/, '$1;max-mbps=3600\r\n');
      descriptor.sdp = descriptor.sdp.replace(/(m=video.*) 120 126 97\r\n/,'$1 126\r\n');
      */
      var body = o.pick("PeerConnection") + ".setRemoteDescription" + JS.methodHead(params);
      return Function([""], body);
    }

    function step4() {
      var params = [step5, randomCallback, makeMediaConstraints, Make.bool];
      var body = o.pick("PeerConnection") + '.createAnswer' + JS.methodHead(params);
      return Function([""], body);
    }

    function step5() {
      var params = ["answer", step6, randomCallback];
      var body = [];
      if (Random.chance(8)) {
        body.push("answer = " + makeInvalidSessionDescription());
      }
      body.push(maybeDoSomethingMore(8));
      body.push(o.pick("PeerConnection") + ".setLocalDescription" + JS.methodHead(params));
      return Function(["answer"], body.join("\n"));
    }

    function step6() {
      var params = ["answer", step7, randomCallback];
      var body = o.pick("PeerConnection") + '.setRemoteDescription' + JS.methodHead(params);
      return Function([''], body);
    }

    function step7() {
      var body = [];
      body.push(maybeDoSomethingMore(8));
      return Function(body.join("\n"));
    }

    var params = [
      makeMediaStreamConstraints,
      step0,
      randomCallback
    ];
    return Platform.GUM + JS.methodHead(params);
  }


  function makeInvalidPeerConnectionParameter() {
    // dictionary RTCIceServer
    function makeServerObject() {
      var server = {};
      var choice = Random.range(0, 2);
      if (choice == 0) {
        server["urls"] = Make.stringFromBlocks([
          Make.PeerConnectionProtocols, Make.goodHostnames, Make.token, Make.string, Make.number
        ]);
      }
      if (choice == 1) {
        server["urls"] = Block([
          Random.pick(["", Random.pick(Make.PeerConnectionProtocols) + ":"]),
          Random.pick(["", Random.pick(["username", Make.string]) + "@"]),
          Random.pick(["", Random.pick([Make.goodHostnames, Make.badHostnames])]),
          Random.pick(["", ":" + Random.pick([Make.number])])
        ]);
      }
      if (choice == 2) {
        server["urls"] = makeInvalidTURN();
      }
      if (Random.chance(6)) {
        server["username"] = ["test", Make.string()];
        server["credential"] = ["test", Make.string()];
        server["credentialType"] = Random.pick(IceCredentialType)
      }
      return server;
    }
    // dictionary RTCConfiguration
    var ice = {};
    ice["iceServers"] = [];
    var max_servers = Make.rangeNumber();
    for (var i = 0; i < max_servers; i++) {
      ice["iceServers"].push(makeServerObject());
    }
    ice["iceTransportPolicy"] = Random.pick(IceTransportPolicy);
    ice["bundlePolicy"] = Random.pick(BundlePolicy);
    ice["peeridentity"] = null;
    ice["certificates"] = []
    return Utils.quote(ice);
  }

  function makeInvalidPeerConnection() {
    return o.add("PeerConnection") + " = new " + Platform.PeerConnection +
      JS.methodHead([makeInvalidPeerConnectionParameter]) + ";";
  }

  function makeInvalidIceCandidateParameter() {
    var candidate = Block([
      Random.pick([0, 1, Make.number]), " ",
      Random.pick([0, 1, Make.number]), " ",
      Random.pick(["UDP", "TCP", "SCTP"]),
      Random.pick(["", "/" + Random.pick(["DTLS", "DTLS-SRTP"])]), " ",
      Random.pick([Make.number]), " ",
      Random.pick([Make.goodHostnames]), " ",
      Random.pick([56187,  Make.number]), " ", "type", " ",
      Random.pick([
        "host",
        Block([
          Random.pick(["srflx","prflx", "relay"]),
          " ",
          Random.pick(["raddr"]),
          " ",
          Random.pick([Make.goodHostnames]),
          " ",
          Random.pick(["rport"]),
          Random.use([Block([" ", Make.number])])
        ])
      ])
    ]);
    var sdpMid = Block([
      Random.pick(["application", "video", "audio"]), " ",
      Make.number, " ",
      Random.pick(['RTP/AVP', 'RTP/SAVPF', 'RTP/SAVP', 'SCTP/DTLS']), " ",
      Make.number
    ]);
    var sdpMLineIndex = Random.pick([0, 1, Make.number]);
    return Utils.quote({"candidate": candidate, "sdpMid": sdpMid, "sdpMLineIndex": sdpMLineIndex});
  }

  function makeInvalidIceCandidate() {
    return o.add("IceCandidate") + " = new " + Platform.IceCandidate +
      JS.methodHead([makeInvalidIceCandidateParameter]) + ";";
  }

  function makeInvalidTURN() {
    // 3.1 - http://tools.ietf.org/html/draft-petithuguenin-behave-turn-uris-03
    return Block([
      // scheme
      Random.pick(Make.PeerConnectionProtocols),
      ":",
      // turn-host
      Random.pick([Make.string, Make.badHostnames, Make.goodHostnames, Make.randomIPv6, Make.randomIPv4]),
      // turn-port
      Random.use([Block([":", Make.number])]),
      Random.use([Block(["/", Make.string])]),
      "?",
      Random.pick(["transport"]),
      "=",
      Random.pick(["udp", "tcp", Make.string])
    ]);
  }

  function makeInvalidSessionDescription() {
    // SessionDescription gets fuzzed separately, we don't do any fancy actions here.
    var params = Utils.quote({
      sdp: Utils.shuffle(Random.pick(Make.SessionDescription).split("\n")).join("\n"),
      type: Random.pick(["offer", "answer"])
    });
    return "new " + Platform.SessionDescription + JS.methodHead([params]) + ";";
  }

  /*
  ** Methods and attributes.
  */
  var MediaTrackConstraints = {
    'width': [Make.number],
    'height': [Make.number],
    'frameRate': [Make.float],
    'facingMode': ['left', 'right', 'environment', 'user'],
    'mediaSource': ['camera', 'screen', 'application', 'window', 'browser', 'microphone', 'audioCapture', 'other'],
    'browserWindow': [Make.number],
    'scrollWithPage': [Make.bool],
    'deviceId': [""],
    'viewportOffsetX': [Make.number],
    'viewportOffsetY': [Make.number],
    'viewportWidth': [Make.number],
    'viewportHeight': [Make.number],
    'echoCancellation': [Make.bool],
    'mozNoiseSuppression': [Make.bool],
    'mozAutoGainControl': [Make.bool],
  };

  var MandatoryMediaConstraints = [
    "offerToReceiveVideo",
    "offerToReceiveAudio",
    "VoiceActivityDetection",
    "iceRestart",
    "mozDontOfferDataChannel",
    "mozBundleOnly"
  ];

  var DataChannelMethods = {
    "close": [],
    "send": [Make.quotedString]
  };

  var DataChannelAttributes = {
    "binaryType": ["'arraybuffer'", "'blob'"]
  };

  var PeerConnectionMethods = {
    "generateCertificate": [function() {
      var choice = Random.range(0, 32), cert = {};
      if (choice == 0) {
        cert = {name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256"}
      } else {
        cert = {name: "ECDSA", namedCurve: "P-256"};
      }
      return  JSON.stringify(cert);
    }],
    "createOffer": [randomCallback, randomCallback],
    "createAnswer": [randomCallback, randomCallback],
    "setLocalDescription": [randomCallback, randomCallback],
    "setRemoteDescription": [randomCallback, randomCallback],
    "updateIce": [makeInvalidPeerConnectionParameter],
    "addIceCandidate": [makeInvalidIceCandidateParameter, randomCallback, randomCallback],
    "getLocalStreams": [],
    "getRemoteStreams": [],
    "getStreamById": ["'foobar'"],
    "addStream": [function () { return o.pick("LocalMediaStream") }],
    "removeStream": [function () { return o.pick("LocalMediaStream") }],
    "removeTrack": [function() { return o.pick("PeerConnection") + ".getSender()[" + Random.range(0, 5) + "]"; }],
    "close": [],
    "getStats": [function() {
        return o.pick("PeerConnection") + ".getLocalStreams()[0].getAudioTracks()[0]"
      },
      randomCallback,
      randomCallback
    ],
    "setIdentityProvider": ['"developer.mozilla.org"', '"default"'],
    "getIdentityAssertion": [],
    "close": [],
    "getConfiguration": [],
    "getSenders": [],
    "getReceivers": []
  };

  var MediaElementAttributes = {
    "autoplay": [Make.bool],
    "controls": [Make.bool],
    "currentTime": [Make.number],
    "defaultMuted": [Make.bool],
    "defaultPlaybackRate": [Make.number],
    "loop": [Make.bool],
    "muted": [Make.bool],
    "playbackRate": [Make.number],
    "preload": [Make.bool],
    "src": [Make.video],
    "startOffsetTime": [Make.number],
    "volume": [Make.bool],
    "poster": [Make.file]
  };
  if (Platform.isMozilla) {
    Utils.mergeHash(MediaElementAttributes, {
      "mozFrameBufferLength": [Make.number],
      "mozSrcObject": [function () { return o.pick("LocalMediaStream") }]
    });
  }

  var MediaElementMethods = {
    "load": [],
    "pause": [],
    "play": [],
    "stop": []
  };
  if (Platform.isMozilla) {
    Utils.mergeHash(MediaElementMethods, {
      "mozGetMetaData": [],
      "mozLoadFrom": [function () { return o.pick("LocalMediaStream") }],
      "mozCaptureStream": [],
      "mozCaptureStreamUntilEnded": []
    });
  }

  var RTCPRtpSender = {
    "setParameters": [function() { o.pick("Sender") + ".getParameters()"}],
    "replaceTrack": []
  };

  /*
  *****************************************************************************
  * Parameters
  */

  var RtxParameters = {
    "ssrc": Make.number
  };

  var FecParameters = {
    "ssrc": Make.number
  };

  var RtpEncodingParameters = {
    "ssrc": Make.number,
    "rtx": JSON.stringify(RtxParameters),
    "fec": JSON.stringify(FecParameters),
    "active": Make.bool,
    "priority": Random.pick(PriorityType),
    "maxBitrate": Make.number,
    "degradationPreference": Random.pick(DegradationPreference),
    "rid": "foobar",
    "scaleResolutionDownBy": [1.0, Make.number]
  };

  var RtpHeaderExtensionParameters = {
    "uri": "",
    "id":"",
    "encrypted": Make.bool
  };

  var RtcpParameters = {
    "cname": "",
    "reducedSize": Make.bool
  };

  var RtpCodecParameters = {
    "payloadType": Make.number,
    "mimeType": Make.mimeType,
    "clockRate": Make.number,
    "channels": [1, Make.number],
    "sdpFmtpLine": ""
  };

  var RtpParameters = {
    "encodings": JSON.stringify(RtpEncodingParameters),
    "headerExtensions": JSON.stringify(RtpHeaderExtensionParameters),
    "rtcp": JSON.stringify(RtcpParameters),
    "codecs": JSON.stringify(RtpCodecParameters)
  };

  /*
  *****************************************************************************
  * Constants
  */

  var LifecycleEvent = [
    "initialized",
    "icegatheringstatechange",
    "iceconnectionstatechange"
  ];

  var DegradationPreference = [
    "maintain-framerate",
    "maintain-resolution",
    "balanced"
  ];

  var PriorityType = [
    "very-low",
    "low",
    "medium",
    "high"
  ];

  var BundlePolicy = [
    "balanced",
    "max-compat",
    "max-bundle"
  ];

  var IceTransportPolicy = [
    "none",
    "relay",
    "all"
  ];

  var IceCredentialType = [
    "password",
    "token"
  ];

  var IceGatheringState = [
    "new",
    "gathering",
    "complete"
  ];

  var RTCIceConnectionState = [
    "new",
    "checking",
    "connected",
    "completed",
    "failed",
    "disconnected",
    "closed"
  ];

  var SignalingState = [
    "stable",
    "have-local-offer",
    "have-remote-offer",
    "have-local-pranswer",
    "have-remote-pranswer",
    "closed"
  ];

  var SdpType = [
    "offer",
    "pranswer",
    "answer",
    "rollback"
  ];

  /*
  *****************************************************************************
  * Events
  */

  var Events = {
    "DataChannel": [
      "open",
      "message",
      "close",
      "error"
    ],
    "PeerConnection": [
      "negotiationneeded",
      "icecandidate",
      "signalingstatechange",
      "removestream",
      "iceconnectionstatechange",
      "datachannel",
      "connection",
      "closedconnection",
      "identityresult",
      "peeridentity"
    ]
  };

  return {
    onInit: onInit,
    makeCommand: makeCommand,
    onFinish: onFinish,
    Events: Events
  };
})();
