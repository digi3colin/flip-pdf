"use strict";

function _empty() {}

function _awaitIgnored(value, direct) {
  if (!direct) {
    return value && value.then ? value.then(_empty) : Promise.resolve();
  }
}

function _async(f) {
  return function () {
    for (var args = [], i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
    }

    try {
      return Promise.resolve(f.apply(this, args));
    } catch (e) {
      return Promise.reject(e);
    }
  };
}

function _await(value, then, direct) {
  if (direct) {
    return then ? then(value) : value;
  }

  if (!value || !value.then) {
    value = Promise.resolve(value);
  }

  return then ? value.then(then) : value;
}

function _settle(pact, state, value) {
  if (!pact.s) {
    if (value instanceof _Pact) {
      if (value.s) {
        if (state & 1) {
          state = value.s;
        }

        value = value.v;
      } else {
        value.o = _settle.bind(null, pact, state);
        return;
      }
    }

    if (value && value.then) {
      value.then(_settle.bind(null, pact, state), _settle.bind(null, pact, 2));
      return;
    }

    pact.s = state;
    pact.v = value;
    var observer = pact.o;

    if (observer) {
      observer(pact);
    }
  }
}

var _Pact = /*#__PURE__*/function () {
  function _Pact() {}

  _Pact.prototype.then = function (onFulfilled, onRejected) {
    var result = new _Pact();
    var state = this.s;

    if (state) {
      var callback = state & 1 ? onFulfilled : onRejected;

      if (callback) {
        try {
          _settle(result, 1, callback(this.v));
        } catch (e) {
          _settle(result, 2, e);
        }

        return result;
      } else {
        return this;
      }
    }

    this.o = function (_this) {
      try {
        var value = _this.v;

        if (_this.s & 1) {
          _settle(result, 1, onFulfilled ? onFulfilled(value) : value);
        } else if (onRejected) {
          _settle(result, 1, onRejected(value));
        } else {
          _settle(result, 2, value);
        }
      } catch (e) {
        _settle(result, 2, e);
      }
    };

    return result;
  };

  return _Pact;
}();

function _isSettledPact(thenable) {
  return thenable instanceof _Pact && thenable.s & 1;
}

function _for(test, update, body) {
  var stage;

  for (;;) {
    var shouldContinue = test();

    if (_isSettledPact(shouldContinue)) {
      shouldContinue = shouldContinue.v;
    }

    if (!shouldContinue) {
      return result;
    }

    if (shouldContinue.then) {
      stage = 0;
      break;
    }

    var result = body();

    if (result && result.then) {
      if (_isSettledPact(result)) {
        result = result.s;
      } else {
        stage = 1;
        break;
      }
    }

    if (update) {
      var updateValue = update();

      if (updateValue && updateValue.then && !_isSettledPact(updateValue)) {
        stage = 2;
        break;
      }
    }
  }

  var pact = new _Pact();

  var reject = _settle.bind(null, pact, 2);

  (stage === 0 ? shouldContinue.then(_resumeAfterTest) : stage === 1 ? result.then(_resumeAfterBody) : updateValue.then(_resumeAfterUpdate)).then(void 0, reject);
  return pact;

  function _resumeAfterBody(value) {
    result = value;

    do {
      if (update) {
        updateValue = update();

        if (updateValue && updateValue.then && !_isSettledPact(updateValue)) {
          updateValue.then(_resumeAfterUpdate).then(void 0, reject);
          return;
        }
      }

      shouldContinue = test();

      if (!shouldContinue || _isSettledPact(shouldContinue) && !shouldContinue.v) {
        _settle(pact, 1, result);

        return;
      }

      if (shouldContinue.then) {
        shouldContinue.then(_resumeAfterTest).then(void 0, reject);
        return;
      }

      result = body();

      if (_isSettledPact(result)) {
        result = result.v;
      }
    } while (!result || !result.then);

    result.then(_resumeAfterBody).then(void 0, reject);
  }

  function _resumeAfterTest(shouldContinue) {
    if (shouldContinue) {
      result = body();

      if (result && result.then) {
        result.then(_resumeAfterBody).then(void 0, reject);
      } else {
        _resumeAfterBody(result);
      }
    } else {
      _settle(pact, 1, result);
    }
  }

  function _resumeAfterUpdate() {
    if (shouldContinue = test()) {
      if (shouldContinue.then) {
        shouldContinue.then(_resumeAfterTest).then(void 0, reject);
      } else {
        _resumeAfterTest(shouldContinue);
      }
    } else {
      _settle(pact, 1, result);
    }
  }
}

function _continueIgnored(value) {
  if (value && value.then) {
    return value.then(_empty);
  }
}

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var renderPdf = function renderPdf(pdf, w, h) {
  return _await(showPage(pdf, w, h, 1), function (p1) {
    var pw = p1.view[2] * p1.scale;
    var ph = p1.view[3] * p1.scale;
    var book = initBook(pw, ph, grid, debug);
    var coverPage = PIXI.Sprite.from(p1.blobUrl);
    pages.addChild(coverPage);
    book.setPage(1, coverPage);
    pagesMask.clear();
    pagesMask.beginFill(0xFF0000, 1);
    pagesMask.drawRect(-pw, -ph * .5, pw * 2, ph);
    pagesMask.endFill();
    return _await(showPage(pdf, w, h, 2), function (p2) {
      var mcPage = PIXI.Sprite.from(p2.blobUrl);
      mcPage.x = book.pageWidth;
      pages.addChild(mcPage);
      book.setPage(2, mcPage);
      var i = 3;
      return _continueIgnored(_for(function () {
        return i <= pdf.numPages;
      }, function () {
        return i++;
      }, function () {
        return _await(showPage(pdf, w, h, i), function (p) {
          book.setPage(i, PIXI.Sprite.from(p.blobUrl));
        });
      }));
    });
  });
};

var getCanvasBlobURL = _async(function (canvas) {
  return _await(getBlob(canvas), function (blob) {
    return _await(URL.createObjectURL(blob), function (blobURL) {
      return {
        blob: blob,
        blobURL: blobURL
      };
    });
  });
});

var showPage = _async(function (pdf, width, height, num) {
  return _await(pdf.getPage(num), function (page) {
    var scale = Math.min(width / page.view[2], height / page.view[3]);
    var canvas = document.createElement('canvas');
    return _await(renderPage(page, canvas, scale), function () {
      return _await(getBlob(canvas), function (blob) {
        return _await(URL.createObjectURL(blob), function (blobUrl) {
          return {
            view: page.view,
            scale: scale,
            blob: blob,
            blobUrl: blobUrl
          };
        });
      });
    });
  });
});

var render = _async(function (pdf, book) {
  var i = 1;
  return _continueIgnored(_for(function () {
    return i <= pdf.numPages;
  }, function () {
    return i++;
  }, function () {
    return _await(pdf.getPage(i), function (page) {
      var scale = book.pageWidth / page.view[2];
      var canvas = document.querySelector("#page-".concat(i, " canvas"));
      return _awaitIgnored(renderPage(page, canvas, scale));
    });
  }));
});

//load pdf;
var renderPage = _async(function (page, canvas, scale) {
  var outputScale = window.devicePixelRatio || 1;
  var viewport = page.getViewport({
    scale: scale
  });
  var context = canvas.getContext('2d');
  canvas.width = Math.floor(viewport.width * outputScale);
  canvas.height = Math.floor(viewport.height * outputScale);
  var transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;
  var renderContext = {
    canvasContext: context,
    transform: transform,
    viewport: viewport
  };
  return _awaitIgnored(page.render(renderContext).promise);
}); //visualise


var Vec2 = {
  radianToDegree: function radianToDegree(n) {
    return n * (180 / Math.PI);
  },
  degreeToRadian: function degreeToRadian(n) {
    return n * (Math.PI / 180);
  },
  rotation: function rotation(a, b) {
    return Math.atan2(b.y - a.y, b.x - a.x);
  },
  assign: function assign(a, b) {
    a.x = b.x;
    a.y = b.y;
  },
  add: function add(a, b) {
    return {
      x: a.x + b.x,
      y: a.y + b.y
    };
  },
  subtract: function subtract(a, b) {
    return {
      x: a.x - b.x,
      y: a.y - b.y
    };
  },
  multiplyScalar: function multiplyScalar(a, s) {
    return {
      x: a.x * s,
      y: a.y * s
    };
  },
  pointSlope: function pointSlope(m, a) {
    var x = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var y = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
    return {
      x: x !== null ? x : (y - a.y) / m + a.x,
      y: y !== null ? y : m * (x - a.x) + a.y
    };
  },
  magnitude: function magnitude(a) {
    return Math.sqrt(a.x * a.x + a.y * a.y);
  },
  normalize: function normalize(a) {
    var mag = Vec2.magnitude(a);
    return {
      x: a.x / mag,
      y: a.y / mag
    };
  },
  slope: function slope(a) {
    var o = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
      x: 0,
      y: 0
    };
    var d = Vec2.subtract(a, o);
    return d.y / d.x;
  },
  perpendicularSlope: function perpendicularSlope(a) {
    var o = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
      x: 0,
      y: 0
    };
    var d = Vec2.subtract(a, o);
    return -d.x / d.y;
  },
  project: function project(a, b) {
    var normalizedScalarProjection = (a.x * b.x + a.y * b.y) / (b.x * b.x + b.y * b.y);
    return {
      x: b.x * normalizedScalarProjection,
      y: b.y * normalizedScalarProjection
    };
  },
  pointAt: function pointAt(a) {
    var len = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
    var o = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {
      x: 0,
      y: 0
    };
    var d = Vec2.subtract(a, o);
    var n = Vec2.normalize(d);
    var p2 = Vec2.multiplyScalar(n, len);
    return Vec2.add(p2, o);
  },
  easeInOutSine: function easeInOutSine(x) {
    return -(Math.cos(Math.PI * x) - 1) * .5;
  },
  easeInSine: function easeInSine(x) {
    return 1 - Math.cos(x * Math.PI * .5);
  },
  easeOutSine: function easeOutSine(x) {
    return Math.sin(x * Math.PI * .5);
  }
};

var FlipBook = /*#__PURE__*/function () {
  function FlipBook() {
    var pageWidth = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 300;
    var pageHeight = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 300;

    _classCallCheck(this, FlipBook);

    _defineProperty(this, "contents", []);

    _defineProperty(this, "pages", [null]);

    _defineProperty(this, "direction", {
      x: 0,
      y: 0
    });

    _defineProperty(this, "corner", {
      x: 0,
      y: 0
    });

    _defineProperty(this, "page", 1);

    this.pageWidth = pageWidth;
    this.pageHeight = pageHeight;
  }

  _createClass(FlipBook, [{
    key: "setPageContent",
    value: function setPageContent(pageNumber, blob) {
      contents[pageNumber] = blob;
    }
  }, {
    key: "setPage",
    value: function setPage(num, sprite) {
      var deviceRatio = 1 / (window.devicePixelRatio || 1);
      sprite.scale.set(deviceRatio, deviceRatio);
      this.pages[num] = sprite;
    }
  }, {
    key: "start",
    value: function start(p) {
      //find hover zone
      this.direction.x = p.x < 0 ? -1 : 1;
      this.direction.y = p.y < 0 ? -1 : 1;
      this.corner = {
        x: this.pageWidth * this.direction.x,
        y: this.pageHeight * 0.5 * this.direction.y
      };
    }
  }, {
    key: "move",
    value: function move(p) {
      var p1 = Vec2.subtract(p, this.corner);
      var mx = this.pageWidth * -this.direction.x;
      var my = this.pageHeight * -this.direction.y;

      var _FlipBook$getMaskPoin = FlipBook.getMaskPoints(p1, my),
          p2 = _FlipBook$getMaskPoin.p2,
          p3 = _FlipBook$getMaskPoin.p3,
          p4 = _FlipBook$getMaskPoin.p4,
          p5 = _FlipBook$getMaskPoin.p5,
          p6 = _FlipBook$getMaskPoin.p6; //limit p3, p5


      var p3x = p3.x * -this.direction.x;

      if (p3x > this.pageWidth || p3x < 0) {
        p3.x = mx;
        var np = FlipBook.getMaskPoints(Vec2.pointAt(p1, this.pageWidth, p3), my);
        Vec2.assign(p1, np.p1);
        Vec2.assign(p2, np.p2);
        Vec2.assign(p3, np.p3);
        Vec2.assign(p4, np.p4);
        Vec2.assign(p5, np.p5);
        Vec2.assign(p6, np.p6);
      }

      if (p5.x * -this.direction.x > this.pageWidth) {
        p5.x = mx;
        Vec2.assign(p6, Vec2.pointAt(p6, this.pageWidth, p5));
        Vec2.assign(p1, Vec2.pointAt(Vec2.pointSlope(Vec2.perpendicularSlope(p6, p5), p6, 0, null), this.pageHeight, p6));
        var ap1x = p1.x * -this.direction.x;
        var tolerance = 25;

        if (ap1x < tolerance) {
          var ratio = Math.max(ap1x / tolerance, 0);
          p1.y = p1.y * Vec2.easeOutSine(ratio);
        }

        var _np = FlipBook.getMaskPoints(p1, my);

        Vec2.assign(p1, _np.p1);
        Vec2.assign(p2, _np.p2);
        Vec2.assign(p3, _np.p3);
        Vec2.assign(p4, _np.p4);
        Vec2.assign(p5, _np.p5);
        Vec2.assign(p6, _np.p6);
      }

      return {
        p1: p1,
        p2: p2,
        p3: p3,
        p4: p4,
        p5: p5,
        p6: p6
      };
    }
  }], [{
    key: "getMaskPoints",
    value: function getMaskPoints(p1, maxY) {
      var p2 = Vec2.multiplyScalar(p1, .5);
      var m2 = Vec2.perpendicularSlope(p2);
      var p3 = Vec2.pointSlope(m2, p2, null, 0);
      var p4 = Vec2.pointSlope(m2, p2, 0, null);
      var p5 = Vec2.pointSlope(m2, p2, null, maxY);
      var p6 = Vec2.add(Vec2.project(Vec2.subtract(p5, p1), Vec2.subtract(p4, p1)), p1);
      return {
        p1: p1,
        p2: p2,
        p3: p3,
        p4: p4,
        p5: p5,
        p6: p6
      };
    }
  }]);

  return FlipBook;
}();

var Vec2Debug = /*#__PURE__*/function () {
  function Vec2Debug() {
    _classCallCheck(this, Vec2Debug);
  }

  _createClass(Vec2Debug, null, [{
    key: "drawPoint",
    value: function drawPoint(graphics, color, size, a) {
      var o = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {
        x: 0,
        y: 0
      };
      var offsetA = Vec2.add(o, a);
      graphics.beginFill(color).drawCircle(offsetA.x, offsetA.y, size).endFill();
      return offsetA;
    }
  }, {
    key: "drawLine",
    value: function drawLine(graphics, color, width, alpha, a, b) {
      var o = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : {
        x: 0,
        y: 0
      };
      var oa = Vec2.add(o, a);
      var ob = Vec2.add(o, b);
      graphics.lineStyle({
        width: width,
        color: color,
        alpha: alpha
      }).moveTo(oa.x, oa.y).lineTo(ob.x, ob.y).endFill();
      return {
        oa: oa,
        ob: ob
      };
    }
  }]);

  return Vec2Debug;
}(); //prepare stage


var _ref = function () {
  var htmlStage = document.getElementById('stage');
  var rect = htmlStage.getBoundingClientRect();
  console.log(rect);
  var app = new PIXI.Application({
    width: rect.width,
    height: rect.height,
    antialias: false,
    backgroundAlpha: 1,
    backgroundColor: 0xEEEEEE,
    resolution: 2
  });
  htmlStage.appendChild(app.view);
  var stageCenter = new PIXI.Container();
  app.stage.addChild(stageCenter);
  stageCenter.x = rect.width * .5;
  stageCenter.y = rect.height * .5;
  var bg = new PIXI.Graphics();
  bg.beginFill(0x222222);
  bg.drawRect(-rect.width * .5, -rect.height * .5, rect.width, rect.height);
  stageCenter.addChild(bg);
  var pagesMask = new PIXI.Graphics();
  stageCenter.addChild(pagesMask);
  var backPages = new PIXI.Container();
  stageCenter.addChild(backPages);
  var pages = new PIXI.Container();
  pages.mask = pagesMask;
  stageCenter.addChild(pages);
  var flipPageMask = new PIXI.Graphics();
  stageCenter.addChild(flipPageMask);
  var flipPage = new PIXI.Container();
  flipPage.mask = flipPageMask;
  stageCenter.addChild(flipPage);
  var flipPageContainer = new PIXI.Container();
  flipPage.addChild(flipPageContainer);
  var grid = new PIXI.Graphics();
  grid.interactive = true;
  stageCenter.addChild(grid);
  var debug = new PIXI.Graphics();
  stageCenter.addChild(debug);
  var dot = new PIXI.Graphics();
  stageCenter.addChild(dot);
  Vec2Debug.drawLine(dot, 0xFFFFFF, 0.5, 0.3, {
    x: 0,
    y: -stageCenter.y
  }, {
    x: 0,
    y: rect.height
  });
  Vec2Debug.drawLine(dot, 0xFFFFFF, 0.5, 0.3, {
    x: -stageCenter.x,
    y: 0
  }, {
    x: rect.width,
    y: 0
  });
  return {
    bg: bg,
    pages: pages,
    pagesMask: pagesMask,
    flipPage: flipPage,
    flipPageContainer: flipPageContainer,
    flipPageMask: flipPageMask,
    backPages: backPages,
    grid: grid,
    debug: debug
  };
}(),
    bg = _ref.bg,
    pages = _ref.pages,
    pagesMask = _ref.pagesMask,
    flipPage = _ref.flipPage,
    flipPageContainer = _ref.flipPageContainer,
    flipPageMask = _ref.flipPageMask,
    backPages = _ref.backPages,
    grid = _ref.grid,
    debug = _ref.debug;

function setFlipPageContent(book) {
  var content = book.direction.x > 0 ? book.pages[book.page + 2] : book.pages[book.page - 1];
  content.x = 0;
  content.y = 0;
  flipPageContainer.x = book.direction.x < 0 ? -book.pageWidth : 0;
  flipPageContainer.y = book.direction.y > 0 ? -book.pageHeight : 0;
  flipPageContainer.addChild(content);
}

function initBook(width, height, grid, debug) {
  var book = new FlipBook(width, height);
  window.book = book;
  var isDragging = false;
  grid.lineStyle({
    width: 1,
    color: 0xFFFFFF,
    alpha: 0.3
  });
  grid.beginFill(0x000000, 0.01);
  grid.drawRect(-book.pageWidth, -book.pageHeight * 0.5, book.pageWidth * 2, book.pageHeight);
  pages.x = -width;
  pages.y = -height * 0.5;
  backPages.x = pages.x;
  backPages.y = pages.y;

  function onDragStart(evt) {
    var pt = evt.data.getLocalPosition(bg);
    book.start(pt);

    if (book.direction.x > 0) {
      var nextBack = book.pages[book.page + 3];
      if (!nextBack) return;
      nextBack.x = book.pageWidth;
      backPages.addChild(nextBack);
    } else {
      var _nextBack = book.pages[book.page - 2];
      if (!_nextBack) return;
      _nextBack.x = 0;
      backPages.addChild(_nextBack);
    }

    isDragging = true;
    setFlipPageContent(book);
  }

  function onDragEnd() {
    if (isDragging === false) return;
    isDragging = false;

    if (book.direction.x > 0) {
      //flip forward
      //send current page to back pages;
      backPages.addChild(book.pages[book.page]); //push flip page to pages;

      book.page += 2;
    } else {
      //flip back
      backPages.addChildAt(book.pages[book.page]);
      book.page -= 2;
    }

    var currentPage = book.pages[book.page];
    if (currentPage) pages.addChild(currentPage);
    var nextPage = book.pages[book.page + 1];

    if (nextPage) {
      pages.addChild(nextPage);
      nextPage.x = book.pageWidth;
    }

    flipPageMask.clear();
    pagesMask.clear();
    debug.clear();
    pagesMask.beginFill(0xFF0000, 1);
    pagesMask.drawRect(-book.pageWidth, -book.pageHeight * .5, book.pageWidth * 2, book.pageHeight);
    pagesMask.endFill();
  }

  grid.on('pointerdown', function (evt) {
    return onDragStart(evt);
  }).on('pointerup', function () {
    return onDragEnd();
  }).on('pointerupoutside', function () {
    return onDragEnd();
  });
  grid.on('pointermove', function (evt) {
    if (!isDragging) return;
    debug.clear();
    pagesMask.clear();
    flipPageMask.clear();
    var pt = evt.data.getLocalPosition(bg);

    var _book$move = book.move(pt),
        p1 = _book$move.p1,
        p2 = _book$move.p2,
        p3 = _book$move.p3,
        p4 = _book$move.p4,
        p5 = _book$move.p5,
        p6 = _book$move.p6;

    var origin = book.corner;
    Vec2Debug.drawPoint(debug, 0xFFFFFF, 3, origin);
    var op1 = Vec2Debug.drawPoint(debug, 0xFF0000, 2, p1, origin);
    var op2 = Vec2Debug.drawPoint(debug, 0xFFFF00, 2, p2, origin);
    var op3 = Vec2Debug.drawPoint(debug, 0x00FF77, 2, p3, origin);
    var op4 = Vec2Debug.drawPoint(debug, 0xFF7700, 2, p4, origin);
    var op5 = Vec2Debug.drawPoint(debug, 0xFF00FF, 2, p5, origin);
    var op6 = Vec2Debug.drawPoint(debug, 0xFF7700, 2, p6, origin);
    var mcx = book.pageWidth * 2 * -book.direction.x;
    var mcy = book.pageHeight * -book.direction.y;
    var oc1 = Vec2.add({
      x: mcx,
      y: 0
    }, origin);
    var oc2 = Vec2.add({
      x: mcx,
      y: mcy
    }, origin);
    var oc3 = Vec2.add({
      x: 0,
      y: mcy
    }, origin);
    flipPage.rotation = Vec2.rotation(op1, op3) + (book.direction.x > 0 ? 0 : Vec2.degreeToRadian(180));
    flipPage.x = op1.x;
    flipPage.y = op1.y;
    flipPageMask.beginFill(0xFF0000, 1).drawPolygon(origin.x < 0 && p5.x < 0 || origin.x > 0 && p5.x > 0 ? [op1, op4, op3] : [op1, op6, op5, op3]).endFill();
    pagesMask.beginFill(0xFF0000, 1).drawPolygon(origin.x < 0 && p5.x < 0 || origin.x > 0 && p5.x > 0 ? [oc1, oc2, oc3, op4, op3] : [oc1, oc2, op5, op3]).endFill();
    debug.beginFill(0xFFFFFF, 0.2) //    .drawPolygon([pt, oe1, oe2])
    .drawPolygon(origin.x < 0 && p5.x < 0 || origin.x > 0 && p5.x > 0 ? [op1, op4, op3] : [op1, op6, op5, op3]).endFill(); //line from p1 to origin

    Vec2Debug.drawLine(debug, 0xFFFFFF, 1, 0.1, p1, {
      x: 0,
      y: 0
    }, origin);
    Vec2Debug.drawLine(debug, 0xFFFFFF, 1, 0.1, p2, p4, origin);
  });
  return book;
}

var doc = pdfjsLib.getDocument('/media/pdf/test.pdf');

function getBlob(canvas) {
  return new Promise(function (resolve, reject) {
    try {
      canvas.toBlob(function (blob) {
        resolve(blob);
      });
    } catch (e) {
      reject(e);
    }
  });
}

doc.promise.then(function (pdf) {
  //suggest width
  var w = window.innerWidth * 0.5 * 0.8;
  var h = window.innerHeight * 0.8;
  window.pdf = pdf;
  renderPdf(pdf, w, h).then(function () {});
});
//# sourceMappingURL=main.js.map