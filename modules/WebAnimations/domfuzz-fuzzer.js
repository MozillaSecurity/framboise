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
 *
**/
var fuzzerWebAnimations = (function() {

  function makeCommand()
  {
    var choice, cmd = [];

    if (!Things.hasInstance("Animatable") || Random.chance(50)) {
      let animatable = Things.reserve();
      cmd.push(Things.add("Animatable") + " = document.createElement('div');");
      cmd.push(Things.instance("Animatable") + ".setAttribute('style', 'width:200px;height:200px;background:rgba(0,0,255,0.5);');");
    }

    cmd.push(Things.add("Animation") + " = " + Things.instance("Animatable") + ".animate(" + MakeFrames() + ', ' + MakeKeyframeAnimationOptions() + ");");

    chance = Random.range(0, 5);

    if (choice == 0 && Things.hasInstance("Animatable")) {
      cmd.push(JS.methodCall(Things.instance("Animatable"), AnimatableMethods));
    }

    if (choice == 1 && Things.hasInstance("Animation")) {
      cmd.push(JS.setAttribute(Things.instance("Animation"), AnimationAttributes));
    }

    if (choice == 2 && Things.hasInstance("Animation")) {
      cmd.push(o.pick("Animation") + "." + "play();");
      for (var i = 0; i < Random.number(20); i++) {
        cmd.push(o.pick("Animation") + "." + Random.pick(AnimationMethods) + "();")
      }
    }

    return cmd;
  }


  function MakeKeyframeAnimationOptions() {
    var attrs = Random.some(['duration', 'easing', 'delay', 'iterations', 'direction', 'fill'], items.length),
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

  var AnimationMethods = {
    "pause": [],
    "play": [],
    "cancel": [],
    "finish": [],
    "reverse": []
  };

  var AnimationAttributes = {
    "startTime": Make.number,
    "currentTime": Make.number,
    "playbackRate": Make.number
  };

  var Frames = {
    "transform": function() { return 'scale(' + Make.number() + ')'; },
    "opacity": Make.number,
    "left": function() { return '' + Make.number() + 'px'; },
    "color": ['red', 'green', 'blue'],
    "spacing": [
      'distribute',
      function() { return 'paced(' + Random.choose(['left', 'top', 'transform']) +')'}],
   "composite": ['replace', 'add', 'accumulate']
  };

  var KeyframeAnimationOptions = {
    "duration": Make.number,
    "easing": [
      'ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear',
      function() { return 'cubic-bezier(' + Make.number() + ',' + Make.number() + ',' + Make.number() + ',' + Make.number() + ')'; },
      'step-start', 'step-middle', 'step-end',
      function() { return 'steps(' + Make.number() + Random.choose(['start', 'middle', 'end']) + ')'; }
    ],
    "delay": Make.number,
    "iterations": function() { return Random.pick(['Infinity', Make.number()]); },
    "direction": ['alternate', 'normal', 'reverse', 'alternate-reverse'],
    "fill": ['forwards', 'backwards', 'both', 'none', 'auto'],
  };

  var Events = {
    "Animation": ['finished', 'finish', 'cancel'],
  };

  return {
    makeCommand: makeCommand,
    Events: Events
  };
})();

registerModule("fuzzerWebAnimations", 30);
