var o = null;
var websocket;

var Platform = (function () {
  var version, webkitVersion, platform = {};

  var userAgent = (navigator.userAgent).toLowerCase();
  var language = navigator.language || navigator.browserLanguage;

  version = platform.version = (userAgent.match(/.*(?:rv|chrome|webkit|opera|ie)[\/: ](.+?)([ \);]|$)/) || [])[1];
  webkitVersion = (userAgent.match(/webkit\/(.+?) /) || [])[1];
  platform.windows = platform.isWindows = !!/windows/.test(userAgent);
  platform.mac = platform.isMac = !!/macintosh/.test(userAgent) || (/mac os x/.test(userAgent) && !/like mac os x/.test(userAgent));
  platform.lion = platform.isLion = !!(/mac os x 10_7/.test(userAgent) && !/like mac os x 10_7/.test(userAgent));
  platform.iPhone = platform.isiPhone = !!/iphone/.test(userAgent);
  platform.iPod = platform.isiPod = !!/ipod/.test(userAgent);
  platform.iPad = platform.isiPad = !!/ipad/.test(userAgent);
  platform.iOS = platform.isiOS = platform.iPhone || platform.iPod || platform.iPad;
  platform.android = platform.isAndroid = !!/android/.test(userAgent);
  platform.opera = /opera/.test(userAgent) ? version : 0;
  platform.isOpera = !!platform.opera;
  platform.msie = /msie/.test(userAgent) && !platform.opera ? version : 0;
  platform.isIE = !!platform.msie;
  platform.isIE8OrLower = !!(platform.msie && parseInt(platform.msie, 10) <= 8);
  platform.mozilla = /mozilla/.test(userAgent) && !/(compatible|webkit|msie)/.test(userAgent) ? version : 0;
  platform.isMozilla = !!platform.mozilla;
  platform.webkit = /webkit/.test(userAgent) ? webkitVersion : 0;
  platform.isWebkit = !!platform.webkit;
  platform.chrome = /chrome/.test(userAgent) ? version : 0;
  platform.isChrome = !!platform.chrome;
  platform.mobileSafari = /apple.*mobile/.test(userAgent) && platform.iOS ? webkitVersion : 0;
  platform.isMobileSafari = !!platform.mobileSafari;
  platform.iPadSafari = platform.iPad && platform.isMobileSafari ? webkitVersion : 0;
  platform.isiPadSafari = !!platform.iPadSafari;
  platform.iPhoneSafari = platform.iPhone && platform.isMobileSafari ? webkitVersion : 0;
  platform.isiPhoneSafari = !!platform.iphoneSafari;
  platform.iPodSafari = platform.iPod && platform.isMobileSafari ? webkitVersion : 0;
  platform.isiPodSafari = !!platform.iPodSafari;
  platform.isiOSHomeScreen = platform.isMobileSafari && !/apple.*mobile.*safari/.test(userAgent);
  platform.safari = platform.webkit && !platform.chrome && !platform.iOS && !platform.android ? webkitVersion : 0;
  platform.isSafari = !!platform.safari;
  platform.language = language.split("-", 1)[0];
  platform.current =
    platform.msie ? "msie" :
      platform.mozilla ? "mozilla" :
        platform.chrome ? "chrome" :
          platform.safari ? "safari" :
            platform.opera ? "opera" :
              platform.mobileSafari ? "mobile-safari" :
                platform.android ? "android" : "unknown";

  function platformName(candidates) {
    for (var i = 0; i < candidates.length; i++) {
      if (candidates[i] in window) {
        return "window." + candidates[i];
      }
      if (candidates[i] in navigator) {
        return "navigator." + candidates[i];
      }
    }
    return undefined;
  }

  platform.GUM = platformName(['getUserMedia', 'webkitGetUserMedia', 'mozGetUserMedia', 'msGetUserMedia', 'getGUM']);
  platform.PeerConnection = platformName(['webkitRTCPeerConnection', 'mozRTCPeerConnection', 'msPeerConnection']);
  platform.IceCandidate = platformName(['mozRTCIceCandidate', 'RTCIceCandidate']);
  platform.SessionDescription = platformName(['mozRTCSessionDescription', 'RTCSessionDescription']);
  platform.URL = platformName(['URL', 'webkitURL']);
  platform.AudioContext = platformName(['AudioContext', 'webkitAudioContext']);
  platform.OfflineAudioContext = platformName(['OfflineAudioContext', 'webkitOfflineAudioContext']);
  platform.MediaSource = platformName(["MediaSource", "WebKitMediaSource"]);

  platform.SpeechRecognition = platformName(["SpeechRecognition", "webkitSpeechRecognition"]);
  platform.SpeechGrammarList = platformName(["SpeechGrammarList", "webkitSpeechGrammarList"]);

  function findWebGLContextName(candidates) {
    var canvas = document.createElement("canvas");
    for (var i=0; i<candidates.length; i++) {
      var name = candidates[i];
      try {
        if (canvas.getContext(name)) {
          return name;
        }
      } catch (e) {}
    }
    return null;
  }

  platform.WebGL = "webgl";//findWebGLContextName(["webgl", "experimental-webgl", "webkit-3d"]);
  platform.WebGL2 = "webgl2";//findWebGLContextName(["webgl2", "experimental-webgl2"]);

  platform.captureStreamUntilEnded = "captureStreamUntilEnded";
  if (platform.isMozilla) { platform.captureStreamUntilEnded = "mozCaptureStreamUntilEnded"; }

  platform.srcObject = "srcObject";
  if (platform.isMozilla) { platform.srcObject = "mozSrcObject"; }

  return platform;
})();


var Logger = (function () {
  var color = { red: "\033[1;31m", green: "\033[1;32m", clear: "\033[0m" };
  if (Platform.isWindows) {
    color = { red: "", green: "", clear: ""};
  }
  var sep = "\n/* ### NEXT TESTCASE ############################## */";

  function console(msg) {
    if (websocket) {
      websocket.send(msg);
    }
    if (typeof window == 'undefined') {
      print(msg);
    } else if (window.dump) {
      window.dump(msg);
    } else if (window.console && window.console.log) {
      window.console.log(msg);
    } else {
      throw "Unable to run console logger.";
    }
  }

  function dump(msg) { console(msg); }

  function testcase(msg) { dump("/*L*/ " + JSON.stringify(msg) + "\n"); }

  function dumpln(msg) { dump(msg + "\n"); }

  function error(msg) { dumpln(color.red + msg + color.clear); }

  function JSError(msg) { error(comment(msg)) }

  function comment(msg) { return "/* " + msg + " */"; }

  function separator() { dumpln(color.green + sep + color.clear); }

  return {
    console: console,
    dump: dump,
    error: error,
    JSError: JSError,
    dumpln: dumpln,
    comment: comment,
    testcase: testcase,
    separator: separator
  };
})();


function MersenneTwister(seed) {
  var N = 624, M = 397;
  var MATRIX_A = 0x9908b0df;
  var UPPER_MASK = 0x80000000;
  var LOWER_MASK = 0x7fffffff;
  var mt = new Array(N);
  var mti = N + 1;

  function unsigned32(n1) {
    return n1 < 0 ? (n1 ^ UPPER_MASK) + UPPER_MASK : n1;
  }

  function addition32(n1, n2) {
    return unsigned32((n1 + n2) & 0xffffffff)
  }

  function multiplication32(n1, n2) {
    var sum = 0;
    for (var i = 0; i < 32; ++i) {
      if ((n1 >>> i) & 0x1) {
        sum = addition32(sum, unsigned32(n2 << i));
      }
    }
    return sum;
  }

  function init_genrand(s) {
    mt[0] = unsigned32(s & 0xffffffff);
    for (mti = 1; mti < N; mti++) {
      mt[mti] = multiplication32(69069, mt[ mti - 1]);
      mt[mti] = unsigned32(mt[mti] & 0xffffffff);
    }
  }

  this.genrand_uint32 = function (max) {
    var y;
    var mag01 = [0x0, MATRIX_A];
    if (mti >= N) {
      var kk;
      if (mti == N + 1)
        init_genrand(seed);
      for (kk = 0; kk < N - M; kk++) {
        y = unsigned32((mt[kk] & UPPER_MASK) | (mt[kk + 1] & LOWER_MASK));
        mt[kk] = unsigned32(mt[kk + M] ^ (y >>> 1) ^ mag01[y & 0x1]);
      }
      for (; kk < N - 1; kk++) {
        y = unsigned32((mt[kk] & UPPER_MASK) | (mt[kk + 1] & LOWER_MASK));
        mt[kk] = unsigned32(mt[kk + ( M - N)] ^ (y >>> 1) ^ mag01[y & 0x1]);
      }
      y = unsigned32((mt[N - 1] & UPPER_MASK) | (mt[0] & LOWER_MASK));
      mt[N - 1] = unsigned32(mt[M - 1] ^ (y >>> 1) ^ mag01[y & 0x1]);
      mti = 0;
    }
    y = mt[mti++];
    y = unsigned32(y ^ (y >>> 11));
    y = unsigned32(y ^ ((y << 7) & 0x9d2c5680));
    y = unsigned32(y ^ ((y << 15) & 0xefc60000));
    y = unsigned32(y ^ (y >>> 18));
    return max ? y % max : y;
  };

  this.genrand_real1 = function () {
    return this.genrand_uint32() * (1.0 / 4294967295.0);
  };
}


var Random = {
  seed: null,
  twister: null,

  init: function (seed) {
    if (seed == null || seed === undefined) {
      this.seed = new Date().getTime();
    } else {
      this.seed = seed;
    }
    try {
      this.twister = new MersenneTwister(this.seed);
    } catch (ReferenceError) {
      this.twister = null;
      this.seed = -1;
    }
  },
  number: function (limit) {
    if (limit == 0) {
      return limit;
    }
    if (limit == null || limit === undefined) {
      limit = 0xffffffff;
    }
    if (!this.twister) {
      return Math.floor(Math.random() * limit);
    } else {
      return this.twister.genrand_uint32(limit);
    }
  },
  float: function () {
    if (!this.twister) {
      return Math.random();
    } else {
      return this.twister.genrand_real1();
    }
  },
  range: function (start, limit) {
    if (isNaN(start) || isNaN(limit)) {
      Utils.traceback();
      throw new TypeError("Random.range() received a non number type: '" + start + "', '" + limit + "')");
    }
    if (!this.twister) {
      return Math.floor(Math.random() * (limit - start + 1) + start);
    } else {
      return Math.floor(this.twister.genrand_real1() * (limit - start + 1) + start);
    }
  },
  index: function (list) {
    if (list == null || list === undefined || !(list instanceof Array)) {
      Utils.traceback();
      throw new TypeError("Random.index() received a non array type: '" + list + "'");
    }
    return list[this.number(list.length)];
  },
  key: function (obj) {
    var list = [];
    for (var i in obj) {
      list.push(i);
    }
    return this.index(list);
  },
  bool: function () {
    return this.index([true, false]);
  },
  pick: function (obj) {
    if (obj == null || obj === undefined) {
      return null;
    }
    if (typeof(obj) == "function") {
      return obj(); //this.pick(obj());
    }
    if (typeof(obj) == "string") {
      return obj;
    }
    if (obj instanceof(Array)) {
      obj = this.pick(this.index(obj));
    }
    return obj;
  },
  chance: function (limit) {
    if (limit == null || limit === undefined) {
      limit = 2;
    }
    if (isNaN(limit)) {
      Utils.traceback();
      throw new TypeError("Random.chance() received a non number type: '" + limit + "'");
    }
    return this.number(limit) == 1;
  },
  choose: function (list, flat) {
    if (list == null || list === undefined || !(list instanceof Array)) {
      Utils.traceback();
      throw new TypeError("Random.choose() received a non-array type: '" + list + "'");
    }
    var total = 0, i;
    for (i = 0; i < list.length; i++) {
      total += list[i][0];
    }
    var n = this.number(total);
    for (i = 0; i < list.length; i++) {
      if (n < list[i][0]) {
        if (flat == true) {
          return list[i][1];
        } else {
          return this.pick([list[i][1]]);
        }
      }
      n = n - list[i][0];
    }
    if (flat == true) {
      return list[0][1];
    }
    return this.pick([list[0][1]]);
  },
  some: function (list, limit) {
    if (list == null || list === undefined || !(list instanceof Array)) {
      Utils.traceback();
      throw new TypeError("Random.some() received a non-array type: '" + list + "'");
    }
    if (limit == null || limit === undefined) {
      limit = this.range(0, list.length);
    }
    var result = [];
    for (var i = 0; i < limit; i++) {
      result.push(this.pick(list));
    }
    return result;
  },
  use: function (obj) {
    return Random.bool() ? obj : "";
  }
};


function Objects() {
  this.counter = 0;
  this.container = {};
}

Objects.prototype.add = function (category, member) {
  member = member ? member : "o" + this.counter;
  if (!this.has(category)) {
    this.container[category] = [];
  }
  this.container[category].push({type: category, name: member});
  ++this.counter;
  return this.container[category].slice(-1)[0].name;
};

Objects.prototype.get = function (category, last) {
  if (!(category in this.container)) {
    //return {type:null, name:null};
    Utils.traceback();
    throw new Error(category + " is not available.");
  }
  if (last) {
    return this.container[category].slice(-1)[0];
  }
  return Random.index(this.container[category]);
};

Objects.prototype.pick = function (category, last) {
  try {
    return this.get(category, last).name;
  } catch (e) {
    Utils.traceback();
    throw Logger.JSError("Error: pick(" + category + ") " + category + " is undefined.");
  }
};

Objects.prototype.pop = function (objectName) {
  var self = this;
  Utils.getKeysFromHash(this.container).forEach(function (category) {
    self.container[category].forEach(function (obj) {
      if (obj.name == objectName) {
        self.container[category].splice(self.container[category].indexOf(obj), 1);
      }
    });
  });
};

Objects.prototype.contains = function (categoryNames) {
  var categories = [], self = this;
  categoryNames.forEach(function (name) {
    if (self.has(name)) {
      categories.push(name);
    }
  });
  return (categories.length == 0) ? null : categories;
};

Objects.prototype.show = function (category) {
  return (category in this.container) ? this.container[category] : this.container;
};

Objects.prototype.count = function (category) {
  return (category in this.container) ? this.container[category].length : 0;
};

Objects.prototype.has = function (category) {
  if (category in this.container) {
    this.check(category);
    return !!(this.container[category].length > 0);
  }
  return false;
};

Objects.prototype.valid = function () {
  var items = [], self = this;
  Utils.getKeysFromHash(self.container).forEach(function (category) {
    self.check(category);
  });
  Utils.getKeysFromHash(self.container).forEach(function (category) {
    for (var i = 0; i < self.container[category].length; i++) {
      items.push(self.container[category][i].name);
    }
  });
  return items;
};

Objects.prototype.check = function (category) {
  var self = this;
  self.container[category].forEach(function (object) {
    try {
      var x = /*frame.contentWindow.*/eval(object.name);
      if (x === undefined || x == null) {
        self.pop(object.name);
      }
    } catch (e) {
      self.pop(object.name);
    }
  });
};


if (!String.fromCodePoint) {
  String.fromCodePoint = function fromCodePoint() {
    var chars = [], point, offset, units, i;
    for (i = 0; i < arguments.length; ++i) {
      point = arguments[i];
      offset = point - 0x10000;
      units = point > 0xFFFF ? [0xD800 + (offset >> 10), 0xDC00 + (offset & 0x3FF)] : [point];
      chars.push(String.fromCharCode.apply(null, units));
    }
    return chars.join("");
  }
}

if (!String.prototype.endsWith) {
  String.prototype.endsWith = function (str) { return (this.match(str + "$") == str) };
}

if (!String.prototype.startsWith) {
  String.prototype.startsWith = function (str) {
    return (this.match("^" + str) == str)
  };
}

if (!String.prototype.trim) {
  String.prototype.trim = function () {
    return (this.replace(/^[\s\xA0]+/, "").replace(/[\s\xA0]+$/, ""))
  };
}

if (!String.prototype.insert) {
  String.prototype.insert = function (data, idx) {
    return this.slice(0, idx) + data + this.slice(idx, this.length);
  };
}

if (!Array.prototype.has) {
  Array.prototype.has = function (v) {
    return this.indexOf(v) != -1;
  };
}

if (!Array.prototype.forEach) {
  Array.prototype.forEach = function (array, fn) {
    for (var i = 0; i < array.length; i++) {
      fn(array[i]);
    }
  }
}

if (!Array.prototype.map) {
  Array.prototype.map = function (fn, array) {
    var result = [];
    Array.forEach(array, function (element) {
      result.push(fn(element));
    });
    return result;
  }
}


var Utils = {
  objToString: function (obj) {
    try {
      return "" + obj
    } catch (e) {
      return "[" + e + "]"
    }
  },
  getAllProperties: function (obj) {
    var list = [];
    while (obj) {
      list = list.concat(Object.getOwnPropertyNames(obj));
      obj = Object.getPrototypeOf(obj);
    }
    return list;
  },
  getKeysFromHash: function (obj) {
    var list = [];
    for (var p in obj) {
      list.push(p);
    }
    return list;
  },
  quote: function (obj) {
    return JSON.stringify(obj);
  },
  shuffle: function (list) {
    var newArray = list.slice();
    var len = newArray.length;
    var i = len;
    while (i--) {
      var p = parseInt(Math.random() * len);
      var t = newArray[i];
      newArray[i] = newArray[p];
      newArray[p] = t;
    }
    return newArray;
  },
  uniqueList: function (list) {
    var tmp = {}, r = [];
    for (var i = 0; i < list.length; i++) {
      tmp[list[i]] = list[i];
    }
    for (var i in tmp) {
      r.push(tmp[i]);
    }
    return r;
  },
  mergeHash: function (obj1, obj2) {
    for (var p in obj2) {
      try {
        if (obj2[p].constructor == Object) {
          obj1[p] = Utils.mergeHash(obj1[p], obj2[p]);
        } else {
          obj1[p] = obj2[p];
        }
      } catch (e) {
        obj1[p] = obj2[p];
      }
    }
    return obj1;
  },
  traceback: function () {
    Logger.error("===[ Traceback ]");
    try {
      throw new Error();
    } catch (e) {
      Logger.dump(e.stack || e.stacktrace || "");
    }
    Logger.error("===");
  }
};


function Block(list, optional) {
  if (optional == true) {
    if (Random.chance(6)) {
      return '';
    }
  }
  function goDeeper(item) {
    if (item == null || item === undefined) {
      return "";
    }
    if (typeof(item) == "function") {
      return item();
    }
    if (typeof(item) == "string") {
      return item;
    }
    if (item instanceof(Array)) {
      var s = "";
      for (var i = 0; i < item.length; i++) {
        s += goDeeper(item[i]);
      }
      return s;
    }
    return item;
  }
  var asString = "";
  for (var i = 0; i < list.length; i++) {
    asString += goDeeper(list[i]);
  }
  return asString;
}

