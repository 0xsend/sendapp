(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.WebAuthnAuthenticator = {}));
})(this, (function (exports) { 'use strict';

  const global = window;

  var global$1 = (typeof global !== "undefined" ? global :
    typeof self !== "undefined" ? self :
    typeof window !== "undefined" ? window : {});

  var lookup = [];
  var revLookup = [];
  var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
  var inited = false;
  function init () {
    inited = true;
    var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    for (var i = 0, len = code.length; i < len; ++i) {
      lookup[i] = code[i];
      revLookup[code.charCodeAt(i)] = i;
    }

    revLookup['-'.charCodeAt(0)] = 62;
    revLookup['_'.charCodeAt(0)] = 63;
  }

  function toByteArray (b64) {
    if (!inited) {
      init();
    }
    var i, j, l, tmp, placeHolders, arr;
    var len = b64.length;

    if (len % 4 > 0) {
      throw new Error('Invalid string. Length must be a multiple of 4')
    }

    // the number of equal signs (place holders)
    // if there are two placeholders, than the two characters before it
    // represent one byte
    // if there is only one, then the three characters before it represent 2 bytes
    // this is just a cheap hack to not do indexOf twice
    placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0;

    // base64 is 4/3 + up to two characters of the original data
    arr = new Arr(len * 3 / 4 - placeHolders);

    // if there are placeholders, only get up to the last complete 4 chars
    l = placeHolders > 0 ? len - 4 : len;

    var L = 0;

    for (i = 0, j = 0; i < l; i += 4, j += 3) {
      tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)];
      arr[L++] = (tmp >> 16) & 0xFF;
      arr[L++] = (tmp >> 8) & 0xFF;
      arr[L++] = tmp & 0xFF;
    }

    if (placeHolders === 2) {
      tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4);
      arr[L++] = tmp & 0xFF;
    } else if (placeHolders === 1) {
      tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2);
      arr[L++] = (tmp >> 8) & 0xFF;
      arr[L++] = tmp & 0xFF;
    }

    return arr
  }

  function tripletToBase64 (num) {
    return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
  }

  function encodeChunk (uint8, start, end) {
    var tmp;
    var output = [];
    for (var i = start; i < end; i += 3) {
      tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
      output.push(tripletToBase64(tmp));
    }
    return output.join('')
  }

  function fromByteArray (uint8) {
    if (!inited) {
      init();
    }
    var tmp;
    var len = uint8.length;
    var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
    var output = '';
    var parts = [];
    var maxChunkLength = 16383; // must be multiple of 3

    // go through the array every three bytes, we'll deal with trailing stuff later
    for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
      parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
    }

    // pad the end with zeros, but make sure to not forget the extra bytes
    if (extraBytes === 1) {
      tmp = uint8[len - 1];
      output += lookup[tmp >> 2];
      output += lookup[(tmp << 4) & 0x3F];
      output += '==';
    } else if (extraBytes === 2) {
      tmp = (uint8[len - 2] << 8) + (uint8[len - 1]);
      output += lookup[tmp >> 10];
      output += lookup[(tmp >> 4) & 0x3F];
      output += lookup[(tmp << 2) & 0x3F];
      output += '=';
    }

    parts.push(output);

    return parts.join('')
  }

  function read (buffer, offset, isLE, mLen, nBytes) {
    var e, m;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var nBits = -7;
    var i = isLE ? (nBytes - 1) : 0;
    var d = isLE ? -1 : 1;
    var s = buffer[offset + i];

    i += d;

    e = s & ((1 << (-nBits)) - 1);
    s >>= (-nBits);
    nBits += eLen;
    for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

    m = e & ((1 << (-nBits)) - 1);
    e >>= (-nBits);
    nBits += mLen;
    for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

    if (e === 0) {
      e = 1 - eBias;
    } else if (e === eMax) {
      return m ? NaN : ((s ? -1 : 1) * Infinity)
    } else {
      m = m + Math.pow(2, mLen);
      e = e - eBias;
    }
    return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
  }

  function write (buffer, value, offset, isLE, mLen, nBytes) {
    var e, m, c;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0);
    var i = isLE ? 0 : (nBytes - 1);
    var d = isLE ? 1 : -1;
    var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

    value = Math.abs(value);

    if (isNaN(value) || value === Infinity) {
      m = isNaN(value) ? 1 : 0;
      e = eMax;
    } else {
      e = Math.floor(Math.log(value) / Math.LN2);
      if (value * (c = Math.pow(2, -e)) < 1) {
        e--;
        c *= 2;
      }
      if (e + eBias >= 1) {
        value += rt / c;
      } else {
        value += rt * Math.pow(2, 1 - eBias);
      }
      if (value * c >= 2) {
        e++;
        c /= 2;
      }

      if (e + eBias >= eMax) {
        m = 0;
        e = eMax;
      } else if (e + eBias >= 1) {
        m = (value * c - 1) * Math.pow(2, mLen);
        e = e + eBias;
      } else {
        m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
        e = 0;
      }
    }

    for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

    e = (e << mLen) | m;
    eLen += mLen;
    for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

    buffer[offset + i - d] |= s * 128;
  }

  var toString = {}.toString;

  var isArray$1 = Array.isArray || function (arr) {
    return toString.call(arr) == '[object Array]';
  };

  /*!
   * The buffer module from node.js, for the browser.
   *
   * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
   * @license  MIT
   */

  var INSPECT_MAX_BYTES = 50;

  /**
   * If `Buffer.TYPED_ARRAY_SUPPORT`:
   *   === true    Use Uint8Array implementation (fastest)
   *   === false   Use Object implementation (most compatible, even IE6)
   *
   * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
   * Opera 11.6+, iOS 4.2+.
   *
   * Due to various browser bugs, sometimes the Object implementation will be used even
   * when the browser supports typed arrays.
   *
   * Note:
   *
   *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
   *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
   *
   *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
   *
   *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
   *     incorrect length in some situations.

   * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
   * get the Object implementation, which is slower but behaves correctly.
   */
  Buffer$6.TYPED_ARRAY_SUPPORT = global$1.TYPED_ARRAY_SUPPORT !== undefined
    ? global$1.TYPED_ARRAY_SUPPORT
    : true;

  /*
   * Export kMaxLength after typed array support is determined.
   */
  var _kMaxLength = kMaxLength();

  function kMaxLength () {
    return Buffer$6.TYPED_ARRAY_SUPPORT
      ? 0x7fffffff
      : 0x3fffffff
  }

  function createBuffer (that, length) {
    if (kMaxLength() < length) {
      throw new RangeError('Invalid typed array length')
    }
    if (Buffer$6.TYPED_ARRAY_SUPPORT) {
      // Return an augmented `Uint8Array` instance, for best performance
      that = new Uint8Array(length);
      that.__proto__ = Buffer$6.prototype;
    } else {
      // Fallback: Return an object instance of the Buffer class
      if (that === null) {
        that = new Buffer$6(length);
      }
      that.length = length;
    }

    return that
  }

  /**
   * The Buffer constructor returns instances of `Uint8Array` that have their
   * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
   * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
   * and the `Uint8Array` methods. Square bracket notation works as expected -- it
   * returns a single octet.
   *
   * The `Uint8Array` prototype remains unmodified.
   */

  function Buffer$6 (arg, encodingOrOffset, length) {
    if (!Buffer$6.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer$6)) {
      return new Buffer$6(arg, encodingOrOffset, length)
    }

    // Common case.
    if (typeof arg === 'number') {
      if (typeof encodingOrOffset === 'string') {
        throw new Error(
          'If encoding is specified then the first argument must be a string'
        )
      }
      return allocUnsafe(this, arg)
    }
    return from(this, arg, encodingOrOffset, length)
  }

  Buffer$6.poolSize = 8192; // not used by this implementation

  // TODO: Legacy, not needed anymore. Remove in next major version.
  Buffer$6._augment = function (arr) {
    arr.__proto__ = Buffer$6.prototype;
    return arr
  };

  function from (that, value, encodingOrOffset, length) {
    if (typeof value === 'number') {
      throw new TypeError('"value" argument must not be a number')
    }

    if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
      return fromArrayBuffer(that, value, encodingOrOffset, length)
    }

    if (typeof value === 'string') {
      return fromString(that, value, encodingOrOffset)
    }

    return fromObject(that, value)
  }

  /**
   * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
   * if value is a number.
   * Buffer.from(str[, encoding])
   * Buffer.from(array)
   * Buffer.from(buffer)
   * Buffer.from(arrayBuffer[, byteOffset[, length]])
   **/
  Buffer$6.from = function (value, encodingOrOffset, length) {
    return from(null, value, encodingOrOffset, length)
  };

  if (Buffer$6.TYPED_ARRAY_SUPPORT) {
    Buffer$6.prototype.__proto__ = Uint8Array.prototype;
    Buffer$6.__proto__ = Uint8Array;
  }

  function assertSize (size) {
    if (typeof size !== 'number') {
      throw new TypeError('"size" argument must be a number')
    } else if (size < 0) {
      throw new RangeError('"size" argument must not be negative')
    }
  }

  function alloc (that, size, fill, encoding) {
    assertSize(size);
    if (size <= 0) {
      return createBuffer(that, size)
    }
    if (fill !== undefined) {
      // Only pay attention to encoding if it's a string. This
      // prevents accidentally sending in a number that would
      // be interpretted as a start offset.
      return typeof encoding === 'string'
        ? createBuffer(that, size).fill(fill, encoding)
        : createBuffer(that, size).fill(fill)
    }
    return createBuffer(that, size)
  }

  /**
   * Creates a new filled Buffer instance.
   * alloc(size[, fill[, encoding]])
   **/
  Buffer$6.alloc = function (size, fill, encoding) {
    return alloc(null, size, fill, encoding)
  };

  function allocUnsafe (that, size) {
    assertSize(size);
    that = createBuffer(that, size < 0 ? 0 : checked(size) | 0);
    if (!Buffer$6.TYPED_ARRAY_SUPPORT) {
      for (var i = 0; i < size; ++i) {
        that[i] = 0;
      }
    }
    return that
  }

  /**
   * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
   * */
  Buffer$6.allocUnsafe = function (size) {
    return allocUnsafe(null, size)
  };
  /**
   * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
   */
  Buffer$6.allocUnsafeSlow = function (size) {
    return allocUnsafe(null, size)
  };

  function fromString (that, string, encoding) {
    if (typeof encoding !== 'string' || encoding === '') {
      encoding = 'utf8';
    }

    if (!Buffer$6.isEncoding(encoding)) {
      throw new TypeError('"encoding" must be a valid string encoding')
    }

    var length = byteLength(string, encoding) | 0;
    that = createBuffer(that, length);

    var actual = that.write(string, encoding);

    if (actual !== length) {
      // Writing a hex string, for example, that contains invalid characters will
      // cause everything after the first invalid character to be ignored. (e.g.
      // 'abxxcd' will be treated as 'ab')
      that = that.slice(0, actual);
    }

    return that
  }

  function fromArrayLike (that, array) {
    var length = array.length < 0 ? 0 : checked(array.length) | 0;
    that = createBuffer(that, length);
    for (var i = 0; i < length; i += 1) {
      that[i] = array[i] & 255;
    }
    return that
  }

  function fromArrayBuffer (that, array, byteOffset, length) {
    array.byteLength; // this throws if `array` is not a valid ArrayBuffer

    if (byteOffset < 0 || array.byteLength < byteOffset) {
      throw new RangeError('\'offset\' is out of bounds')
    }

    if (array.byteLength < byteOffset + (length || 0)) {
      throw new RangeError('\'length\' is out of bounds')
    }

    if (byteOffset === undefined && length === undefined) {
      array = new Uint8Array(array);
    } else if (length === undefined) {
      array = new Uint8Array(array, byteOffset);
    } else {
      array = new Uint8Array(array, byteOffset, length);
    }

    if (Buffer$6.TYPED_ARRAY_SUPPORT) {
      // Return an augmented `Uint8Array` instance, for best performance
      that = array;
      that.__proto__ = Buffer$6.prototype;
    } else {
      // Fallback: Return an object instance of the Buffer class
      that = fromArrayLike(that, array);
    }
    return that
  }

  function fromObject (that, obj) {
    if (internalIsBuffer(obj)) {
      var len = checked(obj.length) | 0;
      that = createBuffer(that, len);

      if (that.length === 0) {
        return that
      }

      obj.copy(that, 0, 0, len);
      return that
    }

    if (obj) {
      if ((typeof ArrayBuffer !== 'undefined' &&
          obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
        if (typeof obj.length !== 'number' || isnan(obj.length)) {
          return createBuffer(that, 0)
        }
        return fromArrayLike(that, obj)
      }

      if (obj.type === 'Buffer' && isArray$1(obj.data)) {
        return fromArrayLike(that, obj.data)
      }
    }

    throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
  }

  function checked (length) {
    // Note: cannot use `length < kMaxLength()` here because that fails when
    // length is NaN (which is otherwise coerced to zero.)
    if (length >= kMaxLength()) {
      throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                           'size: 0x' + kMaxLength().toString(16) + ' bytes')
    }
    return length | 0
  }

  function SlowBuffer (length) {
    if (+length != length) { // eslint-disable-line eqeqeq
      length = 0;
    }
    return Buffer$6.alloc(+length)
  }
  Buffer$6.isBuffer = isBuffer;
  function internalIsBuffer (b) {
    return !!(b != null && b._isBuffer)
  }

  Buffer$6.compare = function compare (a, b) {
    if (!internalIsBuffer(a) || !internalIsBuffer(b)) {
      throw new TypeError('Arguments must be Buffers')
    }

    if (a === b) return 0

    var x = a.length;
    var y = b.length;

    for (var i = 0, len = Math.min(x, y); i < len; ++i) {
      if (a[i] !== b[i]) {
        x = a[i];
        y = b[i];
        break
      }
    }

    if (x < y) return -1
    if (y < x) return 1
    return 0
  };

  Buffer$6.isEncoding = function isEncoding (encoding) {
    switch (String(encoding).toLowerCase()) {
      case 'hex':
      case 'utf8':
      case 'utf-8':
      case 'ascii':
      case 'latin1':
      case 'binary':
      case 'base64':
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return true
      default:
        return false
    }
  };

  Buffer$6.concat = function concat (list, length) {
    if (!isArray$1(list)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }

    if (list.length === 0) {
      return Buffer$6.alloc(0)
    }

    var i;
    if (length === undefined) {
      length = 0;
      for (i = 0; i < list.length; ++i) {
        length += list[i].length;
      }
    }

    var buffer = Buffer$6.allocUnsafe(length);
    var pos = 0;
    for (i = 0; i < list.length; ++i) {
      var buf = list[i];
      if (!internalIsBuffer(buf)) {
        throw new TypeError('"list" argument must be an Array of Buffers')
      }
      buf.copy(buffer, pos);
      pos += buf.length;
    }
    return buffer
  };

  function byteLength (string, encoding) {
    if (internalIsBuffer(string)) {
      return string.length
    }
    if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
        (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
      return string.byteLength
    }
    if (typeof string !== 'string') {
      string = '' + string;
    }

    var len = string.length;
    if (len === 0) return 0

    // Use a for loop to avoid recursion
    var loweredCase = false;
    for (;;) {
      switch (encoding) {
        case 'ascii':
        case 'latin1':
        case 'binary':
          return len
        case 'utf8':
        case 'utf-8':
        case undefined:
          return utf8ToBytes(string).length
        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return len * 2
        case 'hex':
          return len >>> 1
        case 'base64':
          return base64ToBytes(string).length
        default:
          if (loweredCase) return utf8ToBytes(string).length // assume utf8
          encoding = ('' + encoding).toLowerCase();
          loweredCase = true;
      }
    }
  }
  Buffer$6.byteLength = byteLength;

  function slowToString (encoding, start, end) {
    var loweredCase = false;

    // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
    // property of a typed array.

    // This behaves neither like String nor Uint8Array in that we set start/end
    // to their upper/lower bounds if the value passed is out of range.
    // undefined is handled specially as per ECMA-262 6th Edition,
    // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
    if (start === undefined || start < 0) {
      start = 0;
    }
    // Return early if start > this.length. Done here to prevent potential uint32
    // coercion fail below.
    if (start > this.length) {
      return ''
    }

    if (end === undefined || end > this.length) {
      end = this.length;
    }

    if (end <= 0) {
      return ''
    }

    // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
    end >>>= 0;
    start >>>= 0;

    if (end <= start) {
      return ''
    }

    if (!encoding) encoding = 'utf8';

    while (true) {
      switch (encoding) {
        case 'hex':
          return hexSlice(this, start, end)

        case 'utf8':
        case 'utf-8':
          return utf8Slice(this, start, end)

        case 'ascii':
          return asciiSlice(this, start, end)

        case 'latin1':
        case 'binary':
          return latin1Slice(this, start, end)

        case 'base64':
          return base64Slice(this, start, end)

        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return utf16leSlice(this, start, end)

        default:
          if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
          encoding = (encoding + '').toLowerCase();
          loweredCase = true;
      }
    }
  }

  // The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
  // Buffer instances.
  Buffer$6.prototype._isBuffer = true;

  function swap (b, n, m) {
    var i = b[n];
    b[n] = b[m];
    b[m] = i;
  }

  Buffer$6.prototype.swap16 = function swap16 () {
    var len = this.length;
    if (len % 2 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 16-bits')
    }
    for (var i = 0; i < len; i += 2) {
      swap(this, i, i + 1);
    }
    return this
  };

  Buffer$6.prototype.swap32 = function swap32 () {
    var len = this.length;
    if (len % 4 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 32-bits')
    }
    for (var i = 0; i < len; i += 4) {
      swap(this, i, i + 3);
      swap(this, i + 1, i + 2);
    }
    return this
  };

  Buffer$6.prototype.swap64 = function swap64 () {
    var len = this.length;
    if (len % 8 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 64-bits')
    }
    for (var i = 0; i < len; i += 8) {
      swap(this, i, i + 7);
      swap(this, i + 1, i + 6);
      swap(this, i + 2, i + 5);
      swap(this, i + 3, i + 4);
    }
    return this
  };

  Buffer$6.prototype.toString = function toString () {
    var length = this.length | 0;
    if (length === 0) return ''
    if (arguments.length === 0) return utf8Slice(this, 0, length)
    return slowToString.apply(this, arguments)
  };

  Buffer$6.prototype.equals = function equals (b) {
    if (!internalIsBuffer(b)) throw new TypeError('Argument must be a Buffer')
    if (this === b) return true
    return Buffer$6.compare(this, b) === 0
  };

  Buffer$6.prototype.inspect = function inspect () {
    var str = '';
    var max = INSPECT_MAX_BYTES;
    if (this.length > 0) {
      str = this.toString('hex', 0, max).match(/.{2}/g).join(' ');
      if (this.length > max) str += ' ... ';
    }
    return '<Buffer ' + str + '>'
  };

  Buffer$6.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
    if (!internalIsBuffer(target)) {
      throw new TypeError('Argument must be a Buffer')
    }

    if (start === undefined) {
      start = 0;
    }
    if (end === undefined) {
      end = target ? target.length : 0;
    }
    if (thisStart === undefined) {
      thisStart = 0;
    }
    if (thisEnd === undefined) {
      thisEnd = this.length;
    }

    if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
      throw new RangeError('out of range index')
    }

    if (thisStart >= thisEnd && start >= end) {
      return 0
    }
    if (thisStart >= thisEnd) {
      return -1
    }
    if (start >= end) {
      return 1
    }

    start >>>= 0;
    end >>>= 0;
    thisStart >>>= 0;
    thisEnd >>>= 0;

    if (this === target) return 0

    var x = thisEnd - thisStart;
    var y = end - start;
    var len = Math.min(x, y);

    var thisCopy = this.slice(thisStart, thisEnd);
    var targetCopy = target.slice(start, end);

    for (var i = 0; i < len; ++i) {
      if (thisCopy[i] !== targetCopy[i]) {
        x = thisCopy[i];
        y = targetCopy[i];
        break
      }
    }

    if (x < y) return -1
    if (y < x) return 1
    return 0
  };

  // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
  // OR the last index of `val` in `buffer` at offset <= `byteOffset`.
  //
  // Arguments:
  // - buffer - a Buffer to search
  // - val - a string, Buffer, or number
  // - byteOffset - an index into `buffer`; will be clamped to an int32
  // - encoding - an optional encoding, relevant is val is a string
  // - dir - true for indexOf, false for lastIndexOf
  function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
    // Empty buffer means no match
    if (buffer.length === 0) return -1

    // Normalize byteOffset
    if (typeof byteOffset === 'string') {
      encoding = byteOffset;
      byteOffset = 0;
    } else if (byteOffset > 0x7fffffff) {
      byteOffset = 0x7fffffff;
    } else if (byteOffset < -0x80000000) {
      byteOffset = -0x80000000;
    }
    byteOffset = +byteOffset;  // Coerce to Number.
    if (isNaN(byteOffset)) {
      // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
      byteOffset = dir ? 0 : (buffer.length - 1);
    }

    // Normalize byteOffset: negative offsets start from the end of the buffer
    if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
    if (byteOffset >= buffer.length) {
      if (dir) return -1
      else byteOffset = buffer.length - 1;
    } else if (byteOffset < 0) {
      if (dir) byteOffset = 0;
      else return -1
    }

    // Normalize val
    if (typeof val === 'string') {
      val = Buffer$6.from(val, encoding);
    }

    // Finally, search either indexOf (if dir is true) or lastIndexOf
    if (internalIsBuffer(val)) {
      // Special case: looking for empty string/buffer always fails
      if (val.length === 0) {
        return -1
      }
      return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
    } else if (typeof val === 'number') {
      val = val & 0xFF; // Search for a byte value [0-255]
      if (Buffer$6.TYPED_ARRAY_SUPPORT &&
          typeof Uint8Array.prototype.indexOf === 'function') {
        if (dir) {
          return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
        } else {
          return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
        }
      }
      return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
    }

    throw new TypeError('val must be string, number or Buffer')
  }

  function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
    var indexSize = 1;
    var arrLength = arr.length;
    var valLength = val.length;

    if (encoding !== undefined) {
      encoding = String(encoding).toLowerCase();
      if (encoding === 'ucs2' || encoding === 'ucs-2' ||
          encoding === 'utf16le' || encoding === 'utf-16le') {
        if (arr.length < 2 || val.length < 2) {
          return -1
        }
        indexSize = 2;
        arrLength /= 2;
        valLength /= 2;
        byteOffset /= 2;
      }
    }

    function read (buf, i) {
      if (indexSize === 1) {
        return buf[i]
      } else {
        return buf.readUInt16BE(i * indexSize)
      }
    }

    var i;
    if (dir) {
      var foundIndex = -1;
      for (i = byteOffset; i < arrLength; i++) {
        if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
          if (foundIndex === -1) foundIndex = i;
          if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
        } else {
          if (foundIndex !== -1) i -= i - foundIndex;
          foundIndex = -1;
        }
      }
    } else {
      if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
      for (i = byteOffset; i >= 0; i--) {
        var found = true;
        for (var j = 0; j < valLength; j++) {
          if (read(arr, i + j) !== read(val, j)) {
            found = false;
            break
          }
        }
        if (found) return i
      }
    }

    return -1
  }

  Buffer$6.prototype.includes = function includes (val, byteOffset, encoding) {
    return this.indexOf(val, byteOffset, encoding) !== -1
  };

  Buffer$6.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
  };

  Buffer$6.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
  };

  function hexWrite (buf, string, offset, length) {
    offset = Number(offset) || 0;
    var remaining = buf.length - offset;
    if (!length) {
      length = remaining;
    } else {
      length = Number(length);
      if (length > remaining) {
        length = remaining;
      }
    }

    // must be an even number of digits
    var strLen = string.length;
    if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

    if (length > strLen / 2) {
      length = strLen / 2;
    }
    for (var i = 0; i < length; ++i) {
      var parsed = parseInt(string.substr(i * 2, 2), 16);
      if (isNaN(parsed)) return i
      buf[offset + i] = parsed;
    }
    return i
  }

  function utf8Write (buf, string, offset, length) {
    return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
  }

  function asciiWrite (buf, string, offset, length) {
    return blitBuffer(asciiToBytes(string), buf, offset, length)
  }

  function latin1Write (buf, string, offset, length) {
    return asciiWrite(buf, string, offset, length)
  }

  function base64Write (buf, string, offset, length) {
    return blitBuffer(base64ToBytes(string), buf, offset, length)
  }

  function ucs2Write (buf, string, offset, length) {
    return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
  }

  Buffer$6.prototype.write = function write (string, offset, length, encoding) {
    // Buffer#write(string)
    if (offset === undefined) {
      encoding = 'utf8';
      length = this.length;
      offset = 0;
    // Buffer#write(string, encoding)
    } else if (length === undefined && typeof offset === 'string') {
      encoding = offset;
      length = this.length;
      offset = 0;
    // Buffer#write(string, offset[, length][, encoding])
    } else if (isFinite(offset)) {
      offset = offset | 0;
      if (isFinite(length)) {
        length = length | 0;
        if (encoding === undefined) encoding = 'utf8';
      } else {
        encoding = length;
        length = undefined;
      }
    // legacy write(string, encoding, offset, length) - remove in v0.13
    } else {
      throw new Error(
        'Buffer.write(string, encoding, offset[, length]) is no longer supported'
      )
    }

    var remaining = this.length - offset;
    if (length === undefined || length > remaining) length = remaining;

    if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
      throw new RangeError('Attempt to write outside buffer bounds')
    }

    if (!encoding) encoding = 'utf8';

    var loweredCase = false;
    for (;;) {
      switch (encoding) {
        case 'hex':
          return hexWrite(this, string, offset, length)

        case 'utf8':
        case 'utf-8':
          return utf8Write(this, string, offset, length)

        case 'ascii':
          return asciiWrite(this, string, offset, length)

        case 'latin1':
        case 'binary':
          return latin1Write(this, string, offset, length)

        case 'base64':
          // Warning: maxLength not taken into account in base64Write
          return base64Write(this, string, offset, length)

        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return ucs2Write(this, string, offset, length)

        default:
          if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
          encoding = ('' + encoding).toLowerCase();
          loweredCase = true;
      }
    }
  };

  Buffer$6.prototype.toJSON = function toJSON () {
    return {
      type: 'Buffer',
      data: Array.prototype.slice.call(this._arr || this, 0)
    }
  };

  function base64Slice (buf, start, end) {
    if (start === 0 && end === buf.length) {
      return fromByteArray(buf)
    } else {
      return fromByteArray(buf.slice(start, end))
    }
  }

  function utf8Slice (buf, start, end) {
    end = Math.min(buf.length, end);
    var res = [];

    var i = start;
    while (i < end) {
      var firstByte = buf[i];
      var codePoint = null;
      var bytesPerSequence = (firstByte > 0xEF) ? 4
        : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
        : 1;

      if (i + bytesPerSequence <= end) {
        var secondByte, thirdByte, fourthByte, tempCodePoint;

        switch (bytesPerSequence) {
          case 1:
            if (firstByte < 0x80) {
              codePoint = firstByte;
            }
            break
          case 2:
            secondByte = buf[i + 1];
            if ((secondByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
              if (tempCodePoint > 0x7F) {
                codePoint = tempCodePoint;
              }
            }
            break
          case 3:
            secondByte = buf[i + 1];
            thirdByte = buf[i + 2];
            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
              if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                codePoint = tempCodePoint;
              }
            }
            break
          case 4:
            secondByte = buf[i + 1];
            thirdByte = buf[i + 2];
            fourthByte = buf[i + 3];
            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
              if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                codePoint = tempCodePoint;
              }
            }
        }
      }

      if (codePoint === null) {
        // we did not generate a valid codePoint so insert a
        // replacement char (U+FFFD) and advance only 1 byte
        codePoint = 0xFFFD;
        bytesPerSequence = 1;
      } else if (codePoint > 0xFFFF) {
        // encode to utf16 (surrogate pair dance)
        codePoint -= 0x10000;
        res.push(codePoint >>> 10 & 0x3FF | 0xD800);
        codePoint = 0xDC00 | codePoint & 0x3FF;
      }

      res.push(codePoint);
      i += bytesPerSequence;
    }

    return decodeCodePointsArray(res)
  }

  // Based on http://stackoverflow.com/a/22747272/680742, the browser with
  // the lowest limit is Chrome, with 0x10000 args.
  // We go 1 magnitude less, for safety
  var MAX_ARGUMENTS_LENGTH = 0x1000;

  function decodeCodePointsArray (codePoints) {
    var len = codePoints.length;
    if (len <= MAX_ARGUMENTS_LENGTH) {
      return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
    }

    // Decode in chunks to avoid "call stack size exceeded".
    var res = '';
    var i = 0;
    while (i < len) {
      res += String.fromCharCode.apply(
        String,
        codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
      );
    }
    return res
  }

  function asciiSlice (buf, start, end) {
    var ret = '';
    end = Math.min(buf.length, end);

    for (var i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i] & 0x7F);
    }
    return ret
  }

  function latin1Slice (buf, start, end) {
    var ret = '';
    end = Math.min(buf.length, end);

    for (var i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i]);
    }
    return ret
  }

  function hexSlice (buf, start, end) {
    var len = buf.length;

    if (!start || start < 0) start = 0;
    if (!end || end < 0 || end > len) end = len;

    var out = '';
    for (var i = start; i < end; ++i) {
      out += toHex(buf[i]);
    }
    return out
  }

  function utf16leSlice (buf, start, end) {
    var bytes = buf.slice(start, end);
    var res = '';
    for (var i = 0; i < bytes.length; i += 2) {
      res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
    }
    return res
  }

  Buffer$6.prototype.slice = function slice (start, end) {
    var len = this.length;
    start = ~~start;
    end = end === undefined ? len : ~~end;

    if (start < 0) {
      start += len;
      if (start < 0) start = 0;
    } else if (start > len) {
      start = len;
    }

    if (end < 0) {
      end += len;
      if (end < 0) end = 0;
    } else if (end > len) {
      end = len;
    }

    if (end < start) end = start;

    var newBuf;
    if (Buffer$6.TYPED_ARRAY_SUPPORT) {
      newBuf = this.subarray(start, end);
      newBuf.__proto__ = Buffer$6.prototype;
    } else {
      var sliceLen = end - start;
      newBuf = new Buffer$6(sliceLen, undefined);
      for (var i = 0; i < sliceLen; ++i) {
        newBuf[i] = this[i + start];
      }
    }

    return newBuf
  };

  /*
   * Need to make sure that buffer isn't trying to write out of bounds.
   */
  function checkOffset (offset, ext, length) {
    if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
    if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
  }

  Buffer$6.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);

    var val = this[offset];
    var mul = 1;
    var i = 0;
    while (++i < byteLength && (mul *= 0x100)) {
      val += this[offset + i] * mul;
    }

    return val
  };

  Buffer$6.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) {
      checkOffset(offset, byteLength, this.length);
    }

    var val = this[offset + --byteLength];
    var mul = 1;
    while (byteLength > 0 && (mul *= 0x100)) {
      val += this[offset + --byteLength] * mul;
    }

    return val
  };

  Buffer$6.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 1, this.length);
    return this[offset]
  };

  Buffer$6.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    return this[offset] | (this[offset + 1] << 8)
  };

  Buffer$6.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    return (this[offset] << 8) | this[offset + 1]
  };

  Buffer$6.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);

    return ((this[offset]) |
        (this[offset + 1] << 8) |
        (this[offset + 2] << 16)) +
        (this[offset + 3] * 0x1000000)
  };

  Buffer$6.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);

    return (this[offset] * 0x1000000) +
      ((this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      this[offset + 3])
  };

  Buffer$6.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);

    var val = this[offset];
    var mul = 1;
    var i = 0;
    while (++i < byteLength && (mul *= 0x100)) {
      val += this[offset + i] * mul;
    }
    mul *= 0x80;

    if (val >= mul) val -= Math.pow(2, 8 * byteLength);

    return val
  };

  Buffer$6.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);

    var i = byteLength;
    var mul = 1;
    var val = this[offset + --i];
    while (i > 0 && (mul *= 0x100)) {
      val += this[offset + --i] * mul;
    }
    mul *= 0x80;

    if (val >= mul) val -= Math.pow(2, 8 * byteLength);

    return val
  };

  Buffer$6.prototype.readInt8 = function readInt8 (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 1, this.length);
    if (!(this[offset] & 0x80)) return (this[offset])
    return ((0xff - this[offset] + 1) * -1)
  };

  Buffer$6.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    var val = this[offset] | (this[offset + 1] << 8);
    return (val & 0x8000) ? val | 0xFFFF0000 : val
  };

  Buffer$6.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    var val = this[offset + 1] | (this[offset] << 8);
    return (val & 0x8000) ? val | 0xFFFF0000 : val
  };

  Buffer$6.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);

    return (this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16) |
      (this[offset + 3] << 24)
  };

  Buffer$6.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);

    return (this[offset] << 24) |
      (this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      (this[offset + 3])
  };

  Buffer$6.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return read(this, offset, true, 23, 4)
  };

  Buffer$6.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return read(this, offset, false, 23, 4)
  };

  Buffer$6.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 8, this.length);
    return read(this, offset, true, 52, 8)
  };

  Buffer$6.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 8, this.length);
    return read(this, offset, false, 52, 8)
  };

  function checkInt (buf, value, offset, ext, max, min) {
    if (!internalIsBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
    if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
    if (offset + ext > buf.length) throw new RangeError('Index out of range')
  }

  Buffer$6.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) {
      var maxBytes = Math.pow(2, 8 * byteLength) - 1;
      checkInt(this, value, offset, byteLength, maxBytes, 0);
    }

    var mul = 1;
    var i = 0;
    this[offset] = value & 0xFF;
    while (++i < byteLength && (mul *= 0x100)) {
      this[offset + i] = (value / mul) & 0xFF;
    }

    return offset + byteLength
  };

  Buffer$6.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) {
      var maxBytes = Math.pow(2, 8 * byteLength) - 1;
      checkInt(this, value, offset, byteLength, maxBytes, 0);
    }

    var i = byteLength - 1;
    var mul = 1;
    this[offset + i] = value & 0xFF;
    while (--i >= 0 && (mul *= 0x100)) {
      this[offset + i] = (value / mul) & 0xFF;
    }

    return offset + byteLength
  };

  Buffer$6.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
    if (!Buffer$6.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
    this[offset] = (value & 0xff);
    return offset + 1
  };

  function objectWriteUInt16 (buf, value, offset, littleEndian) {
    if (value < 0) value = 0xffff + value + 1;
    for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
      buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
        (littleEndian ? i : 1 - i) * 8;
    }
  }

  Buffer$6.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
    if (Buffer$6.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value & 0xff);
      this[offset + 1] = (value >>> 8);
    } else {
      objectWriteUInt16(this, value, offset, true);
    }
    return offset + 2
  };

  Buffer$6.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
    if (Buffer$6.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value >>> 8);
      this[offset + 1] = (value & 0xff);
    } else {
      objectWriteUInt16(this, value, offset, false);
    }
    return offset + 2
  };

  function objectWriteUInt32 (buf, value, offset, littleEndian) {
    if (value < 0) value = 0xffffffff + value + 1;
    for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
      buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff;
    }
  }

  Buffer$6.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
    if (Buffer$6.TYPED_ARRAY_SUPPORT) {
      this[offset + 3] = (value >>> 24);
      this[offset + 2] = (value >>> 16);
      this[offset + 1] = (value >>> 8);
      this[offset] = (value & 0xff);
    } else {
      objectWriteUInt32(this, value, offset, true);
    }
    return offset + 4
  };

  Buffer$6.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
    if (Buffer$6.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value >>> 24);
      this[offset + 1] = (value >>> 16);
      this[offset + 2] = (value >>> 8);
      this[offset + 3] = (value & 0xff);
    } else {
      objectWriteUInt32(this, value, offset, false);
    }
    return offset + 4
  };

  Buffer$6.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) {
      var limit = Math.pow(2, 8 * byteLength - 1);

      checkInt(this, value, offset, byteLength, limit - 1, -limit);
    }

    var i = 0;
    var mul = 1;
    var sub = 0;
    this[offset] = value & 0xFF;
    while (++i < byteLength && (mul *= 0x100)) {
      if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
        sub = 1;
      }
      this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
    }

    return offset + byteLength
  };

  Buffer$6.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) {
      var limit = Math.pow(2, 8 * byteLength - 1);

      checkInt(this, value, offset, byteLength, limit - 1, -limit);
    }

    var i = byteLength - 1;
    var mul = 1;
    var sub = 0;
    this[offset + i] = value & 0xFF;
    while (--i >= 0 && (mul *= 0x100)) {
      if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
        sub = 1;
      }
      this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
    }

    return offset + byteLength
  };

  Buffer$6.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
    if (!Buffer$6.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
    if (value < 0) value = 0xff + value + 1;
    this[offset] = (value & 0xff);
    return offset + 1
  };

  Buffer$6.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
    if (Buffer$6.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value & 0xff);
      this[offset + 1] = (value >>> 8);
    } else {
      objectWriteUInt16(this, value, offset, true);
    }
    return offset + 2
  };

  Buffer$6.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
    if (Buffer$6.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value >>> 8);
      this[offset + 1] = (value & 0xff);
    } else {
      objectWriteUInt16(this, value, offset, false);
    }
    return offset + 2
  };

  Buffer$6.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
    if (Buffer$6.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value & 0xff);
      this[offset + 1] = (value >>> 8);
      this[offset + 2] = (value >>> 16);
      this[offset + 3] = (value >>> 24);
    } else {
      objectWriteUInt32(this, value, offset, true);
    }
    return offset + 4
  };

  Buffer$6.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
    if (value < 0) value = 0xffffffff + value + 1;
    if (Buffer$6.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value >>> 24);
      this[offset + 1] = (value >>> 16);
      this[offset + 2] = (value >>> 8);
      this[offset + 3] = (value & 0xff);
    } else {
      objectWriteUInt32(this, value, offset, false);
    }
    return offset + 4
  };

  function checkIEEE754 (buf, value, offset, ext, max, min) {
    if (offset + ext > buf.length) throw new RangeError('Index out of range')
    if (offset < 0) throw new RangeError('Index out of range')
  }

  function writeFloat (buf, value, offset, littleEndian, noAssert) {
    if (!noAssert) {
      checkIEEE754(buf, value, offset, 4);
    }
    write(buf, value, offset, littleEndian, 23, 4);
    return offset + 4
  }

  Buffer$6.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
    return writeFloat(this, value, offset, true, noAssert)
  };

  Buffer$6.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
    return writeFloat(this, value, offset, false, noAssert)
  };

  function writeDouble (buf, value, offset, littleEndian, noAssert) {
    if (!noAssert) {
      checkIEEE754(buf, value, offset, 8);
    }
    write(buf, value, offset, littleEndian, 52, 8);
    return offset + 8
  }

  Buffer$6.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
    return writeDouble(this, value, offset, true, noAssert)
  };

  Buffer$6.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
    return writeDouble(this, value, offset, false, noAssert)
  };

  // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
  Buffer$6.prototype.copy = function copy (target, targetStart, start, end) {
    if (!start) start = 0;
    if (!end && end !== 0) end = this.length;
    if (targetStart >= target.length) targetStart = target.length;
    if (!targetStart) targetStart = 0;
    if (end > 0 && end < start) end = start;

    // Copy 0 bytes; we're done
    if (end === start) return 0
    if (target.length === 0 || this.length === 0) return 0

    // Fatal error conditions
    if (targetStart < 0) {
      throw new RangeError('targetStart out of bounds')
    }
    if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
    if (end < 0) throw new RangeError('sourceEnd out of bounds')

    // Are we oob?
    if (end > this.length) end = this.length;
    if (target.length - targetStart < end - start) {
      end = target.length - targetStart + start;
    }

    var len = end - start;
    var i;

    if (this === target && start < targetStart && targetStart < end) {
      // descending copy from end
      for (i = len - 1; i >= 0; --i) {
        target[i + targetStart] = this[i + start];
      }
    } else if (len < 1000 || !Buffer$6.TYPED_ARRAY_SUPPORT) {
      // ascending copy from start
      for (i = 0; i < len; ++i) {
        target[i + targetStart] = this[i + start];
      }
    } else {
      Uint8Array.prototype.set.call(
        target,
        this.subarray(start, start + len),
        targetStart
      );
    }

    return len
  };

  // Usage:
  //    buffer.fill(number[, offset[, end]])
  //    buffer.fill(buffer[, offset[, end]])
  //    buffer.fill(string[, offset[, end]][, encoding])
  Buffer$6.prototype.fill = function fill (val, start, end, encoding) {
    // Handle string cases:
    if (typeof val === 'string') {
      if (typeof start === 'string') {
        encoding = start;
        start = 0;
        end = this.length;
      } else if (typeof end === 'string') {
        encoding = end;
        end = this.length;
      }
      if (val.length === 1) {
        var code = val.charCodeAt(0);
        if (code < 256) {
          val = code;
        }
      }
      if (encoding !== undefined && typeof encoding !== 'string') {
        throw new TypeError('encoding must be a string')
      }
      if (typeof encoding === 'string' && !Buffer$6.isEncoding(encoding)) {
        throw new TypeError('Unknown encoding: ' + encoding)
      }
    } else if (typeof val === 'number') {
      val = val & 255;
    }

    // Invalid ranges are not set to a default, so can range check early.
    if (start < 0 || this.length < start || this.length < end) {
      throw new RangeError('Out of range index')
    }

    if (end <= start) {
      return this
    }

    start = start >>> 0;
    end = end === undefined ? this.length : end >>> 0;

    if (!val) val = 0;

    var i;
    if (typeof val === 'number') {
      for (i = start; i < end; ++i) {
        this[i] = val;
      }
    } else {
      var bytes = internalIsBuffer(val)
        ? val
        : utf8ToBytes(new Buffer$6(val, encoding).toString());
      var len = bytes.length;
      for (i = 0; i < end - start; ++i) {
        this[i + start] = bytes[i % len];
      }
    }

    return this
  };

  // HELPER FUNCTIONS
  // ================

  var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;

  function base64clean (str) {
    // Node strips out invalid characters like \n and \t from the string, base64-js does not
    str = stringtrim(str).replace(INVALID_BASE64_RE, '');
    // Node converts strings with length < 2 to ''
    if (str.length < 2) return ''
    // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
    while (str.length % 4 !== 0) {
      str = str + '=';
    }
    return str
  }

  function stringtrim (str) {
    if (str.trim) return str.trim()
    return str.replace(/^\s+|\s+$/g, '')
  }

  function toHex (n) {
    if (n < 16) return '0' + n.toString(16)
    return n.toString(16)
  }

  function utf8ToBytes (string, units) {
    units = units || Infinity;
    var codePoint;
    var length = string.length;
    var leadSurrogate = null;
    var bytes = [];

    for (var i = 0; i < length; ++i) {
      codePoint = string.charCodeAt(i);

      // is surrogate component
      if (codePoint > 0xD7FF && codePoint < 0xE000) {
        // last char was a lead
        if (!leadSurrogate) {
          // no lead yet
          if (codePoint > 0xDBFF) {
            // unexpected trail
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
            continue
          } else if (i + 1 === length) {
            // unpaired lead
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
            continue
          }

          // valid lead
          leadSurrogate = codePoint;

          continue
        }

        // 2 leads in a row
        if (codePoint < 0xDC00) {
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          leadSurrogate = codePoint;
          continue
        }

        // valid surrogate pair
        codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
      } else if (leadSurrogate) {
        // valid bmp char, but last char was a lead
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
      }

      leadSurrogate = null;

      // encode utf8
      if (codePoint < 0x80) {
        if ((units -= 1) < 0) break
        bytes.push(codePoint);
      } else if (codePoint < 0x800) {
        if ((units -= 2) < 0) break
        bytes.push(
          codePoint >> 0x6 | 0xC0,
          codePoint & 0x3F | 0x80
        );
      } else if (codePoint < 0x10000) {
        if ((units -= 3) < 0) break
        bytes.push(
          codePoint >> 0xC | 0xE0,
          codePoint >> 0x6 & 0x3F | 0x80,
          codePoint & 0x3F | 0x80
        );
      } else if (codePoint < 0x110000) {
        if ((units -= 4) < 0) break
        bytes.push(
          codePoint >> 0x12 | 0xF0,
          codePoint >> 0xC & 0x3F | 0x80,
          codePoint >> 0x6 & 0x3F | 0x80,
          codePoint & 0x3F | 0x80
        );
      } else {
        throw new Error('Invalid code point')
      }
    }

    return bytes
  }

  function asciiToBytes (str) {
    var byteArray = [];
    for (var i = 0; i < str.length; ++i) {
      // Node's code seems to be doing this and not & 0x7F..
      byteArray.push(str.charCodeAt(i) & 0xFF);
    }
    return byteArray
  }

  function utf16leToBytes (str, units) {
    var c, hi, lo;
    var byteArray = [];
    for (var i = 0; i < str.length; ++i) {
      if ((units -= 2) < 0) break

      c = str.charCodeAt(i);
      hi = c >> 8;
      lo = c % 256;
      byteArray.push(lo);
      byteArray.push(hi);
    }

    return byteArray
  }


  function base64ToBytes (str) {
    return toByteArray(base64clean(str))
  }

  function blitBuffer (src, dst, offset, length) {
    for (var i = 0; i < length; ++i) {
      if ((i + offset >= dst.length) || (i >= src.length)) break
      dst[i + offset] = src[i];
    }
    return i
  }

  function isnan (val) {
    return val !== val // eslint-disable-line no-self-compare
  }


  // the following is from is-buffer, also by Feross Aboukhadijeh and with same lisence
  // The _isBuffer check is for Safari 5-7 support, because it's missing
  // Object.prototype.constructor. Remove this eventually
  function isBuffer(obj) {
    return obj != null && (!!obj._isBuffer || isFastBuffer(obj) || isSlowBuffer(obj))
  }

  function isFastBuffer (obj) {
    return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
  }

  // For Node v0.10 support. Remove this eventually.
  function isSlowBuffer (obj) {
    return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isFastBuffer(obj.slice(0, 0))
  }

  var bufferEs6 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    Buffer: Buffer$6,
    INSPECT_MAX_BYTES: INSPECT_MAX_BYTES,
    SlowBuffer: SlowBuffer,
    isBuffer: isBuffer,
    kMaxLength: _kMaxLength
  });

  function getDefaultExportFromCjs (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
  }

  function getAugmentedNamespace(n) {
    if (n.__esModule) return n;
    var f = n.default;
  	if (typeof f == "function") {
  		var a = function a () {
  			if (this instanceof a) {
          return Reflect.construct(f, arguments, this.constructor);
  			}
  			return f.apply(this, arguments);
  		};
  		a.prototype = f.prototype;
    } else a = {};
    Object.defineProperty(a, '__esModule', {value: true});
  	Object.keys(n).forEach(function (k) {
  		var d = Object.getOwnPropertyDescriptor(n, k);
  		Object.defineProperty(a, k, d.get ? d : {
  			enumerable: true,
  			get: function () {
  				return n[k];
  			}
  		});
  	});
  	return a;
  }

  var domain;

  // This constructor is used to store event handlers. Instantiating this is
  // faster than explicitly calling `Object.create(null)` to get a "clean" empty
  // object (tested with v8 v4.9).
  function EventHandlers() {}
  EventHandlers.prototype = Object.create(null);

  function EventEmitter() {
    EventEmitter.init.call(this);
  }

  // nodejs oddity
  // require('events') === require('events').EventEmitter
  EventEmitter.EventEmitter = EventEmitter;

  EventEmitter.usingDomains = false;

  EventEmitter.prototype.domain = undefined;
  EventEmitter.prototype._events = undefined;
  EventEmitter.prototype._maxListeners = undefined;

  // By default EventEmitters will print a warning if more than 10 listeners are
  // added to it. This is a useful default which helps finding memory leaks.
  EventEmitter.defaultMaxListeners = 10;

  EventEmitter.init = function() {
    this.domain = null;
    if (EventEmitter.usingDomains) {
      // if there is an active domain, then attach to it.
      if (domain.active ) ;
    }

    if (!this._events || this._events === Object.getPrototypeOf(this)._events) {
      this._events = new EventHandlers();
      this._eventsCount = 0;
    }

    this._maxListeners = this._maxListeners || undefined;
  };

  // Obviously not all Emitters should be limited to 10. This function allows
  // that to be increased. Set to zero for unlimited.
  EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
    if (typeof n !== 'number' || n < 0 || isNaN(n))
      throw new TypeError('"n" argument must be a positive number');
    this._maxListeners = n;
    return this;
  };

  function $getMaxListeners(that) {
    if (that._maxListeners === undefined)
      return EventEmitter.defaultMaxListeners;
    return that._maxListeners;
  }

  EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
    return $getMaxListeners(this);
  };

  // These standalone emit* functions are used to optimize calling of event
  // handlers for fast cases because emit() itself often has a variable number of
  // arguments and can be deoptimized because of that. These functions always have
  // the same number of arguments and thus do not get deoptimized, so the code
  // inside them can execute faster.
  function emitNone(handler, isFn, self) {
    if (isFn)
      handler.call(self);
    else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);
      for (var i = 0; i < len; ++i)
        listeners[i].call(self);
    }
  }
  function emitOne(handler, isFn, self, arg1) {
    if (isFn)
      handler.call(self, arg1);
    else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);
      for (var i = 0; i < len; ++i)
        listeners[i].call(self, arg1);
    }
  }
  function emitTwo(handler, isFn, self, arg1, arg2) {
    if (isFn)
      handler.call(self, arg1, arg2);
    else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);
      for (var i = 0; i < len; ++i)
        listeners[i].call(self, arg1, arg2);
    }
  }
  function emitThree(handler, isFn, self, arg1, arg2, arg3) {
    if (isFn)
      handler.call(self, arg1, arg2, arg3);
    else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);
      for (var i = 0; i < len; ++i)
        listeners[i].call(self, arg1, arg2, arg3);
    }
  }

  function emitMany(handler, isFn, self, args) {
    if (isFn)
      handler.apply(self, args);
    else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);
      for (var i = 0; i < len; ++i)
        listeners[i].apply(self, args);
    }
  }

  EventEmitter.prototype.emit = function emit(type) {
    var er, handler, len, args, i, events, domain;
    var doError = (type === 'error');

    events = this._events;
    if (events)
      doError = (doError && events.error == null);
    else if (!doError)
      return false;

    domain = this.domain;

    // If there is no 'error' event listener then throw.
    if (doError) {
      er = arguments[1];
      if (domain) {
        if (!er)
          er = new Error('Uncaught, unspecified "error" event');
        er.domainEmitter = this;
        er.domain = domain;
        er.domainThrown = false;
        domain.emit('error', er);
      } else if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
      return false;
    }

    handler = events[type];

    if (!handler)
      return false;

    var isFn = typeof handler === 'function';
    len = arguments.length;
    switch (len) {
      // fast cases
      case 1:
        emitNone(handler, isFn, this);
        break;
      case 2:
        emitOne(handler, isFn, this, arguments[1]);
        break;
      case 3:
        emitTwo(handler, isFn, this, arguments[1], arguments[2]);
        break;
      case 4:
        emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
        break;
      // slower
      default:
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        emitMany(handler, isFn, this, args);
    }

    return true;
  };

  function _addListener(target, type, listener, prepend) {
    var m;
    var events;
    var existing;

    if (typeof listener !== 'function')
      throw new TypeError('"listener" argument must be a function');

    events = target._events;
    if (!events) {
      events = target._events = new EventHandlers();
      target._eventsCount = 0;
    } else {
      // To avoid recursion in the case that type === "newListener"! Before
      // adding it to the listeners, first emit "newListener".
      if (events.newListener) {
        target.emit('newListener', type,
                    listener.listener ? listener.listener : listener);

        // Re-assign `events` because a newListener handler could have caused the
        // this._events to be assigned to a new object
        events = target._events;
      }
      existing = events[type];
    }

    if (!existing) {
      // Optimize the case of one listener. Don't need the extra array object.
      existing = events[type] = listener;
      ++target._eventsCount;
    } else {
      if (typeof existing === 'function') {
        // Adding the second element, need to change to array.
        existing = events[type] = prepend ? [listener, existing] :
                                            [existing, listener];
      } else {
        // If we've already got an array, just append.
        if (prepend) {
          existing.unshift(listener);
        } else {
          existing.push(listener);
        }
      }

      // Check for listener leak
      if (!existing.warned) {
        m = $getMaxListeners(target);
        if (m && m > 0 && existing.length > m) {
          existing.warned = true;
          var w = new Error('Possible EventEmitter memory leak detected. ' +
                              existing.length + ' ' + type + ' listeners added. ' +
                              'Use emitter.setMaxListeners() to increase limit');
          w.name = 'MaxListenersExceededWarning';
          w.emitter = target;
          w.type = type;
          w.count = existing.length;
          emitWarning(w);
        }
      }
    }

    return target;
  }
  function emitWarning(e) {
    typeof console.warn === 'function' ? console.warn(e) : console.log(e);
  }
  EventEmitter.prototype.addListener = function addListener(type, listener) {
    return _addListener(this, type, listener, false);
  };

  EventEmitter.prototype.on = EventEmitter.prototype.addListener;

  EventEmitter.prototype.prependListener =
      function prependListener(type, listener) {
        return _addListener(this, type, listener, true);
      };

  function _onceWrap(target, type, listener) {
    var fired = false;
    function g() {
      target.removeListener(type, g);
      if (!fired) {
        fired = true;
        listener.apply(target, arguments);
      }
    }
    g.listener = listener;
    return g;
  }

  EventEmitter.prototype.once = function once(type, listener) {
    if (typeof listener !== 'function')
      throw new TypeError('"listener" argument must be a function');
    this.on(type, _onceWrap(this, type, listener));
    return this;
  };

  EventEmitter.prototype.prependOnceListener =
      function prependOnceListener(type, listener) {
        if (typeof listener !== 'function')
          throw new TypeError('"listener" argument must be a function');
        this.prependListener(type, _onceWrap(this, type, listener));
        return this;
      };

  // emits a 'removeListener' event iff the listener was removed
  EventEmitter.prototype.removeListener =
      function removeListener(type, listener) {
        var list, events, position, i, originalListener;

        if (typeof listener !== 'function')
          throw new TypeError('"listener" argument must be a function');

        events = this._events;
        if (!events)
          return this;

        list = events[type];
        if (!list)
          return this;

        if (list === listener || (list.listener && list.listener === listener)) {
          if (--this._eventsCount === 0)
            this._events = new EventHandlers();
          else {
            delete events[type];
            if (events.removeListener)
              this.emit('removeListener', type, list.listener || listener);
          }
        } else if (typeof list !== 'function') {
          position = -1;

          for (i = list.length; i-- > 0;) {
            if (list[i] === listener ||
                (list[i].listener && list[i].listener === listener)) {
              originalListener = list[i].listener;
              position = i;
              break;
            }
          }

          if (position < 0)
            return this;

          if (list.length === 1) {
            list[0] = undefined;
            if (--this._eventsCount === 0) {
              this._events = new EventHandlers();
              return this;
            } else {
              delete events[type];
            }
          } else {
            spliceOne(list, position);
          }

          if (events.removeListener)
            this.emit('removeListener', type, originalListener || listener);
        }

        return this;
      };

  EventEmitter.prototype.removeAllListeners =
      function removeAllListeners(type) {
        var listeners, events;

        events = this._events;
        if (!events)
          return this;

        // not listening for removeListener, no need to emit
        if (!events.removeListener) {
          if (arguments.length === 0) {
            this._events = new EventHandlers();
            this._eventsCount = 0;
          } else if (events[type]) {
            if (--this._eventsCount === 0)
              this._events = new EventHandlers();
            else
              delete events[type];
          }
          return this;
        }

        // emit removeListener for all listeners on all events
        if (arguments.length === 0) {
          var keys = Object.keys(events);
          for (var i = 0, key; i < keys.length; ++i) {
            key = keys[i];
            if (key === 'removeListener') continue;
            this.removeAllListeners(key);
          }
          this.removeAllListeners('removeListener');
          this._events = new EventHandlers();
          this._eventsCount = 0;
          return this;
        }

        listeners = events[type];

        if (typeof listeners === 'function') {
          this.removeListener(type, listeners);
        } else if (listeners) {
          // LIFO order
          do {
            this.removeListener(type, listeners[listeners.length - 1]);
          } while (listeners[0]);
        }

        return this;
      };

  EventEmitter.prototype.listeners = function listeners(type) {
    var evlistener;
    var ret;
    var events = this._events;

    if (!events)
      ret = [];
    else {
      evlistener = events[type];
      if (!evlistener)
        ret = [];
      else if (typeof evlistener === 'function')
        ret = [evlistener.listener || evlistener];
      else
        ret = unwrapListeners(evlistener);
    }

    return ret;
  };

  EventEmitter.listenerCount = function(emitter, type) {
    if (typeof emitter.listenerCount === 'function') {
      return emitter.listenerCount(type);
    } else {
      return listenerCount$1.call(emitter, type);
    }
  };

  EventEmitter.prototype.listenerCount = listenerCount$1;
  function listenerCount$1(type) {
    var events = this._events;

    if (events) {
      var evlistener = events[type];

      if (typeof evlistener === 'function') {
        return 1;
      } else if (evlistener) {
        return evlistener.length;
      }
    }

    return 0;
  }

  EventEmitter.prototype.eventNames = function eventNames() {
    return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
  };

  // About 1.5x faster than the two-arg version of Array#splice().
  function spliceOne(list, index) {
    for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
      list[i] = list[k];
    list.pop();
  }

  function arrayClone(arr, i) {
    var copy = new Array(i);
    while (i--)
      copy[i] = arr[i];
    return copy;
  }

  function unwrapListeners(arr) {
    var ret = new Array(arr.length);
    for (var i = 0; i < ret.length; ++i) {
      ret[i] = arr[i].listener || arr[i];
    }
    return ret;
  }

  // shim for using process in browser
  // based off https://github.com/defunctzombie/node-process/blob/master/browser.js

  function defaultSetTimout() {
      throw new Error('setTimeout has not been defined');
  }
  function defaultClearTimeout () {
      throw new Error('clearTimeout has not been defined');
  }
  var cachedSetTimeout = defaultSetTimout;
  var cachedClearTimeout = defaultClearTimeout;
  if (typeof global$1.setTimeout === 'function') {
      cachedSetTimeout = setTimeout;
  }
  if (typeof global$1.clearTimeout === 'function') {
      cachedClearTimeout = clearTimeout;
  }

  function runTimeout(fun) {
      if (cachedSetTimeout === setTimeout) {
          //normal enviroments in sane situations
          return setTimeout(fun, 0);
      }
      // if setTimeout wasn't available but was latter defined
      if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
          cachedSetTimeout = setTimeout;
          return setTimeout(fun, 0);
      }
      try {
          // when when somebody has screwed with setTimeout but no I.E. maddness
          return cachedSetTimeout(fun, 0);
      } catch(e){
          try {
              // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
              return cachedSetTimeout.call(null, fun, 0);
          } catch(e){
              // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
              return cachedSetTimeout.call(this, fun, 0);
          }
      }


  }
  function runClearTimeout(marker) {
      if (cachedClearTimeout === clearTimeout) {
          //normal enviroments in sane situations
          return clearTimeout(marker);
      }
      // if clearTimeout wasn't available but was latter defined
      if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
          cachedClearTimeout = clearTimeout;
          return clearTimeout(marker);
      }
      try {
          // when when somebody has screwed with setTimeout but no I.E. maddness
          return cachedClearTimeout(marker);
      } catch (e){
          try {
              // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
              return cachedClearTimeout.call(null, marker);
          } catch (e){
              // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
              // Some versions of I.E. have different rules for clearTimeout vs setTimeout
              return cachedClearTimeout.call(this, marker);
          }
      }



  }
  var queue = [];
  var draining = false;
  var currentQueue;
  var queueIndex = -1;

  function cleanUpNextTick() {
      if (!draining || !currentQueue) {
          return;
      }
      draining = false;
      if (currentQueue.length) {
          queue = currentQueue.concat(queue);
      } else {
          queueIndex = -1;
      }
      if (queue.length) {
          drainQueue();
      }
  }

  function drainQueue() {
      if (draining) {
          return;
      }
      var timeout = runTimeout(cleanUpNextTick);
      draining = true;

      var len = queue.length;
      while(len) {
          currentQueue = queue;
          queue = [];
          while (++queueIndex < len) {
              if (currentQueue) {
                  currentQueue[queueIndex].run();
              }
          }
          queueIndex = -1;
          len = queue.length;
      }
      currentQueue = null;
      draining = false;
      runClearTimeout(timeout);
  }
  function nextTick(fun) {
      var args = new Array(arguments.length - 1);
      if (arguments.length > 1) {
          for (var i = 1; i < arguments.length; i++) {
              args[i - 1] = arguments[i];
          }
      }
      queue.push(new Item(fun, args));
      if (queue.length === 1 && !draining) {
          runTimeout(drainQueue);
      }
  }
  // v8 likes predictible objects
  function Item(fun, array) {
      this.fun = fun;
      this.array = array;
  }
  Item.prototype.run = function () {
      this.fun.apply(null, this.array);
  };
  var title = 'browser';
  var platform = 'browser';
  var browser = true;
  var env = {};
  var argv = [];
  var version = ''; // empty string to avoid regexp issues
  var versions = {};
  var release = {};
  var config = {};

  function noop() {}

  var on = noop;
  var addListener = noop;
  var once = noop;
  var off = noop;
  var removeListener = noop;
  var removeAllListeners = noop;
  var emit = noop;

  function binding(name) {
      throw new Error('process.binding is not supported');
  }

  function cwd () { return '/' }
  function chdir (dir) {
      throw new Error('process.chdir is not supported');
  }function umask() { return 0; }

  // from https://github.com/kumavis/browser-process-hrtime/blob/master/index.js
  var performance = global$1.performance || {};
  var performanceNow =
    performance.now        ||
    performance.mozNow     ||
    performance.msNow      ||
    performance.oNow       ||
    performance.webkitNow  ||
    function(){ return (new Date()).getTime() };

  // generate timestamp or delta
  // see http://nodejs.org/api/process.html#process_process_hrtime
  function hrtime(previousTimestamp){
    var clocktime = performanceNow.call(performance)*1e-3;
    var seconds = Math.floor(clocktime);
    var nanoseconds = Math.floor((clocktime%1)*1e9);
    if (previousTimestamp) {
      seconds = seconds - previousTimestamp[0];
      nanoseconds = nanoseconds - previousTimestamp[1];
      if (nanoseconds<0) {
        seconds--;
        nanoseconds += 1e9;
      }
    }
    return [seconds,nanoseconds]
  }

  var startTime = new Date();
  function uptime() {
    var currentTime = new Date();
    var dif = currentTime - startTime;
    return dif / 1000;
  }

  var browser$1 = {
    nextTick: nextTick,
    title: title,
    browser: browser,
    env: env,
    argv: argv,
    version: version,
    versions: versions,
    on: on,
    addListener: addListener,
    once: once,
    off: off,
    removeListener: removeListener,
    removeAllListeners: removeAllListeners,
    emit: emit,
    binding: binding,
    cwd: cwd,
    chdir: chdir,
    umask: umask,
    hrtime: hrtime,
    platform: platform,
    release: release,
    config: config,
    uptime: uptime
  };

  var process = browser$1;

  var inherits;
  if (typeof Object.create === 'function'){
    inherits = function inherits(ctor, superCtor) {
      // implementation from standard node.js 'util' module
      ctor.super_ = superCtor;
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      });
    };
  } else {
    inherits = function inherits(ctor, superCtor) {
      ctor.super_ = superCtor;
      var TempCtor = function () {};
      TempCtor.prototype = superCtor.prototype;
      ctor.prototype = new TempCtor();
      ctor.prototype.constructor = ctor;
    };
  }
  var inherits$1 = inherits;

  var formatRegExp = /%[sdj%]/g;
  function format(f) {
    if (!isString(f)) {
      var objects = [];
      for (var i = 0; i < arguments.length; i++) {
        objects.push(inspect(arguments[i]));
      }
      return objects.join(' ');
    }

    var i = 1;
    var args = arguments;
    var len = args.length;
    var str = String(f).replace(formatRegExp, function(x) {
      if (x === '%%') return '%';
      if (i >= len) return x;
      switch (x) {
        case '%s': return String(args[i++]);
        case '%d': return Number(args[i++]);
        case '%j':
          try {
            return JSON.stringify(args[i++]);
          } catch (_) {
            return '[Circular]';
          }
        default:
          return x;
      }
    });
    for (var x = args[i]; i < len; x = args[++i]) {
      if (isNull(x) || !isObject(x)) {
        str += ' ' + x;
      } else {
        str += ' ' + inspect(x);
      }
    }
    return str;
  }

  // Mark that a method should not be used.
  // Returns a modified function which warns once by default.
  // If --no-deprecation is set, then it is a no-op.
  function deprecate(fn, msg) {
    // Allow for deprecating things in the process of starting up.
    if (isUndefined(global$1.process)) {
      return function() {
        return deprecate(fn, msg).apply(this, arguments);
      };
    }

    if (process.noDeprecation === true) {
      return fn;
    }

    var warned = false;
    function deprecated() {
      if (!warned) {
        if (process.throwDeprecation) {
          throw new Error(msg);
        } else if (process.traceDeprecation) {
          console.trace(msg);
        } else {
          console.error(msg);
        }
        warned = true;
      }
      return fn.apply(this, arguments);
    }

    return deprecated;
  }

  var debugs = {};
  var debugEnviron;
  function debuglog(set) {
    if (isUndefined(debugEnviron))
      debugEnviron = process.env.NODE_DEBUG || '';
    set = set.toUpperCase();
    if (!debugs[set]) {
      if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
        var pid = 0;
        debugs[set] = function() {
          var msg = format.apply(null, arguments);
          console.error('%s %d: %s', set, pid, msg);
        };
      } else {
        debugs[set] = function() {};
      }
    }
    return debugs[set];
  }

  /**
   * Echos the value of a value. Trys to print the value out
   * in the best way possible given the different types.
   *
   * @param {Object} obj The object to print out.
   * @param {Object} opts Optional options object that alters the output.
   */
  /* legacy: obj, showHidden, depth, colors*/
  function inspect(obj, opts) {
    // default options
    var ctx = {
      seen: [],
      stylize: stylizeNoColor
    };
    // legacy...
    if (arguments.length >= 3) ctx.depth = arguments[2];
    if (arguments.length >= 4) ctx.colors = arguments[3];
    if (isBoolean(opts)) {
      // legacy...
      ctx.showHidden = opts;
    } else if (opts) {
      // got an "options" object
      _extend(ctx, opts);
    }
    // set default options
    if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
    if (isUndefined(ctx.depth)) ctx.depth = 2;
    if (isUndefined(ctx.colors)) ctx.colors = false;
    if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
    if (ctx.colors) ctx.stylize = stylizeWithColor;
    return formatValue(ctx, obj, ctx.depth);
  }

  // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
  inspect.colors = {
    'bold' : [1, 22],
    'italic' : [3, 23],
    'underline' : [4, 24],
    'inverse' : [7, 27],
    'white' : [37, 39],
    'grey' : [90, 39],
    'black' : [30, 39],
    'blue' : [34, 39],
    'cyan' : [36, 39],
    'green' : [32, 39],
    'magenta' : [35, 39],
    'red' : [31, 39],
    'yellow' : [33, 39]
  };

  // Don't use 'blue' not visible on cmd.exe
  inspect.styles = {
    'special': 'cyan',
    'number': 'yellow',
    'boolean': 'yellow',
    'undefined': 'grey',
    'null': 'bold',
    'string': 'green',
    'date': 'magenta',
    // "name": intentionally not styling
    'regexp': 'red'
  };


  function stylizeWithColor(str, styleType) {
    var style = inspect.styles[styleType];

    if (style) {
      return '\u001b[' + inspect.colors[style][0] + 'm' + str +
             '\u001b[' + inspect.colors[style][1] + 'm';
    } else {
      return str;
    }
  }


  function stylizeNoColor(str, styleType) {
    return str;
  }


  function arrayToHash(array) {
    var hash = {};

    array.forEach(function(val, idx) {
      hash[val] = true;
    });

    return hash;
  }


  function formatValue(ctx, value, recurseTimes) {
    // Provide a hook for user-specified inspect functions.
    // Check that value is an object with an inspect function on it
    if (ctx.customInspect &&
        value &&
        isFunction(value.inspect) &&
        // Filter out the util module, it's inspect function is special
        value.inspect !== inspect &&
        // Also filter out any prototype objects using the circular check.
        !(value.constructor && value.constructor.prototype === value)) {
      var ret = value.inspect(recurseTimes, ctx);
      if (!isString(ret)) {
        ret = formatValue(ctx, ret, recurseTimes);
      }
      return ret;
    }

    // Primitive types cannot have properties
    var primitive = formatPrimitive(ctx, value);
    if (primitive) {
      return primitive;
    }

    // Look up the keys of the object.
    var keys = Object.keys(value);
    var visibleKeys = arrayToHash(keys);

    if (ctx.showHidden) {
      keys = Object.getOwnPropertyNames(value);
    }

    // IE doesn't make error fields non-enumerable
    // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
    if (isError(value)
        && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
      return formatError(value);
    }

    // Some type of object without properties can be shortcutted.
    if (keys.length === 0) {
      if (isFunction(value)) {
        var name = value.name ? ': ' + value.name : '';
        return ctx.stylize('[Function' + name + ']', 'special');
      }
      if (isRegExp(value)) {
        return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
      }
      if (isDate(value)) {
        return ctx.stylize(Date.prototype.toString.call(value), 'date');
      }
      if (isError(value)) {
        return formatError(value);
      }
    }

    var base = '', array = false, braces = ['{', '}'];

    // Make Array say that they are Array
    if (isArray(value)) {
      array = true;
      braces = ['[', ']'];
    }

    // Make functions say that they are functions
    if (isFunction(value)) {
      var n = value.name ? ': ' + value.name : '';
      base = ' [Function' + n + ']';
    }

    // Make RegExps say that they are RegExps
    if (isRegExp(value)) {
      base = ' ' + RegExp.prototype.toString.call(value);
    }

    // Make dates with properties first say the date
    if (isDate(value)) {
      base = ' ' + Date.prototype.toUTCString.call(value);
    }

    // Make error with message first say the error
    if (isError(value)) {
      base = ' ' + formatError(value);
    }

    if (keys.length === 0 && (!array || value.length == 0)) {
      return braces[0] + base + braces[1];
    }

    if (recurseTimes < 0) {
      if (isRegExp(value)) {
        return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
      } else {
        return ctx.stylize('[Object]', 'special');
      }
    }

    ctx.seen.push(value);

    var output;
    if (array) {
      output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
    } else {
      output = keys.map(function(key) {
        return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
      });
    }

    ctx.seen.pop();

    return reduceToSingleString(output, base, braces);
  }


  function formatPrimitive(ctx, value) {
    if (isUndefined(value))
      return ctx.stylize('undefined', 'undefined');
    if (isString(value)) {
      var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                               .replace(/'/g, "\\'")
                                               .replace(/\\"/g, '"') + '\'';
      return ctx.stylize(simple, 'string');
    }
    if (isNumber(value))
      return ctx.stylize('' + value, 'number');
    if (isBoolean(value))
      return ctx.stylize('' + value, 'boolean');
    // For some reason typeof null is "object", so special case here.
    if (isNull(value))
      return ctx.stylize('null', 'null');
  }


  function formatError(value) {
    return '[' + Error.prototype.toString.call(value) + ']';
  }


  function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
    var output = [];
    for (var i = 0, l = value.length; i < l; ++i) {
      if (hasOwnProperty(value, String(i))) {
        output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
            String(i), true));
      } else {
        output.push('');
      }
    }
    keys.forEach(function(key) {
      if (!key.match(/^\d+$/)) {
        output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
            key, true));
      }
    });
    return output;
  }


  function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
    var name, str, desc;
    desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
    if (desc.get) {
      if (desc.set) {
        str = ctx.stylize('[Getter/Setter]', 'special');
      } else {
        str = ctx.stylize('[Getter]', 'special');
      }
    } else {
      if (desc.set) {
        str = ctx.stylize('[Setter]', 'special');
      }
    }
    if (!hasOwnProperty(visibleKeys, key)) {
      name = '[' + key + ']';
    }
    if (!str) {
      if (ctx.seen.indexOf(desc.value) < 0) {
        if (isNull(recurseTimes)) {
          str = formatValue(ctx, desc.value, null);
        } else {
          str = formatValue(ctx, desc.value, recurseTimes - 1);
        }
        if (str.indexOf('\n') > -1) {
          if (array) {
            str = str.split('\n').map(function(line) {
              return '  ' + line;
            }).join('\n').substr(2);
          } else {
            str = '\n' + str.split('\n').map(function(line) {
              return '   ' + line;
            }).join('\n');
          }
        }
      } else {
        str = ctx.stylize('[Circular]', 'special');
      }
    }
    if (isUndefined(name)) {
      if (array && key.match(/^\d+$/)) {
        return str;
      }
      name = JSON.stringify('' + key);
      if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
        name = name.substr(1, name.length - 2);
        name = ctx.stylize(name, 'name');
      } else {
        name = name.replace(/'/g, "\\'")
                   .replace(/\\"/g, '"')
                   .replace(/(^"|"$)/g, "'");
        name = ctx.stylize(name, 'string');
      }
    }

    return name + ': ' + str;
  }


  function reduceToSingleString(output, base, braces) {
    var length = output.reduce(function(prev, cur) {
      if (cur.indexOf('\n') >= 0) ;
      return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
    }, 0);

    if (length > 60) {
      return braces[0] +
             (base === '' ? '' : base + '\n ') +
             ' ' +
             output.join(',\n  ') +
             ' ' +
             braces[1];
    }

    return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
  }


  // NOTE: These type checking functions intentionally don't use `instanceof`
  // because it is fragile and can be easily faked with `Object.create()`.
  function isArray(ar) {
    return Array.isArray(ar);
  }

  function isBoolean(arg) {
    return typeof arg === 'boolean';
  }

  function isNull(arg) {
    return arg === null;
  }

  function isNumber(arg) {
    return typeof arg === 'number';
  }

  function isString(arg) {
    return typeof arg === 'string';
  }

  function isUndefined(arg) {
    return arg === void 0;
  }

  function isRegExp(re) {
    return isObject(re) && objectToString(re) === '[object RegExp]';
  }

  function isObject(arg) {
    return typeof arg === 'object' && arg !== null;
  }

  function isDate(d) {
    return isObject(d) && objectToString(d) === '[object Date]';
  }

  function isError(e) {
    return isObject(e) &&
        (objectToString(e) === '[object Error]' || e instanceof Error);
  }

  function isFunction(arg) {
    return typeof arg === 'function';
  }

  function objectToString(o) {
    return Object.prototype.toString.call(o);
  }

  function _extend(origin, add) {
    // Don't do anything if add isn't an object
    if (!add || !isObject(add)) return origin;

    var keys = Object.keys(add);
    var i = keys.length;
    while (i--) {
      origin[keys[i]] = add[keys[i]];
    }
    return origin;
  }
  function hasOwnProperty(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }

  function BufferList() {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  BufferList.prototype.push = function (v) {
    var entry = { data: v, next: null };
    if (this.length > 0) this.tail.next = entry;else this.head = entry;
    this.tail = entry;
    ++this.length;
  };

  BufferList.prototype.unshift = function (v) {
    var entry = { data: v, next: this.head };
    if (this.length === 0) this.tail = entry;
    this.head = entry;
    ++this.length;
  };

  BufferList.prototype.shift = function () {
    if (this.length === 0) return;
    var ret = this.head.data;
    if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
    --this.length;
    return ret;
  };

  BufferList.prototype.clear = function () {
    this.head = this.tail = null;
    this.length = 0;
  };

  BufferList.prototype.join = function (s) {
    if (this.length === 0) return '';
    var p = this.head;
    var ret = '' + p.data;
    while (p = p.next) {
      ret += s + p.data;
    }return ret;
  };

  BufferList.prototype.concat = function (n) {
    if (this.length === 0) return Buffer$6.alloc(0);
    if (this.length === 1) return this.head.data;
    var ret = Buffer$6.allocUnsafe(n >>> 0);
    var p = this.head;
    var i = 0;
    while (p) {
      p.data.copy(ret, i);
      i += p.data.length;
      p = p.next;
    }
    return ret;
  };

  // Copyright Joyent, Inc. and other Node contributors.
  //
  // Permission is hereby granted, free of charge, to any person obtaining a
  // copy of this software and associated documentation files (the
  // "Software"), to deal in the Software without restriction, including
  // without limitation the rights to use, copy, modify, merge, publish,
  // distribute, sublicense, and/or sell copies of the Software, and to permit
  // persons to whom the Software is furnished to do so, subject to the
  // following conditions:
  //
  // The above copyright notice and this permission notice shall be included
  // in all copies or substantial portions of the Software.
  //
  // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
  // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
  // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
  // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
  // USE OR OTHER DEALINGS IN THE SOFTWARE.

  var isBufferEncoding = Buffer$6.isEncoding
    || function(encoding) {
         switch (encoding && encoding.toLowerCase()) {
           case 'hex': case 'utf8': case 'utf-8': case 'ascii': case 'binary': case 'base64': case 'ucs2': case 'ucs-2': case 'utf16le': case 'utf-16le': case 'raw': return true;
           default: return false;
         }
       };


  function assertEncoding(encoding) {
    if (encoding && !isBufferEncoding(encoding)) {
      throw new Error('Unknown encoding: ' + encoding);
    }
  }

  // StringDecoder provides an interface for efficiently splitting a series of
  // buffers into a series of JS strings without breaking apart multi-byte
  // characters. CESU-8 is handled as part of the UTF-8 encoding.
  //
  // @TODO Handling all encodings inside a single object makes it very difficult
  // to reason about this code, so it should be split up in the future.
  // @TODO There should be a utf8-strict encoding that rejects invalid UTF-8 code
  // points as used by CESU-8.
  function StringDecoder(encoding) {
    this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
    assertEncoding(encoding);
    switch (this.encoding) {
      case 'utf8':
        // CESU-8 represents each of Surrogate Pair by 3-bytes
        this.surrogateSize = 3;
        break;
      case 'ucs2':
      case 'utf16le':
        // UTF-16 represents each of Surrogate Pair by 2-bytes
        this.surrogateSize = 2;
        this.detectIncompleteChar = utf16DetectIncompleteChar;
        break;
      case 'base64':
        // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
        this.surrogateSize = 3;
        this.detectIncompleteChar = base64DetectIncompleteChar;
        break;
      default:
        this.write = passThroughWrite;
        return;
    }

    // Enough space to store all bytes of a single character. UTF-8 needs 4
    // bytes, but CESU-8 may require up to 6 (3 bytes per surrogate).
    this.charBuffer = new Buffer$6(6);
    // Number of bytes received for the current incomplete multi-byte character.
    this.charReceived = 0;
    // Number of bytes expected for the current incomplete multi-byte character.
    this.charLength = 0;
  }

  // write decodes the given buffer and returns it as JS string that is
  // guaranteed to not contain any partial multi-byte characters. Any partial
  // character found at the end of the buffer is buffered up, and will be
  // returned when calling write again with the remaining bytes.
  //
  // Note: Converting a Buffer containing an orphan surrogate to a String
  // currently works, but converting a String to a Buffer (via `new Buffer`, or
  // Buffer#write) will replace incomplete surrogates with the unicode
  // replacement character. See https://codereview.chromium.org/121173009/ .
  StringDecoder.prototype.write = function(buffer) {
    var charStr = '';
    // if our last write ended with an incomplete multibyte character
    while (this.charLength) {
      // determine how many remaining bytes this buffer has to offer for this char
      var available = (buffer.length >= this.charLength - this.charReceived) ?
          this.charLength - this.charReceived :
          buffer.length;

      // add the new bytes to the char buffer
      buffer.copy(this.charBuffer, this.charReceived, 0, available);
      this.charReceived += available;

      if (this.charReceived < this.charLength) {
        // still not enough chars in this buffer? wait for more ...
        return '';
      }

      // remove bytes belonging to the current character from the buffer
      buffer = buffer.slice(available, buffer.length);

      // get the character that was split
      charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

      // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
      var charCode = charStr.charCodeAt(charStr.length - 1);
      if (charCode >= 0xD800 && charCode <= 0xDBFF) {
        this.charLength += this.surrogateSize;
        charStr = '';
        continue;
      }
      this.charReceived = this.charLength = 0;

      // if there are no more bytes in this buffer, just emit our char
      if (buffer.length === 0) {
        return charStr;
      }
      break;
    }

    // determine and set charLength / charReceived
    this.detectIncompleteChar(buffer);

    var end = buffer.length;
    if (this.charLength) {
      // buffer the incomplete character bytes we got
      buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
      end -= this.charReceived;
    }

    charStr += buffer.toString(this.encoding, 0, end);

    var end = charStr.length - 1;
    var charCode = charStr.charCodeAt(end);
    // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
      var size = this.surrogateSize;
      this.charLength += size;
      this.charReceived += size;
      this.charBuffer.copy(this.charBuffer, size, 0, size);
      buffer.copy(this.charBuffer, 0, 0, size);
      return charStr.substring(0, end);
    }

    // or just emit the charStr
    return charStr;
  };

  // detectIncompleteChar determines if there is an incomplete UTF-8 character at
  // the end of the given buffer. If so, it sets this.charLength to the byte
  // length that character, and sets this.charReceived to the number of bytes
  // that are available for this character.
  StringDecoder.prototype.detectIncompleteChar = function(buffer) {
    // determine how many bytes we have to check at the end of this buffer
    var i = (buffer.length >= 3) ? 3 : buffer.length;

    // Figure out if one of the last i bytes of our buffer announces an
    // incomplete char.
    for (; i > 0; i--) {
      var c = buffer[buffer.length - i];

      // See http://en.wikipedia.org/wiki/UTF-8#Description

      // 110XXXXX
      if (i == 1 && c >> 5 == 0x06) {
        this.charLength = 2;
        break;
      }

      // 1110XXXX
      if (i <= 2 && c >> 4 == 0x0E) {
        this.charLength = 3;
        break;
      }

      // 11110XXX
      if (i <= 3 && c >> 3 == 0x1E) {
        this.charLength = 4;
        break;
      }
    }
    this.charReceived = i;
  };

  StringDecoder.prototype.end = function(buffer) {
    var res = '';
    if (buffer && buffer.length)
      res = this.write(buffer);

    if (this.charReceived) {
      var cr = this.charReceived;
      var buf = this.charBuffer;
      var enc = this.encoding;
      res += buf.slice(0, cr).toString(enc);
    }

    return res;
  };

  function passThroughWrite(buffer) {
    return buffer.toString(this.encoding);
  }

  function utf16DetectIncompleteChar(buffer) {
    this.charReceived = buffer.length % 2;
    this.charLength = this.charReceived ? 2 : 0;
  }

  function base64DetectIncompleteChar(buffer) {
    this.charReceived = buffer.length % 3;
    this.charLength = this.charReceived ? 3 : 0;
  }

  Readable.ReadableState = ReadableState;

  var debug = debuglog('stream');
  inherits$1(Readable, EventEmitter);

  function prependListener(emitter, event, fn) {
    // Sadly this is not cacheable as some libraries bundle their own
    // event emitter implementation with them.
    if (typeof emitter.prependListener === 'function') {
      return emitter.prependListener(event, fn);
    } else {
      // This is a hack to make sure that our error handler is attached before any
      // userland ones.  NEVER DO THIS. This is here only because this code needs
      // to continue to work with older versions of Node.js that do not include
      // the prependListener() method. The goal is to eventually remove this hack.
      if (!emitter._events || !emitter._events[event])
        emitter.on(event, fn);
      else if (Array.isArray(emitter._events[event]))
        emitter._events[event].unshift(fn);
      else
        emitter._events[event] = [fn, emitter._events[event]];
    }
  }
  function listenerCount (emitter, type) {
    return emitter.listeners(type).length;
  }
  function ReadableState(options, stream) {

    options = options || {};

    // object stream flag. Used to make read(n) ignore n and to
    // make all the buffer merging and length checks go away
    this.objectMode = !!options.objectMode;

    if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

    // the point at which it stops calling _read() to fill the buffer
    // Note: 0 is a valid value, means "don't call _read preemptively ever"
    var hwm = options.highWaterMark;
    var defaultHwm = this.objectMode ? 16 : 16 * 1024;
    this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

    // cast to ints.
    this.highWaterMark = ~ ~this.highWaterMark;

    // A linked list is used to store data chunks instead of an array because the
    // linked list can remove elements from the beginning faster than
    // array.shift()
    this.buffer = new BufferList();
    this.length = 0;
    this.pipes = null;
    this.pipesCount = 0;
    this.flowing = null;
    this.ended = false;
    this.endEmitted = false;
    this.reading = false;

    // a flag to be able to tell if the onwrite cb is called immediately,
    // or on a later tick.  We set this to true at first, because any
    // actions that shouldn't happen until "later" should generally also
    // not happen before the first write call.
    this.sync = true;

    // whenever we return null, then we set a flag to say
    // that we're awaiting a 'readable' event emission.
    this.needReadable = false;
    this.emittedReadable = false;
    this.readableListening = false;
    this.resumeScheduled = false;

    // Crypto is kind of old and crusty.  Historically, its default string
    // encoding is 'binary' so we have to make this configurable.
    // Everything else in the universe uses 'utf8', though.
    this.defaultEncoding = options.defaultEncoding || 'utf8';

    // when piping, we only care about 'readable' events that happen
    // after read()ing all the bytes and not getting any pushback.
    this.ranOut = false;

    // the number of writers that are awaiting a drain event in .pipe()s
    this.awaitDrain = 0;

    // if true, a maybeReadMore has been scheduled
    this.readingMore = false;

    this.decoder = null;
    this.encoding = null;
    if (options.encoding) {
      this.decoder = new StringDecoder(options.encoding);
      this.encoding = options.encoding;
    }
  }
  function Readable(options) {

    if (!(this instanceof Readable)) return new Readable(options);

    this._readableState = new ReadableState(options, this);

    // legacy
    this.readable = true;

    if (options && typeof options.read === 'function') this._read = options.read;

    EventEmitter.call(this);
  }

  // Manually shove something into the read() buffer.
  // This returns true if the highWaterMark has not been hit yet,
  // similar to how Writable.write() returns true if you should
  // write() some more.
  Readable.prototype.push = function (chunk, encoding) {
    var state = this._readableState;

    if (!state.objectMode && typeof chunk === 'string') {
      encoding = encoding || state.defaultEncoding;
      if (encoding !== state.encoding) {
        chunk = Buffer$6.from(chunk, encoding);
        encoding = '';
      }
    }

    return readableAddChunk(this, state, chunk, encoding, false);
  };

  // Unshift should *always* be something directly out of read()
  Readable.prototype.unshift = function (chunk) {
    var state = this._readableState;
    return readableAddChunk(this, state, chunk, '', true);
  };

  Readable.prototype.isPaused = function () {
    return this._readableState.flowing === false;
  };

  function readableAddChunk(stream, state, chunk, encoding, addToFront) {
    var er = chunkInvalid(state, chunk);
    if (er) {
      stream.emit('error', er);
    } else if (chunk === null) {
      state.reading = false;
      onEofChunk(stream, state);
    } else if (state.objectMode || chunk && chunk.length > 0) {
      if (state.ended && !addToFront) {
        var e = new Error('stream.push() after EOF');
        stream.emit('error', e);
      } else if (state.endEmitted && addToFront) {
        var _e = new Error('stream.unshift() after end event');
        stream.emit('error', _e);
      } else {
        var skipAdd;
        if (state.decoder && !addToFront && !encoding) {
          chunk = state.decoder.write(chunk);
          skipAdd = !state.objectMode && chunk.length === 0;
        }

        if (!addToFront) state.reading = false;

        // Don't add to the buffer if we've decoded to an empty string chunk and
        // we're not in object mode
        if (!skipAdd) {
          // if we want the data now, just emit it.
          if (state.flowing && state.length === 0 && !state.sync) {
            stream.emit('data', chunk);
            stream.read(0);
          } else {
            // update the buffer info.
            state.length += state.objectMode ? 1 : chunk.length;
            if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

            if (state.needReadable) emitReadable(stream);
          }
        }

        maybeReadMore(stream, state);
      }
    } else if (!addToFront) {
      state.reading = false;
    }

    return needMoreData(state);
  }

  // if it's past the high water mark, we can push in some more.
  // Also, if we have no data yet, we can stand some
  // more bytes.  This is to work around cases where hwm=0,
  // such as the repl.  Also, if the push() triggered a
  // readable event, and the user called read(largeNumber) such that
  // needReadable was set, then we ought to push more, so that another
  // 'readable' event will be triggered.
  function needMoreData(state) {
    return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
  }

  // backwards compatibility.
  Readable.prototype.setEncoding = function (enc) {
    this._readableState.decoder = new StringDecoder(enc);
    this._readableState.encoding = enc;
    return this;
  };

  // Don't raise the hwm > 8MB
  var MAX_HWM = 0x800000;
  function computeNewHighWaterMark(n) {
    if (n >= MAX_HWM) {
      n = MAX_HWM;
    } else {
      // Get the next highest power of 2 to prevent increasing hwm excessively in
      // tiny amounts
      n--;
      n |= n >>> 1;
      n |= n >>> 2;
      n |= n >>> 4;
      n |= n >>> 8;
      n |= n >>> 16;
      n++;
    }
    return n;
  }

  // This function is designed to be inlinable, so please take care when making
  // changes to the function body.
  function howMuchToRead(n, state) {
    if (n <= 0 || state.length === 0 && state.ended) return 0;
    if (state.objectMode) return 1;
    if (n !== n) {
      // Only flow one buffer at a time
      if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
    }
    // If we're asking for more than the current hwm, then raise the hwm.
    if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
    if (n <= state.length) return n;
    // Don't have enough
    if (!state.ended) {
      state.needReadable = true;
      return 0;
    }
    return state.length;
  }

  // you can override either this method, or the async _read(n) below.
  Readable.prototype.read = function (n) {
    debug('read', n);
    n = parseInt(n, 10);
    var state = this._readableState;
    var nOrig = n;

    if (n !== 0) state.emittedReadable = false;

    // if we're doing read(0) to trigger a readable event, but we
    // already have a bunch of data in the buffer, then just trigger
    // the 'readable' event and move on.
    if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
      debug('read: emitReadable', state.length, state.ended);
      if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
      return null;
    }

    n = howMuchToRead(n, state);

    // if we've ended, and we're now clear, then finish it up.
    if (n === 0 && state.ended) {
      if (state.length === 0) endReadable(this);
      return null;
    }

    // All the actual chunk generation logic needs to be
    // *below* the call to _read.  The reason is that in certain
    // synthetic stream cases, such as passthrough streams, _read
    // may be a completely synchronous operation which may change
    // the state of the read buffer, providing enough data when
    // before there was *not* enough.
    //
    // So, the steps are:
    // 1. Figure out what the state of things will be after we do
    // a read from the buffer.
    //
    // 2. If that resulting state will trigger a _read, then call _read.
    // Note that this may be asynchronous, or synchronous.  Yes, it is
    // deeply ugly to write APIs this way, but that still doesn't mean
    // that the Readable class should behave improperly, as streams are
    // designed to be sync/async agnostic.
    // Take note if the _read call is sync or async (ie, if the read call
    // has returned yet), so that we know whether or not it's safe to emit
    // 'readable' etc.
    //
    // 3. Actually pull the requested chunks out of the buffer and return.

    // if we need a readable event, then we need to do some reading.
    var doRead = state.needReadable;
    debug('need readable', doRead);

    // if we currently have less than the highWaterMark, then also read some
    if (state.length === 0 || state.length - n < state.highWaterMark) {
      doRead = true;
      debug('length less than watermark', doRead);
    }

    // however, if we've ended, then there's no point, and if we're already
    // reading, then it's unnecessary.
    if (state.ended || state.reading) {
      doRead = false;
      debug('reading or ended', doRead);
    } else if (doRead) {
      debug('do read');
      state.reading = true;
      state.sync = true;
      // if the length is currently zero, then we *need* a readable event.
      if (state.length === 0) state.needReadable = true;
      // call internal read method
      this._read(state.highWaterMark);
      state.sync = false;
      // If _read pushed data synchronously, then `reading` will be false,
      // and we need to re-evaluate how much data we can return to the user.
      if (!state.reading) n = howMuchToRead(nOrig, state);
    }

    var ret;
    if (n > 0) ret = fromList(n, state);else ret = null;

    if (ret === null) {
      state.needReadable = true;
      n = 0;
    } else {
      state.length -= n;
    }

    if (state.length === 0) {
      // If we have nothing in the buffer, then we want to know
      // as soon as we *do* get something into the buffer.
      if (!state.ended) state.needReadable = true;

      // If we tried to read() past the EOF, then emit end on the next tick.
      if (nOrig !== n && state.ended) endReadable(this);
    }

    if (ret !== null) this.emit('data', ret);

    return ret;
  };

  function chunkInvalid(state, chunk) {
    var er = null;
    if (!Buffer$6.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== null && chunk !== undefined && !state.objectMode) {
      er = new TypeError('Invalid non-string/buffer chunk');
    }
    return er;
  }

  function onEofChunk(stream, state) {
    if (state.ended) return;
    if (state.decoder) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) {
        state.buffer.push(chunk);
        state.length += state.objectMode ? 1 : chunk.length;
      }
    }
    state.ended = true;

    // emit 'readable' now to make sure it gets picked up.
    emitReadable(stream);
  }

  // Don't emit readable right away in sync mode, because this can trigger
  // another read() call => stack overflow.  This way, it might trigger
  // a nextTick recursion warning, but that's not so bad.
  function emitReadable(stream) {
    var state = stream._readableState;
    state.needReadable = false;
    if (!state.emittedReadable) {
      debug('emitReadable', state.flowing);
      state.emittedReadable = true;
      if (state.sync) nextTick(emitReadable_, stream);else emitReadable_(stream);
    }
  }

  function emitReadable_(stream) {
    debug('emit readable');
    stream.emit('readable');
    flow(stream);
  }

  // at this point, the user has presumably seen the 'readable' event,
  // and called read() to consume some data.  that may have triggered
  // in turn another _read(n) call, in which case reading = true if
  // it's in progress.
  // However, if we're not ended, or reading, and the length < hwm,
  // then go ahead and try to read some more preemptively.
  function maybeReadMore(stream, state) {
    if (!state.readingMore) {
      state.readingMore = true;
      nextTick(maybeReadMore_, stream, state);
    }
  }

  function maybeReadMore_(stream, state) {
    var len = state.length;
    while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
      debug('maybeReadMore read 0');
      stream.read(0);
      if (len === state.length)
        // didn't get any data, stop spinning.
        break;else len = state.length;
    }
    state.readingMore = false;
  }

  // abstract method.  to be overridden in specific implementation classes.
  // call cb(er, data) where data is <= n in length.
  // for virtual (non-string, non-buffer) streams, "length" is somewhat
  // arbitrary, and perhaps not very meaningful.
  Readable.prototype._read = function (n) {
    this.emit('error', new Error('not implemented'));
  };

  Readable.prototype.pipe = function (dest, pipeOpts) {
    var src = this;
    var state = this._readableState;

    switch (state.pipesCount) {
      case 0:
        state.pipes = dest;
        break;
      case 1:
        state.pipes = [state.pipes, dest];
        break;
      default:
        state.pipes.push(dest);
        break;
    }
    state.pipesCount += 1;
    debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

    var doEnd = (!pipeOpts || pipeOpts.end !== false);

    var endFn = doEnd ? onend : cleanup;
    if (state.endEmitted) nextTick(endFn);else src.once('end', endFn);

    dest.on('unpipe', onunpipe);
    function onunpipe(readable) {
      debug('onunpipe');
      if (readable === src) {
        cleanup();
      }
    }

    function onend() {
      debug('onend');
      dest.end();
    }

    // when the dest drains, it reduces the awaitDrain counter
    // on the source.  This would be more elegant with a .once()
    // handler in flow(), but adding and removing repeatedly is
    // too slow.
    var ondrain = pipeOnDrain(src);
    dest.on('drain', ondrain);

    var cleanedUp = false;
    function cleanup() {
      debug('cleanup');
      // cleanup event handlers once the pipe is broken
      dest.removeListener('close', onclose);
      dest.removeListener('finish', onfinish);
      dest.removeListener('drain', ondrain);
      dest.removeListener('error', onerror);
      dest.removeListener('unpipe', onunpipe);
      src.removeListener('end', onend);
      src.removeListener('end', cleanup);
      src.removeListener('data', ondata);

      cleanedUp = true;

      // if the reader is waiting for a drain event from this
      // specific writer, then it would cause it to never start
      // flowing again.
      // So, if this is awaiting a drain, then we just call it now.
      // If we don't know, then assume that we are waiting for one.
      if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
    }

    // If the user pushes more data while we're writing to dest then we'll end up
    // in ondata again. However, we only want to increase awaitDrain once because
    // dest will only emit one 'drain' event for the multiple writes.
    // => Introduce a guard on increasing awaitDrain.
    var increasedAwaitDrain = false;
    src.on('data', ondata);
    function ondata(chunk) {
      debug('ondata');
      increasedAwaitDrain = false;
      var ret = dest.write(chunk);
      if (false === ret && !increasedAwaitDrain) {
        // If the user unpiped during `dest.write()`, it is possible
        // to get stuck in a permanently paused state if that write
        // also returned false.
        // => Check whether `dest` is still a piping destination.
        if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
          debug('false write response, pause', src._readableState.awaitDrain);
          src._readableState.awaitDrain++;
          increasedAwaitDrain = true;
        }
        src.pause();
      }
    }

    // if the dest has an error, then stop piping into it.
    // however, don't suppress the throwing behavior for this.
    function onerror(er) {
      debug('onerror', er);
      unpipe();
      dest.removeListener('error', onerror);
      if (listenerCount(dest, 'error') === 0) dest.emit('error', er);
    }

    // Make sure our error handler is attached before userland ones.
    prependListener(dest, 'error', onerror);

    // Both close and finish should trigger unpipe, but only once.
    function onclose() {
      dest.removeListener('finish', onfinish);
      unpipe();
    }
    dest.once('close', onclose);
    function onfinish() {
      debug('onfinish');
      dest.removeListener('close', onclose);
      unpipe();
    }
    dest.once('finish', onfinish);

    function unpipe() {
      debug('unpipe');
      src.unpipe(dest);
    }

    // tell the dest that it's being piped to
    dest.emit('pipe', src);

    // start the flow if it hasn't been started already.
    if (!state.flowing) {
      debug('pipe resume');
      src.resume();
    }

    return dest;
  };

  function pipeOnDrain(src) {
    return function () {
      var state = src._readableState;
      debug('pipeOnDrain', state.awaitDrain);
      if (state.awaitDrain) state.awaitDrain--;
      if (state.awaitDrain === 0 && src.listeners('data').length) {
        state.flowing = true;
        flow(src);
      }
    };
  }

  Readable.prototype.unpipe = function (dest) {
    var state = this._readableState;

    // if we're not piping anywhere, then do nothing.
    if (state.pipesCount === 0) return this;

    // just one destination.  most common case.
    if (state.pipesCount === 1) {
      // passed in one, but it's not the right one.
      if (dest && dest !== state.pipes) return this;

      if (!dest) dest = state.pipes;

      // got a match.
      state.pipes = null;
      state.pipesCount = 0;
      state.flowing = false;
      if (dest) dest.emit('unpipe', this);
      return this;
    }

    // slow case. multiple pipe destinations.

    if (!dest) {
      // remove all.
      var dests = state.pipes;
      var len = state.pipesCount;
      state.pipes = null;
      state.pipesCount = 0;
      state.flowing = false;

      for (var _i = 0; _i < len; _i++) {
        dests[_i].emit('unpipe', this);
      }return this;
    }

    // try to find the right one.
    var i = indexOf(state.pipes, dest);
    if (i === -1) return this;

    state.pipes.splice(i, 1);
    state.pipesCount -= 1;
    if (state.pipesCount === 1) state.pipes = state.pipes[0];

    dest.emit('unpipe', this);

    return this;
  };

  // set up data events if they are asked for
  // Ensure readable listeners eventually get something
  Readable.prototype.on = function (ev, fn) {
    var res = EventEmitter.prototype.on.call(this, ev, fn);

    if (ev === 'data') {
      // Start flowing on next tick if stream isn't explicitly paused
      if (this._readableState.flowing !== false) this.resume();
    } else if (ev === 'readable') {
      var state = this._readableState;
      if (!state.endEmitted && !state.readableListening) {
        state.readableListening = state.needReadable = true;
        state.emittedReadable = false;
        if (!state.reading) {
          nextTick(nReadingNextTick, this);
        } else if (state.length) {
          emitReadable(this);
        }
      }
    }

    return res;
  };
  Readable.prototype.addListener = Readable.prototype.on;

  function nReadingNextTick(self) {
    debug('readable nexttick read 0');
    self.read(0);
  }

  // pause() and resume() are remnants of the legacy readable stream API
  // If the user uses them, then switch into old mode.
  Readable.prototype.resume = function () {
    var state = this._readableState;
    if (!state.flowing) {
      debug('resume');
      state.flowing = true;
      resume(this, state);
    }
    return this;
  };

  function resume(stream, state) {
    if (!state.resumeScheduled) {
      state.resumeScheduled = true;
      nextTick(resume_, stream, state);
    }
  }

  function resume_(stream, state) {
    if (!state.reading) {
      debug('resume read 0');
      stream.read(0);
    }

    state.resumeScheduled = false;
    state.awaitDrain = 0;
    stream.emit('resume');
    flow(stream);
    if (state.flowing && !state.reading) stream.read(0);
  }

  Readable.prototype.pause = function () {
    debug('call pause flowing=%j', this._readableState.flowing);
    if (false !== this._readableState.flowing) {
      debug('pause');
      this._readableState.flowing = false;
      this.emit('pause');
    }
    return this;
  };

  function flow(stream) {
    var state = stream._readableState;
    debug('flow', state.flowing);
    while (state.flowing && stream.read() !== null) {}
  }

  // wrap an old-style stream as the async data source.
  // This is *not* part of the readable stream interface.
  // It is an ugly unfortunate mess of history.
  Readable.prototype.wrap = function (stream) {
    var state = this._readableState;
    var paused = false;

    var self = this;
    stream.on('end', function () {
      debug('wrapped end');
      if (state.decoder && !state.ended) {
        var chunk = state.decoder.end();
        if (chunk && chunk.length) self.push(chunk);
      }

      self.push(null);
    });

    stream.on('data', function (chunk) {
      debug('wrapped data');
      if (state.decoder) chunk = state.decoder.write(chunk);

      // don't skip over falsy values in objectMode
      if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

      var ret = self.push(chunk);
      if (!ret) {
        paused = true;
        stream.pause();
      }
    });

    // proxy all the other methods.
    // important when wrapping filters and duplexes.
    for (var i in stream) {
      if (this[i] === undefined && typeof stream[i] === 'function') {
        this[i] = function (method) {
          return function () {
            return stream[method].apply(stream, arguments);
          };
        }(i);
      }
    }

    // proxy certain important events.
    var events = ['error', 'close', 'destroy', 'pause', 'resume'];
    forEach(events, function (ev) {
      stream.on(ev, self.emit.bind(self, ev));
    });

    // when we try to consume some more bytes, simply unpause the
    // underlying stream.
    self._read = function (n) {
      debug('wrapped _read', n);
      if (paused) {
        paused = false;
        stream.resume();
      }
    };

    return self;
  };

  // exposed for testing purposes only.
  Readable._fromList = fromList;

  // Pluck off n bytes from an array of buffers.
  // Length is the combined lengths of all the buffers in the list.
  // This function is designed to be inlinable, so please take care when making
  // changes to the function body.
  function fromList(n, state) {
    // nothing buffered
    if (state.length === 0) return null;

    var ret;
    if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
      // read it all, truncate the list
      if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
      state.buffer.clear();
    } else {
      // read part of list
      ret = fromListPartial(n, state.buffer, state.decoder);
    }

    return ret;
  }

  // Extracts only enough buffered data to satisfy the amount requested.
  // This function is designed to be inlinable, so please take care when making
  // changes to the function body.
  function fromListPartial(n, list, hasStrings) {
    var ret;
    if (n < list.head.data.length) {
      // slice is the same for buffers and strings
      ret = list.head.data.slice(0, n);
      list.head.data = list.head.data.slice(n);
    } else if (n === list.head.data.length) {
      // first chunk is a perfect match
      ret = list.shift();
    } else {
      // result spans more than one buffer
      ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
    }
    return ret;
  }

  // Copies a specified amount of characters from the list of buffered data
  // chunks.
  // This function is designed to be inlinable, so please take care when making
  // changes to the function body.
  function copyFromBufferString(n, list) {
    var p = list.head;
    var c = 1;
    var ret = p.data;
    n -= ret.length;
    while (p = p.next) {
      var str = p.data;
      var nb = n > str.length ? str.length : n;
      if (nb === str.length) ret += str;else ret += str.slice(0, n);
      n -= nb;
      if (n === 0) {
        if (nb === str.length) {
          ++c;
          if (p.next) list.head = p.next;else list.head = list.tail = null;
        } else {
          list.head = p;
          p.data = str.slice(nb);
        }
        break;
      }
      ++c;
    }
    list.length -= c;
    return ret;
  }

  // Copies a specified amount of bytes from the list of buffered data chunks.
  // This function is designed to be inlinable, so please take care when making
  // changes to the function body.
  function copyFromBuffer(n, list) {
    var ret = Buffer$6.allocUnsafe(n);
    var p = list.head;
    var c = 1;
    p.data.copy(ret);
    n -= p.data.length;
    while (p = p.next) {
      var buf = p.data;
      var nb = n > buf.length ? buf.length : n;
      buf.copy(ret, ret.length - n, 0, nb);
      n -= nb;
      if (n === 0) {
        if (nb === buf.length) {
          ++c;
          if (p.next) list.head = p.next;else list.head = list.tail = null;
        } else {
          list.head = p;
          p.data = buf.slice(nb);
        }
        break;
      }
      ++c;
    }
    list.length -= c;
    return ret;
  }

  function endReadable(stream) {
    var state = stream._readableState;

    // If we get here before consuming all the bytes, then that is a
    // bug in node.  Should never happen.
    if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

    if (!state.endEmitted) {
      state.ended = true;
      nextTick(endReadableNT, state, stream);
    }
  }

  function endReadableNT(state, stream) {
    // Check that we didn't get one last unshift.
    if (!state.endEmitted && state.length === 0) {
      state.endEmitted = true;
      stream.readable = false;
      stream.emit('end');
    }
  }

  function forEach(xs, f) {
    for (var i = 0, l = xs.length; i < l; i++) {
      f(xs[i], i);
    }
  }

  function indexOf(xs, x) {
    for (var i = 0, l = xs.length; i < l; i++) {
      if (xs[i] === x) return i;
    }
    return -1;
  }

  // A bit simpler than readable streams.
  // Implement an async ._write(chunk, encoding, cb), and it'll handle all
  // the drain event emission and buffering.

  Writable.WritableState = WritableState;
  inherits$1(Writable, EventEmitter);

  function nop() {}

  function WriteReq(chunk, encoding, cb) {
    this.chunk = chunk;
    this.encoding = encoding;
    this.callback = cb;
    this.next = null;
  }

  function WritableState(options, stream) {
    Object.defineProperty(this, 'buffer', {
      get: deprecate(function () {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.')
    });
    options = options || {};

    // object stream flag to indicate whether or not this stream
    // contains buffers or objects.
    this.objectMode = !!options.objectMode;

    if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

    // the point at which write() starts returning false
    // Note: 0 is a valid value, means that we always return false if
    // the entire buffer is not flushed immediately on write()
    var hwm = options.highWaterMark;
    var defaultHwm = this.objectMode ? 16 : 16 * 1024;
    this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

    // cast to ints.
    this.highWaterMark = ~ ~this.highWaterMark;

    this.needDrain = false;
    // at the start of calling end()
    this.ending = false;
    // when end() has been called, and returned
    this.ended = false;
    // when 'finish' is emitted
    this.finished = false;

    // should we decode strings into buffers before passing to _write?
    // this is here so that some node-core streams can optimize string
    // handling at a lower level.
    var noDecode = options.decodeStrings === false;
    this.decodeStrings = !noDecode;

    // Crypto is kind of old and crusty.  Historically, its default string
    // encoding is 'binary' so we have to make this configurable.
    // Everything else in the universe uses 'utf8', though.
    this.defaultEncoding = options.defaultEncoding || 'utf8';

    // not an actual buffer we keep track of, but a measurement
    // of how much we're waiting to get pushed to some underlying
    // socket or file.
    this.length = 0;

    // a flag to see when we're in the middle of a write.
    this.writing = false;

    // when true all writes will be buffered until .uncork() call
    this.corked = 0;

    // a flag to be able to tell if the onwrite cb is called immediately,
    // or on a later tick.  We set this to true at first, because any
    // actions that shouldn't happen until "later" should generally also
    // not happen before the first write call.
    this.sync = true;

    // a flag to know if we're processing previously buffered items, which
    // may call the _write() callback in the same tick, so that we don't
    // end up in an overlapped onwrite situation.
    this.bufferProcessing = false;

    // the callback that's passed to _write(chunk,cb)
    this.onwrite = function (er) {
      onwrite(stream, er);
    };

    // the callback that the user supplies to write(chunk,encoding,cb)
    this.writecb = null;

    // the amount that is being written when _write is called.
    this.writelen = 0;

    this.bufferedRequest = null;
    this.lastBufferedRequest = null;

    // number of pending user-supplied write callbacks
    // this must be 0 before 'finish' can be emitted
    this.pendingcb = 0;

    // emit prefinish if the only thing we're waiting for is _write cbs
    // This is relevant for synchronous Transform streams
    this.prefinished = false;

    // True if the error was already emitted and should not be thrown again
    this.errorEmitted = false;

    // count buffered requests
    this.bufferedRequestCount = 0;

    // allocate the first CorkedRequest, there is always
    // one allocated and free to use, and we maintain at most two
    this.corkedRequestsFree = new CorkedRequest(this);
  }

  WritableState.prototype.getBuffer = function writableStateGetBuffer() {
    var current = this.bufferedRequest;
    var out = [];
    while (current) {
      out.push(current);
      current = current.next;
    }
    return out;
  };
  function Writable(options) {

    // Writable ctor is applied to Duplexes, though they're not
    // instanceof Writable, they're instanceof Readable.
    if (!(this instanceof Writable) && !(this instanceof Duplex)) return new Writable(options);

    this._writableState = new WritableState(options, this);

    // legacy.
    this.writable = true;

    if (options) {
      if (typeof options.write === 'function') this._write = options.write;

      if (typeof options.writev === 'function') this._writev = options.writev;
    }

    EventEmitter.call(this);
  }

  // Otherwise people can pipe Writable streams, which is just wrong.
  Writable.prototype.pipe = function () {
    this.emit('error', new Error('Cannot pipe, not readable'));
  };

  function writeAfterEnd(stream, cb) {
    var er = new Error('write after end');
    // TODO: defer error events consistently everywhere, not just the cb
    stream.emit('error', er);
    nextTick(cb, er);
  }

  // If we get something that is not a buffer, string, null, or undefined,
  // and we're not in objectMode, then that's an error.
  // Otherwise stream chunks are all considered to be of length=1, and the
  // watermarks determine how many objects to keep in the buffer, rather than
  // how many bytes or characters.
  function validChunk(stream, state, chunk, cb) {
    var valid = true;
    var er = false;
    // Always throw error if a null is written
    // if we are not in object mode then throw
    // if it is not a buffer, string, or undefined.
    if (chunk === null) {
      er = new TypeError('May not write null values to stream');
    } else if (!Buffer$6.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
      er = new TypeError('Invalid non-string/buffer chunk');
    }
    if (er) {
      stream.emit('error', er);
      nextTick(cb, er);
      valid = false;
    }
    return valid;
  }

  Writable.prototype.write = function (chunk, encoding, cb) {
    var state = this._writableState;
    var ret = false;

    if (typeof encoding === 'function') {
      cb = encoding;
      encoding = null;
    }

    if (Buffer$6.isBuffer(chunk)) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

    if (typeof cb !== 'function') cb = nop;

    if (state.ended) writeAfterEnd(this, cb);else if (validChunk(this, state, chunk, cb)) {
      state.pendingcb++;
      ret = writeOrBuffer(this, state, chunk, encoding, cb);
    }

    return ret;
  };

  Writable.prototype.cork = function () {
    var state = this._writableState;

    state.corked++;
  };

  Writable.prototype.uncork = function () {
    var state = this._writableState;

    if (state.corked) {
      state.corked--;

      if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
    }
  };

  Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
    // node::ParseEncoding() requires lower case.
    if (typeof encoding === 'string') encoding = encoding.toLowerCase();
    if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
    this._writableState.defaultEncoding = encoding;
    return this;
  };

  function decodeChunk(state, chunk, encoding) {
    if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
      chunk = Buffer$6.from(chunk, encoding);
    }
    return chunk;
  }

  // if we're already writing something, then just put this
  // in the queue, and wait our turn.  Otherwise, call _write
  // If we return false, then we need a drain event, so set that flag.
  function writeOrBuffer(stream, state, chunk, encoding, cb) {
    chunk = decodeChunk(state, chunk, encoding);

    if (Buffer$6.isBuffer(chunk)) encoding = 'buffer';
    var len = state.objectMode ? 1 : chunk.length;

    state.length += len;

    var ret = state.length < state.highWaterMark;
    // we must ensure that previous needDrain will not be reset to false.
    if (!ret) state.needDrain = true;

    if (state.writing || state.corked) {
      var last = state.lastBufferedRequest;
      state.lastBufferedRequest = new WriteReq(chunk, encoding, cb);
      if (last) {
        last.next = state.lastBufferedRequest;
      } else {
        state.bufferedRequest = state.lastBufferedRequest;
      }
      state.bufferedRequestCount += 1;
    } else {
      doWrite(stream, state, false, len, chunk, encoding, cb);
    }

    return ret;
  }

  function doWrite(stream, state, writev, len, chunk, encoding, cb) {
    state.writelen = len;
    state.writecb = cb;
    state.writing = true;
    state.sync = true;
    if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
    state.sync = false;
  }

  function onwriteError(stream, state, sync, er, cb) {
    --state.pendingcb;
    if (sync) nextTick(cb, er);else cb(er);

    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
  }

  function onwriteStateUpdate(state) {
    state.writing = false;
    state.writecb = null;
    state.length -= state.writelen;
    state.writelen = 0;
  }

  function onwrite(stream, er) {
    var state = stream._writableState;
    var sync = state.sync;
    var cb = state.writecb;

    onwriteStateUpdate(state);

    if (er) onwriteError(stream, state, sync, er, cb);else {
      // Check if we're actually ready to finish, but don't emit yet
      var finished = needFinish(state);

      if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
        clearBuffer(stream, state);
      }

      if (sync) {
        /*<replacement>*/
          nextTick(afterWrite, stream, state, finished, cb);
        /*</replacement>*/
      } else {
          afterWrite(stream, state, finished, cb);
        }
    }
  }

  function afterWrite(stream, state, finished, cb) {
    if (!finished) onwriteDrain(stream, state);
    state.pendingcb--;
    cb();
    finishMaybe(stream, state);
  }

  // Must force callback to be called on nextTick, so that we don't
  // emit 'drain' before the write() consumer gets the 'false' return
  // value, and has a chance to attach a 'drain' listener.
  function onwriteDrain(stream, state) {
    if (state.length === 0 && state.needDrain) {
      state.needDrain = false;
      stream.emit('drain');
    }
  }

  // if there's something in the buffer waiting, then process it
  function clearBuffer(stream, state) {
    state.bufferProcessing = true;
    var entry = state.bufferedRequest;

    if (stream._writev && entry && entry.next) {
      // Fast case, write everything using _writev()
      var l = state.bufferedRequestCount;
      var buffer = new Array(l);
      var holder = state.corkedRequestsFree;
      holder.entry = entry;

      var count = 0;
      while (entry) {
        buffer[count] = entry;
        entry = entry.next;
        count += 1;
      }

      doWrite(stream, state, true, state.length, buffer, '', holder.finish);

      // doWrite is almost always async, defer these to save a bit of time
      // as the hot path ends with doWrite
      state.pendingcb++;
      state.lastBufferedRequest = null;
      if (holder.next) {
        state.corkedRequestsFree = holder.next;
        holder.next = null;
      } else {
        state.corkedRequestsFree = new CorkedRequest(state);
      }
    } else {
      // Slow case, write chunks one-by-one
      while (entry) {
        var chunk = entry.chunk;
        var encoding = entry.encoding;
        var cb = entry.callback;
        var len = state.objectMode ? 1 : chunk.length;

        doWrite(stream, state, false, len, chunk, encoding, cb);
        entry = entry.next;
        // if we didn't call the onwrite immediately, then
        // it means that we need to wait until it does.
        // also, that means that the chunk and cb are currently
        // being processed, so move the buffer counter past them.
        if (state.writing) {
          break;
        }
      }

      if (entry === null) state.lastBufferedRequest = null;
    }

    state.bufferedRequestCount = 0;
    state.bufferedRequest = entry;
    state.bufferProcessing = false;
  }

  Writable.prototype._write = function (chunk, encoding, cb) {
    cb(new Error('not implemented'));
  };

  Writable.prototype._writev = null;

  Writable.prototype.end = function (chunk, encoding, cb) {
    var state = this._writableState;

    if (typeof chunk === 'function') {
      cb = chunk;
      chunk = null;
      encoding = null;
    } else if (typeof encoding === 'function') {
      cb = encoding;
      encoding = null;
    }

    if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

    // .end() fully uncorks
    if (state.corked) {
      state.corked = 1;
      this.uncork();
    }

    // ignore unnecessary end() calls.
    if (!state.ending && !state.finished) endWritable(this, state, cb);
  };

  function needFinish(state) {
    return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
  }

  function prefinish(stream, state) {
    if (!state.prefinished) {
      state.prefinished = true;
      stream.emit('prefinish');
    }
  }

  function finishMaybe(stream, state) {
    var need = needFinish(state);
    if (need) {
      if (state.pendingcb === 0) {
        prefinish(stream, state);
        state.finished = true;
        stream.emit('finish');
      } else {
        prefinish(stream, state);
      }
    }
    return need;
  }

  function endWritable(stream, state, cb) {
    state.ending = true;
    finishMaybe(stream, state);
    if (cb) {
      if (state.finished) nextTick(cb);else stream.once('finish', cb);
    }
    state.ended = true;
    stream.writable = false;
  }

  // It seems a linked list but it is not
  // there will be only 2 of these for each stream
  function CorkedRequest(state) {
    var _this = this;

    this.next = null;
    this.entry = null;

    this.finish = function (err) {
      var entry = _this.entry;
      _this.entry = null;
      while (entry) {
        var cb = entry.callback;
        state.pendingcb--;
        cb(err);
        entry = entry.next;
      }
      if (state.corkedRequestsFree) {
        state.corkedRequestsFree.next = _this;
      } else {
        state.corkedRequestsFree = _this;
      }
    };
  }

  inherits$1(Duplex, Readable);

  var keys = Object.keys(Writable.prototype);
  for (var v = 0; v < keys.length; v++) {
    var method = keys[v];
    if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
  }
  function Duplex(options) {
    if (!(this instanceof Duplex)) return new Duplex(options);

    Readable.call(this, options);
    Writable.call(this, options);

    if (options && options.readable === false) this.readable = false;

    if (options && options.writable === false) this.writable = false;

    this.allowHalfOpen = true;
    if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

    this.once('end', onend);
  }

  // the no-half-open enforcer
  function onend() {
    // if we allow half-open state, or if the writable side ended,
    // then we're ok.
    if (this.allowHalfOpen || this._writableState.ended) return;

    // no more data can be written.
    // But allow more writes to happen in this tick.
    nextTick(onEndNT, this);
  }

  function onEndNT(self) {
    self.end();
  }

  // a transform stream is a readable/writable stream where you do
  // something with the data.  Sometimes it's called a "filter",
  // but that's not a great name for it, since that implies a thing where
  // some bits pass through, and others are simply ignored.  (That would
  // be a valid example of a transform, of course.)
  //
  // While the output is causally related to the input, it's not a
  // necessarily symmetric or synchronous transformation.  For example,
  // a zlib stream might take multiple plain-text writes(), and then
  // emit a single compressed chunk some time in the future.
  //
  // Here's how this works:
  //
  // The Transform stream has all the aspects of the readable and writable
  // stream classes.  When you write(chunk), that calls _write(chunk,cb)
  // internally, and returns false if there's a lot of pending writes
  // buffered up.  When you call read(), that calls _read(n) until
  // there's enough pending readable data buffered up.
  //
  // In a transform stream, the written data is placed in a buffer.  When
  // _read(n) is called, it transforms the queued up data, calling the
  // buffered _write cb's as it consumes chunks.  If consuming a single
  // written chunk would result in multiple output chunks, then the first
  // outputted bit calls the readcb, and subsequent chunks just go into
  // the read buffer, and will cause it to emit 'readable' if necessary.
  //
  // This way, back-pressure is actually determined by the reading side,
  // since _read has to be called to start processing a new chunk.  However,
  // a pathological inflate type of transform can cause excessive buffering
  // here.  For example, imagine a stream where every byte of input is
  // interpreted as an integer from 0-255, and then results in that many
  // bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
  // 1kb of data being output.  In this case, you could write a very small
  // amount of input, and end up with a very large amount of output.  In
  // such a pathological inflating mechanism, there'd be no way to tell
  // the system to stop doing the transform.  A single 4MB write could
  // cause the system to run out of memory.
  //
  // However, even in such a pathological case, only a single written chunk
  // would be consumed, and then the rest would wait (un-transformed) until
  // the results of the previous transformed chunk were consumed.

  inherits$1(Transform, Duplex);

  function TransformState(stream) {
    this.afterTransform = function (er, data) {
      return afterTransform(stream, er, data);
    };

    this.needTransform = false;
    this.transforming = false;
    this.writecb = null;
    this.writechunk = null;
    this.writeencoding = null;
  }

  function afterTransform(stream, er, data) {
    var ts = stream._transformState;
    ts.transforming = false;

    var cb = ts.writecb;

    if (!cb) return stream.emit('error', new Error('no writecb in Transform class'));

    ts.writechunk = null;
    ts.writecb = null;

    if (data !== null && data !== undefined) stream.push(data);

    cb(er);

    var rs = stream._readableState;
    rs.reading = false;
    if (rs.needReadable || rs.length < rs.highWaterMark) {
      stream._read(rs.highWaterMark);
    }
  }
  function Transform(options) {
    if (!(this instanceof Transform)) return new Transform(options);

    Duplex.call(this, options);

    this._transformState = new TransformState(this);

    // when the writable side finishes, then flush out anything remaining.
    var stream = this;

    // start out asking for a readable event once data is transformed.
    this._readableState.needReadable = true;

    // we have implemented the _read method, and done the other things
    // that Readable wants before the first _read call, so unset the
    // sync guard flag.
    this._readableState.sync = false;

    if (options) {
      if (typeof options.transform === 'function') this._transform = options.transform;

      if (typeof options.flush === 'function') this._flush = options.flush;
    }

    this.once('prefinish', function () {
      if (typeof this._flush === 'function') this._flush(function (er) {
        done(stream, er);
      });else done(stream);
    });
  }

  Transform.prototype.push = function (chunk, encoding) {
    this._transformState.needTransform = false;
    return Duplex.prototype.push.call(this, chunk, encoding);
  };

  // This is the part where you do stuff!
  // override this function in implementation classes.
  // 'chunk' is an input chunk.
  //
  // Call `push(newChunk)` to pass along transformed output
  // to the readable side.  You may call 'push' zero or more times.
  //
  // Call `cb(err)` when you are done with this chunk.  If you pass
  // an error, then that'll put the hurt on the whole operation.  If you
  // never call cb(), then you'll never get another chunk.
  Transform.prototype._transform = function (chunk, encoding, cb) {
    throw new Error('Not implemented');
  };

  Transform.prototype._write = function (chunk, encoding, cb) {
    var ts = this._transformState;
    ts.writecb = cb;
    ts.writechunk = chunk;
    ts.writeencoding = encoding;
    if (!ts.transforming) {
      var rs = this._readableState;
      if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
    }
  };

  // Doesn't matter what the args are here.
  // _transform does all the work.
  // That we got here means that the readable side wants more data.
  Transform.prototype._read = function (n) {
    var ts = this._transformState;

    if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
      ts.transforming = true;
      this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
    } else {
      // mark that we need a transform, so that any data that comes in
      // will get processed, now that we've asked for it.
      ts.needTransform = true;
    }
  };

  function done(stream, er) {
    if (er) return stream.emit('error', er);

    // if there's nothing in the write buffer, then that means
    // that nothing more will ever be provided
    var ws = stream._writableState;
    var ts = stream._transformState;

    if (ws.length) throw new Error('Calling transform done when ws.length != 0');

    if (ts.transforming) throw new Error('Calling transform done when still transforming');

    return stream.push(null);
  }

  inherits$1(PassThrough, Transform);
  function PassThrough(options) {
    if (!(this instanceof PassThrough)) return new PassThrough(options);

    Transform.call(this, options);
  }

  PassThrough.prototype._transform = function (chunk, encoding, cb) {
    cb(null, chunk);
  };

  inherits$1(Stream, EventEmitter);
  Stream.Readable = Readable;
  Stream.Writable = Writable;
  Stream.Duplex = Duplex;
  Stream.Transform = Transform;
  Stream.PassThrough = PassThrough;

  // Backwards-compat with node 0.4.x
  Stream.Stream = Stream;

  // old-style streams.  Note that the pipe method (the only relevant
  // part of this class) is overridden in the Readable class.

  function Stream() {
    EventEmitter.call(this);
  }

  Stream.prototype.pipe = function(dest, options) {
    var source = this;

    function ondata(chunk) {
      if (dest.writable) {
        if (false === dest.write(chunk) && source.pause) {
          source.pause();
        }
      }
    }

    source.on('data', ondata);

    function ondrain() {
      if (source.readable && source.resume) {
        source.resume();
      }
    }

    dest.on('drain', ondrain);

    // If the 'end' option is not supplied, dest.end() will be called when
    // source gets the 'end' or 'close' events.  Only dest.end() once.
    if (!dest._isStdio && (!options || options.end !== false)) {
      source.on('end', onend);
      source.on('close', onclose);
    }

    var didOnEnd = false;
    function onend() {
      if (didOnEnd) return;
      didOnEnd = true;

      dest.end();
    }


    function onclose() {
      if (didOnEnd) return;
      didOnEnd = true;

      if (typeof dest.destroy === 'function') dest.destroy();
    }

    // don't leave dangling pipes when there are errors.
    function onerror(er) {
      cleanup();
      if (EventEmitter.listenerCount(this, 'error') === 0) {
        throw er; // Unhandled stream error in pipe.
      }
    }

    source.on('error', onerror);
    dest.on('error', onerror);

    // remove all the event listeners that were added.
    function cleanup() {
      source.removeListener('data', ondata);
      dest.removeListener('drain', ondrain);

      source.removeListener('end', onend);
      source.removeListener('close', onclose);

      source.removeListener('error', onerror);
      dest.removeListener('error', onerror);

      source.removeListener('end', cleanup);
      source.removeListener('close', cleanup);

      dest.removeListener('close', cleanup);
    }

    source.on('end', cleanup);
    source.on('close', cleanup);

    dest.on('close', cleanup);

    dest.emit('pipe', source);

    // Allow for unix-like usage: A.pipe(B).pipe(C)
    return dest;
  };

  var stream$5 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    Duplex: Duplex,
    PassThrough: PassThrough,
    Readable: Readable,
    Stream: Stream,
    Transform: Transform,
    Writable: Writable,
    default: Stream
  });

  var require$$0 = /*@__PURE__*/getAugmentedNamespace(stream$5);

  var utils$6 = {};

  var require$$2 = /*@__PURE__*/getAugmentedNamespace(bufferEs6);

  const stream$4 = require$$0;
  const {Buffer: Buffer$5} = require$$2;
  const td = new TextDecoder('utf8', {fatal: true, ignoreBOM: true});

  /**
   * @typedef {object} NoFilterOptions
   * @property {string|Buffer} [input=null] Input source data.
   * @property {BufferEncoding} [inputEncoding=null] Encoding name for input,
   *   ignored if input is not a String.
   * @property {number} [highWaterMark=16384] The maximum number of bytes to
   *   store in the internal buffer before ceasing to read from the underlying
   *   resource. Default=16kb, or 16 for objectMode streams.
   * @property {BufferEncoding} [encoding=null] If specified, then buffers
   *   will be decoded to strings using the specified encoding.
   * @property {boolean} [objectMode=false] Whether this stream should behave
   *   as a stream of objects. Meaning that stream.read(n) returns a single
   *   value instead of a Buffer of size n.
   * @property {boolean} [decodeStrings=true] Whether or not to decode
   *   strings into Buffers before passing them to _write().
   * @property {boolean} [watchPipe=true] Whether to watch for 'pipe' events,
   *   setting this stream's objectMode based on the objectMode of the input
   *   stream.
   * @property {boolean} [readError=false] If true, when a read() underflows,
   *   throw an error.
   * @property {boolean} [allowHalfOpen=true] If set to false, then the
   *   stream will automatically end the writable side when the readable side
   *   ends.
   * @property {boolean} [autoDestroy=true] Whether this stream should
   *   automatically call .destroy() on itself after ending.
   * @property {BufferEncoding} [defaultEncoding='utf8'] The default encoding
   *   that is used when no encoding is specified as an argument to
   *   stream.write().
   * @property {boolean} [emitClose=true] Whether or not the stream should
   *   emit 'close' after it has been destroyed.
   * @property {number} [readableHighWaterMark] Sets highWaterMark for the
   *   readable side of the stream. Has no effect if highWaterMark is provided.
   * @property {boolean} [readableObjectMode=false] Sets objectMode for
   *   readable side of the stream. Has no effect if objectMode is true.
   * @property {number} [writableHighWaterMark] Sets highWaterMark for the
   *   writable side of the stream. Has no effect if highWaterMark is provided.
   * @property {boolean} [writableObjectMode=false] Sets objectMode for
   *   writable side of the stream. Has no effect if objectMode is true.
   */

  /**
   * NoFilter stream.  Can be used to sink or source data to and from
   * other node streams.  Implemented as the "identity" Transform stream
   * (hence the name), but allows for inspecting data that is in-flight.
   *
   * Allows passing in source data (input, inputEncoding) at creation
   * time.  Source data can also be passed in the options object.
   *
   * @example <caption>source and sink</caption>
   * const source = new NoFilter('Zm9v', 'base64')
   * source.pipe(process.stdout)
   * const sink = new Nofilter()
   * // NOTE: 'finish' fires when the input is done writing
   * sink.on('finish', () => console.log(n.toString('base64')))
   * process.stdin.pipe(sink)
   */
  let NoFilter$5 = class NoFilter extends stream$4.Transform {
    /**
     * Create an instance of NoFilter.
     *
     * @param {string|Buffer|BufferEncoding|NoFilterOptions} [input] Source data.
     * @param {BufferEncoding|NoFilterOptions} [inputEncoding] Encoding
     *   name for input, ignored if input is not a String.
     * @param {NoFilterOptions} [options] Other options.
     */
    constructor(input, inputEncoding, options = {}) {
      let inp = null;
      let inpE = /** @type {BufferEncoding?} */ (null);
      switch (typeof input) {
        case 'object':
          if (Buffer$5.isBuffer(input)) {
            inp = input;
          } else if (input) {
            options = input;
          }
          break
        case 'string':
          inp = input;
          break
        case 'undefined':
          break
        default:
          throw new TypeError('Invalid input')
      }
      switch (typeof inputEncoding) {
        case 'object':
          if (inputEncoding) {
            options = inputEncoding;
          }
          break
        case 'string':
          inpE = /** @type {BufferEncoding} */ (inputEncoding);
          break
        case 'undefined':
          break
        default:
          throw new TypeError('Invalid inputEncoding')
      }
      if (!options || typeof options !== 'object') {
        throw new TypeError('Invalid options')
      }
      if (inp == null) {
        inp = options.input;
      }
      if (inpE == null) {
        inpE = options.inputEncoding;
      }
      delete options.input;
      delete options.inputEncoding;
      const watchPipe = options.watchPipe == null ? true : options.watchPipe;
      delete options.watchPipe;
      const readError = Boolean(options.readError);
      delete options.readError;
      super(options);

      this.readError = readError;

      if (watchPipe) {
        this.on('pipe', readable => {
          // @ts-ignore: TS2339 (using internal interface)
          const om = readable._readableState.objectMode;
          // @ts-ignore: TS2339 (using internal interface)
          if ((this.length > 0) && (om !== this._readableState.objectMode)) {
            throw new Error(
              'Do not switch objectMode in the middle of the stream'
            )
          }

          // @ts-ignore: TS2339 (using internal interface)
          this._readableState.objectMode = om;
          // @ts-ignore: TS2339 (using internal interface)
          this._writableState.objectMode = om;
        });
      }

      if (inp != null) {
        this.end(inp, inpE);
      }
    }

    /**
     * Is the given object a {NoFilter}?
     *
     * @param {object} obj The object to test.
     * @returns {boolean} True if obj is a NoFilter.
     */
    static isNoFilter(obj) {
      return obj instanceof this
    }

    /**
     * The same as nf1.compare(nf2). Useful for sorting an Array of NoFilters.
     *
     * @param {NoFilter} nf1 The first object to compare.
     * @param {NoFilter} nf2 The second object to compare.
     * @returns {number} -1, 0, 1 for less, equal, greater.
     * @throws {TypeError} Arguments not NoFilter instances.
     * @example
     * const arr = [new NoFilter('1234'), new NoFilter('0123')]
     * arr.sort(NoFilter.compare)
     */
    static compare(nf1, nf2) {
      if (!(nf1 instanceof this)) {
        throw new TypeError('Arguments must be NoFilters')
      }
      if (nf1 === nf2) {
        return 0
      }
      return nf1.compare(nf2)
    }

    /**
     * Returns a buffer which is the result of concatenating all the
     * NoFilters in the list together. If the list has no items, or if
     * the totalLength is 0, then it returns a zero-length buffer.
     *
     * If length is not provided, it is read from the buffers in the
     * list. However, this adds an additional loop to the function, so
     * it is faster to provide the length explicitly if you already know it.
     *
     * @param {Array<NoFilter>} list Inputs.  Must not be all either in object
     *   mode, or all not in object mode.
     * @param {number} [length=null] Number of bytes or objects to read.
     * @returns {Buffer|Array} The concatenated values as an array if in object
     *   mode, otherwise a Buffer.
     * @throws {TypeError} List not array of NoFilters.
     */
    static concat(list, length) {
      if (!Array.isArray(list)) {
        throw new TypeError('list argument must be an Array of NoFilters')
      }
      if ((list.length === 0) || (length === 0)) {
        return Buffer$5.alloc(0)
      }
      if ((length == null)) {
        length = list.reduce((tot, nf) => {
          if (!(nf instanceof NoFilter)) {
            throw new TypeError('list argument must be an Array of NoFilters')
          }
          return tot + nf.length
        }, 0);
      }
      let allBufs = true;
      let allObjs = true;
      const bufs = list.map(nf => {
        if (!(nf instanceof NoFilter)) {
          throw new TypeError('list argument must be an Array of NoFilters')
        }
        const buf = nf.slice();
        if (Buffer$5.isBuffer(buf)) {
          allObjs = false;
        } else {
          allBufs = false;
        }
        return buf
      });
      if (allBufs) {
        // @ts-ignore: TS2322, tsc can't see the type checking above
        return Buffer$5.concat(bufs, length)
      }
      if (allObjs) {
        return [].concat(...bufs).slice(0, length)
      }
      // TODO: maybe coalesce buffers, counting bytes, and flatten in arrays
      // counting objects?  I can't imagine why that would be useful.
      throw new Error('Concatenating mixed object and byte streams not supported')
    }

    /**
     * @ignore
     */
    _transform(chunk, encoding, callback) {
      // @ts-ignore: TS2339 (using internal interface)
      if (!this._readableState.objectMode && !Buffer$5.isBuffer(chunk)) {
        chunk = Buffer$5.from(chunk, encoding);
      }
      this.push(chunk);
      callback();
    }

    /**
     * @returns {Buffer[]} The current internal buffers.  They are layed out
     *   end to end.
     * @ignore
     */
    _bufArray() {
      // @ts-ignore: TS2339 (using internal interface)
      let bufs = this._readableState.buffer;
      // HACK: replace with something else one day.  This is what I get for
      // relying on internals.
      if (!Array.isArray(bufs)) {
        let b = bufs.head;
        bufs = [];
        while (b != null) {
          bufs.push(b.data);
          b = b.next;
        }
      }
      return bufs
    }

    /**
     * Pulls some data out of the internal buffer and returns it.
     * If there is no data available, then it will return null.
     *
     * If you pass in a size argument, then it will return that many bytes. If
     * size bytes are not available, then it will return null, unless we've
     * ended, in which case it will return the data remaining in the buffer.
     *
     * If you do not specify a size argument, then it will return all the data in
     * the internal buffer.
     *
     * @param {number} [size=null] Number of bytes to read.
     * @returns {string|Buffer|null} If no data or not enough data, null.  If
     *   decoding output a string, otherwise a Buffer.
     * @throws Error If readError is true and there was underflow.
     * @fires NoFilter#read When read from.
     */
    read(size) {
      const buf = super.read(size);
      if (buf != null) {
        /**
         * Read event. Fired whenever anything is read from the stream.
         *
         * @event NoFilter#read
         * @param {Buffer|string|object} buf What was read.
         */
        this.emit('read', buf);
        if (this.readError && (buf.length < size)) {
          throw new Error(`Read ${buf.length}, wanted ${size}`)
        }
      } else if (this.readError) {
        throw new Error(`No data available, wanted ${size}`)
      }
      return buf
    }

    /**
     * Read the full number of bytes asked for, no matter how long it takes.
     * Fail if an error occurs in the meantime, or if the stream finishes before
     * enough data is available.
     *
     * Note: This function won't work fully correctly if you are using
     * stream-browserify (for example, on the Web).
     *
     * @param {number} size The number of bytes to read.
     * @returns {Promise<string|Buffer>} A promise for the data read.
     */
    readFull(size) {
      let onReadable = null;
      let onFinish = null;
      let onError = null;
      return new Promise((resolve, reject) => {
        if (this.length >= size) {
          resolve(this.read(size));
          return
        }

        // Added in Node 12.19.  This won't work with stream-browserify yet.
        // If it's needed, file a bug, and I'll do a work-around.
        if (this.writableFinished) {
          // Already finished writing, so no more coming.
          reject(new Error(`Stream finished before ${size} bytes were available`));
          return
        }

        onReadable = chunk => {
          if (this.length >= size) {
            resolve(this.read(size));
          }
        };
        onFinish = () => {
          reject(new Error(`Stream finished before ${size} bytes were available`));
        };
        onError = reject;
        this.on('readable', onReadable);
        this.on('error', onError);
        this.on('finish', onFinish);
      }).finally(() => {
        if (onReadable) {
          this.removeListener('readable', onReadable);
          this.removeListener('error', onError);
          this.removeListener('finish', onFinish);
        }
      })
    }

    /**
     * Return a promise fulfilled with the full contents, after the 'finish'
     * event fires.  Errors on the stream cause the promise to be rejected.
     *
     * @param {Function} [cb=null] Finished/error callback used in *addition*
     *   to the promise.
     * @returns {Promise<Buffer|string>} Fulfilled when complete.
     */
    promise(cb) {
      let done = false;
      return new Promise((resolve, reject) => {
        this.on('finish', () => {
          const data = this.read();
          if ((cb != null) && !done) {
            done = true;
            cb(null, data);
          }
          resolve(data);
        });
        this.on('error', er => {
          if ((cb != null) && !done) {
            done = true;
            cb(er);
          }
          reject(er);
        });
      })
    }

    /**
     * Returns a number indicating whether this comes before or after or is the
     * same as the other NoFilter in sort order.
     *
     * @param {NoFilter} other The other object to compare.
     * @returns {number} -1, 0, 1 for less, equal, greater.
     * @throws {TypeError} Arguments must be NoFilters.
     */
    compare(other) {
      if (!(other instanceof NoFilter)) {
        throw new TypeError('Arguments must be NoFilters')
      }
      if (this === other) {
        return 0
      }

      const buf1 = this.slice();
      const buf2 = other.slice();
      // These will both be buffers because of the check above.
      if (Buffer$5.isBuffer(buf1) && Buffer$5.isBuffer(buf2)) {
        return buf1.compare(buf2)
      }
      throw new Error('Cannot compare streams in object mode')
    }

    /**
     * Do these NoFilter's contain the same bytes?  Doesn't work if either is
     * in object mode.
     *
     * @param {NoFilter} other Other NoFilter to compare against.
     * @returns {boolean} Equal?
     */
    equals(other) {
      return this.compare(other) === 0
    }

    /**
     * Read bytes or objects without consuming them.  Useful for diagnostics.
     * Note: as a side-effect, concatenates multiple writes together into what
     * looks like a single write, so that this concat doesn't have to happen
     * multiple times when you're futzing with the same NoFilter.
     *
     * @param {number} [start=0] Beginning offset.
     * @param {number} [end=length] Ending offset.
     * @returns {Buffer|Array} If in object mode, an array of objects.  Otherwise,
     *   concatenated array of contents.
     */
    slice(start, end) {
      // @ts-ignore: TS2339 (using internal interface)
      if (this._readableState.objectMode) {
        return this._bufArray().slice(start, end)
      }
      const bufs = this._bufArray();
      switch (bufs.length) {
        case 0: return Buffer$5.alloc(0)
        case 1: return bufs[0].slice(start, end)
        default: {
          const b = Buffer$5.concat(bufs);
          // TODO: store the concatented bufs back
          // @_readableState.buffer = [b]
          return b.slice(start, end)
        }
      }
    }

    /**
     * Get a byte by offset.  I didn't want to get into metaprogramming
     * to give you the `NoFilter[0]` syntax.
     *
     * @param {number} index The byte to retrieve.
     * @returns {number} 0-255.
     */
    get(index) {
      return this.slice()[index]
    }

    /**
     * Return an object compatible with Buffer's toJSON implementation, so that
     * round-tripping will produce a Buffer.
     *
     * @returns {string|Array|{type: 'Buffer',data: number[]}} If in object mode,
     *   the objects.  Otherwise, JSON text.
     * @example <caption>output for 'foo', not in object mode</caption>
     * ({
     *   type: 'Buffer',
     *   data: [102, 111, 111],
     * })
     */
    toJSON() {
      const b = this.slice();
      if (Buffer$5.isBuffer(b)) {
        return b.toJSON()
      }
      return b
    }

    /**
     * Decodes and returns a string from buffer data encoded using the specified
     * character set encoding. If encoding is undefined or null, then encoding
     * defaults to 'utf8'. The start and end parameters default to 0 and
     * NoFilter.length when undefined.
     *
     * @param {BufferEncoding} [encoding='utf8'] Which to use for decoding?
     * @param {number} [start=0] Start offset.
     * @param {number} [end=length] End offset.
     * @returns {string} String version of the contents.
     */
    toString(encoding, start, end) {
      const buf = this.slice(start, end);
      if (!Buffer$5.isBuffer(buf)) {
        return JSON.stringify(buf)
      }
      if (!encoding || (encoding === 'utf8')) {
        return td.decode(buf)
      }
      return buf.toString(encoding)
    }

    /**
     * @ignore
     */
    [Symbol.for('nodejs.util.inspect.custom')](depth, options) {
      const bufs = this._bufArray();
      const hex = bufs.map(b => {
        if (Buffer$5.isBuffer(b)) {
          return options.stylize(b.toString('hex'), 'string')
        }
        return JSON.stringify(b)
      }).join(', ');
      return `${this.constructor.name} [${hex}]`
    }

    /**
     * Current readable length, in bytes.
     *
     * @returns {number} Length of the contents.
     */
    get length() {
      // @ts-ignore: TS2339 (using internal interface)
      return this._readableState.length
    }

    /**
     * Write a JavaScript BigInt to the stream.  Negative numbers will be
     * written as their 2's complement version.
     *
     * @param {bigint} val The value to write.
     * @returns {boolean} True on success.
     */
    writeBigInt(val) {
      let str = val.toString(16);
      if (val < 0) {
        // Two's complement
        // Note: str always starts with '-' here.
        const sz = BigInt(Math.floor(str.length / 2));
        const mask = BigInt(1) << (sz * BigInt(8));
        val = mask + val;
        str = val.toString(16);
      }
      if (str.length % 2) {
        str = `0${str}`;
      }
      return this.push(Buffer$5.from(str, 'hex'))
    }

    /**
     * Read a variable-sized JavaScript unsigned BigInt from the stream.
     *
     * @param {number} [len=null] Number of bytes to read or all remaining
     *   if null.
     * @returns {bigint} A BigInt.
     */
    readUBigInt(len) {
      const b = this.read(len);
      if (!Buffer$5.isBuffer(b)) {
        return null
      }
      return BigInt(`0x${b.toString('hex')}`)
    }

    /**
     * Read a variable-sized JavaScript signed BigInt from the stream in 2's
     * complement format.
     *
     * @param {number} [len=null] Number of bytes to read or all remaining
     *   if null.
     * @returns {bigint} A BigInt.
     */
    readBigInt(len) {
      const b = this.read(len);
      if (!Buffer$5.isBuffer(b)) {
        return null
      }
      let ret = BigInt(`0x${b.toString('hex')}`);
      // Negative?
      if (b[0] & 0x80) {
        // Two's complement
        const mask = BigInt(1) << (BigInt(b.length) * BigInt(8));
        ret -= mask;
      }
      return ret
    }

    /**
     * Write an 8-bit unsigned integer to the stream.  Adds 1 byte.
     *
     * @param {number} value 0..255.
     * @returns {boolean} True on success.
     */
    writeUInt8(value) {
      const b = Buffer$5.from([value]);
      return this.push(b)
    }

    /**
     * Write a little-endian 16-bit unsigned integer to the stream.  Adds
     * 2 bytes.
     *
     * @param {number} value 0..65535.
     * @returns {boolean} True on success.
     */
    writeUInt16LE(value) {
      const b = Buffer$5.alloc(2);
      b.writeUInt16LE(value);
      return this.push(b)
    }

    /**
     * Write a big-endian 16-bit unsigned integer to the stream.  Adds
     * 2 bytes.
     *
     * @param {number} value 0..65535.
     * @returns {boolean} True on success.
     */
    writeUInt16BE(value) {
      const b = Buffer$5.alloc(2);
      b.writeUInt16BE(value);
      return this.push(b)
    }

    /**
     * Write a little-endian 32-bit unsigned integer to the stream.  Adds
     * 4 bytes.
     *
     * @param {number} value 0..2**32-1.
     * @returns {boolean} True on success.
     */
    writeUInt32LE(value) {
      const b = Buffer$5.alloc(4);
      b.writeUInt32LE(value);
      return this.push(b)
    }

    /**
     * Write a big-endian 32-bit unsigned integer to the stream.  Adds
     * 4 bytes.
     *
     * @param {number} value 0..2**32-1.
     * @returns {boolean} True on success.
     */
    writeUInt32BE(value) {
      const b = Buffer$5.alloc(4);
      b.writeUInt32BE(value);
      return this.push(b)
    }

    /**
     * Write a signed 8-bit integer to the stream.  Adds 1 byte.
     *
     * @param {number} value (-128)..127.
     * @returns {boolean} True on success.
     */
    writeInt8(value) {
      const b = Buffer$5.from([value]);
      return this.push(b)
    }

    /**
     * Write a signed little-endian 16-bit integer to the stream.  Adds 2 bytes.
     *
     * @param {number} value (-32768)..32767.
     * @returns {boolean} True on success.
     */
    writeInt16LE(value) {
      const b = Buffer$5.alloc(2);
      b.writeUInt16LE(value);
      return this.push(b)
    }

    /**
     * Write a signed big-endian 16-bit integer to the stream.  Adds 2 bytes.
     *
     * @param {number} value (-32768)..32767.
     * @returns {boolean} True on success.
     */
    writeInt16BE(value) {
      const b = Buffer$5.alloc(2);
      b.writeUInt16BE(value);
      return this.push(b)
    }

    /**
     * Write a signed little-endian 32-bit integer to the stream.  Adds 4 bytes.
     *
     * @param {number} value (-2**31)..(2**31-1).
     * @returns {boolean} True on success.
     */
    writeInt32LE(value) {
      const b = Buffer$5.alloc(4);
      b.writeUInt32LE(value);
      return this.push(b)
    }

    /**
     * Write a signed big-endian 32-bit integer to the stream.  Adds 4 bytes.
     *
     * @param {number} value (-2**31)..(2**31-1).
     * @returns {boolean} True on success.
     */
    writeInt32BE(value) {
      const b = Buffer$5.alloc(4);
      b.writeUInt32BE(value);
      return this.push(b)
    }

    /**
     * Write a little-endian 32-bit float to the stream.  Adds 4 bytes.
     *
     * @param {number} value 32-bit float.
     * @returns {boolean} True on success.
     */
    writeFloatLE(value) {
      const b = Buffer$5.alloc(4);
      b.writeFloatLE(value);
      return this.push(b)
    }

    /**
     * Write a big-endian 32-bit float to the stream.  Adds 4 bytes.
     *
     * @param {number} value 32-bit float.
     * @returns {boolean} True on success.
     */
    writeFloatBE(value) {
      const b = Buffer$5.alloc(4);
      b.writeFloatBE(value);
      return this.push(b)
    }

    /**
     * Write a little-endian 64-bit double to the stream.  Adds 8 bytes.
     *
     * @param {number} value 64-bit float.
     * @returns {boolean} True on success.
     */
    writeDoubleLE(value) {
      const b = Buffer$5.alloc(8);
      b.writeDoubleLE(value);
      return this.push(b)
    }

    /**
     * Write a big-endian 64-bit float to the stream.  Adds 8 bytes.
     *
     * @param {number} value 64-bit float.
     * @returns {boolean} True on success.
     */
    writeDoubleBE(value) {
      const b = Buffer$5.alloc(8);
      b.writeDoubleBE(value);
      return this.push(b)
    }

    /**
     * Write a signed little-endian 64-bit BigInt to the stream.  Adds 8 bytes.
     *
     * @param {bigint} value BigInt.
     * @returns {boolean} True on success.
     */
    writeBigInt64LE(value) {
      const b = Buffer$5.alloc(8);
      b.writeBigInt64LE(value);
      return this.push(b)
    }

    /**
     * Write a signed big-endian 64-bit BigInt to the stream.  Adds 8 bytes.
     *
     * @param {bigint} value BigInt.
     * @returns {boolean} True on success.
     */
    writeBigInt64BE(value) {
      const b = Buffer$5.alloc(8);
      b.writeBigInt64BE(value);
      return this.push(b)
    }

    /**
     * Write an unsigned little-endian 64-bit BigInt to the stream.  Adds 8 bytes.
     *
     * @param {bigint} value Non-negative BigInt.
     * @returns {boolean} True on success.
     */
    writeBigUInt64LE(value) {
      const b = Buffer$5.alloc(8);
      b.writeBigUInt64LE(value);
      return this.push(b)
    }

    /**
     * Write an unsigned big-endian 64-bit BigInt to the stream.  Adds 8 bytes.
     *
     * @param {bigint} value Non-negative BigInt.
     * @returns {boolean} True on success.
     */
    writeBigUInt64BE(value) {
      const b = Buffer$5.alloc(8);
      b.writeBigUInt64BE(value);
      return this.push(b)
    }

    /**
     * Read an unsigned 8-bit integer from the stream.  Consumes 1 byte.
     *
     * @returns {number} Value read.
     */
    readUInt8() {
      const b = this.read(1);
      if (!Buffer$5.isBuffer(b)) {
        return null
      }
      return b.readUInt8()
    }

    /**
     * Read a little-endian unsigned 16-bit integer from the stream.
     * Consumes 2 bytes.
     *
     * @returns {number} Value read.
     */
    readUInt16LE() {
      const b = this.read(2);
      if (!Buffer$5.isBuffer(b)) {
        return null
      }
      return b.readUInt16LE()
    }

    /**
     * Read a little-endian unsigned 16-bit integer from the stream.
     * Consumes 2 bytes.
     *
     * @returns {number} Value read.
     */
    readUInt16BE() {
      const b = this.read(2);
      if (!Buffer$5.isBuffer(b)) {
        return null
      }
      return b.readUInt16BE()
    }

    /**
     * Read a little-endian unsigned 32-bit integer from the stream.
     * Consumes 4 bytes.
     *
     * @returns {number} Value read.
     */
    readUInt32LE() {
      const b = this.read(4);
      if (!Buffer$5.isBuffer(b)) {
        return null
      }
      return b.readUInt32LE()
    }

    /**
     * Read a little-endian unsigned 16-bit integer from the stream.
     * Consumes 4 bytes.
     *
     * @returns {number} Value read.
     */
    readUInt32BE() {
      const b = this.read(4);
      if (!Buffer$5.isBuffer(b)) {
        return null
      }
      return b.readUInt32BE()
    }

    /**
     * Read a signed 8-bit integer from the stream.  Consumes 1 byte.
     *
     * @returns {number} Value read.
     */
    readInt8() {
      const b = this.read(1);
      if (!Buffer$5.isBuffer(b)) {
        return null
      }
      return b.readInt8()
    }

    /**
     * Read a little-endian signed 16-bit integer from the stream.
     * Consumes 2 bytes.
     *
     * @returns {number} Value read.
     */
    readInt16LE() {
      const b = this.read(2);
      if (!Buffer$5.isBuffer(b)) {
        return null
      }
      return b.readInt16LE()
    }

    /**
     * Read a little-endian signed 16-bit integer from the stream.
     * Consumes 2 bytes.
     *
     * @returns {number} Value read.
     */
    readInt16BE() {
      const b = this.read(2);
      if (!Buffer$5.isBuffer(b)) {
        return null
      }
      return b.readInt16BE()
    }

    /**
     * Read a little-endian signed 32-bit integer from the stream.
     * Consumes 4 bytes.
     *
     * @returns {number} Value read.
     */
    readInt32LE() {
      const b = this.read(4);
      if (!Buffer$5.isBuffer(b)) {
        return null
      }
      return b.readInt32LE()
    }

    /**
     * Read a little-endian signed 16-bit integer from the stream.
     * Consumes 4 bytes.
     *
     * @returns {number} Value read.
     */
    readInt32BE() {
      const b = this.read(4);
      if (!Buffer$5.isBuffer(b)) {
        return null
      }
      return b.readInt32BE()
    }

    /**
     * Read a 32-bit little-endian float from the stream.
     * Consumes 4 bytes.
     *
     * @returns {number} Value read.
     */
    readFloatLE() {
      const b = this.read(4);
      if (!Buffer$5.isBuffer(b)) {
        return null
      }
      return b.readFloatLE()
    }

    /**
     * Read a 32-bit big-endian float from the stream.
     * Consumes 4 bytes.
     *
     * @returns {number} Value read.
     */
    readFloatBE() {
      const b = this.read(4);
      if (!Buffer$5.isBuffer(b)) {
        return null
      }
      return b.readFloatBE()
    }

    /**
     * Read a 64-bit little-endian float from the stream.
     * Consumes 8 bytes.
     *
     * @returns {number} Value read.
     */
    readDoubleLE() {
      const b = this.read(8);
      if (!Buffer$5.isBuffer(b)) {
        return null
      }
      return b.readDoubleLE()
    }

    /**
     * Read a 64-bit big-endian float from the stream.
     * Consumes 8 bytes.
     *
     * @returns {number} Value read.
     */
    readDoubleBE() {
      const b = this.read(8);
      if (!Buffer$5.isBuffer(b)) {
        return null
      }
      return b.readDoubleBE()
    }

    /**
     * Read a signed 64-bit little-endian BigInt from the stream.
     * Consumes 8 bytes.
     *
     * @returns {bigint} Value read.
     */
    readBigInt64LE() {
      const b = this.read(8);
      if (!Buffer$5.isBuffer(b)) {
        return null
      }
      return b.readBigInt64LE()
    }

    /**
     * Read a signed 64-bit big-endian BigInt from the stream.
     * Consumes 8 bytes.
     *
     * @returns {bigint} Value read.
     */
    readBigInt64BE() {
      const b = this.read(8);
      if (!Buffer$5.isBuffer(b)) {
        return null
      }
      return b.readBigInt64BE()
    }

    /**
     * Read an unsigned 64-bit little-endian BigInt from the stream.
     * Consumes 8 bytes.
     *
     * @returns {bigint} Value read.
     */
    readBigUInt64LE() {
      const b = this.read(8);
      if (!Buffer$5.isBuffer(b)) {
        return null
      }
      return b.readBigUInt64LE()
    }

    /**
     * Read an unsigned 64-bit big-endian BigInt from the stream.
     * Consumes 8 bytes.
     *
     * @returns {bigint} Value read.
     */
    readBigUInt64BE() {
      const b = this.read(8);
      if (!Buffer$5.isBuffer(b)) {
        return null
      }
      return b.readBigUInt64BE()
    }
  };

  var lib = NoFilter$5;

  var constants$3 = {};

  (function (exports) {

  	/**
  	 * @enum {number}
  	 */
  	exports.MT = {
  	  POS_INT: 0,
  	  NEG_INT: 1,
  	  BYTE_STRING: 2,
  	  UTF8_STRING: 3,
  	  ARRAY: 4,
  	  MAP: 5,
  	  TAG: 6,
  	  SIMPLE_FLOAT: 7,
  	};

  	/**
  	 * @enum {number}
  	 */
  	exports.TAG = {
  	  DATE_STRING: 0,
  	  DATE_EPOCH: 1,
  	  POS_BIGINT: 2,
  	  NEG_BIGINT: 3,
  	  DECIMAL_FRAC: 4,
  	  BIGFLOAT: 5,
  	  BASE64URL_EXPECTED: 21,
  	  BASE64_EXPECTED: 22,
  	  BASE16_EXPECTED: 23,
  	  CBOR: 24,
  	  URI: 32,
  	  BASE64URL: 33,
  	  BASE64: 34,
  	  REGEXP: 35,
  	  MIME: 36,
  	  // https://github.com/input-output-hk/cbor-sets-spec/blob/master/CBOR_SETS.md
  	  SET: 258,
  	};

  	/**
  	 * @enum {number}
  	 */
  	exports.NUMBYTES = {
  	  ZERO: 0,
  	  ONE: 24,
  	  TWO: 25,
  	  FOUR: 26,
  	  EIGHT: 27,
  	  INDEFINITE: 31,
  	};

  	/**
  	 * @enum {number}
  	 */
  	exports.SIMPLE = {
  	  FALSE: 20,
  	  TRUE: 21,
  	  NULL: 22,
  	  UNDEFINED: 23,
  	};

  	exports.SYMS = {
  	  NULL: Symbol.for('github.com/hildjj/node-cbor/null'),
  	  UNDEFINED: Symbol.for('github.com/hildjj/node-cbor/undef'),
  	  PARENT: Symbol.for('github.com/hildjj/node-cbor/parent'),
  	  BREAK: Symbol.for('github.com/hildjj/node-cbor/break'),
  	  STREAM: Symbol.for('github.com/hildjj/node-cbor/stream'),
  	};

  	exports.SHIFT32 = 0x100000000;

  	exports.BI = {
  	  MINUS_ONE: BigInt(-1),
  	  NEG_MAX: BigInt(-1) - BigInt(Number.MAX_SAFE_INTEGER),
  	  MAXINT32: BigInt('0xffffffff'),
  	  MAXINT64: BigInt('0xffffffffffffffff'),
  	  SHIFT32: BigInt(exports.SHIFT32),
  	}; 
  } (constants$3));

  (function (exports) {

  	const {Buffer} = require$$2;
  	const NoFilter = lib;
  	const stream = require$$0;
  	const constants = constants$3;
  	const {NUMBYTES, SHIFT32, BI, SYMS} = constants;
  	const MAX_SAFE_HIGH = 0x1fffff;

  	/**
  	 * Convert a UTF8-encoded Buffer to a JS string.  If possible, throw an error
  	 * on invalid UTF8.  Byte Order Marks are not looked at or stripped.
  	 *
  	 * @private
  	 */
  	const td = new TextDecoder('utf8', {fatal: true, ignoreBOM: true});
  	exports.utf8 = buf => td.decode(buf);
  	exports.utf8.checksUTF8 = true;

  	function isReadable(s) {
  	  // Is this a readable stream?  In the webpack version, instanceof isn't
  	  // working correctly.
  	  if (s instanceof stream.Readable) {
  	    return true
  	  }
  	  return ['read', 'on', 'pipe'].every(f => typeof s[f] === 'function')
  	}

  	exports.isBufferish = function isBufferish(b) {
  	  return b &&
  	    (typeof b === 'object') &&
  	    ((Buffer.isBuffer(b)) ||
  	      (b instanceof Uint8Array) ||
  	      (b instanceof Uint8ClampedArray) ||
  	      (b instanceof ArrayBuffer) ||
  	      (b instanceof DataView))
  	};

  	exports.bufferishToBuffer = function bufferishToBuffer(b) {
  	  if (Buffer.isBuffer(b)) {
  	    return b
  	  } else if (ArrayBuffer.isView(b)) {
  	    return Buffer.from(b.buffer, b.byteOffset, b.byteLength)
  	  } else if (b instanceof ArrayBuffer) {
  	    return Buffer.from(b)
  	  }
  	  return null
  	};

  	exports.parseCBORint = function parseCBORint(ai, buf) {
  	  switch (ai) {
  	    case NUMBYTES.ONE:
  	      return buf.readUInt8(0)
  	    case NUMBYTES.TWO:
  	      return buf.readUInt16BE(0)
  	    case NUMBYTES.FOUR:
  	      return buf.readUInt32BE(0)
  	    case NUMBYTES.EIGHT: {
  	      const f = buf.readUInt32BE(0);
  	      const g = buf.readUInt32BE(4);
  	      if (f > MAX_SAFE_HIGH) {
  	        return (BigInt(f) * BI.SHIFT32) + BigInt(g)
  	      }
  	      return (f * SHIFT32) + g
  	    }
  	    default:
  	      throw new Error(`Invalid additional info for int: ${ai}`)
  	  }
  	};

  	exports.writeHalf = function writeHalf(buf, half) {
  	  // Assume 0, -0, NaN, Infinity, and -Infinity have already been caught

  	  // HACK: everyone settle in.  This isn't going to be pretty.
  	  // Translate cn-cbor's C code (from Carsten Borman):

  	  // uint32_t be32;
  	  // uint16_t be16, u16;
  	  // union {
  	  //   float f;
  	  //   uint32_t u;
  	  // } u32;
  	  // u32.f = float_val;

  	  const u32 = Buffer.allocUnsafe(4);
  	  u32.writeFloatBE(half, 0);
  	  const u = u32.readUInt32BE(0);

  	  // If ((u32.u & 0x1FFF) == 0) { /* worth trying half */

  	  // hildjj: If the lower 13 bits aren't 0,
  	  // we will lose precision in the conversion.
  	  // mant32 = 24bits, mant16 = 11bits, 24-11 = 13
  	  if ((u & 0x1FFF) !== 0) {
  	    return false
  	  }

  	  // Sign, exponent, mantissa
  	  //   int s16 = (u32.u >> 16) & 0x8000;
  	  //   int exp = (u32.u >> 23) & 0xff;
  	  //   int mant = u32.u & 0x7fffff;

  	  let s16 = (u >> 16) & 0x8000; // Top bit is sign
  	  const exp = (u >> 23) & 0xff; // Then 5 bits of exponent
  	  const mant = u & 0x7fffff;

  	  // Hildjj: zeros already handled.  Assert if you don't believe me.
  	  //   if (exp == 0 && mant == 0)
  	  //     ;              /* 0.0, -0.0 */

  	  //   else if (exp >= 113 && exp <= 142) /* normalized */
  	  //     s16 += ((exp - 112) << 10) + (mant >> 13);

  	  if ((exp >= 113) && (exp <= 142)) {
  	    s16 += ((exp - 112) << 10) + (mant >> 13);
  	  } else if ((exp >= 103) && (exp < 113)) {
  	    // Denormalized numbers
  	    //   else if (exp >= 103 && exp < 113) { /* denorm, exp16 = 0 */
  	    //     if (mant & ((1 << (126 - exp)) - 1))
  	    //       goto float32;         /* loss of precision */
  	    //     s16 += ((mant + 0x800000) >> (126 - exp));

  	    if (mant & ((1 << (126 - exp)) - 1)) {
  	      return false
  	    }
  	    s16 += ((mant + 0x800000) >> (126 - exp));
  	  } else {
  	  //   } else if (exp == 255 && mant == 0) { /* Inf */
  	  //     s16 += 0x7c00;

  	    // hildjj: Infinity already handled

  	    //   } else
  	    //     goto float32;           /* loss of range */

  	    return false
  	  }

  	  // Done
  	  //   ensure_writable(3);
  	  //   u16 = s16;
  	  //   be16 = hton16p((const uint8_t*)&u16);
  	  buf.writeUInt16BE(s16);
  	  return true
  	};

  	exports.parseHalf = function parseHalf(buf) {
  	  const sign = buf[0] & 0x80 ? -1 : 1;
  	  const exp = (buf[0] & 0x7C) >> 2;
  	  const mant = ((buf[0] & 0x03) << 8) | buf[1];
  	  if (!exp) {
  	    return sign * 5.9604644775390625e-8 * mant
  	  } else if (exp === 0x1f) {
  	    return sign * (mant ? NaN : Infinity)
  	  }
  	  return sign * (2 ** (exp - 25)) * (1024 + mant)
  	};

  	exports.parseCBORfloat = function parseCBORfloat(buf) {
  	  switch (buf.length) {
  	    case 2:
  	      return exports.parseHalf(buf)
  	    case 4:
  	      return buf.readFloatBE(0)
  	    case 8:
  	      return buf.readDoubleBE(0)
  	    default:
  	      throw new Error(`Invalid float size: ${buf.length}`)
  	  }
  	};

  	exports.hex = function hex(s) {
  	  return Buffer.from(s.replace(/^0x/, ''), 'hex')
  	};

  	exports.bin = function bin(s) {
  	  s = s.replace(/\s/g, '');
  	  let start = 0;
  	  let end = (s.length % 8) || 8;
  	  const chunks = [];
  	  while (end <= s.length) {
  	    chunks.push(parseInt(s.slice(start, end), 2));
  	    start = end;
  	    end += 8;
  	  }
  	  return Buffer.from(chunks)
  	};

  	exports.arrayEqual = function arrayEqual(a, b) {
  	  if ((a == null) && (b == null)) {
  	    return true
  	  }
  	  if ((a == null) || (b == null)) {
  	    return false
  	  }
  	  return (a.length === b.length) && a.every((elem, i) => elem === b[i])
  	};

  	exports.bufferToBigInt = function bufferToBigInt(buf) {
  	  return BigInt(`0x${buf.toString('hex')}`)
  	};

  	exports.cborValueToString = function cborValueToString(val, float_bytes = -1) {
  	  switch (typeof val) {
  	    case 'symbol': {
  	      switch (val) {
  	        case SYMS.NULL:
  	          return 'null'
  	        case SYMS.UNDEFINED:
  	          return 'undefined'
  	        case SYMS.BREAK:
  	          return 'BREAK'
  	      }
  	      // Impossible in node 10
  	      /* istanbul ignore if */
  	      if (val.description) {
  	        return val.description
  	      }
  	      // On node10, Symbol doesn't have description.  Parse it out of the
  	      // toString value, which looks like `Symbol(foo)`.
  	      const s = val.toString();
  	      const m = s.match(/^Symbol\((?<name>.*)\)/);
  	      /* istanbul ignore if */
  	      if (m && m.groups.name) {
  	        // Impossible in node 12+
  	        /* istanbul ignore next */
  	        return m.groups.name
  	      }
  	      return 'Symbol'
  	    }
  	    case 'string':
  	      return JSON.stringify(val)
  	    case 'bigint':
  	      return val.toString()
  	    case 'number': {
  	      const s = Object.is(val, -0) ? '-0' : String(val);
  	      return (float_bytes > 0) ? `${s}_${float_bytes}` : s
  	    }
  	    case 'object': {
  	      // A null should be caught above
  	      const buf = exports.bufferishToBuffer(val);
  	      if (buf) {
  	        const hex = buf.toString('hex');
  	        return (float_bytes === -Infinity) ? hex : `h'${hex}'`
  	      }
  	      if (typeof val[Symbol.for('nodejs.util.inspect.custom')] === 'function') {
  	        return val[Symbol.for('nodejs.util.inspect.custom')]()
  	      }
  	      // Shouldn't get non-empty arrays here
  	      if (Array.isArray(val)) {
  	        return '[]'
  	      }
  	      // This should be all that is left
  	      return '{}'
  	    }
  	  }
  	  return String(val)
  	};

  	exports.guessEncoding = function guessEncoding(input, encoding) {
  	  if (typeof input === 'string') {
  	    return new NoFilter(input, (encoding == null) ? 'hex' : encoding)
  	  }
  	  const buf = exports.bufferishToBuffer(input);
  	  if (buf) {
  	    return new NoFilter(buf)
  	  }
  	  if (isReadable(input)) {
  	    return input
  	  }
  	  throw new Error('Unknown input type')
  	};

  	const B64URL_SWAPS = {
  	  '=': '',
  	  '+': '-',
  	  '/': '_',
  	};

  	/**
  	 * @param {Buffer|Uint8Array|Uint8ClampedArray|ArrayBuffer|DataView} buf
  	 *   Buffer to convert.
  	 * @returns {string} Base64url string.
  	 * @private
  	 */
  	exports.base64url = function base64url(buf) {
  	  return exports.bufferishToBuffer(buf)
  	    .toString('base64')
  	    .replace(/[=+/]/g, c => B64URL_SWAPS[c])
  	};

  	/**
  	 * @param {Buffer|Uint8Array|Uint8ClampedArray|ArrayBuffer|DataView} buf
  	 *   Buffer to convert.
  	 * @returns {string} Base64 string.
  	 * @private
  	 */
  	exports.base64 = function base64(buf) {
  	  return exports.bufferishToBuffer(buf).toString('base64')
  	};

  	exports.isBigEndian = function isBigEndian() {
  	  const array = new Uint8Array(4);
  	  const view = new Uint32Array(array.buffer);
  	  return !((view[0] = 1) & array[0])
  	}; 
  } (utils$6));

  const stream$3 = require$$0;
  const NoFilter$4 = lib;

  /**
   * BinaryParseStream is a TransformStream that consumes buffers and outputs
   * objects on the other end.  It expects your subclass to implement a `_parse`
   * method that is a generator.  When your generator yields a number, it'll be
   * fed a buffer of that length from the input.  When your generator returns,
   * the return value will be pushed to the output side.
   *
   * @extends stream.Transform
   */
  let BinaryParseStream$1 = class BinaryParseStream extends stream$3.Transform {
    /**
     * Creates an instance of BinaryParseStream.
     *
     * @memberof BinaryParseStream
     * @param {stream.TransformOptions} options Stream options.
     */
    constructor(options) {
      super(options);
      // Doesn't work to pass these in as opts, for some reason
      // also, work around typescript not knowing TransformStream internals
      // eslint-disable-next-line dot-notation
      this['_writableState'].objectMode = false;
      // eslint-disable-next-line dot-notation
      this['_readableState'].objectMode = true;

      this.bs = new NoFilter$4();
      this.__restart();
    }

    /**
     * Transforming.
     *
     * @param {any} fresh Buffer to transcode.
     * @param {BufferEncoding} encoding Name of encoding.
     * @param {stream.TransformCallback} cb Callback when done.
     * @ignore
     */
    _transform(fresh, encoding, cb) {
      this.bs.write(fresh);

      while (this.bs.length >= this.__needed) {
        let ret = null;
        const chunk = (this.__needed === null) ?
          undefined :
          this.bs.read(this.__needed);

        try {
          ret = this.__parser.next(chunk);
        } catch (e) {
          return cb(e)
        }

        if (this.__needed) {
          this.__fresh = false;
        }

        if (ret.done) {
          this.push(ret.value);
          this.__restart();
        } else {
          this.__needed = ret.value || Infinity;
        }
      }

      return cb()
    }

    /**
     * Subclasses must override this to set their parsing behavior.  Yield a
     * number to receive a Buffer of that many bytes.
     *
     * @abstract
     * @returns {Generator<number, any, Buffer>}
     */
    /* istanbul ignore next */
    *_parse() { // eslint-disable-line class-methods-use-this, require-yield
      throw new Error('Must be implemented in subclass')
    }

    __restart() {
      this.__needed = null;
      this.__parser = this._parse();
      this.__fresh = true;
    }

    /**
     * Flushing.
     *
     * @param {stream.TransformCallback} cb Callback when done.
     * @ignore
     */
    _flush(cb) {
      cb(this.__fresh ? null : new Error('unexpected end of input'));
    }
  };

  var binaryParseStream = BinaryParseStream$1;

  const constants$2 = constants$3;
  const utils$5 = utils$6;
  const INTERNAL_JSON = Symbol('INTERNAL_JSON');

  function setBuffersToJSON(obj, fn) {
    // The data item tagged can be a byte string or any other data item.  In the
    // latter case, the tag applies to all of the byte string data items
    // contained in the data item, except for those contained in a nested data
    // item tagged with an expected conversion.
    if (utils$5.isBufferish(obj)) {
      obj.toJSON = fn;
    } else if (Array.isArray(obj)) {
      for (const v of obj) {
        setBuffersToJSON(v, fn);
      }
    } else if (obj && (typeof obj === 'object')) {
      // FFS, complexity in the protocol.

      // There's some circular dependency in here.
      // eslint-disable-next-line no-use-before-define
      if (!(obj instanceof Tagged$2) || (obj.tag < 21) || (obj.tag > 23)) {
        for (const v of Object.values(obj)) {
          setBuffersToJSON(v, fn);
        }
      }
    }
  }

  function b64this() {
    // eslint-disable-next-line no-invalid-this
    return utils$5.base64(this)
  }

  function b64urlThis() {
    // eslint-disable-next-line no-invalid-this
    return utils$5.base64url(this)
  }

  function hexThis() {
    // eslint-disable-next-line no-invalid-this
    return this.toString('hex')
  }

  function swapEndian(ab, size, byteOffset, byteLength) {
    const dv = new DataView(ab);
    const [getter, setter] = {
      2: [dv.getUint16, dv.setUint16],
      4: [dv.getUint32, dv.setUint32],
      8: [dv.getBigUint64, dv.setBigUint64],
    }[size];

    const end = byteOffset + byteLength;
    for (let offset = byteOffset; offset < end; offset += size) {
      setter.call(dv, offset, getter.call(dv, offset, true));
    }
  }

  /**
   * Convert a tagged value to a more interesting JavaScript type.  Errors
   * thrown in this function will be captured into the "err" property of the
   * original Tagged instance.
   *
   * @callback TagFunction
   * @param {any} value The value inside the tag.
   * @param {Tagged} tag The enclosing Tagged instance; useful if you want to
   *   modify it and return it.  Also available as "this".
   * @returns {any} The transformed value.
   */

  /* eslint-disable jsdoc/check-types */
  /**
   * A mapping from tag number to a tag decoding function.
   *
   * @typedef {Object.<string, TagFunction>} TagMap
   */
  /* eslint-enable jsdoc/check-types */

  /**
   * @type {TagMap}
   * @private
   */
  const TAGS = {
    // Standard date/time string; see Section 3.4.1
    0: v => new Date(v),
    // Epoch-based date/time; see Section 3.4.2
    1: v => new Date(v * 1000),
    // Positive bignum; see Section 3.4.3
    2: v => utils$5.bufferToBigInt(v),
    // Negative bignum; see Section 3.4.3
    3: v => constants$2.BI.MINUS_ONE - utils$5.bufferToBigInt(v),
    // Expected conversion to base64url encoding; see Section 3.4.5.2
    21: (v, tag) => {
      if (utils$5.isBufferish(v)) {
        tag[INTERNAL_JSON] = b64urlThis;
      } else {
        setBuffersToJSON(v, b64urlThis);
      }
      return tag
    },
    // Expected conversion to base64 encoding; see Section 3.4.5.2
    22: (v, tag) => {
      if (utils$5.isBufferish(v)) {
        tag[INTERNAL_JSON] = b64this;
      } else {
        setBuffersToJSON(v, b64this);
      }
      return tag
    },
    // Expected conversion to base16 encoding; see Section Section 3.4.5.2
    23: (v, tag) => {
      if (utils$5.isBufferish(v)) {
        tag[INTERNAL_JSON] = hexThis;
      } else {
        setBuffersToJSON(v, hexThis);
      }
      return tag
    },
    // URI; see Section 3.4.5.3
    32: v => new URL(v),
    // Base64url; see Section 3.4.5.3
    33: (v, tag) => {
      // If any of the following apply:
      // -  the encoded text string contains non-alphabet characters or
      //    only 1 alphabet character in the last block of 4 (where
      //    alphabet is defined by Section 5 of [RFC4648] for tag number 33
      //    and Section 4 of [RFC4648] for tag number 34), or
      if (!v.match(/^[a-zA-Z0-9_-]+$/)) {
        throw new Error('Invalid base64url characters')
      }
      const last = v.length % 4;
      if (last === 1) {
        throw new Error('Invalid base64url length')
      }
      // -  the padding bits in a 2- or 3-character block are not 0, or
      if (last === 2) {
        // The last 4 bits of the last character need to be zero.
        if ('AQgw'.indexOf(v[v.length - 1]) === -1) {
          throw new Error('Invalid base64 padding')
        }
      } else if (last === 3) {
        // The last 2 bits of the last character need to be zero.
        if ('AEIMQUYcgkosw048'.indexOf(v[v.length - 1]) === -1) {
          throw new Error('Invalid base64 padding')
        }
      }

      //    Or
      // -  the base64url encoding has padding characters,
      // (caught above)

      // the string is invalid.
      return tag
    },
    // Base64; see Section 3.4.5.3
    34: (v, tag) => {
      // If any of the following apply:
      // -  the encoded text string contains non-alphabet characters or
      //    only 1 alphabet character in the last block of 4 (where
      //    alphabet is defined by Section 5 of [RFC4648] for tag number 33
      //    and Section 4 of [RFC4648] for tag number 34), or
      const m = v.match(/^[a-zA-Z0-9+/]+(?<padding>={0,2})$/);
      if (!m) {
        throw new Error('Invalid base64 characters')
      }
      if ((v.length % 4) !== 0) {
        throw new Error('Invalid base64 length')
      }
      // -  the padding bits in a 2- or 3-character block are not 0, or
      if (m.groups.padding === '=') {
        // The last 4 bits of the last character need to be zero.
        if ('AQgw'.indexOf(v[v.length - 2]) === -1) {
          throw new Error('Invalid base64 padding')
        }
      } else if (m.groups.padding === '==') {
        // The last 2 bits of the last character need to be zero.
        if ('AEIMQUYcgkosw048'.indexOf(v[v.length - 3]) === -1) {
          throw new Error('Invalid base64 padding')
        }
      }

      // -  the base64 encoding has the wrong number of padding characters,
      // (caught above)
      // the string is invalid.
      return tag
    },
    // Regular expression; see Section 2.4.4.3
    35: v => new RegExp(v),
    // https://github.com/input-output-hk/cbor-sets-spec/blob/master/CBOR_SETS.md
    258: v => new Set(v),
  };

  const TYPED_ARRAY_TAGS = {
    64: Uint8Array,
    65: Uint16Array,
    66: Uint32Array,
    // 67: BigUint64Array,  Safari doesn't implement
    68: Uint8ClampedArray,
    69: Uint16Array,
    70: Uint32Array,
    // 71: BigUint64Array,  Safari doesn't implement
    72: Int8Array,
    73: Int16Array,
    74: Int32Array,
    // 75: BigInt64Array,  Safari doesn't implement
    // 76: reserved
    77: Int16Array,
    78: Int32Array,
    // 79: BigInt64Array,  Safari doesn't implement
    // 80: not implemented, float16 array
    81: Float32Array,
    82: Float64Array,
    // 83: not implemented, float128 array
    // 84: not implemented, float16 array
    85: Float32Array,
    86: Float64Array,
    // 87: not implemented, float128 array
  };

  // Safari
  if (typeof BigUint64Array !== 'undefined') {
    TYPED_ARRAY_TAGS[67] = BigUint64Array;
    TYPED_ARRAY_TAGS[71] = BigUint64Array;
  }
  if (typeof BigInt64Array !== 'undefined') {
    TYPED_ARRAY_TAGS[75] = BigInt64Array;
    TYPED_ARRAY_TAGS[79] = BigInt64Array;
  }

  function _toTypedArray(val, tagged) {
    if (!utils$5.isBufferish(val)) {
      throw new TypeError('val not a buffer')
    }
    const {tag} = tagged;
    // See https://tools.ietf.org/html/rfc8746
    const TypedClass = TYPED_ARRAY_TAGS[tag];
    if (!TypedClass) {
      throw new Error(`Invalid typed array tag: ${tag}`)
    }
    const little = tag & 0b00000100;
    const float = (tag & 0b00010000) >> 4;
    const sz = 2 ** (float + (tag & 0b00000011));

    if ((!little !== utils$5.isBigEndian()) && (sz > 1)) {
      swapEndian(val.buffer, sz, val.byteOffset, val.byteLength);
    }

    const ab = val.buffer.slice(val.byteOffset, val.byteOffset + val.byteLength);
    return new TypedClass(ab)
  }

  for (const n of Object.keys(TYPED_ARRAY_TAGS)) {
    TAGS[n] = _toTypedArray;
  }

  /**
   * @type {TagMap}
   * @private
   */
  let current_TAGS = {};

  /**
   * A CBOR tagged item, where the tag does not have semantics specified at the
   * moment, or those semantics threw an error during parsing. Typically this will
   * be an extension point you're not yet expecting.
   */
  let Tagged$2 = class Tagged {
    /**
     * Creates an instance of Tagged.
     *
     * @param {number} tag The number of the tag.
     * @param {any} value The value inside the tag.
     * @param {Error} [err] The error that was thrown parsing the tag, or null.
     */
    constructor(tag, value, err) {
      this.tag = tag;
      this.value = value;
      this.err = err;
      if (typeof this.tag !== 'number') {
        throw new Error(`Invalid tag type (${typeof this.tag})`)
      }
      if ((this.tag < 0) || ((this.tag | 0) !== this.tag)) {
        throw new Error(`Tag must be a positive integer: ${this.tag}`)
      }
    }

    toJSON() {
      if (this[INTERNAL_JSON]) {
        return this[INTERNAL_JSON].call(this.value)
      }
      const ret = {
        tag: this.tag,
        value: this.value,
      };
      if (this.err) {
        ret.err = this.err;
      }
      return ret
    }

    /**
     * Convert to a String.
     *
     * @returns {string} String of the form '1(2)'.
     */
    toString() {
      return `${this.tag}(${JSON.stringify(this.value)})`
    }

    /**
     * Push the simple value onto the CBOR stream.
     *
     * @param {object} gen The generator to push onto.
     * @returns {boolean} True on success.
     */
    encodeCBOR(gen) {
      gen._pushTag(this.tag);
      return gen.pushAny(this.value)
    }

    /**
     * If we have a converter for this type, do the conversion.  Some converters
     * are built-in.  Additional ones can be passed in.  If you want to remove
     * a built-in converter, pass a converter in whose value is 'null' instead
     * of a function.
     *
     * @param {object} converters Keys in the object are a tag number, the value
     *   is a function that takes the decoded CBOR and returns a JavaScript value
     *   of the appropriate type.  Throw an exception in the function on errors.
     * @returns {any} The converted item.
     */
    convert(converters) {
      let f = (converters == null) ? undefined : converters[this.tag];
      if (f === null) { // === is intentional. null has semantic meaning as above
        return this
      }
      if (typeof f !== 'function') {
        f = Tagged.TAGS[this.tag];
        if (typeof f !== 'function') {
          return this
        }
      }
      try {
        return f.call(this, this.value, this)
      } catch (error) {
        if (error && error.message && (error.message.length > 0)) {
          this.err = error.message;
        } else {
          this.err = error;
        }
        return this
      }
    }

    /**
     * The current set of supported tags.  May be modified by plugins.
     *
     * @type {TagMap}
     * @static
     */
    static get TAGS() {
      return current_TAGS
    }

    static set TAGS(val) {
      current_TAGS = val;
    }

    /**
     * Reset the supported tags to the original set, before any plugins modified
     * the list.
     */
    static reset() {
      Tagged.TAGS = {...TAGS};
    }
  };
  Tagged$2.INTERNAL_JSON = INTERNAL_JSON;
  Tagged$2.reset();
  var tagged = Tagged$2;

  const {MT: MT$5, SIMPLE: SIMPLE$1, SYMS: SYMS$4} = constants$3;

  /**
   * A CBOR Simple Value that does not map onto a known constant.
   */
  let Simple$2 = class Simple {
    /**
     * Creates an instance of Simple.
     *
     * @param {number} value The simple value's integer value.
     */
    constructor(value) {
      if (typeof value !== 'number') {
        throw new Error(`Invalid Simple type: ${typeof value}`)
      }
      if ((value < 0) || (value > 255) || ((value | 0) !== value)) {
        throw new Error(`value must be a small positive integer: ${value}`)
      }
      this.value = value;
    }

    /**
     * Debug string for simple value.
     *
     * @returns {string} Formated string of `simple(value)`.
     */
    toString() {
      return `simple(${this.value})`
    }

    /**
     * Debug string for simple value.
     *
     * @param {number} depth How deep are we?
     * @param {object} opts Options.
     * @returns {string} Formatted string of `simple(value)`.
     */
    [Symbol.for('nodejs.util.inspect.custom')](depth, opts) {
      return `simple(${this.value})`
    }

    /**
     * Push the simple value onto the CBOR stream.
     *
     * @param {object} gen The generator to push onto.
     * @returns {boolean} True on success.
     */
    encodeCBOR(gen) {
      return gen._pushInt(this.value, MT$5.SIMPLE_FLOAT)
    }

    /**
     * Is the given object a Simple?
     *
     * @param {any} obj Object to test.
     * @returns {boolean} Is it Simple?
     */
    static isSimple(obj) {
      return obj instanceof Simple
    }

    /**
     * Decode from the CBOR additional information into a JavaScript value.
     * If the CBOR item has no parent, return a "safe" symbol instead of
     * `null` or `undefined`, so that the value can be passed through a
     * stream in object mode.
     *
     * @param {number} val The CBOR additional info to convert.
     * @param {boolean} [has_parent=true] Does the CBOR item have a parent?
     * @param {boolean} [parent_indefinite=false] Is the parent element
     *   indefinitely encoded?
     * @returns {(null|undefined|boolean|symbol|Simple)} The decoded value.
     * @throws {Error} Invalid BREAK.
     */
    static decode(val, has_parent = true, parent_indefinite = false) {
      switch (val) {
        case SIMPLE$1.FALSE:
          return false
        case SIMPLE$1.TRUE:
          return true
        case SIMPLE$1.NULL:
          if (has_parent) {
            return null
          }
          return SYMS$4.NULL
        case SIMPLE$1.UNDEFINED:
          if (has_parent) {
            return undefined
          }
          return SYMS$4.UNDEFINED
        case -1:
          if (!has_parent || !parent_indefinite) {
            throw new Error('Invalid BREAK')
          }
          return SYMS$4.BREAK
        default:
          return new Simple(val)
      }
    }
  };

  var simple = Simple$2;

  const BinaryParseStream = binaryParseStream;
  const Tagged$1 = tagged;
  const Simple$1 = simple;
  const utils$4 = utils$6;
  const NoFilter$3 = lib;
  const constants$1 = constants$3;
  const {MT: MT$4, NUMBYTES: NUMBYTES$2, SYMS: SYMS$3, BI: BI$1} = constants$1;
  const {Buffer: Buffer$4} = require$$2;

  const COUNT = Symbol('count');
  const MAJOR = Symbol('major type');
  const ERROR = Symbol('error');
  const NOT_FOUND = Symbol('not found');

  function parentArray(parent, typ, count) {
    const a = [];

    a[COUNT] = count;
    a[SYMS$3.PARENT] = parent;
    a[MAJOR] = typ;
    return a
  }

  function parentBufferStream(parent, typ) {
    const b = new NoFilter$3();

    b[COUNT] = -1;
    b[SYMS$3.PARENT] = parent;
    b[MAJOR] = typ;
    return b
  }

  class UnexpectedDataError extends Error {
    constructor(byte, value) {
      super(`Unexpected data: 0x${byte.toString(16)}`);
      this.name = 'UnexpectedDataError';
      this.byte = byte;
      this.value = value;
    }
  }

  /**
   * Things that can act as inputs, from which a NoFilter can be created.
   *
   * @typedef {string|Buffer|ArrayBuffer|Uint8Array|Uint8ClampedArray
   *   |DataView|stream.Readable} BufferLike
   */
  /**
   * @typedef ExtendedResults
   * @property {any} value The value that was found.
   * @property {number} length The number of bytes of the original input that
   *   were read.
   * @property {Buffer} bytes The bytes of the original input that were used
   *   to produce the value.
   * @property {Buffer} [unused] The bytes that were left over from the original
   *   input.  This property only exists if {@linkcode Decoder.decodeFirst} or
   *   {@linkcode Decoder.decodeFirstSync} was called.
   */
  /**
   * @typedef DecoderOptions
   * @property {number} [max_depth=-1] The maximum depth to parse.
   *   Use -1 for "until you run out of memory".  Set this to a finite
   *   positive number for un-trusted inputs.  Most standard inputs won't nest
   *   more than 100 or so levels; I've tested into the millions before
   *   running out of memory.
   * @property {Tagged.TagMap} [tags] Mapping from tag number to function(v),
   *   where v is the decoded value that comes after the tag, and where the
   *   function returns the correctly-created value for that tag.
   * @property {boolean} [preferWeb=false] If true, prefer Uint8Arrays to
   *   be generated instead of node Buffers.  This might turn on some more
   *   changes in the future, so forward-compatibility is not guaranteed yet.
   * @property {BufferEncoding} [encoding='hex'] The encoding of the input.
   *   Ignored if input is a Buffer.
   * @property {boolean} [required=false] Should an error be thrown when no
   *   data is in the input?
   * @property {boolean} [extendedResults=false] If true, emit extended
   *   results, which will be an object with shape {@link ExtendedResults}.
   *   The value will already have been null-checked.
   * @property {boolean} [preventDuplicateKeys=false] If true, error is
   *   thrown if a map has duplicate keys.
   */
  /**
   * @callback decodeCallback
   * @param {Error} [error] If one was generated.
   * @param {any} [value] The decoded value.
   * @returns {void}
   */
  /**
   * @param {DecoderOptions|decodeCallback|string} opts Options,
   *   the callback, or input incoding.
   * @param {decodeCallback} [cb] Called on completion.
   * @returns {{options: DecoderOptions, cb: decodeCallback}} Normalized.
   * @throws {TypeError} On unknown option type.
   * @private
   */
  function normalizeOptions$2(opts, cb) {
    switch (typeof opts) {
      case 'function':
        return {options: {}, cb: /** @type {decodeCallback} */ (opts)}
      case 'string':
        return {options: {encoding: /** @type {BufferEncoding} */ (opts)}, cb}
      case 'object':
        return {options: opts || {}, cb}
      default:
        throw new TypeError('Unknown option type')
    }
  }

  /**
   * Decode a stream of CBOR bytes by transforming them into equivalent
   * JavaScript data.  Because of the limitations of Node object streams,
   * special symbols are emitted instead of NULL or UNDEFINED.  Fix those
   * up by calling {@link Decoder.nullcheck}.
   *
   * @extends BinaryParseStream
   */
  let Decoder$3 = class Decoder extends BinaryParseStream {
    /**
     * Create a parsing stream.
     *
     * @param {DecoderOptions} [options={}] Options.
     */
    constructor(options = {}) {
      const {
        tags = {},
        max_depth = -1,
        preferWeb = false,
        required = false,
        encoding = 'hex',
        extendedResults = false,
        preventDuplicateKeys = false,
        ...superOpts
      } = options;

      super({defaultEncoding: encoding, ...superOpts});

      this.running = true;
      this.max_depth = max_depth;
      this.tags = tags;
      this.preferWeb = preferWeb;
      this.extendedResults = extendedResults;
      this.required = required;
      this.preventDuplicateKeys = preventDuplicateKeys;

      if (extendedResults) {
        this.bs.on('read', this._onRead.bind(this));
        this.valueBytes = /** @type {NoFilter} */ (new NoFilter$3());
      }
    }

    /**
     * Check the given value for a symbol encoding a NULL or UNDEFINED value in
     * the CBOR stream.
     *
     * @param {any} val The value to check.
     * @returns {any} The corrected value.
     * @throws {Error} Nothing was found.
     * @static
     * @example
     * myDecoder.on('data', val => {
     *   val = Decoder.nullcheck(val)
     *   // ...
     * })
     */
    static nullcheck(val) {
      switch (val) {
        case SYMS$3.NULL:
          return null
        case SYMS$3.UNDEFINED:
          return undefined
        // Leaving this in for now as belt-and-suspenders, but I'm pretty sure
        // it can't happen.
        /* istanbul ignore next */
        case NOT_FOUND:
          /* istanbul ignore next */
          throw new Error('Value not found')
        default:
          return val
      }
    }

    /**
     * Decode the first CBOR item in the input, synchronously.  This will throw
     * an exception if the input is not valid CBOR, or if there are more bytes
     * left over at the end (if options.extendedResults is not true).
     *
     * @param {BufferLike} input If a Readable stream, must have
     *   received the `readable` event already, or you will get an error
     *   claiming "Insufficient data".
     * @param {DecoderOptions|string} [options={}] Options or encoding for input.
     * @returns {ExtendedResults|any} The decoded value.
     * @throws {UnexpectedDataError} Data is left over after decoding.
     * @throws {Error} Insufficient data.
     * @static
     */
    static decodeFirstSync(input, options = {}) {
      if (input == null) {
        throw new TypeError('input required')
      }
      ({options} = normalizeOptions$2(options));
      const {encoding = 'hex', ...opts} = options;
      const c = new Decoder(opts);
      const s = utils$4.guessEncoding(input, encoding);

      // For/of doesn't work when you need to call next() with a value
      // generator created by parser will be "done" after each CBOR entity
      // parser will yield numbers of bytes that it wants
      const parser = c._parse();
      let state = parser.next();

      while (!state.done) {
        const b = s.read(state.value);

        if ((b == null) || (b.length !== state.value)) {
          throw new Error('Insufficient data')
        }
        if (c.extendedResults) {
          c.valueBytes.write(b);
        }
        state = parser.next(b);
      }

      let val = null;
      if (c.extendedResults) {
        val = state.value;
        val.unused = s.read();
      } else {
        val = Decoder.nullcheck(state.value);
        if (s.length > 0) {
          const nextByte = s.read(1);

          s.unshift(nextByte);
          throw new UnexpectedDataError(nextByte[0], val)
        }
      }
      return val
    }

    /**
     * Decode all of the CBOR items in the input into an array.  This will throw
     * an exception if the input is not valid CBOR; a zero-length input will
     * return an empty array.
     *
     * @param {BufferLike} input What to parse?
     * @param {DecoderOptions|string} [options={}] Options or encoding
     *   for input.
     * @returns {Array<ExtendedResults>|Array<any>} Array of all found items.
     * @throws {TypeError} No input provided.
     * @throws {Error} Insufficient data provided.
     * @static
     */
    static decodeAllSync(input, options = {}) {
      if (input == null) {
        throw new TypeError('input required')
      }
      ({options} = normalizeOptions$2(options));
      const {encoding = 'hex', ...opts} = options;
      const c = new Decoder(opts);
      const s = utils$4.guessEncoding(input, encoding);
      const res = [];

      while (s.length > 0) {
        const parser = c._parse();
        let state = parser.next();

        while (!state.done) {
          const b = s.read(state.value);

          if ((b == null) || (b.length !== state.value)) {
            throw new Error('Insufficient data')
          }
          if (c.extendedResults) {
            c.valueBytes.write(b);
          }
          state = parser.next(b);
        }
        res.push(Decoder.nullcheck(state.value));
      }
      return res
    }

    /**
     * Decode the first CBOR item in the input.  This will error if there are
     * more bytes left over at the end (if options.extendedResults is not true),
     * and optionally if there were no valid CBOR bytes in the input.  Emits the
     * {Decoder.NOT_FOUND} Symbol in the callback if no data was found and the
     * `required` option is false.
     *
     * @param {BufferLike} input What to parse?
     * @param {DecoderOptions|decodeCallback|string} [options={}] Options, the
     *   callback, or input encoding.
     * @param {decodeCallback} [cb] Callback.
     * @returns {Promise<ExtendedResults|any>} Returned even if callback is
     *   specified.
     * @throws {TypeError} No input provided.
     * @static
     */
    static decodeFirst(input, options = {}, cb = null) {
      if (input == null) {
        throw new TypeError('input required')
      }
      ({options, cb} = normalizeOptions$2(options, cb));
      const {encoding = 'hex', required = false, ...opts} = options;

      const c = new Decoder(opts);
      let v = /** @type {any} */ (NOT_FOUND);
      const s = utils$4.guessEncoding(input, encoding);
      const p = new Promise((resolve, reject) => {
        c.on('data', val => {
          v = Decoder.nullcheck(val);
          c.close();
        });
        c.once('error', er => {
          if (c.extendedResults && (er instanceof UnexpectedDataError)) {
            v.unused = c.bs.slice();
            return resolve(v)
          }
          if (v !== NOT_FOUND) {
            // Typescript work-around
            // eslint-disable-next-line dot-notation
            er['value'] = v;
          }
          v = ERROR;
          c.close();
          return reject(er)
        });
        c.once('end', () => {
          switch (v) {
            case NOT_FOUND:
              if (required) {
                return reject(new Error('No CBOR found'))
              }
              return resolve(v)
            // Pretty sure this can't happen, but not *certain*.
            /* istanbul ignore next */
            case ERROR:
              /* istanbul ignore next */
              return undefined
            default:
              return resolve(v)
          }
        });
      });

      if (typeof cb === 'function') {
        p.then(val => cb(null, val), cb);
      }
      s.pipe(c);
      return p
    }

    /**
     * @callback decodeAllCallback
     * @param {Error} error If one was generated.
     * @param {Array<ExtendedResults>|Array<any>} value All of the decoded
     *   values, wrapped in an Array.
     */

    /**
     * Decode all of the CBOR items in the input.  This will error if there are
     * more bytes left over at the end.
     *
     * @param {BufferLike} input What to parse?
     * @param {DecoderOptions|decodeAllCallback|string} [options={}]
     *   Decoding options, the callback, or the input encoding.
     * @param {decodeAllCallback} [cb] Callback.
     * @returns {Promise<Array<ExtendedResults>|Array<any>>} Even if callback
     *   is specified.
     * @throws {TypeError} No input specified.
     * @static
     */
    static decodeAll(input, options = {}, cb = null) {
      if (input == null) {
        throw new TypeError('input required')
      }
      ({options, cb} = normalizeOptions$2(options, cb));
      const {encoding = 'hex', ...opts} = options;

      const c = new Decoder(opts);
      const vals = [];

      c.on('data', val => vals.push(Decoder.nullcheck(val)));

      const p = new Promise((resolve, reject) => {
        c.on('error', reject);
        c.on('end', () => resolve(vals));
      });

      if (typeof cb === 'function') {
        p.then(v => cb(undefined, v), er => cb(er, undefined));
      }
      utils$4.guessEncoding(input, encoding).pipe(c);
      return p
    }

    /**
     * Stop processing.
     */
    close() {
      this.running = false;
      this.__fresh = true;
    }

    /**
     * Only called if extendedResults is true.
     *
     * @ignore
     */
    _onRead(data) {
      this.valueBytes.write(data);
    }

    /**
     * @returns {Generator<number, any, Buffer>} Yields a number of bytes,
     *   returns anything, next returns a Buffer.
     * @throws {Error} Maximum depth exceeded.
     * @yields {number} Number of bytes to read.
     * @ignore
     */
    *_parse() {
      let parent = null;
      let depth = 0;
      let val = null;

      while (true) {
        if ((this.max_depth >= 0) && (depth > this.max_depth)) {
          throw new Error(`Maximum depth ${this.max_depth} exceeded`)
        }

        const [octet] = yield 1;
        if (!this.running) {
          this.bs.unshift(Buffer$4.from([octet]));
          throw new UnexpectedDataError(octet)
        }
        const mt = octet >> 5;
        const ai = octet & 0x1f;
        const parent_major = (parent == null) ? undefined : parent[MAJOR];
        const parent_length = (parent == null) ? undefined : parent.length;

        switch (ai) {
          case NUMBYTES$2.ONE:
            this.emit('more-bytes', mt, 1, parent_major, parent_length)
            ;[val] = yield 1;
            break
          case NUMBYTES$2.TWO:
          case NUMBYTES$2.FOUR:
          case NUMBYTES$2.EIGHT: {
            const numbytes = 1 << (ai - 24);

            this.emit('more-bytes', mt, numbytes, parent_major, parent_length);
            const buf = yield numbytes;
            val = (mt === MT$4.SIMPLE_FLOAT) ?
              buf :
              utils$4.parseCBORint(ai, buf);
            break
          }
          case 28:
          case 29:
          case 30:
            this.running = false;
            throw new Error(`Additional info not implemented: ${ai}`)
          case NUMBYTES$2.INDEFINITE:
            switch (mt) {
              case MT$4.POS_INT:
              case MT$4.NEG_INT:
              case MT$4.TAG:
                throw new Error(`Invalid indefinite encoding for MT ${mt}`)
            }
            val = -1;
            break
          default:
            val = ai;
        }
        switch (mt) {
          case MT$4.POS_INT:
            // Val already decoded
            break
          case MT$4.NEG_INT:
            if (val === Number.MAX_SAFE_INTEGER) {
              val = BI$1.NEG_MAX;
            } else {
              val = (typeof val === 'bigint') ? BI$1.MINUS_ONE - val : -1 - val;
            }
            break
          case MT$4.BYTE_STRING:
          case MT$4.UTF8_STRING:
            switch (val) {
              case 0:
                this.emit('start-string', mt, val, parent_major, parent_length);
                if (mt === MT$4.UTF8_STRING) {
                  val = '';
                } else {
                  val = this.preferWeb ? new Uint8Array(0) : Buffer$4.allocUnsafe(0);
                }
                break
              case -1:
                this.emit('start', mt, SYMS$3.STREAM, parent_major, parent_length);
                parent = parentBufferStream(parent, mt);
                depth++;
                continue
              default:
                this.emit('start-string', mt, val, parent_major, parent_length);
                val = yield val;
                if (mt === MT$4.UTF8_STRING) {
                  val = utils$4.utf8(val);
                } else if (this.preferWeb) {
                  val = new Uint8Array(val.buffer, val.byteOffset, val.length);
                }
            }
            break
          case MT$4.ARRAY:
          case MT$4.MAP:
            switch (val) {
              case 0:
                val = (mt === MT$4.MAP) ? {} : [];
                break
              case -1:
                this.emit('start', mt, SYMS$3.STREAM, parent_major, parent_length);
                parent = parentArray(parent, mt, -1);
                depth++;
                continue
              default:
                this.emit('start', mt, val, parent_major, parent_length);
                parent = parentArray(parent, mt, val * (mt - 3));
                depth++;
                continue
            }
            break
          case MT$4.TAG:
            this.emit('start', mt, val, parent_major, parent_length);
            parent = parentArray(parent, mt, 1);
            parent.push(val);
            depth++;
            continue
          case MT$4.SIMPLE_FLOAT:
            if (typeof val === 'number') {
              if ((ai === NUMBYTES$2.ONE) && (val < 32)) {
                throw new Error(
                  `Invalid two-byte encoding of simple value ${val}`
                )
              }
              const hasParent = (parent != null);
              val = Simple$1.decode(
                val,
                hasParent,
                hasParent && (parent[COUNT] < 0)
              );
            } else {
              val = utils$4.parseCBORfloat(val);
            }
        }
        this.emit('value', val, parent_major, parent_length, ai);
        let again = false;
        while (parent != null) {
          if (val === SYMS$3.BREAK) {
            parent[COUNT] = 1;
          } else if (Array.isArray(parent)) {
            parent.push(val);
          } else {
            // Assert: parent instanceof NoFilter
            const pm = parent[MAJOR];

            if ((pm != null) && (pm !== mt)) {
              this.running = false;
              throw new Error('Invalid major type in indefinite encoding')
            }
            parent.write(val);
          }

          if ((--parent[COUNT]) !== 0) {
            again = true;
            break
          }
          --depth;
          delete parent[COUNT];

          if (Array.isArray(parent)) {
            switch (parent[MAJOR]) {
              case MT$4.ARRAY:
                val = parent;
                break
              case MT$4.MAP: {
                let allstrings = true;

                if ((parent.length % 2) !== 0) {
                  throw new Error(`Invalid map length: ${parent.length}`)
                }
                for (let i = 0, len = parent.length; i < len; i += 2) {
                  if ((typeof parent[i] !== 'string') ||
                      (parent[i] === '__proto__')) {
                    allstrings = false;
                    break
                  }
                }
                if (allstrings) {
                  val = {};
                  for (let i = 0, len = parent.length; i < len; i += 2) {
                    if (this.preventDuplicateKeys &&
                      Object.prototype.hasOwnProperty.call(val, parent[i])) {
                      throw new Error('Duplicate keys in a map')
                    }
                    val[parent[i]] = parent[i + 1];
                  }
                } else {
                  val = new Map();
                  for (let i = 0, len = parent.length; i < len; i += 2) {
                    if (this.preventDuplicateKeys && val.has(parent[i])) {
                      throw new Error('Duplicate keys in a map')
                    }
                    val.set(parent[i], parent[i + 1]);
                  }
                }
                break
              }
              case MT$4.TAG: {
                const t = new Tagged$1(parent[0], parent[1]);

                val = t.convert(this.tags);
                break
              }
            }
          } else /* istanbul ignore else */ if (parent instanceof NoFilter$3) {
            // Only parent types are Array and NoFilter for (Array/Map) and
            // (bytes/string) respectively.
            switch (parent[MAJOR]) {
              case MT$4.BYTE_STRING:
                val = parent.slice();
                if (this.preferWeb) {
                  val = new Uint8Array(
                    /** @type {Buffer} */ (val).buffer,
                    /** @type {Buffer} */ (val).byteOffset,
                    /** @type {Buffer} */ (val).length
                  );
                }
                break
              case MT$4.UTF8_STRING:
                val = parent.toString('utf-8');
                break
            }
          }
          this.emit('stop', parent[MAJOR]);

          const old = parent;
          parent = parent[SYMS$3.PARENT];
          delete old[SYMS$3.PARENT];
          delete old[MAJOR];
        }
        if (!again) {
          if (this.extendedResults) {
            const bytes = this.valueBytes.slice();
            const ret = {
              value: Decoder.nullcheck(val),
              bytes,
              length: bytes.length,
            };

            this.valueBytes = new NoFilter$3();
            return ret
          }
          return val
        }
      }
    }
  };

  Decoder$3.NOT_FOUND = NOT_FOUND;
  var decoder$1 = Decoder$3;

  const stream$2 = require$$0;
  const utils$3 = utils$6;
  const Decoder$2 = decoder$1;
  const NoFilter$2 = lib;
  const {MT: MT$3, NUMBYTES: NUMBYTES$1, SYMS: SYMS$2} = constants$3;
  const {Buffer: Buffer$3} = require$$2;

  function plural(c) {
    if (c > 1) {
      return 's'
    }
    return ''
  }

  /**
   * @typedef CommentOptions
   * @property {number} [max_depth=10] How many times to indent
   *   the dashes.
   * @property {number} [depth=1] Initial indentation depth.
   * @property {boolean} [no_summary=false] If true, omit the summary
   *   of the full bytes read at the end.
   * @property {object} [tags] Mapping from tag number to function(v),
   *   where v is the decoded value that comes after the tag, and where the
   *   function returns the correctly-created value for that tag.
   * @property {boolean} [preferWeb=false] If true, prefer Uint8Arrays to
   *   be generated instead of node Buffers.  This might turn on some more
   *   changes in the future, so forward-compatibility is not guaranteed yet.
   * @property {BufferEncoding} [encoding='hex'] Encoding to use for input, if it
   *   is a string.
   */
  /**
   * @callback commentCallback
   * @param {Error} [error] If one was generated.
   * @param {string} [commented] The comment string.
   * @returns {void}
   */
  /**
   * Normalize inputs to the static functions.
   *
   * @param {CommentOptions|commentCallback|string|number} opts Encoding,
   *   max_depth, or callback.
   * @param {commentCallback} [cb] Called on completion.
   * @returns {{options: CommentOptions, cb: commentCallback}} Normalized value.
   * @throws {TypeError} Unknown option type.
   * @private
   */
  function normalizeOptions$1(opts, cb) {
    switch (typeof opts) {
      case 'function':
        return {options: {}, cb: /** @type {commentCallback} */ (opts)}
      case 'string':
        return {options: {encoding: /** @type {BufferEncoding} */ (opts)}, cb}
      case 'number':
        return {options: {max_depth: opts}, cb}
      case 'object':
        return {options: opts || {}, cb}
      default:
        throw new TypeError('Unknown option type')
    }
  }

  /**
   * Generate the expanded format of RFC 8949, section 3.2.2.
   *
   * @extends stream.Transform
   */
  let Commented$1 = class Commented extends stream$2.Transform {
    /**
     * Create a CBOR commenter.
     *
     * @param {CommentOptions} [options={}] Stream options.
     */
    constructor(options = {}) {
      const {
        depth = 1,
        max_depth = 10,
        no_summary = false,
        // Decoder options
        tags = {},
        preferWeb,
        encoding,
        // Stream.Transform options
        ...superOpts
      } = options;

      super({
        ...superOpts,
        readableObjectMode: false,
        writableObjectMode: false,
      });

      this.depth = depth;
      this.max_depth = max_depth;
      this.all = new NoFilter$2();

      if (!tags[24]) {
        tags[24] = this._tag_24.bind(this);
      }
      this.parser = new Decoder$2({
        tags,
        max_depth,
        preferWeb,
        encoding,
      });
      this.parser.on('value', this._on_value.bind(this));
      this.parser.on('start', this._on_start.bind(this));
      this.parser.on('start-string', this._on_start_string.bind(this));
      this.parser.on('stop', this._on_stop.bind(this));
      this.parser.on('more-bytes', this._on_more.bind(this));
      this.parser.on('error', this._on_error.bind(this));
      if (!no_summary) {
        this.parser.on('data', this._on_data.bind(this));
      }
      this.parser.bs.on('read', this._on_read.bind(this));
    }

    /**
     * @param {Buffer} v Descend into embedded CBOR.
     * @private
     */
    _tag_24(v) {
      const c = new Commented({depth: this.depth + 1, no_summary: true});

      c.on('data', b => this.push(b));
      c.on('error', er => this.emit('error', er));
      c.end(v);
    }

    /**
     * Transforming.
     *
     * @param {any} fresh Buffer to transcode.
     * @param {BufferEncoding} encoding Name of encoding.
     * @param {stream.TransformCallback} cb Callback when done.
     * @ignore
     */
    _transform(fresh, encoding, cb) {
      this.parser.write(fresh, encoding, cb);
    }

    /**
     * Flushing.
     *
     * @param {stream.TransformCallback} cb Callback when done.
     * @ignore
     */
    _flush(cb) {
      // TODO: find the test that covers this, and look at the return value
      return this.parser._flush(cb)
    }

    /**
     * Comment on an input Buffer or string, creating a string passed to the
     * callback.  If callback not specified, a promise is returned.
     *
     * @param {string|Buffer|ArrayBuffer|Uint8Array|Uint8ClampedArray
     *   |DataView|stream.Readable} input Something to parse.
     * @param {CommentOptions|commentCallback|string|number} [options={}]
     *   Encoding, max_depth, or callback.
     * @param {commentCallback} [cb] If specified, called on completion.
     * @returns {Promise} If cb not specified.
     * @throws {Error} Input required.
     * @static
     */
    static comment(input, options = {}, cb = null) {
      if (input == null) {
        throw new Error('input required')
      }
      ({options, cb} = normalizeOptions$1(options, cb));
      const bs = new NoFilter$2();
      const {encoding = 'hex', ...opts} = options;
      const d = new Commented(opts);
      let p = null;

      if (typeof cb === 'function') {
        d.on('end', () => {
          cb(null, bs.toString('utf8'));
        });
        d.on('error', cb);
      } else {
        p = new Promise((resolve, reject) => {
          d.on('end', () => {
            resolve(bs.toString('utf8'));
          });
          d.on('error', reject);
        });
      }
      d.pipe(bs);
      utils$3.guessEncoding(input, encoding).pipe(d);
      return p
    }

    /**
     * @ignore
     */
    _on_error(er) {
      this.push('ERROR: ');
      this.push(er.toString());
      this.push('\n');
    }

    /**
     * @ignore
     */
    _on_read(buf) {
      this.all.write(buf);
      const hex = buf.toString('hex');

      this.push(new Array(this.depth + 1).join('  '));
      this.push(hex);

      let ind = ((this.max_depth - this.depth) * 2) - hex.length;
      if (ind < 1) {
        ind = 1;
      }
      this.push(new Array(ind + 1).join(' '));
      this.push('-- ');
    }

    /**
     * @ignore
     */
    _on_more(mt, len, parent_mt, pos) {
      let desc = '';

      this.depth++;
      switch (mt) {
        case MT$3.POS_INT:
          desc = 'Positive number,';
          break
        case MT$3.NEG_INT:
          desc = 'Negative number,';
          break
        case MT$3.ARRAY:
          desc = 'Array, length';
          break
        case MT$3.MAP:
          desc = 'Map, count';
          break
        case MT$3.BYTE_STRING:
          desc = 'Bytes, length';
          break
        case MT$3.UTF8_STRING:
          desc = 'String, length';
          break
        case MT$3.SIMPLE_FLOAT:
          if (len === 1) {
            desc = 'Simple value,';
          } else {
            desc = 'Float,';
          }
          break
      }
      this.push(`${desc} next ${len} byte${plural(len)}\n`);
    }

    /**
     * @ignore
     */
    _on_start_string(mt, len, parent_mt, pos) {
      let desc = '';

      this.depth++;
      switch (mt) {
        case MT$3.BYTE_STRING:
          desc = `Bytes, length: ${len}`;
          break
        case MT$3.UTF8_STRING:
          desc = `String, length: ${len.toString()}`;
          break
      }
      this.push(`${desc}\n`);
    }

    /**
     * @ignore
     */
    _on_start(mt, tag, parent_mt, pos) {
      this.depth++;
      switch (parent_mt) {
        case MT$3.ARRAY:
          this.push(`[${pos}], `);
          break
        case MT$3.MAP:
          if (pos % 2) {
            this.push(`{Val:${Math.floor(pos / 2)}}, `);
          } else {
            this.push(`{Key:${Math.floor(pos / 2)}}, `);
          }
          break
      }
      switch (mt) {
        case MT$3.TAG:
          this.push(`Tag #${tag}`);
          if (tag === 24) {
            this.push(' Encoded CBOR data item');
          }
          break
        case MT$3.ARRAY:
          if (tag === SYMS$2.STREAM) {
            this.push('Array (streaming)');
          } else {
            this.push(`Array, ${tag} item${plural(tag)}`);
          }
          break
        case MT$3.MAP:
          if (tag === SYMS$2.STREAM) {
            this.push('Map (streaming)');
          } else {
            this.push(`Map, ${tag} pair${plural(tag)}`);
          }
          break
        case MT$3.BYTE_STRING:
          this.push('Bytes (streaming)');
          break
        case MT$3.UTF8_STRING:
          this.push('String (streaming)');
          break
      }
      this.push('\n');
    }

    /**
     * @ignore
     */
    _on_stop(mt) {
      this.depth--;
    }

    /**
     * @private
     */
    _on_value(val, parent_mt, pos, ai) {
      if (val !== SYMS$2.BREAK) {
        switch (parent_mt) {
          case MT$3.ARRAY:
            this.push(`[${pos}], `);
            break
          case MT$3.MAP:
            if (pos % 2) {
              this.push(`{Val:${Math.floor(pos / 2)}}, `);
            } else {
              this.push(`{Key:${Math.floor(pos / 2)}}, `);
            }
            break
        }
      }
      const str = utils$3.cborValueToString(val, -Infinity);

      if ((typeof val === 'string') ||
          (Buffer$3.isBuffer(val))) {
        if (val.length > 0) {
          this.push(str);
          this.push('\n');
        }
        this.depth--;
      } else {
        this.push(str);
        this.push('\n');
      }

      switch (ai) {
        case NUMBYTES$1.ONE:
        case NUMBYTES$1.TWO:
        case NUMBYTES$1.FOUR:
        case NUMBYTES$1.EIGHT:
          this.depth--;
      }
    }

    /**
     * @ignore
     */
    _on_data() {
      this.push('0x');
      this.push(this.all.read().toString('hex'));
      this.push('\n');
    }
  };

  var commented = Commented$1;

  const stream$1 = require$$0;
  const Decoder$1 = decoder$1;
  const utils$2 = utils$6;
  const NoFilter$1 = lib;
  const {MT: MT$2, SYMS: SYMS$1} = constants$3;

  /**
   * Things that can act as inputs, from which a NoFilter can be created.
   *
   * @typedef {string|Buffer|ArrayBuffer|Uint8Array|Uint8ClampedArray
   *   |DataView|stream.Readable} BufferLike
   */

  /**
   * @typedef DiagnoseOptions
   * @property {string} [separator='\n'] Output between detected objects.
   * @property {boolean} [stream_errors=false] Put error info into the
   *   output stream.
   * @property {number} [max_depth=-1] The maximum depth to parse.
   *   Use -1 for "until you run out of memory".  Set this to a finite
   *   positive number for un-trusted inputs.  Most standard inputs won't nest
   *   more than 100 or so levels; I've tested into the millions before
   *   running out of memory.
   * @property {object} [tags] Mapping from tag number to function(v),
   *   where v is the decoded value that comes after the tag, and where the
   *   function returns the correctly-created value for that tag.
   * @property {boolean} [preferWeb=false] If true, prefer Uint8Arrays to
   *   be generated instead of node Buffers.  This might turn on some more
   *   changes in the future, so forward-compatibility is not guaranteed yet.
   * @property {BufferEncoding} [encoding='hex'] The encoding of input, ignored if
   *   input is not string.
   */
  /**
   * @callback diagnoseCallback
   * @param {Error} [error] If one was generated.
   * @param {string} [value] The diagnostic value.
   * @returns {void}
   */
  /**
   * @param {DiagnoseOptions|diagnoseCallback|string} opts Options,
   *   the callback, or input incoding.
   * @param {diagnoseCallback} [cb] Called on completion.
   * @returns {{options: DiagnoseOptions, cb: diagnoseCallback}} Normalized.
   * @throws {TypeError} Unknown option type.
   * @private
   */
  function normalizeOptions(opts, cb) {
    switch (typeof opts) {
      case 'function':
        return {options: {}, cb: /** @type {diagnoseCallback} */ (opts)}
      case 'string':
        return {options: {encoding: /** @type {BufferEncoding} */ (opts)}, cb}
      case 'object':
        return {options: opts || {}, cb}
      default:
        throw new TypeError('Unknown option type')
    }
  }

  /**
   * Output the diagnostic format from a stream of CBOR bytes.
   *
   * @extends stream.Transform
   */
  let Diagnose$1 = class Diagnose extends stream$1.Transform {
    /**
     * Creates an instance of Diagnose.
     *
     * @param {DiagnoseOptions} [options={}] Options for creation.
     */
    constructor(options = {}) {
      const {
        separator = '\n',
        stream_errors = false,
        // Decoder options
        tags,
        max_depth,
        preferWeb,
        encoding,
        // Stream.Transform options
        ...superOpts
      } = options;
      super({
        ...superOpts,
        readableObjectMode: false,
        writableObjectMode: false,
      });

      this.float_bytes = -1;
      this.separator = separator;
      this.stream_errors = stream_errors;
      this.parser = new Decoder$1({
        tags,
        max_depth,
        preferWeb,
        encoding,
      });
      this.parser.on('more-bytes', this._on_more.bind(this));
      this.parser.on('value', this._on_value.bind(this));
      this.parser.on('start', this._on_start.bind(this));
      this.parser.on('stop', this._on_stop.bind(this));
      this.parser.on('data', this._on_data.bind(this));
      this.parser.on('error', this._on_error.bind(this));
    }

    /**
     * Transforming.
     *
     * @param {any} fresh Buffer to transcode.
     * @param {BufferEncoding} encoding Name of encoding.
     * @param {stream.TransformCallback} cb Callback when done.
     * @ignore
     */
    _transform(fresh, encoding, cb) {
      this.parser.write(fresh, encoding, cb);
    }

    /**
     * Flushing.
     *
     * @param {stream.TransformCallback} cb Callback when done.
     * @ignore
     */
    _flush(cb) {
      this.parser._flush(er => {
        if (this.stream_errors) {
          if (er) {
            this._on_error(er);
          }
          return cb()
        }
        return cb(er)
      });
    }

    /**
     * Convenience function to return a string in diagnostic format.
     *
     * @param {BufferLike} input The CBOR bytes to format.
     * @param {DiagnoseOptions |diagnoseCallback|string} [options={}]
     *   Options, the callback, or the input encoding.
     * @param {diagnoseCallback} [cb] Callback.
     * @returns {Promise} If callback not specified.
     * @throws {TypeError} Input not provided.
     */
    static diagnose(input, options = {}, cb = null) {
      if (input == null) {
        throw new TypeError('input required')
      }
      ({options, cb} = normalizeOptions(options, cb));
      const {encoding = 'hex', ...opts} = options;

      const bs = new NoFilter$1();
      const d = new Diagnose(opts);
      let p = null;
      if (typeof cb === 'function') {
        d.on('end', () => cb(null, bs.toString('utf8')));
        d.on('error', cb);
      } else {
        p = new Promise((resolve, reject) => {
          d.on('end', () => resolve(bs.toString('utf8')));
          d.on('error', reject);
        });
      }
      d.pipe(bs);
      utils$2.guessEncoding(input, encoding).pipe(d);
      return p
    }

    /**
     * @ignore
     */
    _on_error(er) {
      if (this.stream_errors) {
        this.push(er.toString());
      } else {
        this.emit('error', er);
      }
    }

    /** @private */
    _on_more(mt, len, parent_mt, pos) {
      if (mt === MT$2.SIMPLE_FLOAT) {
        this.float_bytes = {
          2: 1,
          4: 2,
          8: 3,
        }[len];
      }
    }

    /** @private */
    _fore(parent_mt, pos) {
      switch (parent_mt) {
        case MT$2.BYTE_STRING:
        case MT$2.UTF8_STRING:
        case MT$2.ARRAY:
          if (pos > 0) {
            this.push(', ');
          }
          break
        case MT$2.MAP:
          if (pos > 0) {
            if (pos % 2) {
              this.push(': ');
            } else {
              this.push(', ');
            }
          }
      }
    }

    /** @private */
    _on_value(val, parent_mt, pos) {
      if (val === SYMS$1.BREAK) {
        return
      }
      this._fore(parent_mt, pos);
      const fb = this.float_bytes;
      this.float_bytes = -1;
      this.push(utils$2.cborValueToString(val, fb));
    }

    /** @private */
    _on_start(mt, tag, parent_mt, pos) {
      this._fore(parent_mt, pos);
      switch (mt) {
        case MT$2.TAG:
          this.push(`${tag}(`);
          break
        case MT$2.ARRAY:
          this.push('[');
          break
        case MT$2.MAP:
          this.push('{');
          break
        case MT$2.BYTE_STRING:
        case MT$2.UTF8_STRING:
          this.push('(');
          break
      }
      if (tag === SYMS$1.STREAM) {
        this.push('_ ');
      }
    }

    /** @private */
    _on_stop(mt) {
      switch (mt) {
        case MT$2.TAG:
          this.push(')');
          break
        case MT$2.ARRAY:
          this.push(']');
          break
        case MT$2.MAP:
          this.push('}');
          break
        case MT$2.BYTE_STRING:
        case MT$2.UTF8_STRING:
          this.push(')');
          break
      }
    }

    /** @private */
    _on_data() {
      this.push(this.separator);
    }
  };

  var diagnose = Diagnose$1;

  const stream = require$$0;
  const NoFilter = lib;
  const utils$1 = utils$6;
  const constants = constants$3;
  const {
    MT: MT$1, NUMBYTES, SHIFT32, SIMPLE, SYMS, TAG, BI,
  } = constants;
  const {Buffer: Buffer$2} = require$$2;

  const HALF = (MT$1.SIMPLE_FLOAT << 5) | NUMBYTES.TWO;
  const FLOAT = (MT$1.SIMPLE_FLOAT << 5) | NUMBYTES.FOUR;
  const DOUBLE = (MT$1.SIMPLE_FLOAT << 5) | NUMBYTES.EIGHT;
  const TRUE = (MT$1.SIMPLE_FLOAT << 5) | SIMPLE.TRUE;
  const FALSE = (MT$1.SIMPLE_FLOAT << 5) | SIMPLE.FALSE;
  const UNDEFINED = (MT$1.SIMPLE_FLOAT << 5) | SIMPLE.UNDEFINED;
  const NULL = (MT$1.SIMPLE_FLOAT << 5) | SIMPLE.NULL;

  const BREAK = Buffer$2.from([0xff]);
  const BUF_NAN = Buffer$2.from('f97e00', 'hex');
  const BUF_INF_NEG = Buffer$2.from('f9fc00', 'hex');
  const BUF_INF_POS = Buffer$2.from('f97c00', 'hex');
  const BUF_NEG_ZERO = Buffer$2.from('f98000', 'hex');

  /**
   * Generate the CBOR for a value.  If you are using this, you'll either need
   * to call {@link Encoder.write} with a Buffer, or look into the internals of
   * Encoder to reuse existing non-documented behavior.
   *
   * @callback EncodeFunction
   * @param {Encoder} enc The encoder to use.
   * @param {any} val The value to encode.
   * @returns {boolean} True on success.
   */

  /* eslint-disable jsdoc/check-types */
  /**
   * A mapping from tag number to a tag decoding function.
   *
   * @typedef {Object.<string, EncodeFunction>} SemanticMap
   */
  /* eslint-enable jsdoc/check-types */

  /**
   * @type {SemanticMap}
   * @private
   */
  const SEMANTIC_TYPES = {};

  /**
   * @type {SemanticMap}
   * @private
   */
  let current_SEMANTIC_TYPES = {};

  /**
   * @param {string} str String to normalize.
   * @returns {"number"|"float"|"int"|"string"} Normalized.
   * @throws {TypeError} Invalid input.
   * @private
   */
  function parseDateType(str) {
    if (!str) {
      return 'number'
    }
    switch (str.toLowerCase()) {
      case 'number':
        return 'number'
      case 'float':
        return 'float'
      case 'int':
      case 'integer':
        return 'int'
      case 'string':
        return 'string'
    }
    throw new TypeError(`dateType invalid, got "${str}"`)
  }

  /**
   * @typedef ObjectOptions
   * @property {boolean} [indefinite = false] Force indefinite encoding for this
   *   object.
   * @property {boolean} [skipTypes = false] Do not use available type mappings
   *   for this object, but encode it as a "normal" JS object would be.
   */

  /**
   * @typedef EncodingOptions
   * @property {any[]|object} [genTypes=[]] Array of pairs of
   *   `type`, `function(Encoder)` for semantic types to be encoded.  Not
   *   needed for Array, Date, Buffer, Map, RegExp, Set, or URL.
   *   If an object, the keys are the constructor names for the types.
   * @property {boolean} [canonical=false] Should the output be
   *   canonicalized.
   * @property {boolean|WeakSet} [detectLoops=false] Should object loops
   *   be detected?  This will currently add memory to track every part of the
   *   object being encoded in a WeakSet.  Do not encode
   *   the same object twice on the same encoder, without calling
   *   `removeLoopDetectors` in between, which will clear the WeakSet.
   *   You may pass in your own WeakSet to be used; this is useful in some
   *   recursive scenarios.
   * @property {("number"|"float"|"int"|"string")} [dateType="number"] -
   *   how should dates be encoded?  "number" means float or int, if no
   *   fractional seconds.
   * @property {any} [encodeUndefined=undefined] How should an
   *   "undefined" in the input be encoded.  By default, just encode a CBOR
   *   undefined.  If this is a buffer, use those bytes without re-encoding
   *   them.  If this is a function, the function will be called (which is a
   *   good time to throw an exception, if that's what you want), and the
   *   return value will be used according to these rules.  Anything else will
   *   be encoded as CBOR.
   * @property {boolean} [disallowUndefinedKeys=false] Should
   *   "undefined" be disallowed as a key in a Map that is serialized?  If
   *   this is true, encode(new Map([[undefined, 1]])) will throw an
   *   exception.  Note that it is impossible to get a key of undefined in a
   *   normal JS object.
   * @property {boolean} [collapseBigIntegers=false] Should integers
   *   that come in as ECMAscript bigint's be encoded
   *   as normal CBOR integers if they fit, discarding type information?
   * @property {number} [chunkSize=4096] Number of characters or bytes
   *   for each chunk, if obj is a string or Buffer, when indefinite encoding.
   * @property {boolean} [omitUndefinedProperties=false] When encoding
   *   objects or Maps, do not include a key if its corresponding value is
   *   `undefined`.
   */

  /**
   * Transform JavaScript values into CBOR bytes.  The `Writable` side of
   * the stream is in object mode.
   *
   * @extends stream.Transform
   */
  let Encoder$2 = class Encoder extends stream.Transform {
    /**
     * Creates an instance of Encoder.
     *
     * @param {EncodingOptions} [options={}] Options for the encoder.
     */
    constructor(options = {}) {
      const {
        canonical = false,
        encodeUndefined,
        disallowUndefinedKeys = false,
        dateType = 'number',
        collapseBigIntegers = false,
        detectLoops = false,
        omitUndefinedProperties = false,
        genTypes = [],
        ...superOpts
      } = options;

      super({
        ...superOpts,
        readableObjectMode: false,
        writableObjectMode: true,
      });

      this.canonical = canonical;
      this.encodeUndefined = encodeUndefined;
      this.disallowUndefinedKeys = disallowUndefinedKeys;
      this.dateType = parseDateType(dateType);
      this.collapseBigIntegers = this.canonical ? true : collapseBigIntegers;

      /** @type {WeakSet?} */
      this.detectLoops = undefined;
      if (typeof detectLoops === 'boolean') {
        if (detectLoops) {
          this.detectLoops = new WeakSet();
        }
      } else if (detectLoops instanceof WeakSet) {
        this.detectLoops = detectLoops;
      } else {
        throw new TypeError('detectLoops must be boolean or WeakSet')
      }
      this.omitUndefinedProperties = omitUndefinedProperties;

      this.semanticTypes = {...Encoder.SEMANTIC_TYPES};

      if (Array.isArray(genTypes)) {
        for (let i = 0, len = genTypes.length; i < len; i += 2) {
          this.addSemanticType(genTypes[i], genTypes[i + 1]);
        }
      } else {
        for (const [k, v] of Object.entries(genTypes)) {
          this.addSemanticType(k, v);
        }
      }
    }

    /**
     * Transforming.
     *
     * @param {any} fresh Buffer to transcode.
     * @param {BufferEncoding} encoding Name of encoding.
     * @param {stream.TransformCallback} cb Callback when done.
     * @ignore
     */
    _transform(fresh, encoding, cb) {
      const ret = this.pushAny(fresh);
      // Old transformers might not return bool.  undefined !== false
      cb((ret === false) ? new Error('Push Error') : undefined);
    }

    /**
     * Flushing.
     *
     * @param {stream.TransformCallback} cb Callback when done.
     * @ignore
     */
    // eslint-disable-next-line class-methods-use-this
    _flush(cb) {
      cb();
    }

    /**
     * @param {number} val Number(0-255) to encode.
     * @returns {boolean} True on success.
     * @ignore
     */
    _pushUInt8(val) {
      const b = Buffer$2.allocUnsafe(1);
      b.writeUInt8(val, 0);
      return this.push(b)
    }

    /**
     * @param {number} val Number(0-65535) to encode.
     * @returns {boolean} True on success.
     * @ignore
     */
    _pushUInt16BE(val) {
      const b = Buffer$2.allocUnsafe(2);
      b.writeUInt16BE(val, 0);
      return this.push(b)
    }

    /**
     * @param {number} val Number(0..2**32-1) to encode.
     * @returns {boolean} True on success.
     * @ignore
     */
    _pushUInt32BE(val) {
      const b = Buffer$2.allocUnsafe(4);
      b.writeUInt32BE(val, 0);
      return this.push(b)
    }

    /**
     * @param {number} val Number to encode as 4-byte float.
     * @returns {boolean} True on success.
     * @ignore
     */
    _pushFloatBE(val) {
      const b = Buffer$2.allocUnsafe(4);
      b.writeFloatBE(val, 0);
      return this.push(b)
    }

    /**
     * @param {number} val Number to encode as 8-byte double.
     * @returns {boolean} True on success.
     * @ignore
     */
    _pushDoubleBE(val) {
      const b = Buffer$2.allocUnsafe(8);
      b.writeDoubleBE(val, 0);
      return this.push(b)
    }

    /**
     * @returns {boolean} True on success.
     * @ignore
     */
    _pushNaN() {
      return this.push(BUF_NAN)
    }

    /**
     * @param {number} obj Positive or negative infinity.
     * @returns {boolean} True on success.
     * @ignore
     */
    _pushInfinity(obj) {
      const half = (obj < 0) ? BUF_INF_NEG : BUF_INF_POS;
      return this.push(half)
    }

    /**
     * Choose the best float representation for a number and encode it.
     *
     * @param {number} obj A number that is known to be not-integer, but not
     *   how many bytes of precision it needs.
     * @returns {boolean} True on success.
     * @ignore
     */
    _pushFloat(obj) {
      if (this.canonical) {
        // TODO: is this enough slower to hide behind canonical?
        // It's certainly enough of a hack (see utils.parseHalf)

        // From section 3.9:
        // If a protocol allows for IEEE floats, then additional canonicalization
        // rules might need to be added.  One example rule might be to have all
        // floats start as a 64-bit float, then do a test conversion to a 32-bit
        // float; if the result is the same numeric value, use the shorter value
        // and repeat the process with a test conversion to a 16-bit float.  (This
        // rule selects 16-bit float for positive and negative Infinity as well.)

        // which seems pretty much backwards to me.
        const b2 = Buffer$2.allocUnsafe(2);
        if (utils$1.writeHalf(b2, obj)) {
          // I have convinced myself that there are no cases where writeHalf
          // will return true but `utils.parseHalf(b2) !== obj)`
          return this._pushUInt8(HALF) && this.push(b2)
        }
      }
      if (Math.fround(obj) === obj) {
        return this._pushUInt8(FLOAT) && this._pushFloatBE(obj)
      }

      return this._pushUInt8(DOUBLE) && this._pushDoubleBE(obj)
    }

    /**
     * Choose the best integer representation for a postive number and encode
     * it.  If the number is over MAX_SAFE_INTEGER, fall back on float (but I
     * don't remember why).
     *
     * @param {number} obj A positive number that is known to be an integer,
     *   but not how many bytes of precision it needs.
     * @param {number} mt The Major Type number to combine with the integer.
     *   Not yet shifted.
     * @param {number} [orig] The number before it was transformed to positive.
     *   If the mt is NEG_INT, and the positive number is over MAX_SAFE_INT,
     *   then we'll encode this as a float rather than making the number
     *   negative again and losing precision.
     * @returns {boolean} True on success.
     * @ignore
     */
    _pushInt(obj, mt, orig) {
      const m = mt << 5;

      if (obj < 24) {
        return this._pushUInt8(m | obj)
      }
      if (obj <= 0xff) {
        return this._pushUInt8(m | NUMBYTES.ONE) && this._pushUInt8(obj)
      }
      if (obj <= 0xffff) {
        return this._pushUInt8(m | NUMBYTES.TWO) && this._pushUInt16BE(obj)
      }
      if (obj <= 0xffffffff) {
        return this._pushUInt8(m | NUMBYTES.FOUR) && this._pushUInt32BE(obj)
      }
      let max = Number.MAX_SAFE_INTEGER;
      if (mt === MT$1.NEG_INT) {
        // Special case for Number.MIN_SAFE_INTEGER - 1
        max--;
      }
      if (obj <= max) {
        return this._pushUInt8(m | NUMBYTES.EIGHT) &&
          this._pushUInt32BE(Math.floor(obj / SHIFT32)) &&
          this._pushUInt32BE(obj % SHIFT32)
      }
      if (mt === MT$1.NEG_INT) {
        return this._pushFloat(orig)
      }
      return this._pushFloat(obj)
    }

    /**
     * Choose the best integer representation for a number and encode it.
     *
     * @param {number} obj A number that is known to be an integer,
     *   but not how many bytes of precision it needs.
     * @returns {boolean} True on success.
     * @ignore
     */
    _pushIntNum(obj) {
      if (Object.is(obj, -0)) {
        return this.push(BUF_NEG_ZERO)
      }

      if (obj < 0) {
        return this._pushInt(-obj - 1, MT$1.NEG_INT, obj)
      }
      return this._pushInt(obj, MT$1.POS_INT)
    }

    /**
     * @param {number} obj Plain JS number to encode.
     * @returns {boolean} True on success.
     * @ignore
     */
    _pushNumber(obj) {
      if (isNaN(obj)) {
        return this._pushNaN()
      }
      if (!isFinite(obj)) {
        return this._pushInfinity(obj)
      }
      if (Math.round(obj) === obj) {
        return this._pushIntNum(obj)
      }
      return this._pushFloat(obj)
    }

    /**
     * @param {string} obj String to encode.
     * @returns {boolean} True on success.
     * @ignore
     */
    _pushString(obj) {
      const len = Buffer$2.byteLength(obj, 'utf8');
      return this._pushInt(len, MT$1.UTF8_STRING) && this.push(obj, 'utf8')
    }

    /**
     * @param {boolean} obj Bool to encode.
     * @returns {boolean} True on success.
     * @ignore
     */
    _pushBoolean(obj) {
      return this._pushUInt8(obj ? TRUE : FALSE)
    }

    /**
     * @param {undefined} obj Ignored.
     * @returns {boolean} True on success.
     * @ignore
     */
    _pushUndefined(obj) {
      switch (typeof this.encodeUndefined) {
        case 'undefined':
          return this._pushUInt8(UNDEFINED)
        case 'function':
          return this.pushAny(this.encodeUndefined(obj))
        case 'object': {
          const buf = utils$1.bufferishToBuffer(this.encodeUndefined);
          if (buf) {
            return this.push(buf)
          }
        }
      }
      return this.pushAny(this.encodeUndefined)
    }

    /**
     * @param {null} obj Ignored.
     * @returns {boolean} True on success.
     * @ignore
     */
    _pushNull(obj) {
      return this._pushUInt8(NULL)
    }

    /**
     * @param {number} tag Tag number to encode.
     * @returns {boolean} True on success.
     * @ignore
     */
    _pushTag(tag) {
      return this._pushInt(tag, MT$1.TAG)
    }

    /**
     * @param {bigint} obj BigInt to encode.
     * @returns {boolean} True on success.
     * @ignore
     */
    _pushJSBigint(obj) {
      let m = MT$1.POS_INT;
      let tag = TAG.POS_BIGINT;
      // BigInt doesn't have -0
      if (obj < 0) {
        obj = -obj + BI.MINUS_ONE;
        m = MT$1.NEG_INT;
        tag = TAG.NEG_BIGINT;
      }

      if (this.collapseBigIntegers &&
          (obj <= BI.MAXINT64)) {
        // Special handiling for 64bits
        if (obj <= 0xffffffff) {
          return this._pushInt(Number(obj), m)
        }
        return this._pushUInt8((m << 5) | NUMBYTES.EIGHT) &&
          this._pushUInt32BE(Number(obj / BI.SHIFT32)) &&
          this._pushUInt32BE(Number(obj % BI.SHIFT32))
      }

      let str = obj.toString(16);
      if (str.length % 2) {
        str = `0${str}`;
      }
      const buf = Buffer$2.from(str, 'hex');
      return this._pushTag(tag) && Encoder._pushBuffer(this, buf)
    }

    /**
     * @param {object} obj Object to encode.
     * @param {ObjectOptions} [opts] Options for encoding this object.
     * @returns {boolean} True on success.
     * @throws {Error} Loop detected.
     * @ignore
     */
    _pushObject(obj, opts) {
      if (!obj) {
        return this._pushNull(obj)
      }
      opts = {
        indefinite: false,
        skipTypes: false,
        ...opts,
      };
      if (!opts.indefinite) {
        // This will only happen the first time through for indefinite encoding
        if (this.detectLoops) {
          if (this.detectLoops.has(obj)) {
            throw new Error(`\
Loop detected while CBOR encoding.
Call removeLoopDetectors before resuming.`)
          } else {
            this.detectLoops.add(obj);
          }
        }
      }
      if (!opts.skipTypes) {
        const f = obj.encodeCBOR;
        if (typeof f === 'function') {
          return f.call(obj, this)
        }
        const converter = this.semanticTypes[obj.constructor.name];
        if (converter) {
          return converter.call(obj, this, obj)
        }
      }
      const keys = Object.keys(obj).filter(k => {
        const tv = typeof obj[k];
        return (tv !== 'function') &&
          (!this.omitUndefinedProperties || (tv !== 'undefined'))
      });
      const cbor_keys = {};
      if (this.canonical) {
        // Note: this can't be a normal sort, because 'b' needs to sort before
        // 'aa'
        keys.sort((a, b) => {
          // Always strings, so don't bother to pass options.
          // hold on to the cbor versions, since there's no need
          // to encode more than once
          const a_cbor = cbor_keys[a] || (cbor_keys[a] = Encoder.encode(a));
          const b_cbor = cbor_keys[b] || (cbor_keys[b] = Encoder.encode(b));

          return a_cbor.compare(b_cbor)
        });
      }
      if (opts.indefinite) {
        if (!this._pushUInt8((MT$1.MAP << 5) | NUMBYTES.INDEFINITE)) {
          return false
        }
      } else if (!this._pushInt(keys.length, MT$1.MAP)) {
        return false
      }
      let ck = null;
      for (let j = 0, len2 = keys.length; j < len2; j++) {
        const k = keys[j];
        if (this.canonical && ((ck = cbor_keys[k]))) {
          if (!this.push(ck)) { // Already a Buffer
            return false
          }
        } else if (!this._pushString(k)) {
          return false
        }
        if (!this.pushAny(obj[k])) {
          return false
        }
      }
      if (opts.indefinite) {
        if (!this.push(BREAK)) {
          return false
        }
      } else if (this.detectLoops) {
        this.detectLoops.delete(obj);
      }
      return true
    }

    /**
     * @param {any[]} objs Array of supported things.
     * @returns {Buffer} Concatenation of encodings for the supported things.
     * @ignore
     */
    _encodeAll(objs) {
      const bs = new NoFilter({highWaterMark: this.readableHighWaterMark});
      this.pipe(bs);
      for (const o of objs) {
        this.pushAny(o);
      }
      this.end();
      return bs.read()
    }

    /**
     * Add an encoding function to the list of supported semantic types.  This
     * is useful for objects for which you can't add an encodeCBOR method.
     *
     * @param {string|Function} type The type to encode.
     * @param {EncodeFunction} fun The encoder to use.
     * @returns {EncodeFunction?} The previous encoder or undefined if there
     *   wasn't one.
     * @throws {TypeError} Invalid function.
     */
    addSemanticType(type, fun) {
      const typeName = (typeof type === 'string') ? type : type.name;
      const old = this.semanticTypes[typeName];

      if (fun) {
        if (typeof fun !== 'function') {
          throw new TypeError('fun must be of type function')
        }
        this.semanticTypes[typeName] = fun;
      } else if (old) {
        delete this.semanticTypes[typeName];
      }
      return old
    }

    /**
     * Push any supported type onto the encoded stream.
     *
     * @param {any} obj The thing to encode.
     * @returns {boolean} True on success.
     * @throws {TypeError} Unknown type for obj.
     */
    pushAny(obj) {
      switch (typeof obj) {
        case 'number':
          return this._pushNumber(obj)
        case 'bigint':
          return this._pushJSBigint(obj)
        case 'string':
          return this._pushString(obj)
        case 'boolean':
          return this._pushBoolean(obj)
        case 'undefined':
          return this._pushUndefined(obj)
        case 'object':
          return this._pushObject(obj)
        case 'symbol':
          switch (obj) {
            case SYMS.NULL:
              return this._pushNull(null)
            case SYMS.UNDEFINED:
              return this._pushUndefined(undefined)
            // TODO: Add pluggable support for other symbols
            default:
              throw new TypeError(`Unknown symbol: ${obj.toString()}`)
          }
        default:
          throw new TypeError(
            `Unknown type: ${typeof obj}, ${(typeof obj.toString === 'function') ? obj.toString() : ''}`
          )
      }
    }

    /**
     * Encode an array and all of its elements.
     *
     * @param {Encoder} gen Encoder to use.
     * @param {any[]} obj Array to encode.
     * @param {object} [opts] Options.
     * @param {boolean} [opts.indefinite=false] Use indefinite encoding?
     * @returns {boolean} True on success.
     */
    static pushArray(gen, obj, opts) {
      opts = {
        indefinite: false,
        ...opts,
      };
      const len = obj.length;
      if (opts.indefinite) {
        if (!gen._pushUInt8((MT$1.ARRAY << 5) | NUMBYTES.INDEFINITE)) {
          return false
        }
      } else if (!gen._pushInt(len, MT$1.ARRAY)) {
        return false
      }
      for (let j = 0; j < len; j++) {
        if (!gen.pushAny(obj[j])) {
          return false
        }
      }
      if (opts.indefinite) {
        if (!gen.push(BREAK)) {
          return false
        }
      }
      return true
    }

    /**
     * Remove the loop detector WeakSet for this Encoder.
     *
     * @returns {boolean} True when the Encoder was reset, else false.
     */
    removeLoopDetectors() {
      if (!this.detectLoops) {
        return false
      }
      this.detectLoops = new WeakSet();
      return true
    }

    /**
     * @param {Encoder} gen Encoder.
     * @param {Date} obj Date to encode.
     * @returns {boolean} True on success.
     * @ignore
     */
    static _pushDate(gen, obj) {
      switch (gen.dateType) {
        case 'string':
          return gen._pushTag(TAG.DATE_STRING) &&
            gen._pushString(obj.toISOString())
        case 'int':
          return gen._pushTag(TAG.DATE_EPOCH) &&
            gen._pushIntNum(Math.round(obj.getTime() / 1000))
        case 'float':
          // Force float
          return gen._pushTag(TAG.DATE_EPOCH) &&
            gen._pushFloat(obj.getTime() / 1000)
        case 'number':
        default:
          // If we happen to have an integral number of seconds,
          // use integer.  Otherwise, use float.
          return gen._pushTag(TAG.DATE_EPOCH) &&
            gen.pushAny(obj.getTime() / 1000)
      }
    }

    /**
     * @param {Encoder} gen Encoder.
     * @param {Buffer} obj Buffer to encode.
     * @returns {boolean} True on success.
     * @ignore
     */
    static _pushBuffer(gen, obj) {
      return gen._pushInt(obj.length, MT$1.BYTE_STRING) && gen.push(obj)
    }

    /**
     * @param {Encoder} gen Encoder.
     * @param {NoFilter} obj Buffer to encode.
     * @returns {boolean} True on success.
     * @ignore
     */
    static _pushNoFilter(gen, obj) {
      return Encoder._pushBuffer(gen, /** @type {Buffer} */ (obj.slice()))
    }

    /**
     * @param {Encoder} gen Encoder.
     * @param {RegExp} obj RegExp to encode.
     * @returns {boolean} True on success.
     * @ignore
     */
    static _pushRegexp(gen, obj) {
      return gen._pushTag(TAG.REGEXP) && gen.pushAny(obj.source)
    }

    /**
     * @param {Encoder} gen Encoder.
     * @param {Set} obj Set to encode.
     * @returns {boolean} True on success.
     * @ignore
     */
    static _pushSet(gen, obj) {
      if (!gen._pushTag(TAG.SET)) {
        return false
      }
      if (!gen._pushInt(obj.size, MT$1.ARRAY)) {
        return false
      }
      for (const x of obj) {
        if (!gen.pushAny(x)) {
          return false
        }
      }
      return true
    }

    /**
     * @param {Encoder} gen Encoder.
     * @param {URL} obj URL to encode.
     * @returns {boolean} True on success.
     * @ignore
     */
    static _pushURL(gen, obj) {
      return gen._pushTag(TAG.URI) && gen.pushAny(obj.toString())
    }

    /**
     * @param {Encoder} gen Encoder.
     * @param {object} obj Boxed String, Number, or Boolean object to encode.
     * @returns {boolean} True on success.
     * @ignore
     */
    static _pushBoxed(gen, obj) {
      return gen.pushAny(obj.valueOf())
    }

    /**
     * @param {Encoder} gen Encoder.
     * @param {Map} obj Map to encode.
     * @returns {boolean} True on success.
     * @throws {Error} Map key that is undefined.
     * @ignore
     */
    static _pushMap(gen, obj, opts) {
      opts = {
        indefinite: false,
        ...opts,
      };
      let entries = [...obj.entries()];
      if (gen.omitUndefinedProperties) {
        entries = entries.filter(([k, v]) => v !== undefined);
      }
      if (opts.indefinite) {
        if (!gen._pushUInt8((MT$1.MAP << 5) | NUMBYTES.INDEFINITE)) {
          return false
        }
      } else if (!gen._pushInt(entries.length, MT$1.MAP)) {
        return false
      }
      // Memoizing the cbor only helps in certain cases, and hurts in most
      // others.  Just avoid it.
      if (gen.canonical) {
        // Keep the key/value pairs together, so we don't have to do odd
        // gets with object keys later
        const enc = new Encoder({
          genTypes: gen.semanticTypes,
          canonical: gen.canonical,
          detectLoops: Boolean(gen.detectLoops), // Give enc its own loop detector
          dateType: gen.dateType,
          disallowUndefinedKeys: gen.disallowUndefinedKeys,
          collapseBigIntegers: gen.collapseBigIntegers,
        });
        const bs = new NoFilter({highWaterMark: gen.readableHighWaterMark});
        enc.pipe(bs);
        entries.sort(([a], [b]) => {
          // Both a and b are the keys
          enc.pushAny(a);
          const a_cbor = bs.read();
          enc.pushAny(b);
          const b_cbor = bs.read();
          return a_cbor.compare(b_cbor)
        });
        for (const [k, v] of entries) {
          if (gen.disallowUndefinedKeys && (typeof k === 'undefined')) {
            throw new Error('Invalid Map key: undefined')
          }
          if (!(gen.pushAny(k) && gen.pushAny(v))) {
            return false
          }
        }
      } else {
        for (const [k, v] of entries) {
          if (gen.disallowUndefinedKeys && (typeof k === 'undefined')) {
            throw new Error('Invalid Map key: undefined')
          }
          if (!(gen.pushAny(k) && gen.pushAny(v))) {
            return false
          }
        }
      }
      if (opts.indefinite) {
        if (!gen.push(BREAK)) {
          return false
        }
      }
      return true
    }

    /**
     * @param {Encoder} gen Encoder.
     * @param {NodeJS.TypedArray} obj Array to encode.
     * @returns {boolean} True on success.
     * @ignore
     */
    static _pushTypedArray(gen, obj) {
      // See https://tools.ietf.org/html/rfc8746

      let typ = 0b01000000;
      let sz = obj.BYTES_PER_ELEMENT;
      const {name} = obj.constructor;

      if (name.startsWith('Float')) {
        typ |= 0b00010000;
        sz /= 2;
      } else if (!name.includes('U')) {
        typ |= 0b00001000;
      }
      if (name.includes('Clamped') || ((sz !== 1) && !utils$1.isBigEndian())) {
        typ |= 0b00000100;
      }
      typ |= {
        1: 0b00,
        2: 0b01,
        4: 0b10,
        8: 0b11,
      }[sz];
      if (!gen._pushTag(typ)) {
        return false
      }
      return Encoder._pushBuffer(
        gen,
        Buffer$2.from(obj.buffer, obj.byteOffset, obj.byteLength)
      )
    }

    /**
     * @param {Encoder} gen Encoder.
     * @param { ArrayBuffer } obj Array to encode.
     * @returns {boolean} True on success.
     * @ignore
     */
    static _pushArrayBuffer(gen, obj) {
      return Encoder._pushBuffer(gen, Buffer$2.from(obj))
    }

    /**
     * Encode the given object with indefinite length.  There are apparently
     * some (IMO) broken implementations of poorly-specified protocols that
     * REQUIRE indefinite-encoding.  See the example for how to add this as an
     * `encodeCBOR` function to an object or class to get indefinite encoding.
     *
     * @param {Encoder} gen The encoder to use.
     * @param {string|Buffer|Array|Map|object} [obj] The object to encode.  If
     *   null, use "this" instead.
     * @param {EncodingOptions} [options={}] Options for encoding.
     * @returns {boolean} True on success.
     * @throws {Error} No object to encode or invalid indefinite encoding.
     * @example <caption>Force indefinite encoding:</caption>
     * const o = {
     *   a: true,
     *   encodeCBOR: cbor.Encoder.encodeIndefinite,
     * }
     * const m = []
     * m.encodeCBOR = cbor.Encoder.encodeIndefinite
     * cbor.encodeOne([o, m])
     */
    static encodeIndefinite(gen, obj, options = {}) {
      if (obj == null) {
        if (this == null) {
          throw new Error('No object to encode')
        }
        obj = this;
      }

      // TODO: consider other options
      const {chunkSize = 4096} = options;

      let ret = true;
      const objType = typeof obj;
      let buf = null;
      if (objType === 'string') {
        // TODO: make sure not to split surrogate pairs at the edges of chunks,
        // since such half-surrogates cannot be legally encoded as UTF-8.
        ret = ret && gen._pushUInt8((MT$1.UTF8_STRING << 5) | NUMBYTES.INDEFINITE);
        let offset = 0;
        while (offset < obj.length) {
          const endIndex = offset + chunkSize;
          ret = ret && gen._pushString(obj.slice(offset, endIndex));
          offset = endIndex;
        }
        ret = ret && gen.push(BREAK);
      } else if ((buf = utils$1.bufferishToBuffer(obj))) {
        ret = ret && gen._pushUInt8((MT$1.BYTE_STRING << 5) | NUMBYTES.INDEFINITE);
        let offset = 0;
        while (offset < buf.length) {
          const endIndex = offset + chunkSize;
          ret = ret && Encoder._pushBuffer(gen, buf.slice(offset, endIndex));
          offset = endIndex;
        }
        ret = ret && gen.push(BREAK);
      } else if (Array.isArray(obj)) {
        ret = ret && Encoder.pushArray(gen, obj, {
          indefinite: true,
        });
      } else if (obj instanceof Map) {
        ret = ret && Encoder._pushMap(gen, obj, {
          indefinite: true,
        });
      } else {
        if (objType !== 'object') {
          throw new Error('Invalid indefinite encoding')
        }
        ret = ret && gen._pushObject(obj, {
          indefinite: true,
          skipTypes: true,
        });
      }
      return ret
    }

    /**
     * Encode one or more JavaScript objects, and return a Buffer containing the
     * CBOR bytes.
     *
     * @param {...any} objs The objects to encode.
     * @returns {Buffer} The encoded objects.
     */
    static encode(...objs) {
      return new Encoder()._encodeAll(objs)
    }

    /**
     * Encode one or more JavaScript objects canonically (slower!), and return
     * a Buffer containing the CBOR bytes.
     *
     * @param {...any} objs The objects to encode.
     * @returns {Buffer} The encoded objects.
     */
    static encodeCanonical(...objs) {
      return new Encoder({
        canonical: true,
      })._encodeAll(objs)
    }

    /**
     * Encode one JavaScript object using the given options.
     *
     * @param {any} obj The object to encode.
     * @param {EncodingOptions} [options={}] Passed to the Encoder constructor.
     * @returns {Buffer} The encoded objects.
     * @static
     */
    static encodeOne(obj, options) {
      return new Encoder(options)._encodeAll([obj])
    }

    /**
     * Encode one JavaScript object using the given options in a way that
     * is more resilient to objects being larger than the highWaterMark
     * number of bytes.  As with the other static encode functions, this
     * will still use a large amount of memory.  Use a stream-based approach
     * directly if you need to process large and complicated inputs.
     *
     * @param {any} obj The object to encode.
     * @param {EncodingOptions} [options={}] Passed to the Encoder constructor.
     * @returns {Promise<Buffer>} A promise for the encoded buffer.
     */
    static encodeAsync(obj, options) {
      return new Promise((resolve, reject) => {
        const bufs = [];
        const enc = new Encoder(options);
        enc.on('data', buf => bufs.push(buf));
        enc.on('error', reject);
        enc.on('finish', () => resolve(Buffer$2.concat(bufs)));
        enc.pushAny(obj);
        enc.end();
      })
    }

    /**
     * The currently supported set of semantic types.  May be modified by plugins.
     *
     * @type {SemanticMap}
     */
    static get SEMANTIC_TYPES() {
      return current_SEMANTIC_TYPES
    }

    static set SEMANTIC_TYPES(val) {
      current_SEMANTIC_TYPES = val;
    }

    /**
     * Reset the supported semantic types to the original set, before any
     * plugins modified the list.
     */
    static reset() {
      Encoder.SEMANTIC_TYPES = {...SEMANTIC_TYPES};
    }
  };

  Object.assign(SEMANTIC_TYPES, {
    Array: Encoder$2.pushArray,
    Date: Encoder$2._pushDate,
    Buffer: Encoder$2._pushBuffer,
    [Buffer$2.name]: Encoder$2._pushBuffer, // Might be mangled
    Map: Encoder$2._pushMap,
    NoFilter: Encoder$2._pushNoFilter,
    [NoFilter.name]: Encoder$2._pushNoFilter, // Mßight be mangled
    RegExp: Encoder$2._pushRegexp,
    Set: Encoder$2._pushSet,
    ArrayBuffer: Encoder$2._pushArrayBuffer,
    Uint8ClampedArray: Encoder$2._pushTypedArray,
    Uint8Array: Encoder$2._pushTypedArray,
    Uint16Array: Encoder$2._pushTypedArray,
    Uint32Array: Encoder$2._pushTypedArray,
    Int8Array: Encoder$2._pushTypedArray,
    Int16Array: Encoder$2._pushTypedArray,
    Int32Array: Encoder$2._pushTypedArray,
    Float32Array: Encoder$2._pushTypedArray,
    Float64Array: Encoder$2._pushTypedArray,
    URL: Encoder$2._pushURL,
    Boolean: Encoder$2._pushBoxed,
    Number: Encoder$2._pushBoxed,
    String: Encoder$2._pushBoxed,
  });

  // Safari needs to get better.
  if (typeof BigUint64Array !== 'undefined') {
    SEMANTIC_TYPES[BigUint64Array.name] = Encoder$2._pushTypedArray;
  }
  if (typeof BigInt64Array !== 'undefined') {
    SEMANTIC_TYPES[BigInt64Array.name] = Encoder$2._pushTypedArray;
  }

  Encoder$2.reset();
  var encoder$1 = Encoder$2;

  const {Buffer: Buffer$1} = require$$2;
  const encoder = encoder$1;
  const decoder = decoder$1;
  const {MT} = constants$3;

  /**
   * Wrapper around a JavaScript Map object that allows the keys to be
   * any complex type.  The base Map object allows this, but will only
   * compare the keys by identity, not by value.  CborMap translates keys
   * to CBOR first (and base64's them to ensure by-value comparison).
   *
   * This is not a subclass of Object, because it would be tough to get
   * the semantics to be an exact match.
   *
   * @extends Map
   */
  class CborMap extends Map {
    /**
     * Creates an instance of CborMap.
     *
     * @param {Iterable<any>} [iterable] An Array or other iterable
     *   object whose elements are key-value pairs (arrays with two elements, e.g.
     *   <code>[[ 1, 'one' ],[ 2, 'two' ]]</code>). Each key-value pair is added
     *   to the new CborMap; null values are treated as undefined.
     */
    constructor(iterable) {
      super(iterable);
    }

    /**
     * @ignore
     */
    static _encode(key) {
      return encoder.encodeCanonical(key).toString('base64')
    }

    /**
     * @ignore
     */
    static _decode(key) {
      return decoder.decodeFirstSync(key, 'base64')
    }

    /**
     * Retrieve a specified element.
     *
     * @param {any} key The key identifying the element to retrieve.
     *   Can be any type, which will be serialized into CBOR and compared by
     *   value.
     * @returns {any} The element if it exists, or <code>undefined</code>.
     */
    get(key) {
      return super.get(CborMap._encode(key))
    }

    /**
     * Adds or updates an element with a specified key and value.
     *
     * @param {any} key The key identifying the element to store.
     *   Can be any type, which will be serialized into CBOR and compared by
     *   value.
     * @param {any} val The element to store.
     * @returns {this} This object.
     */
    set(key, val) {
      return super.set(CborMap._encode(key), val)
    }

    /**
     * Removes the specified element.
     *
     * @param {any} key The key identifying the element to delete. Can be any
     *   type, which will be serialized into CBOR and compared by value.
     * @returns {boolean} True if an element in the Map object existed and has
     *   been removed, or false if the element does not exist.
     */
    delete(key) {
      return super.delete(CborMap._encode(key))
    }

    /**
     * Does an element with the specified key exist?
     *
     * @param {any} key The key identifying the element to check.
     *   Can be any type, which will be serialized into CBOR and compared by
     *   value.
     * @returns {boolean} True if an element with the specified key exists in
     *   the Map object; otherwise false.
     */
    has(key) {
      return super.has(CborMap._encode(key))
    }

    /**
     * Returns a new Iterator object that contains the keys for each element
     * in the Map object in insertion order.  The keys are decoded into their
     * original format.
     *
     * @yields {any} The keys of the map.
     */
    *keys() {
      for (const k of super.keys()) {
        yield CborMap._decode(k);
      }
    }

    /**
     * Returns a new Iterator object that contains the [key, value] pairs for
     * each element in the Map object in insertion order.
     *
     * @returns {IterableIterator<any>} Key value pairs.
     * @yields {any[]} Key value pairs.
     */
    *entries() {
      for (const kv of super.entries()) {
        yield [CborMap._decode(kv[0]), kv[1]];
      }
    }

    /**
     * Returns a new Iterator object that contains the [key, value] pairs for
     * each element in the Map object in insertion order.
     *
     * @returns {IterableIterator} Key value pairs.
     */
    [Symbol.iterator]() {
      return this.entries()
    }

    /**
     * Executes a provided function once per each key/value pair in the Map
     * object, in insertion order.
     *
     * @param {function(any, any, Map): undefined} fun Function to execute for
     *   each element, which takes a value, a key, and the Map being traversed.
     * @param {any} thisArg Value to use as this when executing callback.
     * @throws {TypeError} Invalid function.
     */
    forEach(fun, thisArg) {
      if (typeof fun !== 'function') {
        throw new TypeError('Must be function')
      }
      for (const kv of super.entries()) {
        fun.call(this, kv[1], CborMap._decode(kv[0]), this);
      }
    }

    /**
     * Push the simple value onto the CBOR stream.
     *
     * @param {object} gen The generator to push onto.
     * @returns {boolean} True on success.
     */
    encodeCBOR(gen) {
      if (!gen._pushInt(this.size, MT.MAP)) {
        return false
      }
      if (gen.canonical) {
        const entries = Array.from(super.entries())
          .map(kv => [Buffer$1.from(kv[0], 'base64'), kv[1]]);
        entries.sort((a, b) => a[0].compare(b[0]));
        for (const kv of entries) {
          if (!(gen.push(kv[0]) && gen.pushAny(kv[1]))) {
            return false
          }
        }
      } else {
        for (const kv of super.entries()) {
          if (!(gen.push(Buffer$1.from(kv[0], 'base64')) && gen.pushAny(kv[1]))) {
            return false
          }
        }
      }
      return true
    }
  }

  var map = CborMap;

  /**
   * Record objects that pass by in a stream.  If the same object is used more
   * than once, it can be value-shared using shared values.
   *
   * @see {@link http://cbor.schmorp.de/value-sharing}
   */
  let ObjectRecorder$1 = class ObjectRecorder {
    constructor() {
      this.clear();
    }

    /**
     * Clear all of the objects that have been seen.  Revert to recording mode.
     */
    clear() {
      this.map = new WeakMap();
      this.count = 0;
      this.recording = true;
    }

    /**
     * Stop recording.
     */
    stop() {
      this.recording = false;
    }

    /**
     * Determine if wrapping a tag 28 or 29 around an object that has been
     * reused is appropriate.  This method stores state for which objects have
     * been seen.
     *
     * @param {object} obj Any object about to be serialized.
     * @returns {number} If recording: -1 for first use, index for second use.
     *   If not recording, -1 for never-duplicated, -2 for first use, index for
     *   subsequent uses.
     * @throws {Error} Recording does not match playback.
     */
    check(obj) {
      const val = this.map.get(obj);
      if (val) {
        if (val.length > 1) {
          if (val[0] || this.recording) {
            return val[1]
          }

          val[0] = true;
          return ObjectRecorder.FIRST
        }
        if (!this.recording) {
          return ObjectRecorder.NEVER
        }
        val.push(this.count++);
        // Second use while recording
        return val[1]
      }
      if (!this.recording) {
        throw new Error('New object detected when not recording')
      }
      this.map.set(obj, [false]);
      // First use while recording
      return ObjectRecorder.NEVER
    }
  };

  ObjectRecorder$1.NEVER = -1;
  ObjectRecorder$1.FIRST = -2;

  var objectRecorder = ObjectRecorder$1;

  const Encoder$1 = encoder$1;
  const ObjectRecorder = objectRecorder;
  const {Buffer} = require$$2;

  /**
   * Implement value sharing.
   *
   * @see {@link cbor.schmorp.de/value-sharing}
   */
  let SharedValueEncoder$1 = class SharedValueEncoder extends Encoder$1 {
    constructor(opts) {
      super(opts);
      this.valueSharing = new ObjectRecorder();
    }

    /**
     * @param {object} obj Object to encode.
     * @param {import('./encoder').ObjectOptions} [opts] Options for encoding
     *   this object.
     * @returns {boolean} True on success.
     * @throws {Error} Loop detected.
     * @ignore
     */
    _pushObject(obj, opts) {
      if (obj !== null) {
        const shared = this.valueSharing.check(obj);
        switch (shared) {
          case ObjectRecorder.FIRST:
            // Prefix with tag 28
            this._pushTag(28);
            break
          case ObjectRecorder.NEVER:
            // Do nothing
            break
          default:
            return this._pushTag(29) && this._pushIntNum(shared)
        }
      }
      return super._pushObject(obj, opts)
    }

    /**
     * Between encoding runs, stop recording, and start outputing correct tags.
     */
    stopRecording() {
      this.valueSharing.stop();
    }

    /**
     * Remove the existing recording and start over.  Do this between encoding
     * pairs.
     */
    clearRecording() {
      this.valueSharing.clear();
    }

    /**
     * Encode one or more JavaScript objects, and return a Buffer containing the
     * CBOR bytes.
     *
     * @param {...any} objs The objects to encode.
     * @returns {Buffer} The encoded objects.
     */
    static encode(...objs) {
      const enc = new SharedValueEncoder();
      // eslint-disable-next-line no-empty-function
      enc.on('data', () => {}); // Sink all writes

      for (const o of objs) {
        enc.pushAny(o);
      }
      enc.stopRecording();
      enc.removeAllListeners('data');
      return enc._encodeAll(objs)
    }

    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Encode one or more JavaScript objects canonically (slower!), and return
     * a Buffer containing the CBOR bytes.
     *
     * @param {...any} objs The objects to encode.
     * @returns {Buffer} Never.
     * @throws {Error} Always.  This combination doesn't work at the moment.
     */
    static encodeCanonical(...objs) {
      throw new Error('Cannot encode canonically in a SharedValueEncoder, which serializes objects multiple times.')
    }

    /**
     * Encode one JavaScript object using the given options.
     *
     * @param {any} obj The object to encode.
     * @param {import('./encoder').EncodingOptions} [options={}]
     *   Passed to the Encoder constructor.
     * @returns {Buffer} The encoded objects.
     * @static
     */
    static encodeOne(obj, options) {
      const enc = new SharedValueEncoder(options);
      // eslint-disable-next-line no-empty-function
      enc.on('data', () => {}); // Sink all writes
      enc.pushAny(obj);
      enc.stopRecording();
      enc.removeAllListeners('data');
      return enc._encodeAll([obj])
    }

    /**
     * Encode one JavaScript object using the given options in a way that
     * is more resilient to objects being larger than the highWaterMark
     * number of bytes.  As with the other static encode functions, this
     * will still use a large amount of memory.  Use a stream-based approach
     * directly if you need to process large and complicated inputs.
     *
     * @param {any} obj The object to encode.
     * @param {import('./encoder').EncodingOptions} [options={}]
     *   Passed to the Encoder constructor.
     * @returns {Promise<Buffer>} A promise for the encoded buffer.
     */
    static encodeAsync(obj, options) {
      return new Promise((resolve, reject) => {
        /** @type {Buffer[]} */
        const bufs = [];
        const enc = new SharedValueEncoder(options);
        // eslint-disable-next-line no-empty-function
        enc.on('data', () => {});
        enc.on('error', reject);
        enc.on('finish', () => resolve(Buffer.concat(bufs)));
        enc.pushAny(obj);
        enc.stopRecording();
        enc.removeAllListeners('data');
        enc.on('data', buf => bufs.push(buf));
        enc.pushAny(obj);
        enc.end();
      })
    }
  };

  var sharedValueEncoder = SharedValueEncoder$1;

  const Commented = commented;
  const Diagnose = diagnose;
  const Decoder = decoder$1;
  const Encoder = encoder$1;
  const Simple = simple;
  const Tagged = tagged;
  const Map$1 = map;
  const SharedValueEncoder = sharedValueEncoder;

  var cbor = {
    Commented,
    Diagnose,
    Decoder,
    Encoder,
    Simple,
    Tagged,
    Map: Map$1,
    SharedValueEncoder,

    /**
     * Convenience name for {@linkcode Commented.comment}.
     */
    comment: Commented.comment,

    /**
     * Convenience name for {@linkcode Decoder.decodeAll}.
     */
    decodeAll: Decoder.decodeAll,

    /**
     * Convenience name for {@linkcode Decoder.decodeFirst}.
     */
    decodeFirst: Decoder.decodeFirst,

    /**
     * Convenience name for {@linkcode Decoder.decodeAllSync}.
     */
    decodeAllSync: Decoder.decodeAllSync,

    /**
     * Convenience name for {@linkcode Decoder.decodeFirstSync}.
     */
    decodeFirstSync: Decoder.decodeFirstSync,

    /**
     * Convenience name for {@linkcode Diagnose.diagnose}.
     */
    diagnose: Diagnose.diagnose,

    /**
     * Convenience name for {@linkcode Encoder.encode}.
     */
    encode: Encoder.encode,

    /**
     * Convenience name for {@linkcode Encoder.encodeCanonical}.
     */
    encodeCanonical: Encoder.encodeCanonical,

    /**
     * Convenience name for {@linkcode Encoder.encodeOne}.
     */
    encodeOne: Encoder.encodeOne,

    /**
     * Convenience name for {@linkcode Encoder.encodeAsync}.
     */
    encodeAsync: Encoder.encodeAsync,

    /**
     * Convenience name for {@linkcode Decoder.decodeFirstSync}.
     */
    decode: Decoder.decodeFirstSync,

    /**
     * The codec information for
     * {@link https://github.com/Level/encoding-down encoding-down}, which is a
     * codec framework for leveldb.  CBOR is a particularly convenient format for
     * both keys and values, as it can deal with a lot of types that JSON can't
     * handle without losing type information.
     *
     * @example
     * const level = require('level')
     * const cbor = require('cbor')
     *
     * async function putget() {
     *   const db = level('./db', {
     *     keyEncoding: cbor.leveldb,
     *     valueEncoding: cbor.leveldb,
     *   })
     *
     *   await db.put({a: 1}, 9857298342094820394820394820398234092834n)
     *   const val = await db.get({a: 1})
     * }
     */
    leveldb: {
      decode: Decoder.decodeFirstSync,
      encode: Encoder.encode,
      buffer: true,
      name: 'cbor',
    },

    /**
     * Reset everything that we can predict a plugin might have altered in good
     * faith.  For now that includes the default set of tags that decoding and
     * encoding will use.
     */
    reset() {
      Encoder.reset();
      Tagged.reset();
    },
  };

  var cbor$1 = /*@__PURE__*/getDefaultExportFromCjs(cbor);

  /**
   * AAGUID is a 128-bit identifier indicating the type (e.g. make and model) of the authenticator.
   */
  const AAGUID = Buffer$6.from('00000000000000000000000000000000', 'hex');

  /**
   * Deserialize a serialized public key credential attestation into a PublicKeyCredential.
   */
  function deserializePublicKeyCredentialAttestion(credential) {
      const credentialId = Buffer$6.from(credential.id, 'base64');
      const clientDataJSON = Buffer$6.from(credential.response.clientDataJSON, 'base64');
      const attestationObject = Buffer$6.from(credential.response.attestationObject, 'base64');
      const attestation = cbor$1.decodeAllSync(attestationObject)[0];
      if (!attestation) {
          throw new Error('Invalid attestation object');
      }
      const { attStmt, authData } = attestation;
      // so weird, but decoder is not decoding to Map so we have to do it manually
      const coseKeyElems = cbor$1.decodeAllSync(authData.subarray(37 + AAGUID.byteLength + 2 + credentialId.byteLength));
      const publicCoseKey = new Map();
      for (let i = 0; i < coseKeyElems.length; i += 2) {
          publicCoseKey.set(coseKeyElems[i], coseKeyElems[i + 1]);
      }
      console.log('publicCoseKey', publicCoseKey);
      const response = {
          attestationObject,
          clientDataJSON,
          getAuthenticatorData() {
              return authData;
          },
          // returns an array buffer containing the DER SubjectPublicKeyInfo of the new credential
          getPublicKey() {
              const key = [
                  // ASN.1 SubjectPublicKeyInfo structure for EC public keys
                  Buffer$6.from('3059301306072a8648ce3d020106082a8648ce3d03010703420004', 'hex'),
                  publicCoseKey.get(-2),
                  publicCoseKey.get(-3),
              ];
              console.log('key', key);
              return Buffer$6.concat(key);
          },
          getPublicKeyAlgorithm() {
              return attStmt.alg;
          },
          getTransports() {
              return ['internal'];
          },
      };
      return {
          id: credentialId.toString('base64'),
          rawId: credentialId,
          authenticatorAttachment: 'platform',
          attestationObject,
          clientDataJSON,
          getClientExtensionResults() {
              return {};
          },
          response,
          type: 'public-key',
      };
  }
  /**
   * Deserialize a serialized public key credential assertion into a PublicKeyCredential.
   */
  function deserializePublicKeyCredentialAssertion(credential) {
      const credentialId = Buffer$6.from(credential.id, 'base64');
      const clientDataJSON = Buffer$6.from(credential.response.clientDataJSON, 'base64');
      const authenticatorData = Buffer$6.from(credential.response.authenticatorData, 'base64');
      const signature = Buffer$6.from(credential.response.signature, 'base64');
      const userHandle = credential.response.userHandle
          ? Buffer$6.from(credential.response.userHandle, 'base64')
          : null;
      const response = {
          authenticatorData,
          clientDataJSON,
          signature,
          userHandle,
      };
      return {
          id: credentialId.toString('base64'),
          rawId: credentialId,
          authenticatorAttachment: 'platform',
          clientDataJSON,
          getClientExtensionResults() {
              return {};
          },
          response,
          type: 'public-key',
      };
  }

  var utils = /*#__PURE__*/Object.freeze({
    __proto__: null,
    deserializePublicKeyCredentialAssertion: deserializePublicKeyCredentialAssertion,
    deserializePublicKeyCredentialAttestion: deserializePublicKeyCredentialAttestion
  });

  /**
   * Install the WebAuthn authenticator mock in the browser. This is a helper function to be used in Playwright tests.
   */
  function installWebAuthnMock({ exposedCreateCredFuncName, exposedGetCredFuncName, } = {}) {
      if (!exposedCreateCredFuncName) {
          throw new Error('Missing exposedCreateCredFuncName. Did you forget to expose it?');
      }
      if (!exposedGetCredFuncName) {
          throw new Error('Missing exposedGetCredFuncName. Did you forget to expose it?');
      }
      console.log('webauthn mock init script');
      // Mock the WebAuthn API
      navigator.credentials.create = async (credOpt) => {
          console.log('webauthn mock create credential', credOpt);
          if (!credOpt.publicKey)
              throw new Error('Missing publicKey in credentialOptions');
          if (!credOpt.publicKey.challenge)
              throw new Error('Missing challenge in publicKey');
          if (!credOpt.publicKey.rp || !credOpt.publicKey.rp.id) {
              credOpt.publicKey.rp = {
                  ...credOpt.publicKey.rp,
                  id: window.location.hostname,
              };
          }
          if (!credOpt.publicKey.user)
              throw new Error('Missing user in publicKey');
          const credOptSer = {
              publicKey: {
                  ...credOpt.publicKey,
                  challenge: Buffer$6.from(credOpt.publicKey.challenge).toString('base64'),
                  user: {
                      ...credOpt.publicKey.user,
                      id: Buffer$6.from(credOpt.publicKey.user.id).toString('base64'),
                  },
                  excludeCredentials: credOpt.publicKey.excludeCredentials?.map((c) => {
                      return {
                          ...c,
                          id: Buffer$6.from(c.id).toString('base64'),
                      };
                  }),
              },
          };
          console.log('webauthn mock create credentialSerialized', credOptSer);
          // biome-ignore lint/suspicious/noExplicitAny: explicit any is needed here
          const createCredFunc = window[exposedCreateCredFuncName];
          if (!createCredFunc || typeof createCredFunc !== 'function') {
              throw new Error(`Missing ${exposedCreateCredFuncName} function. Did you forget to expose it?`);
          }
          const credSer = await createCredFunc(credOptSer);
          console.log('webauthn mock create credSer', credSer);
          const cred = deserializePublicKeyCredentialAttestion(credSer);
          return cred;
      };
      navigator.credentials.get = async (credential) => {
          console.log('[webauthn mock] get credential', credential);
          if (!credential.publicKey)
              throw new Error('Missing publicKey in credentialOptions');
          if (!credential.publicKey.challenge)
              throw new Error('Missing challenge in publicKey');
          if (!credential.publicKey.rpId)
              throw new Error('Missing rpId in publicKey');
          const credOpts = {
              publicKey: {
                  ...credential.publicKey,
                  challenge: Buffer$6.from(credential.publicKey.challenge).toString('base64'),
                  allowCredentials: credential.publicKey.allowCredentials?.map((c) => {
                      return {
                          ...c,
                          id: Buffer$6.from(c.id).toString('base64'),
                      };
                  }),
              },
          };
          // biome-ignore lint/suspicious/noExplicitAny: explicit any is needed here
          const getCredFunc = window[exposedGetCredFuncName];
          if (!getCredFunc || typeof getCredFunc !== 'function') {
              throw new Error(`Missing ${exposedGetCredFuncName} function. Did you forget to expose it?`);
          }
          const assertionSer = await getCredFunc(credOpts);
          console.debug('[webauthn mock] assertion', assertionSer);
          const assertion = deserializePublicKeyCredentialAssertion(assertionSer);
          return assertion;
      };
  }

  exports.installWebAuthnMock = installWebAuthnMock;
  exports.utils = utils;

}));
