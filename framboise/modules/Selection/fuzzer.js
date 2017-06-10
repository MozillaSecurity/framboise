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
    let cmd = []

    // Create dummy object for selected text.
    cmd.push(o.add("HTMLInputElement") + ' = document.createElement("input");')
    cmd.push(o.pick("HTMLInputElement") + '.setAttribute("value", ' + make.text.quotedString() + ');')
    cmd.push(utils.script.addElementToBody(o.pick("HTMLInputElement")))
    cmd.push('document.querySelector("input").select();')

    // Create Selection object.
    cmd.push(o.add("Selection") + " = document.getSelection();")
    cmd.push(o.add("Range") + " = " + o.pick("Selection") + ".getRangeAt(0);")

    return cmd
  }

  /*
  ** Main
  ** Command which shall be called after initialization.
  */
  function makeCommand()
  {
    let cmd = [], choice = random.range(0, 8)

    cmd.push(utils.script.methodCall(o.pick("Selection"), SelectionMethods))

    if (choice === 0) {
      cmd.push(utils.script.setAttribute(o.pick("Selection"), SelectionAttributes))
    }

    if (choice === 4) {
      cmd.push(o.add("Range") + " = " + o.pick("Selection") + ".getRangeAt(" + getRangeNumber() + ");")
    }

    return cmd
  }

  /*
  ** De-initialization.
  ** Commands which shall be called at the end of a testcase.
  */
  function onFinish()
  {
    return []
  }

  // Common Parameters
  function getNode() {
    return o.pick("Selection") + "." + random.pick([
      "anchorNode",
      "focusNode"
    ])
  }

  function getOffset() {
    return o.pick("Selection") + "." + random.pick([
      "anchorOffset",
      "focusOffset"
    ]);
  }

  function getRangeNumber() {
    return random.pick([0, make.number.any]);
  }

  let alter = function() {
    return utils.common.quote(random.pick([
      "move",
      "extend"
    ]))
  }
  let direction = function() {
    return utils.common.quote(random.pick([
      "forward",
      "backward"
    ]))
  }
  let granularity = function() {
    return utils.common.quote(random.pick([
      "character",
      "word",
      "sentence",
      "line",
      "paragraph",
      "lineboundary",
      "sentenceboundary",
      "paragraphboundary",
      "documentboundary"
    ]))
  }

  /*
  ** Methods and attributes.
  */
  let SelectionMethods = {
    "collapse": [getNode, [getOffset, make.number.any]],
    "collapseToStart": [],
    "collapseToEnd": [],
    "extend": [getNode, [getOffset, make.number.any]],
    "selectAllChildren": [getNode],
    "deleteFromDocument": [],
    "getRangeAt": [getRangeNumber],
    "addRange": [function() { return o.pick("Range") }],
    "removeRange": [function() { return o.pick("Range") }],
    "removeAllRanges": [],
    "containsNode": [getNode, make.number.bool],
    "modify": [alter, direction, granularity]
  }

  let SelectionAttributes = {
    "caretBidiLevel": make.number.any
  }

  let Events = {}

  return {
    onInit: onInit,
    makeCommand: makeCommand,
    onFinish: onFinish,
    Events: Events
  }
})()
