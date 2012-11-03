//----------------------------------------------------------------------
//
// ECMAScript "Harmony" Polyfills
//
//----------------------------------------------------------------------

(function (global) {
  "use strict";

  // Snapshot intrinsic functions

  var global_isNaN = global.isNaN,
      global_isFinite = global.isFinite,
      global_parseInt = global.parseInt,
      global_parseFloat = global.parseFloat;

  var E = Math.E,
      LOG10E = Math.LOG10E,
      LOG2E = Math.LOG2E,
      abs = Math.abs,
      ceil = Math.ceil,
      exp = Math.exp,
      floor = Math.floor,
      log = Math.log,
      pow = Math.pow,
      sqrt = Math.sqrt;

  // Approximations of internal ECMAScript functions
  var ECMAScript = (function () {
    var ophop = Object.prototype.hasOwnProperty;
    return {
      HasProperty: function (o, p) { return p in o; },
      HasOwnProperty: function (o, p) { return ophop.call(o, p); },
      IsCallable: function (o) { return typeof o === 'function'; },
      IsConstructor: function (o) { return typeof o === 'function'; }, // TODO: Define
      ToInteger: function (n) {
        n = Number(n);
        if (global_isNaN(n)) { return 0; }
        if (n === 0 || n === Infinity || n === -Infinity) { return n; }
        return ((n < 0) ? -1 : 1) * floor(abs(n));
      },
      ToInt32: function (v) { return v >> 0; },
      ToUint32: function (v) { return v >>> 0; },
      SameValue: function (x, y) {
        if (typeof x !== typeof y) {
          return false;
        }
        switch (typeof x) {
        case 'undefined':
          return true;
        case 'null':
          return true;
        case 'number':
          if (global_isNaN(x) && global_isNaN(y)) { return true; }
          if (x === 0 && y === 0) { return 1/x === 1/y; }
          return x === y;
        case 'boolean':
        case 'string':
        case 'object':
        default:
          return x === y;
        }
      }
    };
  }());

  // Helpers

  function hook(o, p, f) {
    var op = o[p];
    if (typeof op !== 'function') { throw new TypeError("Not a function"); }
    o[p] = function() {
      var r = f.apply(this, arguments);
      return r !== (void 0) ? r : op.apply(this, arguments);
    };
  }

  function defineFunctionProperty(o, p, f) {
    if (!(p in o)) {
      Object.defineProperty(o, p, {
        value: f,
        configurable: true,
        enumerable: false,
        writable: true
      });
    }
  }

  function defineValueProperty(o, p, c) {
    if (!(p in o)) {
      Object.defineProperty(o, p, {
        value: c,
        configurable: false,
        enumerable: false,
        writable: false
      });
    }
  }


  //----------------------------------------------------------------------
  //
  // ECMAScript 6 Draft
  // http://wiki.ecmascript.org/doku.php?id=harmony:specification_drafts
  //
  //----------------------------------------------------------------------

  // Object.prototype.toString
  hook(Object.prototype, 'toString', function() {
    return (this === Object(this) && '@@toStringTag' in this) ? '[object ' + this['@@toStringTag'] + ']' : (void 0);
  });

  // NOTE: Since true iterators can't be polyfilled, this is a hack
  global.StopIteration = global.StopIteration || (function () {
    function StopIterationClass() {}
    StopIterationClass.prototype = {'@@toStringTag': 'StopIteration'};
    return new StopIterationClass;
  }());


  //----------------------------------------
  // Properties of the Object Constructor
  //----------------------------------------

  // TODO: Make sure these get added as functions, not just operators.
  defineFunctionProperty(
    Object, 'is',
    function is(x, y) {
      return ECMAScript.SameValue(x, y);
    });

  // TODO: Make sure these get added as functions, not just operators.
  defineFunctionProperty(
    Object, 'isnt',
    function isnt(x, y) {
      return !ECMAScript.SameValue(x, y);
    });

  defineFunctionProperty(
    Object, 'assign',
    function assign(target, source) {
      target = Object(target);
      source = Object(source);
      Object.keys(source).forEach(function(key) {
        target[key] = source[key];
      });
      return target;
    });

  // Removed from latest ES6 drafts
  if (false) {
    defineFunctionProperty(
      Object, 'isObject',
      function isObject(o) {
        var t = typeof o;
        return t !== 'undefined' && t !== 'boolean' && t !== 'number' && t !== 'string' && o !== null;
      });
  }

  //----------------------------------------
  // Properties of the Number Constructor
  //----------------------------------------

  defineValueProperty(
    Number, 'EPSILON',
    (function () {
      var next, result;
      for (next = 1; 1 + next !== 1; next = next / 2) {
        result = next;
      }
      return result;
    }()));

  defineValueProperty(
    Number, 'MAX_INTEGER',
    9007199254740991); // 2^53 - 1

  defineFunctionProperty(
    Number, 'parseFloat',
    function parseFloat(string) {
      return global_parseFloat(string);
    });

  defineFunctionProperty(
    Number,
    'parseInt',
    function parseInt(string) {
      return global_parseInt(string);
    });

  defineFunctionProperty(
    Number, 'isFinite',
    function isFinite(value) {
      return typeof value === 'number' && global_isFinite(value);
    });

  defineFunctionProperty(
    Number, 'isNaN',
    function isNaN(value) {
      return typeof value === 'number' && global_isNaN(value);
    });

  defineFunctionProperty(
    Number, 'isInteger',
    function isInteger(number) {
      if (typeof number !== 'number') {
        return false;
      }
      var integer = ECMAScript.ToInteger(number);
      if (integer !== number) {
        return false;
      }
      return true;
    });

  defineFunctionProperty(
    Number, 'toInt',
    function toInt(value) {
      return ECMAScript.ToInteger(value);
    });


  //----------------------------------------
  // Properties of the Number Prototype Object
  //----------------------------------------

  defineFunctionProperty(
    Number.prototype, 'clz',
    function clz() {

      function clz8(x) {
        return (x & 0xf0) ? (x & 0x80 ? 0 : x & 0x40 ? 1 : x & 0x20 ? 2 : 3) :
        (x & 0x08 ? 4 : x & 0x04 ? 5 : x & 0x02 ? 6 : x & 0x01 ? 7 : 8);
      }

      var x = Number(this);
      x = ECMAScript.ToUint32(x);
      return x & 0xff000000 ? clz8(x >> 24) :
        x & 0xff0000 ? clz8(x >> 16) + 8 :
        x & 0xff00 ? clz8(x >> 8) + 16 : clz8(x) + 24;
    });


  //----------------------------------------
  // Properties of the String Prototype Object
  //----------------------------------------

  defineFunctionProperty(
    String.prototype, 'repeat',
    function repeat(count) {
      // var string = '' + this;
      // count = ECMAScript.ToInteger(count);
      // var result = ';
      // while (--count >= 0) {
      //     result += string;
      // }
      // return result;
      count = ECMAScript.ToInteger(count);
      var a = [];
      a.length = count + 1;
      return a.join(String(this));
    });

  defineFunctionProperty(
    String.prototype, 'startsWith',
    function startsWith(s) {
      s = String(s);
      return String(this).substring(0, s.length) === s;
    });

  defineFunctionProperty(
    String.prototype, 'endsWith',
    function endsWith(s) {
      s = String(s);
      var t = String(this);
      return t.substring(t.length - s.length) === s;
    });

  defineFunctionProperty(
    String.prototype, 'contains',
    function contains(searchString, position) {
      return String(this).indexOf(searchString, position) !== -1;
    });


  //----------------------------------------
  // Function Properties of the Math Object
  //----------------------------------------

  defineFunctionProperty(
    Math, 'log10',
    function log10(x) {
      x = Number(x);
      return log(x) * LOG10E;
    });

  defineFunctionProperty(
    Math, 'log2',
    function log2(x) {
      x = Number(x);
      return log(x) * LOG2E;
    });

  defineFunctionProperty(
    Math, 'log1p',
    function log1p(x) {
      x = Number(x);
      // from: http://www.johndcook.com/cpp_expm1.html
      if (x < -1) {
        return NaN;
      } else if (ECMAScript.SameValue(x, -0)) {
        return -0;
      } else if (abs(x) > 1e-4) {
        return log(1 + x);
      } else {
        return (-0.5 * x + 1) * x;
      }
    });

  defineFunctionProperty(
    Math, 'expm1',
    function expm1(x) {
      x = Number(x);
      // from: http://www.johndcook.com/cpp_log1p.html
      if (ECMAScript.SameValue(x, -0)) {
        return -0;
      } else if (abs(x) < 1e-5) {
        return x + 0.5 * x * x; // two terms of Taylor expansion
      } else {
        return exp(x) - 1;
      }
    });

  defineFunctionProperty(
    Math, 'cosh',
    function cosh(x) {
      x = Number(x);
      return (pow(E, x) + pow(E, -x)) / 2;
    });

  defineFunctionProperty(
    Math, 'sinh',
    function sinh(x) {
      x = Number(x);
      return ECMAScript.SameValue(x, -0) ? x : (pow(E, x) - pow(E, -x)) / 2;
    });

  defineFunctionProperty(
    Math, 'tanh',
    function tanh(x) {
      x = Number(x);
      var n = pow(E, 2 * x) - 1,
          d = pow(E, 2 * x) + 1;
      return ECMAScript.SameValue(x, -0) ? x : (n === d) ? 1 : n / d; // Handle Infinity/Infinity
    });

  defineFunctionProperty(
    Math, 'acosh',
    function acosh(x) {
      x = Number(x);
      return log(x + sqrt(x * x - 1));
    });

  defineFunctionProperty(
    Math, 'asinh',
    function asinh(x) {
      x = Number(x);
      if (ECMAScript.SameValue(x, -0)) {
        return x;
      }
      var s = sqrt(x * x + 1);
      return (s === -x) ? log(0) : log(x + s);
    });

  defineFunctionProperty(
    Math, 'atanh',
    function atanh(x) {
      x = Number(x);
      return (x === 0) ? x : log((1 + x) / (1 - x)) / 2;
    });

  defineFunctionProperty(
    Math, 'hypot',
    function hypot(x, y, z) {
      function isInfinite(x) { return x === Infinity || x === -Infinity; }
      if (arguments.length < 3) {
        x = Number(x);
        y = Number(y);
        if (isInfinite(x) || isInfinite(y)) {
          return Infinity;
        }
        if (global_isNaN(x) || global_isNaN(y)) {
          return NaN;
        }
        return sqrt(x*x + y*y);
      } else {
        x = Number(x);
        y = Number(y);
        z = Number(z);
        if (isInfinite(x) || isInfinite(y) || isInfinite(z)) {
          return Infinity;
        }
        if (global_isNaN(x) || global_isNaN(y) || global_isNaN(z)) {
          return NaN;
        }
        return sqrt(x*x + y*y + z*z);
      }
    });

  defineFunctionProperty(
    Math, 'trunc',
    function trunc(x) {
      x = Number(x);
      return global_isNaN(x) ? NaN :
        x < 0 ? ceil(x) : floor(x);
    });

  defineFunctionProperty(
    Math, 'sign',
    function sign(x) {
      x = Number(x);
      return x < 0 ? -1 : x > 0 ? 1 : x;
    });

  defineFunctionProperty(
    Math, 'cbrt',
    function sign(x) {
      x = Number(x);
      if (global_isNaN(x/x)) {
        return x;
      }
      var r = pow( abs(x), 1/3 );
      var t = x/r/r;
      return r + (r * (t-r) / (2*r + t));
    });


  //----------------------------------------
  // Properties of the Array Constructor
  //----------------------------------------

  defineFunctionProperty(
    Array, 'of',
    function of() {
      var items = arguments;
      var lenValue = items.length;
      var len = ECMAScript.ToUint32(lenValue);
      var c = this, a;
      if (ECMAScript.IsConstructor(c)) {
        a = new c(len);
        a = Object(a);
      } else {
        a = new Array(len);
      }
      var k = 0;
      while (k < len) {
        a[k] = items[k];
        k += 1;
      }
      a.length = len;
      return a;
      return Array.from(arguments);
    });

  defineFunctionProperty(
    Array, 'from',
    function from(arrayLike) {
      var items = Object(arrayLike);
      var lenValue = items.length;
      var len = ECMAScript.ToUint32(lenValue);
      var c = this, a;
      if (ECMAScript.IsConstructor(c)) {
        a = new c(len);
        a = Object(a);
      } else {
        a = new Array(len);
      }
      var k = 0;
      while (k < len) {
        a[k] = items[k];
        k += 1;
      }
      a.length = len;
      return a;
    });

  //----------------------------------------
  // Properties of the Array Prototype Object
  //----------------------------------------

  (function() {
    defineFunctionProperty(
      Array.prototype, 'items',
      function items() {
        return CreateArrayIterator(this, "key+value");
      });
    defineFunctionProperty(
      Array.prototype, 'keys',
      function keys() {
        return CreateArrayIterator(this, "key");
      });
    defineFunctionProperty(
      Array.prototype, 'values',
      function values() {
        return CreateArrayIterator(this, "value");
      });
    defineFunctionProperty(
      Array.prototype, '@@iterator',
      Array.prototype.items
    );

    function CreateArrayIterator(array, kind) {
      return new ArrayIterator(array, 0, kind);
    }

    function ArrayIterator(object, nextIndex, kind) {
      this.iteratedObject = object;
      this.nextIndex = nextIndex;
      this.iterationKind = kind;
    }
    ArrayIterator.prototype = {'@@toStringTag': 'Array Iterator'};
    defineFunctionProperty(
      ArrayIterator.prototype, 'next',
      function() {
        if (typeof this !== 'object') { throw new TypeError; }
        var a = this.iteratedObject,
            index = this.nextIndex,
            itemKind = this.iterationKind,
            lenValue = a.length,
            len = ECMAScript.ToUint32(lenValue),
            elementKey,
            elementValue;
        if (itemKind.indexOf("sparse") !== -1) {
          var found = false;
          while (!found && index < len) {
            elementKey = String(index);
            found = ECMAScript.HasProperty(a, elementKey);
            if (!found) {
              index += 1;
            }
          }
        }
        if (index >= len) {
          this.nextIndex = Infinity;
          throw global.StopIteration;
        }
        elementKey = String(index);
        this.nextIndex = index + 1;
        if (itemKind.indexOf("value") !== -1) {
          elementValue = a[elementKey];
        }
        if (itemKind.indexOf("key+value") !== -1) {
          return [elementKey, elementValue];
        } else if (itemKind.indexOf("key") !== -1) {
          return elementKey;
        } else if (itemKind === "value") {
          return elementValue;
        }
        throw new Error("Internal error");
      });
    defineFunctionProperty(
      ArrayIterator.prototype, '@@iterator',
      function() {
        return this;
      });
  }());


  //----------------------------------------
  // Collections: Maps, Sets, and WeakMaps
  //----------------------------------------

  (function() {
    /** @constructor */
    function Map(iterable) {
      if (!(this instanceof Map)) { return new Map(iterable); }

      this._mapData = { keys: [], values: [] };

      if (iterable) {
        iterable = Object(iterable);
        var it = iterable['@@iterator'](); // or throw...
        try {
          while (true) {
            var next = it.next();
            this.set(next[0], next[1]);
          }
        } catch (ex) {
          if (ex !== global.StopIteration) {
            throw ex;
          }
        }
      }

      return this;
    }

    function indexOf(mapData, key) {
      var i;
      if (key === key && key !== 0) {
        return mapData.keys.indexOf(key);
      }
      // Slow case for NaN/+0/-0
      for (i = 0; i < mapData.keys.length; i += 1) {
        if (ECMAScript.SameValue(mapData.keys[i], key)) { return i; }
      }
      return -1;
    }

    Map.prototype = {'@@toStringTag': 'Map'};
    defineFunctionProperty(
      Map.prototype, 'clear',
      function clear() {
        this._mapData.keys.length = 0;
        this._mapData.values.length = 0;
        if (this.size !== this._mapData.keys.length) { this.size = this._mapData.keys.length; }
      });
    defineFunctionProperty(
      Map.prototype, 'delete',
      function deleteFunction(key) {
        var i = indexOf(this._mapData, key);
        if (i < 0) { return false; }
        this._mapData.keys.splice(i, 1);
        this._mapData.values.splice(i, 1);
        if (this.size !== this._mapData.keys.length) { this.size = this._mapData.keys.length; }
        return true;
      });
    defineFunctionProperty(
      Map.prototype, 'forEach',
      function forEach(callbackfn /*, thisArg*/) {
        var thisArg = arguments[1];
        var m = Object(this);
        if (!ECMAScript.IsCallable(callbackfn)) {
          throw new TypeError("First argument to forEach is not callable.");
        }
        for (var i = 0; i < this._mapData.keys.length; ++i) {
          callbackfn.call(thisArg, this._mapData.keys[i], this._mapData.values[i], m);
        }
      });
    defineFunctionProperty(
      Map.prototype, 'get',
      function get(key) {
        var i = indexOf(this._mapData, key);
        return i < 0 ? undefined : this._mapData.values[i];
      });
    defineFunctionProperty(
      Map.prototype, 'has',
      function has(key) {
        return indexOf(this._mapData, key) >= 0;
      });
    defineFunctionProperty(
      Map.prototype, 'items',
      function items() {
        return CreateMapIterator(Object(this), "key+value");
      });
    defineFunctionProperty(
      Map.prototype, 'keys',
      function keys() {
        return CreateMapIterator(Object(this), "key");
      });
    defineFunctionProperty(
      Map.prototype, 'set',
      function set(key, val) {
        var i = indexOf(this._mapData, key);
        if (i < 0) { i = this._mapData.keys.length; }
        this._mapData.keys[i] = key;
        this._mapData.values[i] = val;
        if (this.size !== this._mapData.keys.length) { this.size = this._mapData.keys.length; }
      });
    Object.defineProperty(
      Map.prototype, 'size', {
        get: function() {
          return this._mapData.keys.length;
        }
      });
    defineFunctionProperty(
      Map.prototype, 'values',
      function values() {
        return CreateMapIterator(Object(this), "value");
      });
    defineFunctionProperty(
      Map.prototype, '@@iterator',
      function() {
        return CreateMapIterator(Object(this), "key+value");
      });

    function CreateMapIterator(map, kind) {
      map = Object(map);
      return new MapIterator(map, 0, kind);
    }

    /** @constructor */
    function MapIterator(object, index, kind) {
      this._iterationObject = object;
      this._nextIndex = index;
      this._iterationKind = kind;
    }
    MapIterator.prototype = {'@@toStringTag': 'Map Iterator'};
    defineFunctionProperty(
      MapIterator.prototype, 'next',
      function() {
        if (typeof this !== 'object') { throw new TypeError(); }
        var m = this._iterationObject,
            index = this._nextIndex,
            itemKind = this._iterationKind,
            entries = m._mapData;
        while (index < entries.keys.length) {
          var e = {key: entries.keys[index], value: entries.values[index]};
          index = index += 1;
          this._nextIndex = index;
          if (e.key !== undefined) { // |empty| ?
            if (itemKind === "key") {
              return e.key;
            } else if (itemKind === "value") {
              return e.value;
            } else {
              return [e.key, e.value];
            }
          }
        }
        throw global.StopIteration;
      });
    defineFunctionProperty(
      MapIterator.prototype, '@@iterator',
      function() {
        return this;
      });

    global.Map = global.Map || Map;
  }());

  (function() {
    /** @constructor */
    function Set(iterable) {
      if (!(this instanceof Set)) { return new Set(iterable); }

      this._setData = [];

      if (iterable) {
        iterable = Object(iterable);
        var it = ECMAScript.HasProperty(iterable, "values") ? iterable.values() : iterable['@@iterator'](); // or throw...
        try {
          while (true) {
            var next = it.next();
            // Spec has next = ToObject(next) here
            this.add(next);
          }
        } catch (ex) {
          if (ex !== global.StopIteration) {
            throw ex;
          }
        }
      }

      return this;
    }

    function indexOf(setData, key) {
      var i;
      if (key === key && key !== 0) {
        return setData.indexOf(key);
      }
      // Slow case for NaN/+0/-0
      for (i = 0; i < setData.length; i += 1) {
        if (ECMAScript.SameValue(setData[i], key)) { return i; }
      }
      return -1;
    }

    Set.prototype = {'@@toStringTag': 'Set'};
    defineFunctionProperty(
      Set.prototype, 'add',
      function add(key) {
        var i = indexOf(this._setData, key);
        if (i < 0) { i = this._setData.length; }
        this._setData[i] = key;
        if (this.size !== this._setData.length) { this.size = this._setData.length; }
      });
    defineFunctionProperty(
      Set.prototype, 'clear',
      function clear() {
        this._setData = [];
        if (this.size !== this._setData.length) { this.size = this._setData.length; }
      });
    defineFunctionProperty(
      Set.prototype, 'delete',
      function deleteFunction(key) {
        var i = indexOf(this._setData, key);
        if (i < 0) { return false; }
        this._setData.splice(i, 1);
        if (this.size !== this._setData.length) { this.size = this._setData.length; }
        return true;
      });
    defineFunctionProperty(
      Set.prototype, 'forEach',
      function forEach(callbackfn/*, thisArg*/) {
        var thisArg = arguments[1];
        var s = Object(this);
        if (!ECMAScript.IsCallable(callbackfn)) {
          throw new TypeError("First argument to forEach is not callable.");
        }
        for (var i = 0; i < this._setData.length; ++i) {
          callbackfn.call(thisArg, this._setData[i], s);
        }
      });
    defineFunctionProperty(
      Set.prototype, 'has',
      function has(key) {
        return indexOf(this._setData, key) !== -1;
      });
    Object.defineProperty(
      Set.prototype, 'size', {
        get: function() {
          return this._setData.length;
        }
      });
    defineFunctionProperty(
      Set.prototype, 'values',
      function values() {
        return CreateSetIterator(Object(this));
      });
    defineFunctionProperty(
      Set.prototype, '@@iterator',
      function() {
        return CreateSetIterator(Object(this));
      });

    function CreateSetIterator(set) {
      set = Object(set);
      return new SetIterator(set, 0);
    }

    /** @constructor */
    function SetIterator(set, index) {
      this.set = set;
      this.nextIndex = index;
    }
    SetIterator.prototype = {'@@toStringTag': 'Set Iterator'};
    defineFunctionProperty(
      SetIterator.prototype, 'next',
      function() {
        if (typeof this !== 'object') { throw new TypeError; }
        var s = this.set,
            index = this.nextIndex,
            entries = s._setData;
        while (index < entries.length) {
          var e = entries[index];
          index = index += 1;
          this.nextIndex = index;
          if (e !== undefined) { // |empty| ?
            return e;
          }
        }
        throw global.StopIteration;
      });
    defineFunctionProperty(
      SetIterator.prototype, '@@iterator',
      function() {
        return this;
      });

    global.Set = global.Set || Set;
  }());

  (function() {
    // Inspired by https://gist.github.com/1638059
    /** @constructor */
    function EphemeronTable() {
      var secretKey = Object.create(null);

      function conceal(o) {
        var oValueOf = o.valueOf, secrets = Object.create(null);
        o.valueOf = (function(secretKey) {
          return function (k) {
            return (k === secretKey) ? secrets : oValueOf.apply(o, arguments);
          };
        }(secretKey));
        return secrets;
      }

      function reveal(o) {
        var v = o.valueOf(secretKey);
        return v === o ? null : v;
      }

      this.clear = function() {
        secretKey = Object.create(null);
      };
      this.remove = function(key) {
        var secrets = reveal(key);
        if (secrets) {
          delete secrets.value;
        }
      };
      this.get = function(key, defaultValue) {
        var secrets = reveal(key);
        return (secrets && ECMAScript.HasOwnProperty(secrets, 'value')) ? secrets.value : defaultValue;
      };
      this.has = function(key) {
        var secrets = reveal(key);
        return Boolean(secrets && ECMAScript.HasOwnProperty(secrets, 'value'));
      };
      this.set = function(key, value) {
        var secrets = reveal(key) || conceal(key);
        secrets.value = value;
      };
    }

    /** @constructor */
    function WeakMap(iterable) {
      if (!(this instanceof WeakMap)) { return new WeakMap(iterable); }

      this._table = new EphemeronTable;

      if (iterable) {
        iterable = Object(iterable);
        var it = iterable['@@iterator'](); // or throw...
        try {
          while (true) {
            var next = it.next();
            this.set(next[0], next[1]);
          }
        } catch (ex) {
          if (ex !== global.StopIteration) {
            throw ex;
          }
        }
      }

      return this;
    }

    WeakMap.prototype = {'@@toStringTag': 'WeakMap'};
    defineFunctionProperty(
      WeakMap.prototype, 'clear',
      function clear() {
        this._table.clear();
      });
    defineFunctionProperty(
      WeakMap.prototype, 'delete',
      function deleteFunction(key) {
        if (key !== Object(key)) { throw new TypeError("Expected object"); }
        this._table.remove(key);
      });
    defineFunctionProperty(
      WeakMap.prototype, 'get',
      function get(key, defaultValue) {
        if (key !== Object(key)) { throw new TypeError("Expected object"); }
        return this._table.get(key, defaultValue);
      });
    defineFunctionProperty(
      WeakMap.prototype, 'has',
      function has(key) {
        if (key !== Object(key)) { throw new TypeError("Expected object"); }
        return this._table.has(key);
      });
    defineFunctionProperty(
      WeakMap.prototype, 'set',
      function set(key, value) {
        if (key !== Object(key)) { throw new TypeError("Expected object"); }
        this._table.set(key, value);
      });

    global.WeakMap = global.WeakMap || WeakMap;
  }());

  //----------------------------------------------------------------------
  //
  // ECMAScript Strawman Proposals
  //
  //----------------------------------------------------------------------

  // http://wiki.ecmascript.org/doku.php?id=strawman:number_compare
  defineFunctionProperty(
    Number, 'compare',
    function compare(first, second, tolerance) {
      var difference = first - second;
      return abs(difference) <= (tolerance || 0) ? 0 : difference < 0 ? -1 : 1;
    });


  // http://wiki.ecmascript.org/doku.php?id=strawman:array.prototype.pushall
  defineFunctionProperty(
    Array.prototype, 'pushAll',
    function pushAll(other, start, end) {
      other = Object(other);
      if (typeof start === 'undefined') {
        start = 0;
      }
      start = ECMAScript.ToUint32(start);
      var otherLength = ECMAScript.ToUint32(other.length);
      if (typeof end === 'undefined') {
        end = otherLength;
      }
      end = ECMAScript.ToUint32(end);
      var self = Object(this);
      var length = ECMAScript.ToUint32(self.length);
      for (var i = 0, j = length; i < end; i++, j++) {
        self[j] = other[i];
      }
      self.length = j;
      return;
    });

  // es-discuss: DOMStringList replacement
  defineFunctionProperty(
    Array.prototype, 'contains',
    function contains(target) {
      if (this === void 0 || this === null) { throw new TypeError(); }
      var t = Object(this),
          len = ECMAScript.ToUint32(t.length),
          i;
      for (i = 0; i < len; i += 1) {
        // eval("0 in [undefined]") == false in IE8-
        if (/*i in t &&*/ ECMAScript.SameValue(t[i], target)) {
          return true;
        }
      }
      return false;
    });

  // http://norbertlindenberg.com/2012/05/ecmascript-supplementary-characters/index.html
  defineFunctionProperty(
    String, 'fromCodePoint',
    function fromCodePoint() {
      var chars = [], i;
      for (i = 0; i < arguments.length; i++) {
        var c = Number(arguments[i]);
        if (!isFinite(c) || c < 0 || c > 0x10FFFF || floor(c) !== c) {
          throw new RangeError("Invalid code point " + c);
        }
        if (c < 0x10000) {
          chars.push(c);
        } else {
          c -= 0x10000;
          chars.push((c >> 10) + 0xD800);
          chars.push((c % 0x400) + 0xDC00);
        }
      }
      return String.fromCharCode.apply(undefined, chars);
    });

  // http://norbertlindenberg.com/2012/05/ecmascript-supplementary-characters/index.html
  defineFunctionProperty(
    String.prototype, 'codePointAt',
    function codePointAt(index) {
      var str = String(this);
      if (index < 0 || index >= str.length) {
        return undefined;
      }
      var first = str.charCodeAt(index);
      if (first >= 0xD800 && first <= 0xDBFF && str.length > index + 1) {
        var second = str.charCodeAt(index + 1);
        if (second >= 0xDC00 && second <= 0xDFFF) {
          return ((first - 0xD800) << 10) + (second - 0xDC00) + 0x10000;
        }
      }
      return first;
    });

  // http://norbertlindenberg.com/2012/05/ecmascript-supplementary-characters/index.html
  (function() {
    defineFunctionProperty(
      String.prototype, '@@iterator',
      function items() {
        return CreateStringIterator(this);
      });

    function CreateStringIterator(string) {
      return new StringIterator(string, 0);
    }

    /** @constructor */
    function StringIterator(object, nextIndex) {
      this.iteratedObject = object;
      this.nextIndex = nextIndex;
    }
    StringIterator.prototype = {'@@toStringTag': 'String Iterator'};
    defineFunctionProperty(
      StringIterator.prototype, 'next',
      function() {
        var s = String(this.iteratedObject),
            index = this.nextIndex,
            len = s.length;
        if (index >= len) {
          this.nextIndex = Infinity;
          throw global.StopIteration;
        }
        var cp = s.codePointAt(index);
        this.nextIndex += cp > 0xFFFF ? 2 : 1;
        return String.fromCodePoint(cp);
      });
    defineFunctionProperty(
      StringIterator.prototype, '@@iterator',
      function() {
        return this;
      });
  }());

}(self));
