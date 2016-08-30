/*
 * WebAnimations References
 *
 * Implementation: https://bugzilla.mozilla.org/show_bug.cgi?id=875219
 * WebIDL:
    dom/webidl/Animatable.webidl
    dom/webidl/Animation.webidl
    dom/webidl/AnimationEffectReadOnly.webidl
    dom/webidl/AnimationEffectAnimationOptions.webidl
    dom/webidl/AnimationEffectTimingReadOnly.webidl
    dom/webidl/AnimationEvent.webidl
    dom/webidl/AnimationPlaybackEvent.webidl
    dom/webidl/AnimationTimeline.webidl
 * Mochitests: dom/animation/test/css-animations
 * Specification: https://w3c.github.io/web-animations/
 * Run: ./framboise.py -fuzzer 1:WebAnimations -setup inbound64-release -debug -with-set-timeout -with-set-interval
 *
**/
var fuzzerWebAnimations = (function() {
  /*
  ** Initialization
  ** Commands which shall be called at the beginning of a testcase.
  */
  function onInit()
  {
    var cmd = [];

    if (!o.has("Animatable")) {
      cmd.push(o.add("Animatable") + " = document.createElement('div');");
      cmd.push(o.pick("Animatable") + ".setAttribute('class', 'box');");
      cmd.push(o.pick("Animatable") + ".setAttribute('id', 'box');");
      cmd.push(o.pick("Animatable") + ".setAttribute('style', 'width:200px;height:200px;background:rgba(0,0,255,0.5);');");
      cmd.push(JS.addElementToBody(o.pick("Animatable")));
    }

    return cmd;
  }

  /*
  ** Main
  ** Command which shall be called after initialization.
  */
  function makeCommand()
  {
    var choice = Random.range(0, 5), cmd = [];

    cmd.push(o.add("Animation") + " = " + o.pick("Animatable") + ".animate(" + MakeFrames() + ', ' + MakeKeyframeAnimationOptions() + ");");

    if (choice == 0 && o.has("Animatable")) {
      cmd.push(JS.methodCall(o.pick("Animatable"), AnimatableMethods));
    }

    if (choice == 1 && o.has("Animation")) {
      cmd.push(JS.setAttribute(o.pick("Animation"), AnimationAttributes));
    }

    return cmd;
  }

  /*
  ** De-initialization.
  ** Commands which shall be called at the end of a testcase.
  */
  function onFinish()
  {
    var cmd = [],
        states = ["pause", "play", "cancel", "finish", "reverse"];

    if (!o.has("Animation")) {
      return cmd;
    }

    cmd.push(o.pick("Animation") + "." + "play();")

    for (var i = 0; i < Random.number(states.length * 4); i++) {
      cmd.push(o.pick("Animation") + "." + Random.pick(states) + "();")
    }

    return cmd;
  }

  function MakeKeyframeAnimationOptions() {
    var items = ['duration', 'easing', 'delay', 'iterations', 'direction', 'fill'],
        attrs = Random.some(items, items.length),
        o = {};

    for (var i = 0; i < attrs.length; i++) {
      o[attrs[i]] = Random.pick(KeyframeAnimationOptions[attrs[i]]);
    }

    return JSON.stringify(o);
  }

  function MakeFrames() {
    var max = Random.range(1, 10), frames = [];

    for (var i = 0; i < max; i++) {
      var attrs = Random.some(Object.keys(Frames), Object.keys(Frames).length),
          o = {};

      for (var j = 0; j < attrs.length; j++) {
        o[attrs[j]] = Random.pick(Frames[attrs[j]]);
      }

      //o["offset"] = Random.pick([0, 1]);
      //o["offset"] = parseFloat(Random.range(1,10) / 10).toFixed(2);
      //o["offset"] = null;

      frames.push(o);
    }

    return JSON.stringify(frames);
  }

  /*
  ** Methods and attributes.
  */
  var AnimatableMethods = {
    "getAnimations": []
  };

  var AnimationAttributes = {
    "startTime": function() { return Make.number(); },
    "currentTime": function() { return Make.number(); },
    "playbackRate": function() { return Make.number(); }
  };

  var Frames = {
    "transform": function() { return 'scale(' + Make.number() + ')'; },
    "opacity": function() { return Make.number() },
    "left": function() { return '' + Make.number() + 'px'; },
    "color": ['red', 'green', 'blue'],
    "spacing": [
      'distribute',
      function() { return 'paced(' + Random.choose(['left', 'top', 'transform']) +')'}],
   "composite": ['replace', 'add', 'accumulate']
  };

  var KeyframeAnimationOptions = {
    "duration": function() { return Make.number(); },
    "easing": [
      'ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear',
      function() { return 'cubic-bezier(' + Make.number() + ',' + Make.number() + ',' + Make.number() + ',' + Make.number() + ')'; },
      'step-start', 'step-middle', 'step-end',
      function() { return 'steps(' + Make.number() + Random.choose(['start', 'middle', 'end']) + ')'; }
    ],
    "delay": function() { return Make.number(); },
    "iterations": function() { return Random.pick(['Infinity', Make.number()]); },
    "direction": ['alternate', 'normal', 'reverse', 'alternate-reverse'],
    "fill": ['forwards', 'backwards', 'both', 'none', 'auto'],
  };

  var Events = {
    "Animation": ['finished', 'finish', 'cancel'],
  };

  return {
    onInit: onInit,
    makeCommand: makeCommand,
    onFinish: onFinish,
    Events: Events
  };
})();
