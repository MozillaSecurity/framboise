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

    // Create dummy object for selected text.
    cmd.push(o.add("HTMLInputElement") + ' = document.createElement("input");');
    cmd.push(o.pick("HTMLInputElement") + '.setAttribute("value", ' + Make.quotedString() + ');');
    cmd.push(JS.addElementToBody(o.pick("HTMLInputElement")));
    cmd.push('document.querySelector("input").select();');

    // Create Selection object.
    cmd.push(o.add("Selection") + " = document.getSelection();");
    cmd.push(o.add("Range") + " = " + o.pick("Selection") + ".getRangeAt(0);");

    return cmd;
  }

  /*
  ** Main
  ** Command which shall be called after initialization.
  */
  function makeCommand()
  {
    var cmd = [], choice = Random.range(0, 8);

    cmd.push(JS.methodCall(o.pick("Selection"), SelectionMethods));

    if (choice === 0) {
      cmd.push(JS.setAttribute(o.pick("Selection"), SelectionAttributes));
    }

    // Pickup new objects.
    if (choice === 4) {
      cmd.push(o.add("Range") + " = " + o.pick("Selection") + ".getRangeAt(" + getRangeNumber() + ");");
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
    return o.pick("Selection") + "." + Random.pick([
      "anchorNode",
      "focusNode"]);
  }

  function getOffset() {
    return o.pick("Selection") + "." + Random.pick([
      "anchorOffset",
      "focusOffset"]);
  }

  function getRangeNumber() {
    return Random.pick([0, Make.number]);
  }

  var alter = function() { return JSON.stringify(Random.pick([
    "move",
    "extend"]));
  };
  var direction = function() { return  JSON.stringify(Random.pick([
    "forward",
    "backward"]));
  };
  var granularity = function() { return  JSON.stringify(Random.pick([
    "character",
    "word",
    "sentence",
    "line",
    "paragraph",
    "lineboundary",
    "sentenceboundary",
    "paragraphboundary",
    "documentboundary"]));
  };

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
    "getRangeAt": [getRangeNumber],
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
