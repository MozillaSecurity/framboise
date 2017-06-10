/*
 * Canvas2D References
 *
 * Specification: http://www.w3.org/html/wg/drafts/2dcontext/html5_canvas/
 * Firefox WebIDL: dom/webidl/CanvasRenderingContext2D.webidl
 * Blink WebIDL: https://github.com/mirrors/blink/tree/master/Source/core/html/canvas
 * Mochitests: content/canvas/test/
 *
**/
var fuzzerCanvas2D = (function() {
  /*
  ** Initialization
  ** Commands which shall be called at the beginning of a testcase.
  */
  function onInit()
  {
    let cmd = []
    let params = []

    if (!o.has("CanvasElement")) {
      cmd.push(o.add("CanvasElement") + " = document.createElement('canvas');")
      cmd.push(utils.script.addElementToBody(o.pick("CanvasElement")))
    }

    if (!o.has("Canvas2D")) {
      params = ["'2d'"]
      if (random.chance(4)) {
        params.push(utils.common.quote(utils.script.makeConstraint(["alpha", "willReadFrequently"],[true, false])))
      }
      cmd.push(o.add("Canvas2D") + " = " + o.pick("CanvasElement") + ".getContext" + utils.script.methodHead(params) + ";")
    }

    if (!o.has("ImageElement")) {
      cmd.push(o.add("ImageElement") + " = document.createElement('img');")
      cmd.push(o.pick("ImageElement") + ".src = " + make.files.image() + ";")
    }

    if (!o.has("VideoElement") && random.chance(8)) {
      cmd.push(o.add("VideoElement") + " = document.createElement('video');")
      cmd.push(o.pick("VideoElement") + ".src = " + make.files.video() + ";")
    }

    if (!o.has("Path2D") && random.chance(4)) {
        cmd.push(o.add("Path2D") + " = " + _Path2D())
    }

    return cmd
  }

  /*
  ** Main
  ** Command which shall be called after initialization.
  */
  function makeCommand()
  {
    if (o.has("Canvas2D") && random.chance(8)) {
      return utils.script.setAttribute(o.pick("Canvas2D"), Canvas2DAttributes)
    }

    if (random.chance(4)) {
      return _DrawImage()
    }

    if (!o.has("ImageData") || random.chance(32)) {
      return _ImageData()
    }

    if (random.chance(16) && o.has("ImageData")) {
      return _putImageData()
    }

    if (!o.has("CanvasGradient") || random.chance(32)) {
      return _CanvasGradient()
    }

    if (!o.has("CanvasPattern") && random.chance(32)) {
      return _CanvasPattern()
    }

    if (o.has("CanvasElement") && random.chance(16)) {
      return utils.script.setAttribute(o.pick("CanvasElement"), Canvas2DElementAttributes)
    }

    if (o.has("CanvasGradient") && random.chance(16)) {
      return utils.script.methodCall(o.pick("CanvasGradient"), CanvasGradientMethods)
    }

    if (!o.has("HitRegion") || random.chance(4)) {
        return o.add("HitRegion") + " = " + _HitRegionOptions()
    }

    return utils.script.methodCall(o.pick("Canvas2D"), Canvas2DMethods)
  }

  /*
  ** De-initialization.
  ** Commands which shall be called at the end of a testcase.
  */
  function onFinish()
  {
    let choice = random.number(0, 4)

    if (choice === 0) {
      return o.pick("CanvasElement") + ".toDataURL" + utils.script.methodHead([utils.common.quote(make.mime.any())])
    }

    if (choice === 1 && utils.platform.isMozilla) {
      let args = ["function() {}", utils.common.quote(make.mimeType()), make.number.any]
      return o.pick("CanvasElement") + ".toBlob" + utils.script.methodHead(args)
    }

    if (choice === 2 && utils.platform.isMozilla) {
      let args = [utils.common.quote(make.image())]
      return o.pick("CanvasElement") + ".mozGetAsFile" + utils.script.methodHead(args)
    }
  }

  /*
  ** Constructors.
  */
  function _CanvasGradient() {
    // Firefox defines an overloaded function with 4 parameters but throws an error?
    return o.add("CanvasGradient") + " = " + o.pick("Canvas2D") + ".createRadialGradient" + utils.script.methodHead(
      [make.number.any, make.number.any, make.number.any, make.number.any, make.number.any, make.number.any])
  }


  function _CanvasPattern() {
    let params = [o.pick("CanvasElement"), ["'repeat'", "'repeat-x'", "'repeat-y'", "'no-repeat'"]]
    return o.add("CanvasPattern") + " = " + o.pick("Canvas2D") + ".createPattern" + utils.script.methodHead(params)
  }


  function _ImageData() {
    let params
    let choice = random.number(6)

    if (choice === 0) {
      params = [make.number.any, make.number.any, make.number.any, make.number.any]
      return o.add("ImageData")  + " = " + o.pick("Canvas2D") + ".getImageData" + utils.script.methodHead(params)
    }

    if (choice === 1 && o.has("ImageData")) {
      params = [o.pick("ImageData")]
      return o.add("ImageData") + " = " + o.pick("Canvas2D") + ".createImageData" + utils.script.methodHead(params)
    }

    params = [make.number.any, make.number.any]
    return o.add("ImageData") + " = " + o.pick("Canvas2D") + ".createImageData" + utils.script.methodHead(params)
  }


  function _DrawImage() {
    let params
    let elementName = o.pick(random.pick(o.contains(["CanvasElement", "ImageElement", "VideoElement"])))

    if (utils.platform.isChrome && random.chance(4)) {
      params = random.choose([
        [1, [elementName].concat(random.some([make.number.any, make.number.any, make.number.any, make.number.any, make.number.any, make.number.any, make.number.any, make.number.any]))]
      ], true)
      return o.pick("Canvas2D") + ".drawImageFromRect" + utils.script.methodHead(params)
    }

    params = random.choose([
      [1, [elementName, make.number.any(), make.number.any()]],
      [1, [elementName, make.number.any(), make.number.any(), make.number.any(), make.number.any()]],
      [1, [elementName, make.number.any(), make.number.any(), make.number.any(), make.number.any(), make.number.any(), make.number.any(), make.number.any(), make.number.any()]]
      ], true)

    return o.pick("Canvas2D") + ".drawImage" + utils.script.methodHead(params)
  }

  function _putImageData() {
    let params

    if (utils.platform.isChrome && random.chance(4)) {
      params = random.choose([
        [1, [o.pick("ImageData"), make.number.any(), make.number.any()]],
        [1, [o.pick("ImageData"), make.number.any(), make.number.any(), make.number.any(), make.number.any(), make.number.any(), make.number.any()]]
      ], true)
      return o.pick("Canvas2D") + ".webkitPutImageDataHD" + utils.script.methodHead(params)
    }

    params = random.choose([
      [1, [o.pick("ImageData"), make.number.any(), make.number.any()]],
      [1, [o.pick("ImageData"), make.number.any(), make.number.any(), make.number.any(), make.number.any(), make.number.any(), make.number.any()]]
    ], true)

    return o.pick("Canvas2D") + ".putImageData" + utils.script.methodHead(params)
  }

  function make_path_data() {
      // Todo: http://www.w3.org/TR/SVGTiny12/paths.html#PathDataBNF
      return "M100,0L200,0L200,100L100,100z"
  }

  function _Path2D() {
      return "new Path2D('" + make_path_data() + "')"
  }

  function _HitRegionOptions() {
    let opts = {}
    opts["id"] = "region" + o.count("HitRegion")
    opts["control"] = random.pick([null])
    return utils.common.quote(opts)
  }

  /*
  ** Methods and attributes.
  */
  let Canvas2DElementAttributes = {
    "width": [make.number.any],
    "height": [make.number.any]
  }
  if (utils.platform.isMozilla) {
    utils.common.mergeHash(Canvas2DElementAttributes, {
      "mozOpaque": [make.number.bool]
    })
  }

  let CanvasWindingRule = ["'nonzero'", "'evenodd'"]

  let Canvas2DAttributes = {
    "globalAlpha": [make.number.any],
    "globalCompositeOperation": ["'source-atop'", "'source-in'", "'source-out'", "'source-over'", "'destination-atop'",
      "'destination-in'", "'destination-out'", "'destination-over'", "'lighter'", "'copy'", "'exclusion'"],
    "strokeStyle": [function() { return utils.common.quote(make.colors.any) }],
    "fillStyle": [function() { return utils.common.quote(make.colors.any) }],
    "shadowOffsetX": [make.number.any],
    "shadowOffsetY": [make.number.any],
    "shadowBlur": [make.number.any],
    "shadowColor": [function() { return utils.common.quote(make.colors.any) }],
    "lineWidth": [1, make.number.any],
    "lineCap": ["'butt'", "'round'", "'square'"],
    "lineJoin": ["'round'", "'bevel'", "'miter'"],
    "miterLimit": [10, make.number.any],
    "font": [make.font.font],
    "textAlign": ["'start'", "'end'", "'left'", "'right'", "'center'"],
    "textBaseline": ["'top'", "'hanging'", "'middle'", "'alphabetic'", "'ideographic'", "'bottom'"]
  }
  if (utils.platform.isMozilla) {
    utils.common.mergeHash(Canvas2DAttributes, {
      "mozImageSmoothingEnabled": [make.number.bool],
      "mozDashOffset": [make.number.any],
      "mozDash": [function() { // Bug: 899517
        return utils.common.quote(make.arrays.filledArray(function() { return random.pick([0,1]) }, random.range(0, 32)))}
      ],
      "mozFillRule": [CanvasWindingRule],
      "mozCurrentTransform": [function() {
        return utils.common.quote(make.arrays.filledArray(function() { return random.pick([make.number.any]) }, 6)) }
      ],
      "mozCurrentTransformInverse": [function() {
        return utils.common.quote(make.arrays.filledArray(function() { return random.pick([make.number.any]) }, 6)) }
      ]
    })
  }
  if (utils.platform.isChrome) {
    utils.common.mergeHash(Canvas2DAttributes, {
      "webkitImageSmoothingEnabled": [make.number.bool],
      "lineDashOffset": [make.number.any]
    })
  }

  let Canvas2DMethods = {
    "save": [],
    "restore": [],
    "scale": [make.number.any, make.number.any],
    "rotate": [make.number.any],
    "translate": [make.number.any, make.number.any],
    "transform": [make.number.any, make.number.any, make.number.any, make.number.any, make.number.any, make.number.any],
    "setTransform": [make.number.any, make.number.any, make.number.any, make.number.any, make.number.any, make.number.any],
    "clearRect": [make.number.any, make.number.any, make.number.any, make.number.any],
    "fillRect": [make.number.any, make.number.any, make.number.any, make.number.any],
    "strokeRect": [make.number.any, make.number.any, make.number.any, make.number.any], // Bug: 899517
    "beginPath": [],
    "fill": [function() { return o.has("Path2D") ? o.pick("Path2D") : _Path2D() }, CanvasWindingRule],
    "stroke": [function() { return o.has("Path2D") ? o.pick("Path2D") : _Path2D() }],
    "clip": [function() { return o.has("Path2D") ? o.pick("Path2D") : _Path2D() }, CanvasWindingRule],
    "isPointInPath": [function() { return o.has("Path2D") ? o.pick("Path2D") : _Path2D() }, make.number.any, make.number.any, CanvasWindingRule],
    "isPointInStroke": [
      function() { return o.has("Path2D") ? o.pick("Path2D") : _Path2D() },
      function() { return random.choose([
        [ 1, make.number.any]
       ])},
      function () { return random.choose([
        [ 1, make.number.any]
      ])}
    ],
    "fillText": [function() {
        return random.choose([
          [1, [make.text.quotedString(), make.number.any(), make.number.any()]],
          [1, [make.text.quotedString(), make.number.any(), make.number.any(), make.number.any()]]
        ], true)
      }
    ],
    "strokeText":  [function() {
        return random.choose([
          [1, [make.text.quotedString(), make.number.any(), make.number.any()]],
          [1, [make.text.quotedString(), make.number.any(), make.number.any(), make.number.any()]]
        ], true)
      }
    ],
    "measureText": [make.text.quotedString],
    "closePath": [],
    "moveTo": [make.number.any, make.number.any],
    "lineTo": [make.number.any, make.number.any],
    "quadraticCurveTo": [make.number.any, make.number.any, make.number.any, make.number.any],
    "bezierCurveTo": [make.number.any, make.number.any, make.number.any, make.number.any, make.number.any, make.number.any],
    "rect": [make.number.any, make.number.any, make.number.any, make.number.any],
    "arcTo": [make.number.any, make.number.any, make.number.any, make.number.any, make.number.any],
    "arc": [
      function() { return random.choose([
        [ 1, make.number.any]
      ])},
      function() { return random.choose([
        [ 1, make.number.any]
      ])},
      function () { return random.choose([
        [ 1, make.number.any]
      ])},
      function () { return random.choose([
        [ 1, make.number.any]
      ])},
      function () { return random.choose([
        [ 1, make.number.any]
       ])},
       make.bool
    ],
    "addHitRegion": [function() { return o.has("HitRegion") ? o.pick("HitRegion") : _HitRegionOptions() }],
    "removeHitRegion": [function() { return "'region" + random.number(o.count("HitRegion")) + "'" }],
    "drawFocusIfNeeded": [[utils.script.getRandomElement, "document.activeElement"]],
    "drawCustomFocusRing": [[utils.script.getRandomElement, "document.activeElement"]]
  }
  if (utils.platform.isCrome) {
    utils.common.mergeHash(Canvas2DMethods, {
      "createLinearGradient": [function() {
          return random.choose([
            [1, [make.number.any(), make.number.any(), make.number.any(), make.number.any()]],
            [1, [make.number.any(), make.number.any(), make.number.any(), make.number.any(), make.number.any(), make.number.any()]]
          ], true)
        }
      ],
      "setAlpha": [make.number.any],
      "setCompositeOperation": ["'source-atop'", "'source-in'", "'source-out'", "'source-over'", "'destination-atop'",
        "'destination-in'", "'destination-out'", "'destination-over'", "'lighter'", "'copy'", "'exclusion'"],
      "getLineDash": [],
      "setLineDash": [function () {
        return utils.common.quote(make.filledArray(function () { return random.pick([0, 1]) }, random.range(0, 32)))}
      ],
      "setLineWidth": [make.number.any],
      "setLineCap": ["'butt'", "'round'", "'square'"],
      "setLineJoin": ["'round'", "'bevel'", "'miter'"],
      "setMiterLine": [make.number.any],
      "setStrokeColor": [function() {
          return random.choose([
            [1, [make.color(), make.number.any()]],
            [1, [make.number.any(), make.number.any()]],
            [1, [make.number.any(), make.number.any(), make.number.any(), make.number.any()]],
            [1, [make.number.any(), make.number.any(), make.number.any(), make.number.any(), make.number.any()]]
          ], true)
        }
      ],
      "setFillColor": [function () {
          return random.choose([
            [1, [make.color(), make.number.any()]],
            [1, [make.number.any(), make.number.any()]],
            [1, [make.number.any(), make.number.any(), make.number.any(), make.number.any()]],
            [1, [make.number.any(), make.number.any(), make.number.any(), make.number.any(), make.number.any()]]
          ], true)
        }
      ],
      "strokeRect": [make.number.any, make.number.any, make.number.any, make.number.any],
      "clearShadow": [],
      "setShadow": [function() {
          return random.choose([
            [1, [make.number.any(), make.number.any(), make.number.any(), make.color(), make.number.any()]],
            [1, [make.number.any(), make.number.any(), make.number.any(), make.number.any(), make.number.any()]],
            [1, [make.number.any(), make.number.any(), make.number.any(), make.number.any(), make.number.any(), make.number.any(), make.number.any()]],
            [1, [make.number.any(), make.number.any(), make.number.any(), make.number.any(), make.number.any(), make.number.any(), make.number.any(), make.number.any()]]
          ], true)
        }
      ],
      "webkitGetImageDataHD": [make.number.any, make.number.any, make.number.any, make.number.any],
      "getContextAttributes": []
    })
  }

  let CanvasGradientMethods = {
    "addColorStop": [[0.0, 1.0, make.number.float], function() { return utils.common.quote(make.colors.rgb()) }]
  }

  return {
    onInit: onInit,
    makeCommand: makeCommand,
    onFinish: onFinish
  }
})()
