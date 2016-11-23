/*
 * Selection API References
 *
 * WebIDL: dom/webidl/Selection.webidl
 * Documentation: https://developer.mozilla.org/en-US/docs/Web/API/Selection
 *
**/

var fuzzerSelection = (function() {
  /*
  ** Initialization
  ** Commands which shall be called at the beginning of a testcase.
  */
  function onInit()
  {
    var cmd = [];

    cmd.push(o.add("Selection") + " = window.getSelection();");
    cmd.push(o.add("Range") + " = " + o.pick("Selection") + ".getRangeAt(0);");

    return cmd;
  }

  /*
  ** Main
  ** Command which shall be called after initialization.
  */
  function makeCommand()
  {
    var cmd = [], choice = Random.range(0, 5);

    cmd.push(JS.methodCall(o.pick("Selection"), SelectionMethods));

    if (choice === 0) {
      cmd.push(JS.setAttribute(o.pick("Selection"), SelectionAttributes));
    }
    if (choice === 5) {
      cmd.push(o.add("Range") + " = " + o.pick("Selection") + ".getRangeAt(" + Make.number() + ");");
    }

    return cmd;
  }

  /*
  ** De-initialization.
  ** Commands which shall be called at the end of a testcase.
  */
  function onFinish()
  {
    var cmd = [];

    return cmd;
  }

  // Common Parameters
  function getNode() {
    return o.pick("Selection") + "." + Random.pick(["anchorNode", "focusNode"]);
  }

  function getOffset() {
    return o.pick("Selection") + "." +  Random.pick(["anchorOffset", "focusOffset"]);
  }

  var alter = function() { return Random.pick(["move", "extend"]); };
  var direction = function() { return Random.pick(["forward", "backward"]); }
  var granularity = function() { return Random.pick([
    "character", "word", "sentence", "line", "paragraph", "lineboundary",
    "sentenceboundary", "paragraphboundary", "documentboundary"]);
  }

  /*
  ** Methods and attributes.
  */
  var SelectionMethods = {
    "collapse": [getNode, [getOffset, Make.number]],
    "collapseToStart": [],
    "collapseToEnd": [],
    "extend": [getNode, [getOffset, Make.number]],
    "selectAllChildren": [getNode],
    "deleteFromDocument": [],
    "getRangeAt": [Make.number],
    "addRange": [function() { return o.pick("Range"); }],
    "removeRange": [function() { return o.pick("Range"); }],
    "removeAllRanges": [],
    "containsNode": [getNode, Make.bool],
    "modify": [alter, direction, granularity],
  };

  var SelectionAttributes = {
    "caretBidiLevel": Make.number
  };

  var Events = {
  };

  return {
    onInit: onInit,
    makeCommand: makeCommand,
    onFinish: onFinish,
    Events: Events
  };
})();
