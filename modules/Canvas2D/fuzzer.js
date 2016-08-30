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
    var cmd = [], params = [];

    if (!o.has("CanvasElement")) {
      cmd.push(o.add("CanvasElement") + " = document.createElement('canvas');");
      cmd.push(JS.addElementToBody(o.pick("CanvasElement")));
    }

    if (!o.has("Canvas2D")) {
      params = ["'2d'"];
      if (Random.chance(4)) {
        params.push(Utils.quote(JS.makeConstraint(["alpha", "willReadFrequently"],[true, false])));
      }
      cmd.push(o.add("Canvas2D") + " = " + o.pick("CanvasElement") + ".getContext" + JS.methodHead(params) + ";");
    }

    if (!o.has("ImageElement")) {
      cmd.push(o.add("ImageElement") + " = document.createElement('img');");
      cmd.push(o.pick("ImageElement") + ".src = " + Make.image() + ";");
    }

    if (!o.has("VideoElement") && Random.chance(8)) {
      cmd.push(o.add("VideoElement") + " = document.createElement('video');");
      cmd.push(o.pick("VideoElement") + ".src = " + Make.video() + ";");
    }

    if (!o.has("Path2D") && Random.chance(4)) {
        cmd.push(o.add("Path2D") + " = " + _Path2D());
    }

    return cmd;
  }

  /*
  ** Main
  ** Command which shall be called after initialization.
  */
  function makeCommand()
  {
    if (o.has("Canvas2D") && Random.chance(8)) {
      return JS.setAttribute(o.pick("Canvas2D"), Canvas2DAttributes);
    }

    if (Random.chance(4)) {
      return _DrawImage();
    }

    if (!o.has("ImageData") || Random.chance(32)) {
      return _ImageData();
    }

    if (Random.chance(16) && o.has("ImageData")) {
      return _putImageData();
    }

    if (!o.has("CanvasGradient") || Random.chance(32)) {
      return _CanvasGradient();
    }

    if (!o.has("CanvasPattern") && Random.chance(32)) {
      return _CanvasPattern();
    }

    if (o.has("CanvasElement") && Random.chance(16)) {
      return JS.setAttribute(o.pick("CanvasElement"), Canvas2DElementAttributes);
    }

    if (o.has("CanvasGradient") && Random.chance(16)) {
      return JS.methodCall(o.pick("CanvasGradient"), CanvasGradientMethods);
    }

    if (!o.has("HitRegion") || Random.chance(4)) {
        return o.add("HitRegion") + " = " + _HitRegionOptions();
    }

    return JS.methodCall(o.pick("Canvas2D"), Canvas2DMethods);
  }

  /*
  ** De-initialization.
  ** Commands which shall be called at the end of a testcase.
  */
  function onFinish()
  {
    var choice = Random.range(0, 4);
    if (choice == 0) {
      return o.pick("CanvasElement") + ".toDataURL" + JS.methodHead([Utils.quote(Make.mimeType())]);
    }
    if (Platform.isMozilla && choice == 1) {
      var args = ["function() {}", Utils.quote(Make.mimeType()), Make.number];
      return o.pick("CanvasElement") + ".toBlob" + JS.methodHead(args);
    }
    if (Platform.isMozilla && choice == 2) {
      var args = [Utils.quote(Make.image())];
      return o.pick("CanvasElement") + ".mozGetAsFile" + JS.methodHead(args);
    }
  }

  /*
  ** Constructors.
  */
  function _CanvasGradient() {
    // Firefox defines an overloaded function with 4 parameters but throws an error?
    return o.add("CanvasGradient") + " = " + o.pick("Canvas2D") + ".createRadialGradient" + JS.methodHead(
      [Make.number, Make.number, Make.number, Make.number, Make.number, Make.number]);
  }

  function _CanvasPattern() {
    var params = [o.pick("CanvasElement"), ["'repeat'", "'repeat-x'", "'repeat-y'", "'no-repeat'"]];
    return o.add("CanvasPattern") + " = " + o.pick("Canvas2D") + ".createPattern" + JS.methodHead(params);
  }

  function _ImageData() {
    var params;
    var choice = Random.number(6);
    if (choice == 0) {
      params = [Make.number, Make.number, Make.number, Make.number];
      return o.add("ImageData")  + " = " + o.pick("Canvas2D") + ".getImageData" + JS.methodHead(params);
    }
    if (choice == 1 && o.has("ImageData")) {
      params = [o.pick("ImageData")];
      return o.add("ImageData") + " = " + o.pick("Canvas2D") + ".createImageData" + JS.methodHead(params);
    }
    params = [Make.number, Make.number];
    return o.add("ImageData") + " = " + o.pick("Canvas2D") + ".createImageData" + JS.methodHead(params);
  }

  function _DrawImage() {
    var params,
        elementName = o.pick(Random.pick(o.contains(["CanvasElement", "ImageElement", "VideoElement"])));
    if (Platform.isChrome && Random.chance(4)) {
      params = Random.choose([
        [1, [elementName].concat(Random.some([Make.number, Make.number, Make.number, Make.number, Make.number, Make.number, Make.number, Make.number]))]
      ], true);
      return o.pick("Canvas2D") + ".drawImageFromRect" + JS.methodHead(params);
    }
    params = Random.choose([
      [1, [elementName, Make.number(), Make.number()]],
      [1, [elementName, Make.number(), Make.number(), Make.number(), Make.number()]],
      [1, [elementName, Make.number(), Make.number(), Make.number(), Make.number(), Make.number(), Make.number(), Make.number(), Make.number()]]
      ], true);
    return o.pick("Canvas2D") + ".drawImage" + JS.methodHead(params);
  }

  function _putImageData() {
    var params;
    if (Platform.isChrome && Random.chance(4)) {
      params = Random.choose([
        [1, [o.pick("ImageData"), Make.number(), Make.number()]],
        [1, [o.pick("ImageData"), Make.number(), Make.number(), Make.number(), Make.number(), Make.number(), Make.number()]]
      ], true);
      return o.pick("Canvas2D") + ".webkitPutImageDataHD" + JS.methodHead(params);
    }
    params = Random.choose([
      [1, [o.pick("ImageData"), Make.number(), Make.number()]],
      [1, [o.pick("ImageData"), Make.number(), Make.number(), Make.number(), Make.number(), Make.number(), Make.number()]]
    ], true);
    return o.pick("Canvas2D") + ".putImageData" + JS.methodHead(params);
  }

  function make_path_data() {
      // Todo: http://www.w3.org/TR/SVGTiny12/paths.html#PathDataBNF
      return "M100,0L200,0L200,100L100,100z";
  }

  function _Path2D() {
      return "new Path2D('" + make_path_data() + "')"
  }

  function _HitRegionOptions() {
    var opts = {};
    opts["id"] = "region" + o.count("HitRegion");
    opts["control"] = Random.pick([null]);
    return Utils.quote(opts);
  }

  /*
  ** Methods and attributes.
  */
  var Canvas2DElementAttributes = {
    "width": [Make.number],
    "height": [Make.number]
  };
  if (Platform.isMozilla) {
    Utils.mergeHash(Canvas2DElementAttributes, {
      "mozOpaque": [Make.bool]
    });
  }

  var CanvasWindingRule = ["'nonzero'", "'evenodd'"];

  var Canvas2DAttributes = {
    "globalAlpha": [Make.number],
    "globalCompositeOperation": ["'source-atop'", "'source-in'", "'source-out'", "'source-over'", "'destination-atop'",
      "'destination-in'", "'destination-out'", "'destination-over'", "'lighter'", "'copy'", "'exclusion'"],
    "strokeStyle": [Make.color],
    "fillStyle": [Make.color],
    "shadowOffsetX": [Make.number],
    "shadowOffsetY": [Make.number],
    "shadowBlur": [Make.number],
    "shadowColor": [Make.color],
    "lineWidth": [1, Make.number],
    "lineCap": ["'butt'", "'round'", "'square'"],
    "lineJoin": ["'round'", "'bevel'", "'miter'"],
    "miterLimit": [10, Make.number],
    "font": [Make.font],
    "textAlign": ["'start'", "'end'", "'left'", "'right'", "'center'"],
    "textBaseline": ["'top'", "'hanging'", "'middle'", "'alphabetic'", "'ideographic'", "'bottom'"]
  };
  if (Platform.isMozilla) {
    Utils.mergeHash(Canvas2DAttributes, {
      "mozImageSmoothingEnabled": [Make.bool],
      "mozDashOffset": [Make.number],
      /*"mozDash": [function() { // Bug: 899517
        return Utils.quote(Make.filledArray(function() { return Random.pick([0,1]); }, Random.range(0, 32)))}
      ],*/
      "mozFillRule": [CanvasWindingRule],
      "mozCurrentTransform": [function() {
        return Utils.quote(Make.filledArray(function() { return Random.pick([Make.number]); }, 6)) }
      ],
      "mozCurrentTransformInverse": [function() {
        return Utils.quote(Make.filledArray(function() { return Random.pick([Make.number]); }, 6)) }
      ]
    });
  }
  if (Platform.isChrome) {
    Utils.mergeHash(Canvas2DAttributes, {
      "webkitImageSmoothingEnabled": [Make.bool],
      "lineDashOffset": [Make.number]
    });
  }

  var Canvas2DMethods = {
    "save": [],
    "restore": [],
    "scale": [Make.number, Make.number],
    "rotate": [Make.number],
    "translate": [Make.number, Make.number],
    "transform": [Make.number, Make.number, Make.number, Make.number, Make.number, Make.number],
    "setTransform": [Make.number, Make.number, Make.number, Make.number, Make.number, Make.number],
    "clearRect": [Make.number, Make.number, Make.number, Make.number],
    "fillRect": [Make.number, Make.number, Make.number, Make.number],
    //"strokeRect": [Make.number, Make.number, Make.number, Make.number], // Bug: 899517
    "beginPath": [],
    "fill": [function() { return o.has("Path2D") ? o.pick("Path2D") : _Path2D() }, CanvasWindingRule],
    //"stroke": [], // Bug: 899517
    //"stroke": [function() { return o.has("Path2D") ? o.pick("Path2D") : _Path2D() }],
    "clip": [function() { return o.has("Path2D") ? o.pick("Path2D") : _Path2D() }, CanvasWindingRule],
    "isPointInPath": [function() { return o.has("Path2D") ? o.pick("Path2D") : _Path2D() }, Make.number, Make.number, CanvasWindingRule],
    "isPointInStroke": [
      function() { return o.has("Path2D") ? o.pick("Path2D") : _Path2D() },
      function() { return Random.choose([
        [20, Make.tinyNumber],
        [ 1, Make.number]
       ])},
      function () { return Random.choose([
        [20, Make.tinyNumber],
        [ 1, Make.number]
      ])}
    ],
    "fillText": [function() {
        return Random.choose([
          [1, [Make.quotedString(), Make.number(), Make.number()]],
          [1, [Make.quotedString(), Make.number(), Make.number(), Make.number()]]
        ], true);
      },
    ],
    "strokeText":  [function() {
        return Random.choose([
          [1, [Make.quotedString(), Make.number(), Make.number()]],
          [1, [Make.quotedString(), Make.number(), Make.number(), Make.number()]]
        ], true);
      },
    ],
    "measureText": [Make.quotedString],
    "closePath": [],
    "moveTo": [Make.number, Make.number],
    "lineTo": [Make.number, Make.number],
    "quadraticCurveTo": [Make.number, Make.number, Make.number, Make.number],
    "bezierCurveTo": [Make.number, Make.number, Make.number, Make.number, Make.number, Make.number],
    "rect": [Make.number, Make.number, Make.number, Make.number],
    "arcTo": [Make.number, Make.number, Make.number, Make.number, Make.number],
    "arc": [
      function() { return Random.choose([
        [20, Make.tinyNumber],
        [ 1, Make.number]
      ])},
      function() { return Random.choose([
        [20, Make.tinyNumber],
        [ 1, Make.number]
      ])},
      function () { return Random.choose([
        [20, Make.tinyNumber],
        [ 1, Make.number]
      ])},
      function () { return Random.choose([
        [20, Make.tinyNumber],
        [ 1, Make.number]
      ])},
      function () { return Random.choose([
        [20, Make.tinyNumber],
        [ 1, Make.number]
       ])},
       Make.bool
    ],
    "addHitRegion": [function() { return o.has("HitRegion") ? o.pick("HitRegion") : _HitRegionOptions() }],
    "removeHitRegion": [function() { return "'region" + Random.number(o.count("HitRegion")) + "'" }],
    "drawFocusIfNeeded": [[JS.getRandomElement, "document.activeElement"]],
    "drawCustomFocusRing": [[JS.getRandomElement, "document.activeElement"]]
  };
  if (Platform.isCrome) {
    Utils.mergeHash(Canvas2DMethods, {
      "createLinearGradient": [function() {
          return Random.choose([
            [1, [Make.number(), Make.number(), Make.number(), Make.number()]],
            [1, [Make.number(), Make.number(), Make.number(), Make.number(), Make.number(), Make.number()]]
          ], true);
        }
      ],
      "setAlpha": [Make.number],
      "setCompositeOperation": ["'source-atop'", "'source-in'", "'source-out'", "'source-over'", "'destination-atop'",
        "'destination-in'", "'destination-out'", "'destination-over'", "'lighter'", "'copy'", "'exclusion'"],
      "getLineDash": [],
      "setLineDash": [function () {
        return Utils.quote(Make.filledArray(function () { return Random.pick([0, 1]); }, Random.range(0, 32)))}
      ],
      "setLineWidth": [Make.number],
      "setLineCap": ["'butt'", "'round'", "'square'"],
      "setLineJoin": ["'round'", "'bevel'", "'miter'"],
      "setMiterLine": [Make.number],
      "setStrokeColor": [function() {
          return Random.choose([
            [1, [Make.color(), Make.number()]],
            [1, [Make.number(), Make.number()]],
            [1, [Make.number(), Make.number(), Make.number(), Make.number()]],
            [1, [Make.number(), Make.number(), Make.number(), Make.number(), Make.number()]]
          ], true);
        }
      ],
      "setFillColor": [function () {
          return Random.choose([
            [1, [Make.color(), Make.number()]],
            [1, [Make.number(), Make.number()]],
            [1, [Make.number(), Make.number(), Make.number(), Make.number()]],
            [1, [Make.number(), Make.number(), Make.number(), Make.number(), Make.number()]]
          ], true);
        }
      ],
      "strokeRect": [Make.number, Make.number, Make.number, Make.number],
      "clearShadow": [],
      "setShadow": [function() {
          return Random.choose([
            [1, [Make.number(), Make.number(), Make.number(), Make.color(), Make.number()]],
            [1, [Make.number(), Make.number(), Make.number(), Make.number(), Make.number()]],
            [1, [Make.number(), Make.number(), Make.number(), Make.number(), Make.number(), Make.number(), Make.number()]],
            [1, [Make.number(), Make.number(), Make.number(), Make.number(), Make.number(), Make.number(), Make.number(), Make.number()]]
          ], true);
        }
      ],
      "webkitGetImageDataHD": [Make.number, Make.number, Make.number, Make.number],
      "getContextAttributes": []
    });
  }

  var CanvasGradientMethods = {
    "addColorStop": [[0.0, 1.0, Make.float], Make.color]
  };

  return {
    onInit: onInit,
    makeCommand: makeCommand,
    onFinish: onFinish
  };
})();
