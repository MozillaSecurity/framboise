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
    let cmd = []

    if (!o.has("Animatable")) {
      cmd.push(o.add("Animatable") + " = document.createElement('div');")
      cmd.push(o.pick("Animatable") + ".setAttribute('class', 'box');")
      cmd.push(o.pick("Animatable") + ".setAttribute('id', 'box');")
      cmd.push(o.pick("Animatable") + ".setAttribute('style', 'width:200px;height:200px;background:rgba(0,0,255,0.5);');")
      cmd.push(utils.script.addElementToBody(o.pick("Animatable")))
    }

    return cmd
  }

  /*
  ** Main
  ** Command which shall be called after initialization.
  */
  function makeCommand()
  {
    let cmd = []
    let choice = random.range(0, 5)

    cmd.push(o.add("Animation") + " = " + o.pick("Animatable") + ".animate(" + MakeFrames() + ', ' + MakeKeyframeAnimationOptions() + ");")

    if (choice === 0 && o.has("Animatable")) {
      cmd.push(utils.script.methodCall(o.pick("Animatable"), AnimatableMethods))
    }

    if (choice === 1 && o.has("Animation")) {
      cmd.push(utils.script.setAttribute(o.pick("Animation"), AnimationAttributes))
    }

    return cmd
  }

  /*
  ** De-initialization.
  ** Commands which shall be called at the end of a testcase.
  */
  function onFinish()
  {
    let cmd = []
    let states = ["pause", "play", "cancel", "finish", "reverse"]

    if (!o.has("Animation")) {
      return cmd
    }

    cmd.push(o.pick("Animation") + "." + "play();")

    for (let i = 0; i < random.number(states.length * 4); i++) {
      cmd.push(o.pick("Animation") + "." + random.pick(states) + "();")
    }

    return cmd
  }

  function MakeKeyframeAnimationOptions() {
    let items = ['duration', 'easing', 'delay', 'iterations', 'direction', 'fill']
    let attrs = random.subset(items, items.length)
    let opts = {}

    for (let i = 0; i < attrs.length; i++) {
      opts[attrs[i]] = random.pick(KeyframeAnimationOptions[attrs[i]])
    }

    return utils.common.quote(opts)
  }

  function MakeFrames() {
    let max = random.range(1, 10)
    let frames = []

    for (let i = 0; i < max; i++) {
      let attrs = random.subset(Object.keys(Frames), Object.keys(Frames).length)
      let opts = {}

      for (let j = 0; j < attrs.length; j++) {
        opts[attrs[j]] = random.pick(Frames[attrs[j]])
      }

      //opts["offset"] = random.pick([0, 1]);
      //opts["offset"] = parseFloat(random.range(1,10) / 10).toFixed(2);
      //opts["offset"] = null;

      frames.push(opts)
    }

    return utils.common.quote(frames)
  }

  /*
  ** Methods and attributes.
  */
  let AnimatableMethods = {
    "getAnimations": []
  }

  let AnimationAttributes = {
    "startTime": function() { return make.number.any() },
    "currentTime": function() { return make.number.any() },
    "playbackRate": function() { return make.number.any() }
  }

  let Frames = {
    "transform": function() { return 'scale(' + make.number.any() + ')' },
    "opacity": function() { return make.number.any() },
    "left": function() { return '' + make.number.any() + 'px' },
    "color": ['red', 'green', 'blue'],
    "spacing": [
      'distribute',
      function() { return 'paced(' + random.choose(['left', 'top', 'transform']) +')'}],
    "composite": ['replace', 'add', 'accumulate']
  }

  let KeyframeAnimationOptions = {
    "duration": function() { return make.number.any() },
    "easing": [
      'ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear',
      function() { return 'cubic-bezier(' + make.number.any() + ',' + make.number.any() + ',' + make.number.any() + ',' + make.number.any() + ')' },
      'step-start', 'step-middle', 'step-end',
      function() { return 'steps(' + make.number.any() + random.choose(['start', 'middle', 'end']) + ')' }
    ],
    "delay": function() { return make.number.any() },
    "iterations": function() { return random.pick(['Infinity', make.number.any()]) },
    "direction": ['alternate', 'normal', 'reverse', 'alternate-reverse'],
    "fill": ['forwards', 'backwards', 'both', 'none', 'auto']
  }

  let Events = {
    "Animation": ['finished', 'finish', 'cancel']
  }

  return {
    onInit: onInit,
    makeCommand: makeCommand,
    onFinish: onFinish,
    Events: Events
  }
})()
