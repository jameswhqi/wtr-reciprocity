(function(scope){
'use strict';

function F(arity, fun, wrapper) {
  wrapper.a = arity;
  wrapper.f = fun;
  return wrapper;
}

function F2(fun) {
  return F(2, fun, function(a) { return function(b) { return fun(a,b); }; })
}
function F3(fun) {
  return F(3, fun, function(a) {
    return function(b) { return function(c) { return fun(a, b, c); }; };
  });
}
function F4(fun) {
  return F(4, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return fun(a, b, c, d); }; }; };
  });
}
function F5(fun) {
  return F(5, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return fun(a, b, c, d, e); }; }; }; };
  });
}
function F6(fun) {
  return F(6, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return function(f) {
    return fun(a, b, c, d, e, f); }; }; }; }; };
  });
}
function F7(fun) {
  return F(7, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return function(f) {
    return function(g) { return fun(a, b, c, d, e, f, g); }; }; }; }; }; };
  });
}
function F8(fun) {
  return F(8, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return function(f) {
    return function(g) { return function(h) {
    return fun(a, b, c, d, e, f, g, h); }; }; }; }; }; }; };
  });
}
function F9(fun) {
  return F(9, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return function(f) {
    return function(g) { return function(h) { return function(i) {
    return fun(a, b, c, d, e, f, g, h, i); }; }; }; }; }; }; }; };
  });
}

function A2(fun, a, b) {
  return fun.a === 2 ? fun.f(a, b) : fun(a)(b);
}
function A3(fun, a, b, c) {
  return fun.a === 3 ? fun.f(a, b, c) : fun(a)(b)(c);
}
function A4(fun, a, b, c, d) {
  return fun.a === 4 ? fun.f(a, b, c, d) : fun(a)(b)(c)(d);
}
function A5(fun, a, b, c, d, e) {
  return fun.a === 5 ? fun.f(a, b, c, d, e) : fun(a)(b)(c)(d)(e);
}
function A6(fun, a, b, c, d, e, f) {
  return fun.a === 6 ? fun.f(a, b, c, d, e, f) : fun(a)(b)(c)(d)(e)(f);
}
function A7(fun, a, b, c, d, e, f, g) {
  return fun.a === 7 ? fun.f(a, b, c, d, e, f, g) : fun(a)(b)(c)(d)(e)(f)(g);
}
function A8(fun, a, b, c, d, e, f, g, h) {
  return fun.a === 8 ? fun.f(a, b, c, d, e, f, g, h) : fun(a)(b)(c)(d)(e)(f)(g)(h);
}
function A9(fun, a, b, c, d, e, f, g, h, i) {
  return fun.a === 9 ? fun.f(a, b, c, d, e, f, g, h, i) : fun(a)(b)(c)(d)(e)(f)(g)(h)(i);
}

console.warn('Compiled in DEV mode. Follow the advice at https://elm-lang.org/0.19.1/optimize for better performance and smaller assets.');


// EQUALITY

function _Utils_eq(x, y)
{
	for (
		var pair, stack = [], isEqual = _Utils_eqHelp(x, y, 0, stack);
		isEqual && (pair = stack.pop());
		isEqual = _Utils_eqHelp(pair.a, pair.b, 0, stack)
		)
	{}

	return isEqual;
}

function _Utils_eqHelp(x, y, depth, stack)
{
	if (x === y)
	{
		return true;
	}

	if (typeof x !== 'object' || x === null || y === null)
	{
		typeof x === 'function' && _Debug_crash(5);
		return false;
	}

	if (depth > 100)
	{
		stack.push(_Utils_Tuple2(x,y));
		return true;
	}

	/**/
	if (x.$ === 'Set_elm_builtin')
	{
		x = $elm$core$Set$toList(x);
		y = $elm$core$Set$toList(y);
	}
	if (x.$ === 'RBNode_elm_builtin' || x.$ === 'RBEmpty_elm_builtin')
	{
		x = $elm$core$Dict$toList(x);
		y = $elm$core$Dict$toList(y);
	}
	//*/

	/**_UNUSED/
	if (x.$ < 0)
	{
		x = $elm$core$Dict$toList(x);
		y = $elm$core$Dict$toList(y);
	}
	//*/

	for (var key in x)
	{
		if (!_Utils_eqHelp(x[key], y[key], depth + 1, stack))
		{
			return false;
		}
	}
	return true;
}

var _Utils_equal = F2(_Utils_eq);
var _Utils_notEqual = F2(function(a, b) { return !_Utils_eq(a,b); });



// COMPARISONS

// Code in Generate/JavaScript.hs, Basics.js, and List.js depends on
// the particular integer values assigned to LT, EQ, and GT.

function _Utils_cmp(x, y, ord)
{
	if (typeof x !== 'object')
	{
		return x === y ? /*EQ*/ 0 : x < y ? /*LT*/ -1 : /*GT*/ 1;
	}

	/**/
	if (x instanceof String)
	{
		var a = x.valueOf();
		var b = y.valueOf();
		return a === b ? 0 : a < b ? -1 : 1;
	}
	//*/

	/**_UNUSED/
	if (typeof x.$ === 'undefined')
	//*/
	/**/
	if (x.$[0] === '#')
	//*/
	{
		return (ord = _Utils_cmp(x.a, y.a))
			? ord
			: (ord = _Utils_cmp(x.b, y.b))
				? ord
				: _Utils_cmp(x.c, y.c);
	}

	// traverse conses until end of a list or a mismatch
	for (; x.b && y.b && !(ord = _Utils_cmp(x.a, y.a)); x = x.b, y = y.b) {} // WHILE_CONSES
	return ord || (x.b ? /*GT*/ 1 : y.b ? /*LT*/ -1 : /*EQ*/ 0);
}

var _Utils_lt = F2(function(a, b) { return _Utils_cmp(a, b) < 0; });
var _Utils_le = F2(function(a, b) { return _Utils_cmp(a, b) < 1; });
var _Utils_gt = F2(function(a, b) { return _Utils_cmp(a, b) > 0; });
var _Utils_ge = F2(function(a, b) { return _Utils_cmp(a, b) >= 0; });

var _Utils_compare = F2(function(x, y)
{
	var n = _Utils_cmp(x, y);
	return n < 0 ? $elm$core$Basics$LT : n ? $elm$core$Basics$GT : $elm$core$Basics$EQ;
});


// COMMON VALUES

var _Utils_Tuple0_UNUSED = 0;
var _Utils_Tuple0 = { $: '#0' };

function _Utils_Tuple2_UNUSED(a, b) { return { a: a, b: b }; }
function _Utils_Tuple2(a, b) { return { $: '#2', a: a, b: b }; }

function _Utils_Tuple3_UNUSED(a, b, c) { return { a: a, b: b, c: c }; }
function _Utils_Tuple3(a, b, c) { return { $: '#3', a: a, b: b, c: c }; }

function _Utils_chr_UNUSED(c) { return c; }
function _Utils_chr(c) { return new String(c); }


// RECORDS

function _Utils_update(oldRecord, updatedFields)
{
	var newRecord = {};

	for (var key in oldRecord)
	{
		newRecord[key] = oldRecord[key];
	}

	for (var key in updatedFields)
	{
		newRecord[key] = updatedFields[key];
	}

	return newRecord;
}


// APPEND

var _Utils_append = F2(_Utils_ap);

function _Utils_ap(xs, ys)
{
	// append Strings
	if (typeof xs === 'string')
	{
		return xs + ys;
	}

	// append Lists
	if (!xs.b)
	{
		return ys;
	}
	var root = _List_Cons(xs.a, ys);
	xs = xs.b
	for (var curr = root; xs.b; xs = xs.b) // WHILE_CONS
	{
		curr = curr.b = _List_Cons(xs.a, ys);
	}
	return root;
}



var _List_Nil_UNUSED = { $: 0 };
var _List_Nil = { $: '[]' };

function _List_Cons_UNUSED(hd, tl) { return { $: 1, a: hd, b: tl }; }
function _List_Cons(hd, tl) { return { $: '::', a: hd, b: tl }; }


var _List_cons = F2(_List_Cons);

function _List_fromArray(arr)
{
	var out = _List_Nil;
	for (var i = arr.length; i--; )
	{
		out = _List_Cons(arr[i], out);
	}
	return out;
}

function _List_toArray(xs)
{
	for (var out = []; xs.b; xs = xs.b) // WHILE_CONS
	{
		out.push(xs.a);
	}
	return out;
}

var _List_map2 = F3(function(f, xs, ys)
{
	for (var arr = []; xs.b && ys.b; xs = xs.b, ys = ys.b) // WHILE_CONSES
	{
		arr.push(A2(f, xs.a, ys.a));
	}
	return _List_fromArray(arr);
});

var _List_map3 = F4(function(f, xs, ys, zs)
{
	for (var arr = []; xs.b && ys.b && zs.b; xs = xs.b, ys = ys.b, zs = zs.b) // WHILE_CONSES
	{
		arr.push(A3(f, xs.a, ys.a, zs.a));
	}
	return _List_fromArray(arr);
});

var _List_map4 = F5(function(f, ws, xs, ys, zs)
{
	for (var arr = []; ws.b && xs.b && ys.b && zs.b; ws = ws.b, xs = xs.b, ys = ys.b, zs = zs.b) // WHILE_CONSES
	{
		arr.push(A4(f, ws.a, xs.a, ys.a, zs.a));
	}
	return _List_fromArray(arr);
});

var _List_map5 = F6(function(f, vs, ws, xs, ys, zs)
{
	for (var arr = []; vs.b && ws.b && xs.b && ys.b && zs.b; vs = vs.b, ws = ws.b, xs = xs.b, ys = ys.b, zs = zs.b) // WHILE_CONSES
	{
		arr.push(A5(f, vs.a, ws.a, xs.a, ys.a, zs.a));
	}
	return _List_fromArray(arr);
});

var _List_sortBy = F2(function(f, xs)
{
	return _List_fromArray(_List_toArray(xs).sort(function(a, b) {
		return _Utils_cmp(f(a), f(b));
	}));
});

var _List_sortWith = F2(function(f, xs)
{
	return _List_fromArray(_List_toArray(xs).sort(function(a, b) {
		var ord = A2(f, a, b);
		return ord === $elm$core$Basics$EQ ? 0 : ord === $elm$core$Basics$LT ? -1 : 1;
	}));
});



var _JsArray_empty = [];

function _JsArray_singleton(value)
{
    return [value];
}

function _JsArray_length(array)
{
    return array.length;
}

var _JsArray_initialize = F3(function(size, offset, func)
{
    var result = new Array(size);

    for (var i = 0; i < size; i++)
    {
        result[i] = func(offset + i);
    }

    return result;
});

var _JsArray_initializeFromList = F2(function (max, ls)
{
    var result = new Array(max);

    for (var i = 0; i < max && ls.b; i++)
    {
        result[i] = ls.a;
        ls = ls.b;
    }

    result.length = i;
    return _Utils_Tuple2(result, ls);
});

var _JsArray_unsafeGet = F2(function(index, array)
{
    return array[index];
});

var _JsArray_unsafeSet = F3(function(index, value, array)
{
    var length = array.length;
    var result = new Array(length);

    for (var i = 0; i < length; i++)
    {
        result[i] = array[i];
    }

    result[index] = value;
    return result;
});

var _JsArray_push = F2(function(value, array)
{
    var length = array.length;
    var result = new Array(length + 1);

    for (var i = 0; i < length; i++)
    {
        result[i] = array[i];
    }

    result[length] = value;
    return result;
});

var _JsArray_foldl = F3(function(func, acc, array)
{
    var length = array.length;

    for (var i = 0; i < length; i++)
    {
        acc = A2(func, array[i], acc);
    }

    return acc;
});

var _JsArray_foldr = F3(function(func, acc, array)
{
    for (var i = array.length - 1; i >= 0; i--)
    {
        acc = A2(func, array[i], acc);
    }

    return acc;
});

var _JsArray_map = F2(function(func, array)
{
    var length = array.length;
    var result = new Array(length);

    for (var i = 0; i < length; i++)
    {
        result[i] = func(array[i]);
    }

    return result;
});

var _JsArray_indexedMap = F3(function(func, offset, array)
{
    var length = array.length;
    var result = new Array(length);

    for (var i = 0; i < length; i++)
    {
        result[i] = A2(func, offset + i, array[i]);
    }

    return result;
});

var _JsArray_slice = F3(function(from, to, array)
{
    return array.slice(from, to);
});

var _JsArray_appendN = F3(function(n, dest, source)
{
    var destLen = dest.length;
    var itemsToCopy = n - destLen;

    if (itemsToCopy > source.length)
    {
        itemsToCopy = source.length;
    }

    var size = destLen + itemsToCopy;
    var result = new Array(size);

    for (var i = 0; i < destLen; i++)
    {
        result[i] = dest[i];
    }

    for (var i = 0; i < itemsToCopy; i++)
    {
        result[i + destLen] = source[i];
    }

    return result;
});



// LOG

var _Debug_log_UNUSED = F2(function(tag, value)
{
	return value;
});

var _Debug_log = F2(function(tag, value)
{
	console.log(tag + ': ' + _Debug_toString(value));
	return value;
});


// TODOS

function _Debug_todo(moduleName, region)
{
	return function(message) {
		_Debug_crash(8, moduleName, region, message);
	};
}

function _Debug_todoCase(moduleName, region, value)
{
	return function(message) {
		_Debug_crash(9, moduleName, region, value, message);
	};
}


// TO STRING

function _Debug_toString_UNUSED(value)
{
	return '<internals>';
}

function _Debug_toString(value)
{
	return _Debug_toAnsiString(false, value);
}

function _Debug_toAnsiString(ansi, value)
{
	if (typeof value === 'function')
	{
		return _Debug_internalColor(ansi, '<function>');
	}

	if (typeof value === 'boolean')
	{
		return _Debug_ctorColor(ansi, value ? 'True' : 'False');
	}

	if (typeof value === 'number')
	{
		return _Debug_numberColor(ansi, value + '');
	}

	if (value instanceof String)
	{
		return _Debug_charColor(ansi, "'" + _Debug_addSlashes(value, true) + "'");
	}

	if (typeof value === 'string')
	{
		return _Debug_stringColor(ansi, '"' + _Debug_addSlashes(value, false) + '"');
	}

	if (typeof value === 'object' && '$' in value)
	{
		var tag = value.$;

		if (typeof tag === 'number')
		{
			return _Debug_internalColor(ansi, '<internals>');
		}

		if (tag[0] === '#')
		{
			var output = [];
			for (var k in value)
			{
				if (k === '$') continue;
				output.push(_Debug_toAnsiString(ansi, value[k]));
			}
			return '(' + output.join(',') + ')';
		}

		if (tag === 'Set_elm_builtin')
		{
			return _Debug_ctorColor(ansi, 'Set')
				+ _Debug_fadeColor(ansi, '.fromList') + ' '
				+ _Debug_toAnsiString(ansi, $elm$core$Set$toList(value));
		}

		if (tag === 'RBNode_elm_builtin' || tag === 'RBEmpty_elm_builtin')
		{
			return _Debug_ctorColor(ansi, 'Dict')
				+ _Debug_fadeColor(ansi, '.fromList') + ' '
				+ _Debug_toAnsiString(ansi, $elm$core$Dict$toList(value));
		}

		if (tag === 'Array_elm_builtin')
		{
			return _Debug_ctorColor(ansi, 'Array')
				+ _Debug_fadeColor(ansi, '.fromList') + ' '
				+ _Debug_toAnsiString(ansi, $elm$core$Array$toList(value));
		}

		if (tag === '::' || tag === '[]')
		{
			var output = '[';

			value.b && (output += _Debug_toAnsiString(ansi, value.a), value = value.b)

			for (; value.b; value = value.b) // WHILE_CONS
			{
				output += ',' + _Debug_toAnsiString(ansi, value.a);
			}
			return output + ']';
		}

		var output = '';
		for (var i in value)
		{
			if (i === '$') continue;
			var str = _Debug_toAnsiString(ansi, value[i]);
			var c0 = str[0];
			var parenless = c0 === '{' || c0 === '(' || c0 === '[' || c0 === '<' || c0 === '"' || str.indexOf(' ') < 0;
			output += ' ' + (parenless ? str : '(' + str + ')');
		}
		return _Debug_ctorColor(ansi, tag) + output;
	}

	if (typeof DataView === 'function' && value instanceof DataView)
	{
		return _Debug_stringColor(ansi, '<' + value.byteLength + ' bytes>');
	}

	if (typeof File !== 'undefined' && value instanceof File)
	{
		return _Debug_internalColor(ansi, '<' + value.name + '>');
	}

	if (typeof value === 'object')
	{
		var output = [];
		for (var key in value)
		{
			var field = key[0] === '_' ? key.slice(1) : key;
			output.push(_Debug_fadeColor(ansi, field) + ' = ' + _Debug_toAnsiString(ansi, value[key]));
		}
		if (output.length === 0)
		{
			return '{}';
		}
		return '{ ' + output.join(', ') + ' }';
	}

	return _Debug_internalColor(ansi, '<internals>');
}

function _Debug_addSlashes(str, isChar)
{
	var s = str
		.replace(/\\/g, '\\\\')
		.replace(/\n/g, '\\n')
		.replace(/\t/g, '\\t')
		.replace(/\r/g, '\\r')
		.replace(/\v/g, '\\v')
		.replace(/\0/g, '\\0');

	if (isChar)
	{
		return s.replace(/\'/g, '\\\'');
	}
	else
	{
		return s.replace(/\"/g, '\\"');
	}
}

function _Debug_ctorColor(ansi, string)
{
	return ansi ? '\x1b[96m' + string + '\x1b[0m' : string;
}

function _Debug_numberColor(ansi, string)
{
	return ansi ? '\x1b[95m' + string + '\x1b[0m' : string;
}

function _Debug_stringColor(ansi, string)
{
	return ansi ? '\x1b[93m' + string + '\x1b[0m' : string;
}

function _Debug_charColor(ansi, string)
{
	return ansi ? '\x1b[92m' + string + '\x1b[0m' : string;
}

function _Debug_fadeColor(ansi, string)
{
	return ansi ? '\x1b[37m' + string + '\x1b[0m' : string;
}

function _Debug_internalColor(ansi, string)
{
	return ansi ? '\x1b[36m' + string + '\x1b[0m' : string;
}

function _Debug_toHexDigit(n)
{
	return String.fromCharCode(n < 10 ? 48 + n : 55 + n);
}


// CRASH


function _Debug_crash_UNUSED(identifier)
{
	throw new Error('https://github.com/elm/core/blob/1.0.0/hints/' + identifier + '.md');
}


function _Debug_crash(identifier, fact1, fact2, fact3, fact4)
{
	switch(identifier)
	{
		case 0:
			throw new Error('What node should I take over? In JavaScript I need something like:\n\n    Elm.Main.init({\n        node: document.getElementById("elm-node")\n    })\n\nYou need to do this with any Browser.sandbox or Browser.element program.');

		case 1:
			throw new Error('Browser.application programs cannot handle URLs like this:\n\n    ' + document.location.href + '\n\nWhat is the root? The root of your file system? Try looking at this program with `elm reactor` or some other server.');

		case 2:
			var jsonErrorString = fact1;
			throw new Error('Problem with the flags given to your Elm program on initialization.\n\n' + jsonErrorString);

		case 3:
			var portName = fact1;
			throw new Error('There can only be one port named `' + portName + '`, but your program has multiple.');

		case 4:
			var portName = fact1;
			var problem = fact2;
			throw new Error('Trying to send an unexpected type of value through port `' + portName + '`:\n' + problem);

		case 5:
			throw new Error('Trying to use `(==)` on functions.\nThere is no way to know if functions are "the same" in the Elm sense.\nRead more about this at https://package.elm-lang.org/packages/elm/core/latest/Basics#== which describes why it is this way and what the better version will look like.');

		case 6:
			var moduleName = fact1;
			throw new Error('Your page is loading multiple Elm scripts with a module named ' + moduleName + '. Maybe a duplicate script is getting loaded accidentally? If not, rename one of them so I know which is which!');

		case 8:
			var moduleName = fact1;
			var region = fact2;
			var message = fact3;
			throw new Error('TODO in module `' + moduleName + '` ' + _Debug_regionToString(region) + '\n\n' + message);

		case 9:
			var moduleName = fact1;
			var region = fact2;
			var value = fact3;
			var message = fact4;
			throw new Error(
				'TODO in module `' + moduleName + '` from the `case` expression '
				+ _Debug_regionToString(region) + '\n\nIt received the following value:\n\n    '
				+ _Debug_toString(value).replace('\n', '\n    ')
				+ '\n\nBut the branch that handles it says:\n\n    ' + message.replace('\n', '\n    ')
			);

		case 10:
			throw new Error('Bug in https://github.com/elm/virtual-dom/issues');

		case 11:
			throw new Error('Cannot perform mod 0. Division by zero error.');
	}
}

function _Debug_regionToString(region)
{
	if (region.start.line === region.end.line)
	{
		return 'on line ' + region.start.line;
	}
	return 'on lines ' + region.start.line + ' through ' + region.end.line;
}



// MATH

var _Basics_add = F2(function(a, b) { return a + b; });
var _Basics_sub = F2(function(a, b) { return a - b; });
var _Basics_mul = F2(function(a, b) { return a * b; });
var _Basics_fdiv = F2(function(a, b) { return a / b; });
var _Basics_idiv = F2(function(a, b) { return (a / b) | 0; });
var _Basics_pow = F2(Math.pow);

var _Basics_remainderBy = F2(function(b, a) { return a % b; });

// https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/divmodnote-letter.pdf
var _Basics_modBy = F2(function(modulus, x)
{
	var answer = x % modulus;
	return modulus === 0
		? _Debug_crash(11)
		:
	((answer > 0 && modulus < 0) || (answer < 0 && modulus > 0))
		? answer + modulus
		: answer;
});


// TRIGONOMETRY

var _Basics_pi = Math.PI;
var _Basics_e = Math.E;
var _Basics_cos = Math.cos;
var _Basics_sin = Math.sin;
var _Basics_tan = Math.tan;
var _Basics_acos = Math.acos;
var _Basics_asin = Math.asin;
var _Basics_atan = Math.atan;
var _Basics_atan2 = F2(Math.atan2);


// MORE MATH

function _Basics_toFloat(x) { return x; }
function _Basics_truncate(n) { return n | 0; }
function _Basics_isInfinite(n) { return n === Infinity || n === -Infinity; }

var _Basics_ceiling = Math.ceil;
var _Basics_floor = Math.floor;
var _Basics_round = Math.round;
var _Basics_sqrt = Math.sqrt;
var _Basics_log = Math.log;
var _Basics_isNaN = isNaN;


// BOOLEANS

function _Basics_not(bool) { return !bool; }
var _Basics_and = F2(function(a, b) { return a && b; });
var _Basics_or  = F2(function(a, b) { return a || b; });
var _Basics_xor = F2(function(a, b) { return a !== b; });



var _String_cons = F2(function(chr, str)
{
	return chr + str;
});

function _String_uncons(string)
{
	var word = string.charCodeAt(0);
	return !isNaN(word)
		? $elm$core$Maybe$Just(
			0xD800 <= word && word <= 0xDBFF
				? _Utils_Tuple2(_Utils_chr(string[0] + string[1]), string.slice(2))
				: _Utils_Tuple2(_Utils_chr(string[0]), string.slice(1))
		)
		: $elm$core$Maybe$Nothing;
}

var _String_append = F2(function(a, b)
{
	return a + b;
});

function _String_length(str)
{
	return str.length;
}

var _String_map = F2(function(func, string)
{
	var len = string.length;
	var array = new Array(len);
	var i = 0;
	while (i < len)
	{
		var word = string.charCodeAt(i);
		if (0xD800 <= word && word <= 0xDBFF)
		{
			array[i] = func(_Utils_chr(string[i] + string[i+1]));
			i += 2;
			continue;
		}
		array[i] = func(_Utils_chr(string[i]));
		i++;
	}
	return array.join('');
});

var _String_filter = F2(function(isGood, str)
{
	var arr = [];
	var len = str.length;
	var i = 0;
	while (i < len)
	{
		var char = str[i];
		var word = str.charCodeAt(i);
		i++;
		if (0xD800 <= word && word <= 0xDBFF)
		{
			char += str[i];
			i++;
		}

		if (isGood(_Utils_chr(char)))
		{
			arr.push(char);
		}
	}
	return arr.join('');
});

function _String_reverse(str)
{
	var len = str.length;
	var arr = new Array(len);
	var i = 0;
	while (i < len)
	{
		var word = str.charCodeAt(i);
		if (0xD800 <= word && word <= 0xDBFF)
		{
			arr[len - i] = str[i + 1];
			i++;
			arr[len - i] = str[i - 1];
			i++;
		}
		else
		{
			arr[len - i] = str[i];
			i++;
		}
	}
	return arr.join('');
}

var _String_foldl = F3(function(func, state, string)
{
	var len = string.length;
	var i = 0;
	while (i < len)
	{
		var char = string[i];
		var word = string.charCodeAt(i);
		i++;
		if (0xD800 <= word && word <= 0xDBFF)
		{
			char += string[i];
			i++;
		}
		state = A2(func, _Utils_chr(char), state);
	}
	return state;
});

var _String_foldr = F3(function(func, state, string)
{
	var i = string.length;
	while (i--)
	{
		var char = string[i];
		var word = string.charCodeAt(i);
		if (0xDC00 <= word && word <= 0xDFFF)
		{
			i--;
			char = string[i] + char;
		}
		state = A2(func, _Utils_chr(char), state);
	}
	return state;
});

var _String_split = F2(function(sep, str)
{
	return str.split(sep);
});

var _String_join = F2(function(sep, strs)
{
	return strs.join(sep);
});

var _String_slice = F3(function(start, end, str) {
	return str.slice(start, end);
});

function _String_trim(str)
{
	return str.trim();
}

function _String_trimLeft(str)
{
	return str.replace(/^\s+/, '');
}

function _String_trimRight(str)
{
	return str.replace(/\s+$/, '');
}

function _String_words(str)
{
	return _List_fromArray(str.trim().split(/\s+/g));
}

function _String_lines(str)
{
	return _List_fromArray(str.split(/\r\n|\r|\n/g));
}

function _String_toUpper(str)
{
	return str.toUpperCase();
}

function _String_toLower(str)
{
	return str.toLowerCase();
}

var _String_any = F2(function(isGood, string)
{
	var i = string.length;
	while (i--)
	{
		var char = string[i];
		var word = string.charCodeAt(i);
		if (0xDC00 <= word && word <= 0xDFFF)
		{
			i--;
			char = string[i] + char;
		}
		if (isGood(_Utils_chr(char)))
		{
			return true;
		}
	}
	return false;
});

var _String_all = F2(function(isGood, string)
{
	var i = string.length;
	while (i--)
	{
		var char = string[i];
		var word = string.charCodeAt(i);
		if (0xDC00 <= word && word <= 0xDFFF)
		{
			i--;
			char = string[i] + char;
		}
		if (!isGood(_Utils_chr(char)))
		{
			return false;
		}
	}
	return true;
});

var _String_contains = F2(function(sub, str)
{
	return str.indexOf(sub) > -1;
});

var _String_startsWith = F2(function(sub, str)
{
	return str.indexOf(sub) === 0;
});

var _String_endsWith = F2(function(sub, str)
{
	return str.length >= sub.length &&
		str.lastIndexOf(sub) === str.length - sub.length;
});

var _String_indexes = F2(function(sub, str)
{
	var subLen = sub.length;

	if (subLen < 1)
	{
		return _List_Nil;
	}

	var i = 0;
	var is = [];

	while ((i = str.indexOf(sub, i)) > -1)
	{
		is.push(i);
		i = i + subLen;
	}

	return _List_fromArray(is);
});


// TO STRING

function _String_fromNumber(number)
{
	return number + '';
}


// INT CONVERSIONS

function _String_toInt(str)
{
	var total = 0;
	var code0 = str.charCodeAt(0);
	var start = code0 == 0x2B /* + */ || code0 == 0x2D /* - */ ? 1 : 0;

	for (var i = start; i < str.length; ++i)
	{
		var code = str.charCodeAt(i);
		if (code < 0x30 || 0x39 < code)
		{
			return $elm$core$Maybe$Nothing;
		}
		total = 10 * total + code - 0x30;
	}

	return i == start
		? $elm$core$Maybe$Nothing
		: $elm$core$Maybe$Just(code0 == 0x2D ? -total : total);
}


// FLOAT CONVERSIONS

function _String_toFloat(s)
{
	// check if it is a hex, octal, or binary number
	if (s.length === 0 || /[\sxbo]/.test(s))
	{
		return $elm$core$Maybe$Nothing;
	}
	var n = +s;
	// faster isNaN check
	return n === n ? $elm$core$Maybe$Just(n) : $elm$core$Maybe$Nothing;
}

function _String_fromList(chars)
{
	return _List_toArray(chars).join('');
}




function _Char_toCode(char)
{
	var code = char.charCodeAt(0);
	if (0xD800 <= code && code <= 0xDBFF)
	{
		return (code - 0xD800) * 0x400 + char.charCodeAt(1) - 0xDC00 + 0x10000
	}
	return code;
}

function _Char_fromCode(code)
{
	return _Utils_chr(
		(code < 0 || 0x10FFFF < code)
			? '\uFFFD'
			:
		(code <= 0xFFFF)
			? String.fromCharCode(code)
			:
		(code -= 0x10000,
			String.fromCharCode(Math.floor(code / 0x400) + 0xD800, code % 0x400 + 0xDC00)
		)
	);
}

function _Char_toUpper(char)
{
	return _Utils_chr(char.toUpperCase());
}

function _Char_toLower(char)
{
	return _Utils_chr(char.toLowerCase());
}

function _Char_toLocaleUpper(char)
{
	return _Utils_chr(char.toLocaleUpperCase());
}

function _Char_toLocaleLower(char)
{
	return _Utils_chr(char.toLocaleLowerCase());
}



/**/
function _Json_errorToString(error)
{
	return $elm$json$Json$Decode$errorToString(error);
}
//*/


// CORE DECODERS

function _Json_succeed(msg)
{
	return {
		$: 0,
		a: msg
	};
}

function _Json_fail(msg)
{
	return {
		$: 1,
		a: msg
	};
}

function _Json_decodePrim(decoder)
{
	return { $: 2, b: decoder };
}

var _Json_decodeInt = _Json_decodePrim(function(value) {
	return (typeof value !== 'number')
		? _Json_expecting('an INT', value)
		:
	(-2147483647 < value && value < 2147483647 && (value | 0) === value)
		? $elm$core$Result$Ok(value)
		:
	(isFinite(value) && !(value % 1))
		? $elm$core$Result$Ok(value)
		: _Json_expecting('an INT', value);
});

var _Json_decodeBool = _Json_decodePrim(function(value) {
	return (typeof value === 'boolean')
		? $elm$core$Result$Ok(value)
		: _Json_expecting('a BOOL', value);
});

var _Json_decodeFloat = _Json_decodePrim(function(value) {
	return (typeof value === 'number')
		? $elm$core$Result$Ok(value)
		: _Json_expecting('a FLOAT', value);
});

var _Json_decodeValue = _Json_decodePrim(function(value) {
	return $elm$core$Result$Ok(_Json_wrap(value));
});

var _Json_decodeString = _Json_decodePrim(function(value) {
	return (typeof value === 'string')
		? $elm$core$Result$Ok(value)
		: (value instanceof String)
			? $elm$core$Result$Ok(value + '')
			: _Json_expecting('a STRING', value);
});

function _Json_decodeList(decoder) { return { $: 3, b: decoder }; }
function _Json_decodeArray(decoder) { return { $: 4, b: decoder }; }

function _Json_decodeNull(value) { return { $: 5, c: value }; }

var _Json_decodeField = F2(function(field, decoder)
{
	return {
		$: 6,
		d: field,
		b: decoder
	};
});

var _Json_decodeIndex = F2(function(index, decoder)
{
	return {
		$: 7,
		e: index,
		b: decoder
	};
});

function _Json_decodeKeyValuePairs(decoder)
{
	return {
		$: 8,
		b: decoder
	};
}

function _Json_mapMany(f, decoders)
{
	return {
		$: 9,
		f: f,
		g: decoders
	};
}

var _Json_andThen = F2(function(callback, decoder)
{
	return {
		$: 10,
		b: decoder,
		h: callback
	};
});

function _Json_oneOf(decoders)
{
	return {
		$: 11,
		g: decoders
	};
}


// DECODING OBJECTS

var _Json_map1 = F2(function(f, d1)
{
	return _Json_mapMany(f, [d1]);
});

var _Json_map2 = F3(function(f, d1, d2)
{
	return _Json_mapMany(f, [d1, d2]);
});

var _Json_map3 = F4(function(f, d1, d2, d3)
{
	return _Json_mapMany(f, [d1, d2, d3]);
});

var _Json_map4 = F5(function(f, d1, d2, d3, d4)
{
	return _Json_mapMany(f, [d1, d2, d3, d4]);
});

var _Json_map5 = F6(function(f, d1, d2, d3, d4, d5)
{
	return _Json_mapMany(f, [d1, d2, d3, d4, d5]);
});

var _Json_map6 = F7(function(f, d1, d2, d3, d4, d5, d6)
{
	return _Json_mapMany(f, [d1, d2, d3, d4, d5, d6]);
});

var _Json_map7 = F8(function(f, d1, d2, d3, d4, d5, d6, d7)
{
	return _Json_mapMany(f, [d1, d2, d3, d4, d5, d6, d7]);
});

var _Json_map8 = F9(function(f, d1, d2, d3, d4, d5, d6, d7, d8)
{
	return _Json_mapMany(f, [d1, d2, d3, d4, d5, d6, d7, d8]);
});


// DECODE

var _Json_runOnString = F2(function(decoder, string)
{
	try
	{
		var value = JSON.parse(string);
		return _Json_runHelp(decoder, value);
	}
	catch (e)
	{
		return $elm$core$Result$Err(A2($elm$json$Json$Decode$Failure, 'This is not valid JSON! ' + e.message, _Json_wrap(string)));
	}
});

var _Json_run = F2(function(decoder, value)
{
	return _Json_runHelp(decoder, _Json_unwrap(value));
});

function _Json_runHelp(decoder, value)
{
	switch (decoder.$)
	{
		case 2:
			return decoder.b(value);

		case 5:
			return (value === null)
				? $elm$core$Result$Ok(decoder.c)
				: _Json_expecting('null', value);

		case 3:
			if (!_Json_isArray(value))
			{
				return _Json_expecting('a LIST', value);
			}
			return _Json_runArrayDecoder(decoder.b, value, _List_fromArray);

		case 4:
			if (!_Json_isArray(value))
			{
				return _Json_expecting('an ARRAY', value);
			}
			return _Json_runArrayDecoder(decoder.b, value, _Json_toElmArray);

		case 6:
			var field = decoder.d;
			if (typeof value !== 'object' || value === null || !(field in value))
			{
				return _Json_expecting('an OBJECT with a field named `' + field + '`', value);
			}
			var result = _Json_runHelp(decoder.b, value[field]);
			return ($elm$core$Result$isOk(result)) ? result : $elm$core$Result$Err(A2($elm$json$Json$Decode$Field, field, result.a));

		case 7:
			var index = decoder.e;
			if (!_Json_isArray(value))
			{
				return _Json_expecting('an ARRAY', value);
			}
			if (index >= value.length)
			{
				return _Json_expecting('a LONGER array. Need index ' + index + ' but only see ' + value.length + ' entries', value);
			}
			var result = _Json_runHelp(decoder.b, value[index]);
			return ($elm$core$Result$isOk(result)) ? result : $elm$core$Result$Err(A2($elm$json$Json$Decode$Index, index, result.a));

		case 8:
			if (typeof value !== 'object' || value === null || _Json_isArray(value))
			{
				return _Json_expecting('an OBJECT', value);
			}

			var keyValuePairs = _List_Nil;
			// TODO test perf of Object.keys and switch when support is good enough
			for (var key in value)
			{
				if (value.hasOwnProperty(key))
				{
					var result = _Json_runHelp(decoder.b, value[key]);
					if (!$elm$core$Result$isOk(result))
					{
						return $elm$core$Result$Err(A2($elm$json$Json$Decode$Field, key, result.a));
					}
					keyValuePairs = _List_Cons(_Utils_Tuple2(key, result.a), keyValuePairs);
				}
			}
			return $elm$core$Result$Ok($elm$core$List$reverse(keyValuePairs));

		case 9:
			var answer = decoder.f;
			var decoders = decoder.g;
			for (var i = 0; i < decoders.length; i++)
			{
				var result = _Json_runHelp(decoders[i], value);
				if (!$elm$core$Result$isOk(result))
				{
					return result;
				}
				answer = answer(result.a);
			}
			return $elm$core$Result$Ok(answer);

		case 10:
			var result = _Json_runHelp(decoder.b, value);
			return (!$elm$core$Result$isOk(result))
				? result
				: _Json_runHelp(decoder.h(result.a), value);

		case 11:
			var errors = _List_Nil;
			for (var temp = decoder.g; temp.b; temp = temp.b) // WHILE_CONS
			{
				var result = _Json_runHelp(temp.a, value);
				if ($elm$core$Result$isOk(result))
				{
					return result;
				}
				errors = _List_Cons(result.a, errors);
			}
			return $elm$core$Result$Err($elm$json$Json$Decode$OneOf($elm$core$List$reverse(errors)));

		case 1:
			return $elm$core$Result$Err(A2($elm$json$Json$Decode$Failure, decoder.a, _Json_wrap(value)));

		case 0:
			return $elm$core$Result$Ok(decoder.a);
	}
}

function _Json_runArrayDecoder(decoder, value, toElmValue)
{
	var len = value.length;
	var array = new Array(len);
	for (var i = 0; i < len; i++)
	{
		var result = _Json_runHelp(decoder, value[i]);
		if (!$elm$core$Result$isOk(result))
		{
			return $elm$core$Result$Err(A2($elm$json$Json$Decode$Index, i, result.a));
		}
		array[i] = result.a;
	}
	return $elm$core$Result$Ok(toElmValue(array));
}

function _Json_isArray(value)
{
	return Array.isArray(value) || (typeof FileList !== 'undefined' && value instanceof FileList);
}

function _Json_toElmArray(array)
{
	return A2($elm$core$Array$initialize, array.length, function(i) { return array[i]; });
}

function _Json_expecting(type, value)
{
	return $elm$core$Result$Err(A2($elm$json$Json$Decode$Failure, 'Expecting ' + type, _Json_wrap(value)));
}


// EQUALITY

function _Json_equality(x, y)
{
	if (x === y)
	{
		return true;
	}

	if (x.$ !== y.$)
	{
		return false;
	}

	switch (x.$)
	{
		case 0:
		case 1:
			return x.a === y.a;

		case 2:
			return x.b === y.b;

		case 5:
			return x.c === y.c;

		case 3:
		case 4:
		case 8:
			return _Json_equality(x.b, y.b);

		case 6:
			return x.d === y.d && _Json_equality(x.b, y.b);

		case 7:
			return x.e === y.e && _Json_equality(x.b, y.b);

		case 9:
			return x.f === y.f && _Json_listEquality(x.g, y.g);

		case 10:
			return x.h === y.h && _Json_equality(x.b, y.b);

		case 11:
			return _Json_listEquality(x.g, y.g);
	}
}

function _Json_listEquality(aDecoders, bDecoders)
{
	var len = aDecoders.length;
	if (len !== bDecoders.length)
	{
		return false;
	}
	for (var i = 0; i < len; i++)
	{
		if (!_Json_equality(aDecoders[i], bDecoders[i]))
		{
			return false;
		}
	}
	return true;
}


// ENCODE

var _Json_encode = F2(function(indentLevel, value)
{
	return JSON.stringify(_Json_unwrap(value), null, indentLevel) + '';
});

function _Json_wrap(value) { return { $: 0, a: value }; }
function _Json_unwrap(value) { return value.a; }

function _Json_wrap_UNUSED(value) { return value; }
function _Json_unwrap_UNUSED(value) { return value; }

function _Json_emptyArray() { return []; }
function _Json_emptyObject() { return {}; }

var _Json_addField = F3(function(key, value, object)
{
	object[key] = _Json_unwrap(value);
	return object;
});

function _Json_addEntry(func)
{
	return F2(function(entry, array)
	{
		array.push(_Json_unwrap(func(entry)));
		return array;
	});
}

var _Json_encodeNull = _Json_wrap(null);



// TASKS

function _Scheduler_succeed(value)
{
	return {
		$: 0,
		a: value
	};
}

function _Scheduler_fail(error)
{
	return {
		$: 1,
		a: error
	};
}

function _Scheduler_binding(callback)
{
	return {
		$: 2,
		b: callback,
		c: null
	};
}

var _Scheduler_andThen = F2(function(callback, task)
{
	return {
		$: 3,
		b: callback,
		d: task
	};
});

var _Scheduler_onError = F2(function(callback, task)
{
	return {
		$: 4,
		b: callback,
		d: task
	};
});

function _Scheduler_receive(callback)
{
	return {
		$: 5,
		b: callback
	};
}


// PROCESSES

var _Scheduler_guid = 0;

function _Scheduler_rawSpawn(task)
{
	var proc = {
		$: 0,
		e: _Scheduler_guid++,
		f: task,
		g: null,
		h: []
	};

	_Scheduler_enqueue(proc);

	return proc;
}

function _Scheduler_spawn(task)
{
	return _Scheduler_binding(function(callback) {
		callback(_Scheduler_succeed(_Scheduler_rawSpawn(task)));
	});
}

function _Scheduler_rawSend(proc, msg)
{
	proc.h.push(msg);
	_Scheduler_enqueue(proc);
}

var _Scheduler_send = F2(function(proc, msg)
{
	return _Scheduler_binding(function(callback) {
		_Scheduler_rawSend(proc, msg);
		callback(_Scheduler_succeed(_Utils_Tuple0));
	});
});

function _Scheduler_kill(proc)
{
	return _Scheduler_binding(function(callback) {
		var task = proc.f;
		if (task.$ === 2 && task.c)
		{
			task.c();
		}

		proc.f = null;

		callback(_Scheduler_succeed(_Utils_Tuple0));
	});
}


/* STEP PROCESSES

type alias Process =
  { $ : tag
  , id : unique_id
  , root : Task
  , stack : null | { $: SUCCEED | FAIL, a: callback, b: stack }
  , mailbox : [msg]
  }

*/


var _Scheduler_working = false;
var _Scheduler_queue = [];


function _Scheduler_enqueue(proc)
{
	_Scheduler_queue.push(proc);
	if (_Scheduler_working)
	{
		return;
	}
	_Scheduler_working = true;
	while (proc = _Scheduler_queue.shift())
	{
		_Scheduler_step(proc);
	}
	_Scheduler_working = false;
}


function _Scheduler_step(proc)
{
	while (proc.f)
	{
		var rootTag = proc.f.$;
		if (rootTag === 0 || rootTag === 1)
		{
			while (proc.g && proc.g.$ !== rootTag)
			{
				proc.g = proc.g.i;
			}
			if (!proc.g)
			{
				return;
			}
			proc.f = proc.g.b(proc.f.a);
			proc.g = proc.g.i;
		}
		else if (rootTag === 2)
		{
			proc.f.c = proc.f.b(function(newRoot) {
				proc.f = newRoot;
				_Scheduler_enqueue(proc);
			});
			return;
		}
		else if (rootTag === 5)
		{
			if (proc.h.length === 0)
			{
				return;
			}
			proc.f = proc.f.b(proc.h.shift());
		}
		else // if (rootTag === 3 || rootTag === 4)
		{
			proc.g = {
				$: rootTag === 3 ? 0 : 1,
				b: proc.f.b,
				i: proc.g
			};
			proc.f = proc.f.d;
		}
	}
}



function _Process_sleep(time)
{
	return _Scheduler_binding(function(callback) {
		var id = setTimeout(function() {
			callback(_Scheduler_succeed(_Utils_Tuple0));
		}, time);

		return function() { clearTimeout(id); };
	});
}




// PROGRAMS


var _Platform_worker = F4(function(impl, flagDecoder, debugMetadata, args)
{
	return _Platform_initialize(
		flagDecoder,
		args,
		impl.init,
		impl.update,
		impl.subscriptions,
		function() { return function() {} }
	);
});



// INITIALIZE A PROGRAM


function _Platform_initialize(flagDecoder, args, init, update, subscriptions, stepperBuilder)
{
	var result = A2(_Json_run, flagDecoder, _Json_wrap(args ? args['flags'] : undefined));
	$elm$core$Result$isOk(result) || _Debug_crash(2 /**/, _Json_errorToString(result.a) /**/);
	var managers = {};
	var initPair = init(result.a);
	var model = initPair.a;
	var stepper = stepperBuilder(sendToApp, model);
	var ports = _Platform_setupEffects(managers, sendToApp);

	function sendToApp(msg, viewMetadata)
	{
		var pair = A2(update, msg, model);
		stepper(model = pair.a, viewMetadata);
		_Platform_enqueueEffects(managers, pair.b, subscriptions(model));
	}

	_Platform_enqueueEffects(managers, initPair.b, subscriptions(model));

	return ports ? { ports: ports } : {};
}



// TRACK PRELOADS
//
// This is used by code in elm/browser and elm/http
// to register any HTTP requests that are triggered by init.
//


var _Platform_preload;


function _Platform_registerPreload(url)
{
	_Platform_preload.add(url);
}



// EFFECT MANAGERS


var _Platform_effectManagers = {};


function _Platform_setupEffects(managers, sendToApp)
{
	var ports;

	// setup all necessary effect managers
	for (var key in _Platform_effectManagers)
	{
		var manager = _Platform_effectManagers[key];

		if (manager.a)
		{
			ports = ports || {};
			ports[key] = manager.a(key, sendToApp);
		}

		managers[key] = _Platform_instantiateManager(manager, sendToApp);
	}

	return ports;
}


function _Platform_createManager(init, onEffects, onSelfMsg, cmdMap, subMap)
{
	return {
		b: init,
		c: onEffects,
		d: onSelfMsg,
		e: cmdMap,
		f: subMap
	};
}


function _Platform_instantiateManager(info, sendToApp)
{
	var router = {
		g: sendToApp,
		h: undefined
	};

	var onEffects = info.c;
	var onSelfMsg = info.d;
	var cmdMap = info.e;
	var subMap = info.f;

	function loop(state)
	{
		return A2(_Scheduler_andThen, loop, _Scheduler_receive(function(msg)
		{
			var value = msg.a;

			if (msg.$ === 0)
			{
				return A3(onSelfMsg, router, value, state);
			}

			return cmdMap && subMap
				? A4(onEffects, router, value.i, value.j, state)
				: A3(onEffects, router, cmdMap ? value.i : value.j, state);
		}));
	}

	return router.h = _Scheduler_rawSpawn(A2(_Scheduler_andThen, loop, info.b));
}



// ROUTING


var _Platform_sendToApp = F2(function(router, msg)
{
	return _Scheduler_binding(function(callback)
	{
		router.g(msg);
		callback(_Scheduler_succeed(_Utils_Tuple0));
	});
});


var _Platform_sendToSelf = F2(function(router, msg)
{
	return A2(_Scheduler_send, router.h, {
		$: 0,
		a: msg
	});
});



// BAGS


function _Platform_leaf(home)
{
	return function(value)
	{
		return {
			$: 1,
			k: home,
			l: value
		};
	};
}


function _Platform_batch(list)
{
	return {
		$: 2,
		m: list
	};
}


var _Platform_map = F2(function(tagger, bag)
{
	return {
		$: 3,
		n: tagger,
		o: bag
	}
});



// PIPE BAGS INTO EFFECT MANAGERS
//
// Effects must be queued!
//
// Say your init contains a synchronous command, like Time.now or Time.here
//
//   - This will produce a batch of effects (FX_1)
//   - The synchronous task triggers the subsequent `update` call
//   - This will produce a batch of effects (FX_2)
//
// If we just start dispatching FX_2, subscriptions from FX_2 can be processed
// before subscriptions from FX_1. No good! Earlier versions of this code had
// this problem, leading to these reports:
//
//   https://github.com/elm/core/issues/980
//   https://github.com/elm/core/pull/981
//   https://github.com/elm/compiler/issues/1776
//
// The queue is necessary to avoid ordering issues for synchronous commands.


// Why use true/false here? Why not just check the length of the queue?
// The goal is to detect "are we currently dispatching effects?" If we
// are, we need to bail and let the ongoing while loop handle things.
//
// Now say the queue has 1 element. When we dequeue the final element,
// the queue will be empty, but we are still actively dispatching effects.
// So you could get queue jumping in a really tricky category of cases.
//
var _Platform_effectsQueue = [];
var _Platform_effectsActive = false;


function _Platform_enqueueEffects(managers, cmdBag, subBag)
{
	_Platform_effectsQueue.push({ p: managers, q: cmdBag, r: subBag });

	if (_Platform_effectsActive) return;

	_Platform_effectsActive = true;
	for (var fx; fx = _Platform_effectsQueue.shift(); )
	{
		_Platform_dispatchEffects(fx.p, fx.q, fx.r);
	}
	_Platform_effectsActive = false;
}


function _Platform_dispatchEffects(managers, cmdBag, subBag)
{
	var effectsDict = {};
	_Platform_gatherEffects(true, cmdBag, effectsDict, null);
	_Platform_gatherEffects(false, subBag, effectsDict, null);

	for (var home in managers)
	{
		_Scheduler_rawSend(managers[home], {
			$: 'fx',
			a: effectsDict[home] || { i: _List_Nil, j: _List_Nil }
		});
	}
}


function _Platform_gatherEffects(isCmd, bag, effectsDict, taggers)
{
	switch (bag.$)
	{
		case 1:
			var home = bag.k;
			var effect = _Platform_toEffect(isCmd, home, taggers, bag.l);
			effectsDict[home] = _Platform_insert(isCmd, effect, effectsDict[home]);
			return;

		case 2:
			for (var list = bag.m; list.b; list = list.b) // WHILE_CONS
			{
				_Platform_gatherEffects(isCmd, list.a, effectsDict, taggers);
			}
			return;

		case 3:
			_Platform_gatherEffects(isCmd, bag.o, effectsDict, {
				s: bag.n,
				t: taggers
			});
			return;
	}
}


function _Platform_toEffect(isCmd, home, taggers, value)
{
	function applyTaggers(x)
	{
		for (var temp = taggers; temp; temp = temp.t)
		{
			x = temp.s(x);
		}
		return x;
	}

	var map = isCmd
		? _Platform_effectManagers[home].e
		: _Platform_effectManagers[home].f;

	return A2(map, applyTaggers, value)
}


function _Platform_insert(isCmd, newEffect, effects)
{
	effects = effects || { i: _List_Nil, j: _List_Nil };

	isCmd
		? (effects.i = _List_Cons(newEffect, effects.i))
		: (effects.j = _List_Cons(newEffect, effects.j));

	return effects;
}



// PORTS


function _Platform_checkPortName(name)
{
	if (_Platform_effectManagers[name])
	{
		_Debug_crash(3, name)
	}
}



// OUTGOING PORTS


function _Platform_outgoingPort(name, converter)
{
	_Platform_checkPortName(name);
	_Platform_effectManagers[name] = {
		e: _Platform_outgoingPortMap,
		u: converter,
		a: _Platform_setupOutgoingPort
	};
	return _Platform_leaf(name);
}


var _Platform_outgoingPortMap = F2(function(tagger, value) { return value; });


function _Platform_setupOutgoingPort(name)
{
	var subs = [];
	var converter = _Platform_effectManagers[name].u;

	// CREATE MANAGER

	var init = _Process_sleep(0);

	_Platform_effectManagers[name].b = init;
	_Platform_effectManagers[name].c = F3(function(router, cmdList, state)
	{
		for ( ; cmdList.b; cmdList = cmdList.b) // WHILE_CONS
		{
			// grab a separate reference to subs in case unsubscribe is called
			var currentSubs = subs;
			var value = _Json_unwrap(converter(cmdList.a));
			for (var i = 0; i < currentSubs.length; i++)
			{
				currentSubs[i](value);
			}
		}
		return init;
	});

	// PUBLIC API

	function subscribe(callback)
	{
		subs.push(callback);
	}

	function unsubscribe(callback)
	{
		// copy subs into a new array in case unsubscribe is called within a
		// subscribed callback
		subs = subs.slice();
		var index = subs.indexOf(callback);
		if (index >= 0)
		{
			subs.splice(index, 1);
		}
	}

	return {
		subscribe: subscribe,
		unsubscribe: unsubscribe
	};
}



// INCOMING PORTS


function _Platform_incomingPort(name, converter)
{
	_Platform_checkPortName(name);
	_Platform_effectManagers[name] = {
		f: _Platform_incomingPortMap,
		u: converter,
		a: _Platform_setupIncomingPort
	};
	return _Platform_leaf(name);
}


var _Platform_incomingPortMap = F2(function(tagger, finalTagger)
{
	return function(value)
	{
		return tagger(finalTagger(value));
	};
});


function _Platform_setupIncomingPort(name, sendToApp)
{
	var subs = _List_Nil;
	var converter = _Platform_effectManagers[name].u;

	// CREATE MANAGER

	var init = _Scheduler_succeed(null);

	_Platform_effectManagers[name].b = init;
	_Platform_effectManagers[name].c = F3(function(router, subList, state)
	{
		subs = subList;
		return init;
	});

	// PUBLIC API

	function send(incomingValue)
	{
		var result = A2(_Json_run, converter, _Json_wrap(incomingValue));

		$elm$core$Result$isOk(result) || _Debug_crash(4, name, result.a);

		var value = result.a;
		for (var temp = subs; temp.b; temp = temp.b) // WHILE_CONS
		{
			sendToApp(temp.a(value));
		}
	}

	return { send: send };
}



// EXPORT ELM MODULES
//
// Have DEBUG and PROD versions so that we can (1) give nicer errors in
// debug mode and (2) not pay for the bits needed for that in prod mode.
//


function _Platform_export_UNUSED(exports)
{
	scope['Elm']
		? _Platform_mergeExportsProd(scope['Elm'], exports)
		: scope['Elm'] = exports;
}


function _Platform_mergeExportsProd(obj, exports)
{
	for (var name in exports)
	{
		(name in obj)
			? (name == 'init')
				? _Debug_crash(6)
				: _Platform_mergeExportsProd(obj[name], exports[name])
			: (obj[name] = exports[name]);
	}
}


function _Platform_export(exports)
{
	scope['Elm']
		? _Platform_mergeExportsDebug('Elm', scope['Elm'], exports)
		: scope['Elm'] = exports;
}


function _Platform_mergeExportsDebug(moduleName, obj, exports)
{
	for (var name in exports)
	{
		(name in obj)
			? (name == 'init')
				? _Debug_crash(6, moduleName)
				: _Platform_mergeExportsDebug(moduleName + '.' + name, obj[name], exports[name])
			: (obj[name] = exports[name]);
	}
}




// HELPERS


var _VirtualDom_divertHrefToApp;

var _VirtualDom_doc = typeof document !== 'undefined' ? document : {};


function _VirtualDom_appendChild(parent, child)
{
	parent.appendChild(child);
}

var _VirtualDom_init = F4(function(virtualNode, flagDecoder, debugMetadata, args)
{
	// NOTE: this function needs _Platform_export available to work

	/**_UNUSED/
	var node = args['node'];
	//*/
	/**/
	var node = args && args['node'] ? args['node'] : _Debug_crash(0);
	//*/

	node.parentNode.replaceChild(
		_VirtualDom_render(virtualNode, function() {}),
		node
	);

	return {};
});



// TEXT


function _VirtualDom_text(string)
{
	return {
		$: 0,
		a: string
	};
}



// NODE


var _VirtualDom_nodeNS = F2(function(namespace, tag)
{
	return F2(function(factList, kidList)
	{
		for (var kids = [], descendantsCount = 0; kidList.b; kidList = kidList.b) // WHILE_CONS
		{
			var kid = kidList.a;
			descendantsCount += (kid.b || 0);
			kids.push(kid);
		}
		descendantsCount += kids.length;

		return {
			$: 1,
			c: tag,
			d: _VirtualDom_organizeFacts(factList),
			e: kids,
			f: namespace,
			b: descendantsCount
		};
	});
});


var _VirtualDom_node = _VirtualDom_nodeNS(undefined);



// KEYED NODE


var _VirtualDom_keyedNodeNS = F2(function(namespace, tag)
{
	return F2(function(factList, kidList)
	{
		for (var kids = [], descendantsCount = 0; kidList.b; kidList = kidList.b) // WHILE_CONS
		{
			var kid = kidList.a;
			descendantsCount += (kid.b.b || 0);
			kids.push(kid);
		}
		descendantsCount += kids.length;

		return {
			$: 2,
			c: tag,
			d: _VirtualDom_organizeFacts(factList),
			e: kids,
			f: namespace,
			b: descendantsCount
		};
	});
});


var _VirtualDom_keyedNode = _VirtualDom_keyedNodeNS(undefined);



// CUSTOM


function _VirtualDom_custom(factList, model, render, diff)
{
	return {
		$: 3,
		d: _VirtualDom_organizeFacts(factList),
		g: model,
		h: render,
		i: diff
	};
}



// MAP


var _VirtualDom_map = F2(function(tagger, node)
{
	return {
		$: 4,
		j: tagger,
		k: node,
		b: 1 + (node.b || 0)
	};
});



// LAZY


function _VirtualDom_thunk(refs, thunk)
{
	return {
		$: 5,
		l: refs,
		m: thunk,
		k: undefined
	};
}

var _VirtualDom_lazy = F2(function(func, a)
{
	return _VirtualDom_thunk([func, a], function() {
		return func(a);
	});
});

var _VirtualDom_lazy2 = F3(function(func, a, b)
{
	return _VirtualDom_thunk([func, a, b], function() {
		return A2(func, a, b);
	});
});

var _VirtualDom_lazy3 = F4(function(func, a, b, c)
{
	return _VirtualDom_thunk([func, a, b, c], function() {
		return A3(func, a, b, c);
	});
});

var _VirtualDom_lazy4 = F5(function(func, a, b, c, d)
{
	return _VirtualDom_thunk([func, a, b, c, d], function() {
		return A4(func, a, b, c, d);
	});
});

var _VirtualDom_lazy5 = F6(function(func, a, b, c, d, e)
{
	return _VirtualDom_thunk([func, a, b, c, d, e], function() {
		return A5(func, a, b, c, d, e);
	});
});

var _VirtualDom_lazy6 = F7(function(func, a, b, c, d, e, f)
{
	return _VirtualDom_thunk([func, a, b, c, d, e, f], function() {
		return A6(func, a, b, c, d, e, f);
	});
});

var _VirtualDom_lazy7 = F8(function(func, a, b, c, d, e, f, g)
{
	return _VirtualDom_thunk([func, a, b, c, d, e, f, g], function() {
		return A7(func, a, b, c, d, e, f, g);
	});
});

var _VirtualDom_lazy8 = F9(function(func, a, b, c, d, e, f, g, h)
{
	return _VirtualDom_thunk([func, a, b, c, d, e, f, g, h], function() {
		return A8(func, a, b, c, d, e, f, g, h);
	});
});



// FACTS


var _VirtualDom_on = F2(function(key, handler)
{
	return {
		$: 'a0',
		n: key,
		o: handler
	};
});
var _VirtualDom_style = F2(function(key, value)
{
	return {
		$: 'a1',
		n: key,
		o: value
	};
});
var _VirtualDom_property = F2(function(key, value)
{
	return {
		$: 'a2',
		n: key,
		o: value
	};
});
var _VirtualDom_attribute = F2(function(key, value)
{
	return {
		$: 'a3',
		n: key,
		o: value
	};
});
var _VirtualDom_attributeNS = F3(function(namespace, key, value)
{
	return {
		$: 'a4',
		n: key,
		o: { f: namespace, o: value }
	};
});



// XSS ATTACK VECTOR CHECKS
//
// For some reason, tabs can appear in href protocols and it still works.
// So '\tjava\tSCRIPT:alert("!!!")' and 'javascript:alert("!!!")' are the same
// in practice. That is why _VirtualDom_RE_js and _VirtualDom_RE_js_html look
// so freaky.
//
// Pulling the regular expressions out to the top level gives a slight speed
// boost in small benchmarks (4-10%) but hoisting values to reduce allocation
// can be unpredictable in large programs where JIT may have a harder time with
// functions are not fully self-contained. The benefit is more that the js and
// js_html ones are so weird that I prefer to see them near each other.


var _VirtualDom_RE_script = /^script$/i;
var _VirtualDom_RE_on_formAction = /^(on|formAction$)/i;
var _VirtualDom_RE_js = /^\s*j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t\s*:/i;
var _VirtualDom_RE_js_html = /^\s*(j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t\s*:|d\s*a\s*t\s*a\s*:\s*t\s*e\s*x\s*t\s*\/\s*h\s*t\s*m\s*l\s*(,|;))/i;


function _VirtualDom_noScript(tag)
{
	return _VirtualDom_RE_script.test(tag) ? 'p' : tag;
}

function _VirtualDom_noOnOrFormAction(key)
{
	return _VirtualDom_RE_on_formAction.test(key) ? 'data-' + key : key;
}

function _VirtualDom_noInnerHtmlOrFormAction(key)
{
	return key == 'innerHTML' || key == 'formAction' ? 'data-' + key : key;
}

function _VirtualDom_noJavaScriptUri(value)
{
	return _VirtualDom_RE_js.test(value)
		? /**_UNUSED/''//*//**/'javascript:alert("This is an XSS vector. Please use ports or web components instead.")'//*/
		: value;
}

function _VirtualDom_noJavaScriptOrHtmlUri(value)
{
	return _VirtualDom_RE_js_html.test(value)
		? /**_UNUSED/''//*//**/'javascript:alert("This is an XSS vector. Please use ports or web components instead.")'//*/
		: value;
}

function _VirtualDom_noJavaScriptOrHtmlJson(value)
{
	return (typeof _Json_unwrap(value) === 'string' && _VirtualDom_RE_js_html.test(_Json_unwrap(value)))
		? _Json_wrap(
			/**_UNUSED/''//*//**/'javascript:alert("This is an XSS vector. Please use ports or web components instead.")'//*/
		) : value;
}



// MAP FACTS


var _VirtualDom_mapAttribute = F2(function(func, attr)
{
	return (attr.$ === 'a0')
		? A2(_VirtualDom_on, attr.n, _VirtualDom_mapHandler(func, attr.o))
		: attr;
});

function _VirtualDom_mapHandler(func, handler)
{
	var tag = $elm$virtual_dom$VirtualDom$toHandlerInt(handler);

	// 0 = Normal
	// 1 = MayStopPropagation
	// 2 = MayPreventDefault
	// 3 = Custom

	return {
		$: handler.$,
		a:
			!tag
				? A2($elm$json$Json$Decode$map, func, handler.a)
				:
			A3($elm$json$Json$Decode$map2,
				tag < 3
					? _VirtualDom_mapEventTuple
					: _VirtualDom_mapEventRecord,
				$elm$json$Json$Decode$succeed(func),
				handler.a
			)
	};
}

var _VirtualDom_mapEventTuple = F2(function(func, tuple)
{
	return _Utils_Tuple2(func(tuple.a), tuple.b);
});

var _VirtualDom_mapEventRecord = F2(function(func, record)
{
	return {
		message: func(record.message),
		stopPropagation: record.stopPropagation,
		preventDefault: record.preventDefault
	}
});



// ORGANIZE FACTS


function _VirtualDom_organizeFacts(factList)
{
	for (var facts = {}; factList.b; factList = factList.b) // WHILE_CONS
	{
		var entry = factList.a;

		var tag = entry.$;
		var key = entry.n;
		var value = entry.o;

		if (tag === 'a2')
		{
			(key === 'className')
				? _VirtualDom_addClass(facts, key, _Json_unwrap(value))
				: facts[key] = _Json_unwrap(value);

			continue;
		}

		var subFacts = facts[tag] || (facts[tag] = {});
		(tag === 'a3' && key === 'class')
			? _VirtualDom_addClass(subFacts, key, value)
			: subFacts[key] = value;
	}

	return facts;
}

function _VirtualDom_addClass(object, key, newClass)
{
	var classes = object[key];
	object[key] = classes ? classes + ' ' + newClass : newClass;
}



// RENDER


function _VirtualDom_render(vNode, eventNode)
{
	var tag = vNode.$;

	if (tag === 5)
	{
		return _VirtualDom_render(vNode.k || (vNode.k = vNode.m()), eventNode);
	}

	if (tag === 0)
	{
		return _VirtualDom_doc.createTextNode(vNode.a);
	}

	if (tag === 4)
	{
		var subNode = vNode.k;
		var tagger = vNode.j;

		while (subNode.$ === 4)
		{
			typeof tagger !== 'object'
				? tagger = [tagger, subNode.j]
				: tagger.push(subNode.j);

			subNode = subNode.k;
		}

		var subEventRoot = { j: tagger, p: eventNode };
		var domNode = _VirtualDom_render(subNode, subEventRoot);
		domNode.elm_event_node_ref = subEventRoot;
		return domNode;
	}

	if (tag === 3)
	{
		var domNode = vNode.h(vNode.g);
		_VirtualDom_applyFacts(domNode, eventNode, vNode.d);
		return domNode;
	}

	// at this point `tag` must be 1 or 2

	var domNode = vNode.f
		? _VirtualDom_doc.createElementNS(vNode.f, vNode.c)
		: _VirtualDom_doc.createElement(vNode.c);

	if (_VirtualDom_divertHrefToApp && vNode.c == 'a')
	{
		domNode.addEventListener('click', _VirtualDom_divertHrefToApp(domNode));
	}

	_VirtualDom_applyFacts(domNode, eventNode, vNode.d);

	for (var kids = vNode.e, i = 0; i < kids.length; i++)
	{
		_VirtualDom_appendChild(domNode, _VirtualDom_render(tag === 1 ? kids[i] : kids[i].b, eventNode));
	}

	return domNode;
}



// APPLY FACTS


function _VirtualDom_applyFacts(domNode, eventNode, facts)
{
	for (var key in facts)
	{
		var value = facts[key];

		key === 'a1'
			? _VirtualDom_applyStyles(domNode, value)
			:
		key === 'a0'
			? _VirtualDom_applyEvents(domNode, eventNode, value)
			:
		key === 'a3'
			? _VirtualDom_applyAttrs(domNode, value)
			:
		key === 'a4'
			? _VirtualDom_applyAttrsNS(domNode, value)
			:
		((key !== 'value' && key !== 'checked') || domNode[key] !== value) && (domNode[key] = value);
	}
}



// APPLY STYLES


function _VirtualDom_applyStyles(domNode, styles)
{
	var domNodeStyle = domNode.style;

	for (var key in styles)
	{
		domNodeStyle[key] = styles[key];
	}
}



// APPLY ATTRS


function _VirtualDom_applyAttrs(domNode, attrs)
{
	for (var key in attrs)
	{
		var value = attrs[key];
		typeof value !== 'undefined'
			? domNode.setAttribute(key, value)
			: domNode.removeAttribute(key);
	}
}



// APPLY NAMESPACED ATTRS


function _VirtualDom_applyAttrsNS(domNode, nsAttrs)
{
	for (var key in nsAttrs)
	{
		var pair = nsAttrs[key];
		var namespace = pair.f;
		var value = pair.o;

		typeof value !== 'undefined'
			? domNode.setAttributeNS(namespace, key, value)
			: domNode.removeAttributeNS(namespace, key);
	}
}



// APPLY EVENTS


function _VirtualDom_applyEvents(domNode, eventNode, events)
{
	var allCallbacks = domNode.elmFs || (domNode.elmFs = {});

	for (var key in events)
	{
		var newHandler = events[key];
		var oldCallback = allCallbacks[key];

		if (!newHandler)
		{
			domNode.removeEventListener(key, oldCallback);
			allCallbacks[key] = undefined;
			continue;
		}

		if (oldCallback)
		{
			var oldHandler = oldCallback.q;
			if (oldHandler.$ === newHandler.$)
			{
				oldCallback.q = newHandler;
				continue;
			}
			domNode.removeEventListener(key, oldCallback);
		}

		oldCallback = _VirtualDom_makeCallback(eventNode, newHandler);
		domNode.addEventListener(key, oldCallback,
			_VirtualDom_passiveSupported
			&& { passive: $elm$virtual_dom$VirtualDom$toHandlerInt(newHandler) < 2 }
		);
		allCallbacks[key] = oldCallback;
	}
}



// PASSIVE EVENTS


var _VirtualDom_passiveSupported;

try
{
	window.addEventListener('t', null, Object.defineProperty({}, 'passive', {
		get: function() { _VirtualDom_passiveSupported = true; }
	}));
}
catch(e) {}



// EVENT HANDLERS


function _VirtualDom_makeCallback(eventNode, initialHandler)
{
	function callback(event)
	{
		var handler = callback.q;
		var result = _Json_runHelp(handler.a, event);

		if (!$elm$core$Result$isOk(result))
		{
			return;
		}

		var tag = $elm$virtual_dom$VirtualDom$toHandlerInt(handler);

		// 0 = Normal
		// 1 = MayStopPropagation
		// 2 = MayPreventDefault
		// 3 = Custom

		var value = result.a;
		var message = !tag ? value : tag < 3 ? value.a : value.message;
		var stopPropagation = tag == 1 ? value.b : tag == 3 && value.stopPropagation;
		var currentEventNode = (
			stopPropagation && event.stopPropagation(),
			(tag == 2 ? value.b : tag == 3 && value.preventDefault) && event.preventDefault(),
			eventNode
		);
		var tagger;
		var i;
		while (tagger = currentEventNode.j)
		{
			if (typeof tagger == 'function')
			{
				message = tagger(message);
			}
			else
			{
				for (var i = tagger.length; i--; )
				{
					message = tagger[i](message);
				}
			}
			currentEventNode = currentEventNode.p;
		}
		currentEventNode(message, stopPropagation); // stopPropagation implies isSync
	}

	callback.q = initialHandler;

	return callback;
}

function _VirtualDom_equalEvents(x, y)
{
	return x.$ == y.$ && _Json_equality(x.a, y.a);
}



// DIFF


// TODO: Should we do patches like in iOS?
//
// type Patch
//   = At Int Patch
//   | Batch (List Patch)
//   | Change ...
//
// How could it not be better?
//
function _VirtualDom_diff(x, y)
{
	var patches = [];
	_VirtualDom_diffHelp(x, y, patches, 0);
	return patches;
}


function _VirtualDom_pushPatch(patches, type, index, data)
{
	var patch = {
		$: type,
		r: index,
		s: data,
		t: undefined,
		u: undefined
	};
	patches.push(patch);
	return patch;
}


function _VirtualDom_diffHelp(x, y, patches, index)
{
	if (x === y)
	{
		return;
	}

	var xType = x.$;
	var yType = y.$;

	// Bail if you run into different types of nodes. Implies that the
	// structure has changed significantly and it's not worth a diff.
	if (xType !== yType)
	{
		if (xType === 1 && yType === 2)
		{
			y = _VirtualDom_dekey(y);
			yType = 1;
		}
		else
		{
			_VirtualDom_pushPatch(patches, 0, index, y);
			return;
		}
	}

	// Now we know that both nodes are the same $.
	switch (yType)
	{
		case 5:
			var xRefs = x.l;
			var yRefs = y.l;
			var i = xRefs.length;
			var same = i === yRefs.length;
			while (same && i--)
			{
				same = xRefs[i] === yRefs[i];
			}
			if (same)
			{
				y.k = x.k;
				return;
			}
			y.k = y.m();
			var subPatches = [];
			_VirtualDom_diffHelp(x.k, y.k, subPatches, 0);
			subPatches.length > 0 && _VirtualDom_pushPatch(patches, 1, index, subPatches);
			return;

		case 4:
			// gather nested taggers
			var xTaggers = x.j;
			var yTaggers = y.j;
			var nesting = false;

			var xSubNode = x.k;
			while (xSubNode.$ === 4)
			{
				nesting = true;

				typeof xTaggers !== 'object'
					? xTaggers = [xTaggers, xSubNode.j]
					: xTaggers.push(xSubNode.j);

				xSubNode = xSubNode.k;
			}

			var ySubNode = y.k;
			while (ySubNode.$ === 4)
			{
				nesting = true;

				typeof yTaggers !== 'object'
					? yTaggers = [yTaggers, ySubNode.j]
					: yTaggers.push(ySubNode.j);

				ySubNode = ySubNode.k;
			}

			// Just bail if different numbers of taggers. This implies the
			// structure of the virtual DOM has changed.
			if (nesting && xTaggers.length !== yTaggers.length)
			{
				_VirtualDom_pushPatch(patches, 0, index, y);
				return;
			}

			// check if taggers are "the same"
			if (nesting ? !_VirtualDom_pairwiseRefEqual(xTaggers, yTaggers) : xTaggers !== yTaggers)
			{
				_VirtualDom_pushPatch(patches, 2, index, yTaggers);
			}

			// diff everything below the taggers
			_VirtualDom_diffHelp(xSubNode, ySubNode, patches, index + 1);
			return;

		case 0:
			if (x.a !== y.a)
			{
				_VirtualDom_pushPatch(patches, 3, index, y.a);
			}
			return;

		case 1:
			_VirtualDom_diffNodes(x, y, patches, index, _VirtualDom_diffKids);
			return;

		case 2:
			_VirtualDom_diffNodes(x, y, patches, index, _VirtualDom_diffKeyedKids);
			return;

		case 3:
			if (x.h !== y.h)
			{
				_VirtualDom_pushPatch(patches, 0, index, y);
				return;
			}

			var factsDiff = _VirtualDom_diffFacts(x.d, y.d);
			factsDiff && _VirtualDom_pushPatch(patches, 4, index, factsDiff);

			var patch = y.i(x.g, y.g);
			patch && _VirtualDom_pushPatch(patches, 5, index, patch);

			return;
	}
}

// assumes the incoming arrays are the same length
function _VirtualDom_pairwiseRefEqual(as, bs)
{
	for (var i = 0; i < as.length; i++)
	{
		if (as[i] !== bs[i])
		{
			return false;
		}
	}

	return true;
}

function _VirtualDom_diffNodes(x, y, patches, index, diffKids)
{
	// Bail if obvious indicators have changed. Implies more serious
	// structural changes such that it's not worth it to diff.
	if (x.c !== y.c || x.f !== y.f)
	{
		_VirtualDom_pushPatch(patches, 0, index, y);
		return;
	}

	var factsDiff = _VirtualDom_diffFacts(x.d, y.d);
	factsDiff && _VirtualDom_pushPatch(patches, 4, index, factsDiff);

	diffKids(x, y, patches, index);
}



// DIFF FACTS


// TODO Instead of creating a new diff object, it's possible to just test if
// there *is* a diff. During the actual patch, do the diff again and make the
// modifications directly. This way, there's no new allocations. Worth it?
function _VirtualDom_diffFacts(x, y, category)
{
	var diff;

	// look for changes and removals
	for (var xKey in x)
	{
		if (xKey === 'a1' || xKey === 'a0' || xKey === 'a3' || xKey === 'a4')
		{
			var subDiff = _VirtualDom_diffFacts(x[xKey], y[xKey] || {}, xKey);
			if (subDiff)
			{
				diff = diff || {};
				diff[xKey] = subDiff;
			}
			continue;
		}

		// remove if not in the new facts
		if (!(xKey in y))
		{
			diff = diff || {};
			diff[xKey] =
				!category
					? (typeof x[xKey] === 'string' ? '' : null)
					:
				(category === 'a1')
					? ''
					:
				(category === 'a0' || category === 'a3')
					? undefined
					:
				{ f: x[xKey].f, o: undefined };

			continue;
		}

		var xValue = x[xKey];
		var yValue = y[xKey];

		// reference equal, so don't worry about it
		if (xValue === yValue && xKey !== 'value' && xKey !== 'checked'
			|| category === 'a0' && _VirtualDom_equalEvents(xValue, yValue))
		{
			continue;
		}

		diff = diff || {};
		diff[xKey] = yValue;
	}

	// add new stuff
	for (var yKey in y)
	{
		if (!(yKey in x))
		{
			diff = diff || {};
			diff[yKey] = y[yKey];
		}
	}

	return diff;
}



// DIFF KIDS


function _VirtualDom_diffKids(xParent, yParent, patches, index)
{
	var xKids = xParent.e;
	var yKids = yParent.e;

	var xLen = xKids.length;
	var yLen = yKids.length;

	// FIGURE OUT IF THERE ARE INSERTS OR REMOVALS

	if (xLen > yLen)
	{
		_VirtualDom_pushPatch(patches, 6, index, {
			v: yLen,
			i: xLen - yLen
		});
	}
	else if (xLen < yLen)
	{
		_VirtualDom_pushPatch(patches, 7, index, {
			v: xLen,
			e: yKids
		});
	}

	// PAIRWISE DIFF EVERYTHING ELSE

	for (var minLen = xLen < yLen ? xLen : yLen, i = 0; i < minLen; i++)
	{
		var xKid = xKids[i];
		_VirtualDom_diffHelp(xKid, yKids[i], patches, ++index);
		index += xKid.b || 0;
	}
}



// KEYED DIFF


function _VirtualDom_diffKeyedKids(xParent, yParent, patches, rootIndex)
{
	var localPatches = [];

	var changes = {}; // Dict String Entry
	var inserts = []; // Array { index : Int, entry : Entry }
	// type Entry = { tag : String, vnode : VNode, index : Int, data : _ }

	var xKids = xParent.e;
	var yKids = yParent.e;
	var xLen = xKids.length;
	var yLen = yKids.length;
	var xIndex = 0;
	var yIndex = 0;

	var index = rootIndex;

	while (xIndex < xLen && yIndex < yLen)
	{
		var x = xKids[xIndex];
		var y = yKids[yIndex];

		var xKey = x.a;
		var yKey = y.a;
		var xNode = x.b;
		var yNode = y.b;

		var newMatch = undefined;
		var oldMatch = undefined;

		// check if keys match

		if (xKey === yKey)
		{
			index++;
			_VirtualDom_diffHelp(xNode, yNode, localPatches, index);
			index += xNode.b || 0;

			xIndex++;
			yIndex++;
			continue;
		}

		// look ahead 1 to detect insertions and removals.

		var xNext = xKids[xIndex + 1];
		var yNext = yKids[yIndex + 1];

		if (xNext)
		{
			var xNextKey = xNext.a;
			var xNextNode = xNext.b;
			oldMatch = yKey === xNextKey;
		}

		if (yNext)
		{
			var yNextKey = yNext.a;
			var yNextNode = yNext.b;
			newMatch = xKey === yNextKey;
		}


		// swap x and y
		if (newMatch && oldMatch)
		{
			index++;
			_VirtualDom_diffHelp(xNode, yNextNode, localPatches, index);
			_VirtualDom_insertNode(changes, localPatches, xKey, yNode, yIndex, inserts);
			index += xNode.b || 0;

			index++;
			_VirtualDom_removeNode(changes, localPatches, xKey, xNextNode, index);
			index += xNextNode.b || 0;

			xIndex += 2;
			yIndex += 2;
			continue;
		}

		// insert y
		if (newMatch)
		{
			index++;
			_VirtualDom_insertNode(changes, localPatches, yKey, yNode, yIndex, inserts);
			_VirtualDom_diffHelp(xNode, yNextNode, localPatches, index);
			index += xNode.b || 0;

			xIndex += 1;
			yIndex += 2;
			continue;
		}

		// remove x
		if (oldMatch)
		{
			index++;
			_VirtualDom_removeNode(changes, localPatches, xKey, xNode, index);
			index += xNode.b || 0;

			index++;
			_VirtualDom_diffHelp(xNextNode, yNode, localPatches, index);
			index += xNextNode.b || 0;

			xIndex += 2;
			yIndex += 1;
			continue;
		}

		// remove x, insert y
		if (xNext && xNextKey === yNextKey)
		{
			index++;
			_VirtualDom_removeNode(changes, localPatches, xKey, xNode, index);
			_VirtualDom_insertNode(changes, localPatches, yKey, yNode, yIndex, inserts);
			index += xNode.b || 0;

			index++;
			_VirtualDom_diffHelp(xNextNode, yNextNode, localPatches, index);
			index += xNextNode.b || 0;

			xIndex += 2;
			yIndex += 2;
			continue;
		}

		break;
	}

	// eat up any remaining nodes with removeNode and insertNode

	while (xIndex < xLen)
	{
		index++;
		var x = xKids[xIndex];
		var xNode = x.b;
		_VirtualDom_removeNode(changes, localPatches, x.a, xNode, index);
		index += xNode.b || 0;
		xIndex++;
	}

	while (yIndex < yLen)
	{
		var endInserts = endInserts || [];
		var y = yKids[yIndex];
		_VirtualDom_insertNode(changes, localPatches, y.a, y.b, undefined, endInserts);
		yIndex++;
	}

	if (localPatches.length > 0 || inserts.length > 0 || endInserts)
	{
		_VirtualDom_pushPatch(patches, 8, rootIndex, {
			w: localPatches,
			x: inserts,
			y: endInserts
		});
	}
}



// CHANGES FROM KEYED DIFF


var _VirtualDom_POSTFIX = '_elmW6BL';


function _VirtualDom_insertNode(changes, localPatches, key, vnode, yIndex, inserts)
{
	var entry = changes[key];

	// never seen this key before
	if (!entry)
	{
		entry = {
			c: 0,
			z: vnode,
			r: yIndex,
			s: undefined
		};

		inserts.push({ r: yIndex, A: entry });
		changes[key] = entry;

		return;
	}

	// this key was removed earlier, a match!
	if (entry.c === 1)
	{
		inserts.push({ r: yIndex, A: entry });

		entry.c = 2;
		var subPatches = [];
		_VirtualDom_diffHelp(entry.z, vnode, subPatches, entry.r);
		entry.r = yIndex;
		entry.s.s = {
			w: subPatches,
			A: entry
		};

		return;
	}

	// this key has already been inserted or moved, a duplicate!
	_VirtualDom_insertNode(changes, localPatches, key + _VirtualDom_POSTFIX, vnode, yIndex, inserts);
}


function _VirtualDom_removeNode(changes, localPatches, key, vnode, index)
{
	var entry = changes[key];

	// never seen this key before
	if (!entry)
	{
		var patch = _VirtualDom_pushPatch(localPatches, 9, index, undefined);

		changes[key] = {
			c: 1,
			z: vnode,
			r: index,
			s: patch
		};

		return;
	}

	// this key was inserted earlier, a match!
	if (entry.c === 0)
	{
		entry.c = 2;
		var subPatches = [];
		_VirtualDom_diffHelp(vnode, entry.z, subPatches, index);

		_VirtualDom_pushPatch(localPatches, 9, index, {
			w: subPatches,
			A: entry
		});

		return;
	}

	// this key has already been removed or moved, a duplicate!
	_VirtualDom_removeNode(changes, localPatches, key + _VirtualDom_POSTFIX, vnode, index);
}



// ADD DOM NODES
//
// Each DOM node has an "index" assigned in order of traversal. It is important
// to minimize our crawl over the actual DOM, so these indexes (along with the
// descendantsCount of virtual nodes) let us skip touching entire subtrees of
// the DOM if we know there are no patches there.


function _VirtualDom_addDomNodes(domNode, vNode, patches, eventNode)
{
	_VirtualDom_addDomNodesHelp(domNode, vNode, patches, 0, 0, vNode.b, eventNode);
}


// assumes `patches` is non-empty and indexes increase monotonically.
function _VirtualDom_addDomNodesHelp(domNode, vNode, patches, i, low, high, eventNode)
{
	var patch = patches[i];
	var index = patch.r;

	while (index === low)
	{
		var patchType = patch.$;

		if (patchType === 1)
		{
			_VirtualDom_addDomNodes(domNode, vNode.k, patch.s, eventNode);
		}
		else if (patchType === 8)
		{
			patch.t = domNode;
			patch.u = eventNode;

			var subPatches = patch.s.w;
			if (subPatches.length > 0)
			{
				_VirtualDom_addDomNodesHelp(domNode, vNode, subPatches, 0, low, high, eventNode);
			}
		}
		else if (patchType === 9)
		{
			patch.t = domNode;
			patch.u = eventNode;

			var data = patch.s;
			if (data)
			{
				data.A.s = domNode;
				var subPatches = data.w;
				if (subPatches.length > 0)
				{
					_VirtualDom_addDomNodesHelp(domNode, vNode, subPatches, 0, low, high, eventNode);
				}
			}
		}
		else
		{
			patch.t = domNode;
			patch.u = eventNode;
		}

		i++;

		if (!(patch = patches[i]) || (index = patch.r) > high)
		{
			return i;
		}
	}

	var tag = vNode.$;

	if (tag === 4)
	{
		var subNode = vNode.k;

		while (subNode.$ === 4)
		{
			subNode = subNode.k;
		}

		return _VirtualDom_addDomNodesHelp(domNode, subNode, patches, i, low + 1, high, domNode.elm_event_node_ref);
	}

	// tag must be 1 or 2 at this point

	var vKids = vNode.e;
	var childNodes = domNode.childNodes;
	for (var j = 0; j < vKids.length; j++)
	{
		low++;
		var vKid = tag === 1 ? vKids[j] : vKids[j].b;
		var nextLow = low + (vKid.b || 0);
		if (low <= index && index <= nextLow)
		{
			i = _VirtualDom_addDomNodesHelp(childNodes[j], vKid, patches, i, low, nextLow, eventNode);
			if (!(patch = patches[i]) || (index = patch.r) > high)
			{
				return i;
			}
		}
		low = nextLow;
	}
	return i;
}



// APPLY PATCHES


function _VirtualDom_applyPatches(rootDomNode, oldVirtualNode, patches, eventNode)
{
	if (patches.length === 0)
	{
		return rootDomNode;
	}

	_VirtualDom_addDomNodes(rootDomNode, oldVirtualNode, patches, eventNode);
	return _VirtualDom_applyPatchesHelp(rootDomNode, patches);
}

function _VirtualDom_applyPatchesHelp(rootDomNode, patches)
{
	for (var i = 0; i < patches.length; i++)
	{
		var patch = patches[i];
		var localDomNode = patch.t
		var newNode = _VirtualDom_applyPatch(localDomNode, patch);
		if (localDomNode === rootDomNode)
		{
			rootDomNode = newNode;
		}
	}
	return rootDomNode;
}

function _VirtualDom_applyPatch(domNode, patch)
{
	switch (patch.$)
	{
		case 0:
			return _VirtualDom_applyPatchRedraw(domNode, patch.s, patch.u);

		case 4:
			_VirtualDom_applyFacts(domNode, patch.u, patch.s);
			return domNode;

		case 3:
			domNode.replaceData(0, domNode.length, patch.s);
			return domNode;

		case 1:
			return _VirtualDom_applyPatchesHelp(domNode, patch.s);

		case 2:
			if (domNode.elm_event_node_ref)
			{
				domNode.elm_event_node_ref.j = patch.s;
			}
			else
			{
				domNode.elm_event_node_ref = { j: patch.s, p: patch.u };
			}
			return domNode;

		case 6:
			var data = patch.s;
			for (var i = 0; i < data.i; i++)
			{
				domNode.removeChild(domNode.childNodes[data.v]);
			}
			return domNode;

		case 7:
			var data = patch.s;
			var kids = data.e;
			var i = data.v;
			var theEnd = domNode.childNodes[i];
			for (; i < kids.length; i++)
			{
				domNode.insertBefore(_VirtualDom_render(kids[i], patch.u), theEnd);
			}
			return domNode;

		case 9:
			var data = patch.s;
			if (!data)
			{
				domNode.parentNode.removeChild(domNode);
				return domNode;
			}
			var entry = data.A;
			if (typeof entry.r !== 'undefined')
			{
				domNode.parentNode.removeChild(domNode);
			}
			entry.s = _VirtualDom_applyPatchesHelp(domNode, data.w);
			return domNode;

		case 8:
			return _VirtualDom_applyPatchReorder(domNode, patch);

		case 5:
			return patch.s(domNode);

		default:
			_Debug_crash(10); // 'Ran into an unknown patch!'
	}
}


function _VirtualDom_applyPatchRedraw(domNode, vNode, eventNode)
{
	var parentNode = domNode.parentNode;
	var newNode = _VirtualDom_render(vNode, eventNode);

	if (!newNode.elm_event_node_ref)
	{
		newNode.elm_event_node_ref = domNode.elm_event_node_ref;
	}

	if (parentNode && newNode !== domNode)
	{
		parentNode.replaceChild(newNode, domNode);
	}
	return newNode;
}


function _VirtualDom_applyPatchReorder(domNode, patch)
{
	var data = patch.s;

	// remove end inserts
	var frag = _VirtualDom_applyPatchReorderEndInsertsHelp(data.y, patch);

	// removals
	domNode = _VirtualDom_applyPatchesHelp(domNode, data.w);

	// inserts
	var inserts = data.x;
	for (var i = 0; i < inserts.length; i++)
	{
		var insert = inserts[i];
		var entry = insert.A;
		var node = entry.c === 2
			? entry.s
			: _VirtualDom_render(entry.z, patch.u);
		domNode.insertBefore(node, domNode.childNodes[insert.r]);
	}

	// add end inserts
	if (frag)
	{
		_VirtualDom_appendChild(domNode, frag);
	}

	return domNode;
}


function _VirtualDom_applyPatchReorderEndInsertsHelp(endInserts, patch)
{
	if (!endInserts)
	{
		return;
	}

	var frag = _VirtualDom_doc.createDocumentFragment();
	for (var i = 0; i < endInserts.length; i++)
	{
		var insert = endInserts[i];
		var entry = insert.A;
		_VirtualDom_appendChild(frag, entry.c === 2
			? entry.s
			: _VirtualDom_render(entry.z, patch.u)
		);
	}
	return frag;
}


function _VirtualDom_virtualize(node)
{
	// TEXT NODES

	if (node.nodeType === 3)
	{
		return _VirtualDom_text(node.textContent);
	}


	// WEIRD NODES

	if (node.nodeType !== 1)
	{
		return _VirtualDom_text('');
	}


	// ELEMENT NODES

	var attrList = _List_Nil;
	var attrs = node.attributes;
	for (var i = attrs.length; i--; )
	{
		var attr = attrs[i];
		var name = attr.name;
		var value = attr.value;
		attrList = _List_Cons( A2(_VirtualDom_attribute, name, value), attrList );
	}

	var tag = node.tagName.toLowerCase();
	var kidList = _List_Nil;
	var kids = node.childNodes;

	for (var i = kids.length; i--; )
	{
		kidList = _List_Cons(_VirtualDom_virtualize(kids[i]), kidList);
	}
	return A3(_VirtualDom_node, tag, attrList, kidList);
}

function _VirtualDom_dekey(keyedNode)
{
	var keyedKids = keyedNode.e;
	var len = keyedKids.length;
	var kids = new Array(len);
	for (var i = 0; i < len; i++)
	{
		kids[i] = keyedKids[i].b;
	}

	return {
		$: 1,
		c: keyedNode.c,
		d: keyedNode.d,
		e: kids,
		f: keyedNode.f,
		b: keyedNode.b
	};
}




// ELEMENT


var _Debugger_element;

var _Browser_element = _Debugger_element || F4(function(impl, flagDecoder, debugMetadata, args)
{
	return _Platform_initialize(
		flagDecoder,
		args,
		impl.init,
		impl.update,
		impl.subscriptions,
		function(sendToApp, initialModel) {
			var view = impl.view;
			/**_UNUSED/
			var domNode = args['node'];
			//*/
			/**/
			var domNode = args && args['node'] ? args['node'] : _Debug_crash(0);
			//*/
			var currNode = _VirtualDom_virtualize(domNode);

			return _Browser_makeAnimator(initialModel, function(model)
			{
				var nextNode = view(model);
				var patches = _VirtualDom_diff(currNode, nextNode);
				domNode = _VirtualDom_applyPatches(domNode, currNode, patches, sendToApp);
				currNode = nextNode;
			});
		}
	);
});



// DOCUMENT


var _Debugger_document;

var _Browser_document = _Debugger_document || F4(function(impl, flagDecoder, debugMetadata, args)
{
	return _Platform_initialize(
		flagDecoder,
		args,
		impl.init,
		impl.update,
		impl.subscriptions,
		function(sendToApp, initialModel) {
			var divertHrefToApp = impl.setup && impl.setup(sendToApp)
			var view = impl.view;
			var title = _VirtualDom_doc.title;
			var bodyNode = _VirtualDom_doc.body;
			var currNode = _VirtualDom_virtualize(bodyNode);
			return _Browser_makeAnimator(initialModel, function(model)
			{
				_VirtualDom_divertHrefToApp = divertHrefToApp;
				var doc = view(model);
				var nextNode = _VirtualDom_node('body')(_List_Nil)(doc.body);
				var patches = _VirtualDom_diff(currNode, nextNode);
				bodyNode = _VirtualDom_applyPatches(bodyNode, currNode, patches, sendToApp);
				currNode = nextNode;
				_VirtualDom_divertHrefToApp = 0;
				(title !== doc.title) && (_VirtualDom_doc.title = title = doc.title);
			});
		}
	);
});



// ANIMATION


var _Browser_cancelAnimationFrame =
	typeof cancelAnimationFrame !== 'undefined'
		? cancelAnimationFrame
		: function(id) { clearTimeout(id); };

var _Browser_requestAnimationFrame =
	typeof requestAnimationFrame !== 'undefined'
		? requestAnimationFrame
		: function(callback) { return setTimeout(callback, 1000 / 60); };


function _Browser_makeAnimator(model, draw)
{
	draw(model);

	var state = 0;

	function updateIfNeeded()
	{
		state = state === 1
			? 0
			: ( _Browser_requestAnimationFrame(updateIfNeeded), draw(model), 1 );
	}

	return function(nextModel, isSync)
	{
		model = nextModel;

		isSync
			? ( draw(model),
				state === 2 && (state = 1)
				)
			: ( state === 0 && _Browser_requestAnimationFrame(updateIfNeeded),
				state = 2
				);
	};
}



// APPLICATION


function _Browser_application(impl)
{
	var onUrlChange = impl.onUrlChange;
	var onUrlRequest = impl.onUrlRequest;
	var key = function() { key.a(onUrlChange(_Browser_getUrl())); };

	return _Browser_document({
		setup: function(sendToApp)
		{
			key.a = sendToApp;
			_Browser_window.addEventListener('popstate', key);
			_Browser_window.navigator.userAgent.indexOf('Trident') < 0 || _Browser_window.addEventListener('hashchange', key);

			return F2(function(domNode, event)
			{
				if (!event.ctrlKey && !event.metaKey && !event.shiftKey && event.button < 1 && !domNode.target && !domNode.hasAttribute('download'))
				{
					event.preventDefault();
					var href = domNode.href;
					var curr = _Browser_getUrl();
					var next = $elm$url$Url$fromString(href).a;
					sendToApp(onUrlRequest(
						(next
							&& curr.protocol === next.protocol
							&& curr.host === next.host
							&& curr.port_.a === next.port_.a
						)
							? $elm$browser$Browser$Internal(next)
							: $elm$browser$Browser$External(href)
					));
				}
			});
		},
		init: function(flags)
		{
			return A3(impl.init, flags, _Browser_getUrl(), key);
		},
		view: impl.view,
		update: impl.update,
		subscriptions: impl.subscriptions
	});
}

function _Browser_getUrl()
{
	return $elm$url$Url$fromString(_VirtualDom_doc.location.href).a || _Debug_crash(1);
}

var _Browser_go = F2(function(key, n)
{
	return A2($elm$core$Task$perform, $elm$core$Basics$never, _Scheduler_binding(function() {
		n && history.go(n);
		key();
	}));
});

var _Browser_pushUrl = F2(function(key, url)
{
	return A2($elm$core$Task$perform, $elm$core$Basics$never, _Scheduler_binding(function() {
		history.pushState({}, '', url);
		key();
	}));
});

var _Browser_replaceUrl = F2(function(key, url)
{
	return A2($elm$core$Task$perform, $elm$core$Basics$never, _Scheduler_binding(function() {
		history.replaceState({}, '', url);
		key();
	}));
});



// GLOBAL EVENTS


var _Browser_fakeNode = { addEventListener: function() {}, removeEventListener: function() {} };
var _Browser_doc = typeof document !== 'undefined' ? document : _Browser_fakeNode;
var _Browser_window = typeof window !== 'undefined' ? window : _Browser_fakeNode;

var _Browser_on = F3(function(node, eventName, sendToSelf)
{
	return _Scheduler_spawn(_Scheduler_binding(function(callback)
	{
		function handler(event)	{ _Scheduler_rawSpawn(sendToSelf(event)); }
		node.addEventListener(eventName, handler, _VirtualDom_passiveSupported && { passive: true });
		return function() { node.removeEventListener(eventName, handler); };
	}));
});

var _Browser_decodeEvent = F2(function(decoder, event)
{
	var result = _Json_runHelp(decoder, event);
	return $elm$core$Result$isOk(result) ? $elm$core$Maybe$Just(result.a) : $elm$core$Maybe$Nothing;
});



// PAGE VISIBILITY


function _Browser_visibilityInfo()
{
	return (typeof _VirtualDom_doc.hidden !== 'undefined')
		? { hidden: 'hidden', change: 'visibilitychange' }
		:
	(typeof _VirtualDom_doc.mozHidden !== 'undefined')
		? { hidden: 'mozHidden', change: 'mozvisibilitychange' }
		:
	(typeof _VirtualDom_doc.msHidden !== 'undefined')
		? { hidden: 'msHidden', change: 'msvisibilitychange' }
		:
	(typeof _VirtualDom_doc.webkitHidden !== 'undefined')
		? { hidden: 'webkitHidden', change: 'webkitvisibilitychange' }
		: { hidden: 'hidden', change: 'visibilitychange' };
}



// ANIMATION FRAMES


function _Browser_rAF()
{
	return _Scheduler_binding(function(callback)
	{
		var id = _Browser_requestAnimationFrame(function() {
			callback(_Scheduler_succeed(Date.now()));
		});

		return function() {
			_Browser_cancelAnimationFrame(id);
		};
	});
}


function _Browser_now()
{
	return _Scheduler_binding(function(callback)
	{
		callback(_Scheduler_succeed(Date.now()));
	});
}



// DOM STUFF


function _Browser_withNode(id, doStuff)
{
	return _Scheduler_binding(function(callback)
	{
		_Browser_requestAnimationFrame(function() {
			var node = document.getElementById(id);
			callback(node
				? _Scheduler_succeed(doStuff(node))
				: _Scheduler_fail($elm$browser$Browser$Dom$NotFound(id))
			);
		});
	});
}


function _Browser_withWindow(doStuff)
{
	return _Scheduler_binding(function(callback)
	{
		_Browser_requestAnimationFrame(function() {
			callback(_Scheduler_succeed(doStuff()));
		});
	});
}


// FOCUS and BLUR


var _Browser_call = F2(function(functionName, id)
{
	return _Browser_withNode(id, function(node) {
		node[functionName]();
		return _Utils_Tuple0;
	});
});



// WINDOW VIEWPORT


function _Browser_getViewport()
{
	return {
		scene: _Browser_getScene(),
		viewport: {
			x: _Browser_window.pageXOffset,
			y: _Browser_window.pageYOffset,
			width: _Browser_doc.documentElement.clientWidth,
			height: _Browser_doc.documentElement.clientHeight
		}
	};
}

function _Browser_getScene()
{
	var body = _Browser_doc.body;
	var elem = _Browser_doc.documentElement;
	return {
		width: Math.max(body.scrollWidth, body.offsetWidth, elem.scrollWidth, elem.offsetWidth, elem.clientWidth),
		height: Math.max(body.scrollHeight, body.offsetHeight, elem.scrollHeight, elem.offsetHeight, elem.clientHeight)
	};
}

var _Browser_setViewport = F2(function(x, y)
{
	return _Browser_withWindow(function()
	{
		_Browser_window.scroll(x, y);
		return _Utils_Tuple0;
	});
});



// ELEMENT VIEWPORT


function _Browser_getViewportOf(id)
{
	return _Browser_withNode(id, function(node)
	{
		return {
			scene: {
				width: node.scrollWidth,
				height: node.scrollHeight
			},
			viewport: {
				x: node.scrollLeft,
				y: node.scrollTop,
				width: node.clientWidth,
				height: node.clientHeight
			}
		};
	});
}


var _Browser_setViewportOf = F3(function(id, x, y)
{
	return _Browser_withNode(id, function(node)
	{
		node.scrollLeft = x;
		node.scrollTop = y;
		return _Utils_Tuple0;
	});
});



// ELEMENT


function _Browser_getElement(id)
{
	return _Browser_withNode(id, function(node)
	{
		var rect = node.getBoundingClientRect();
		var x = _Browser_window.pageXOffset;
		var y = _Browser_window.pageYOffset;
		return {
			scene: _Browser_getScene(),
			viewport: {
				x: x,
				y: y,
				width: _Browser_doc.documentElement.clientWidth,
				height: _Browser_doc.documentElement.clientHeight
			},
			element: {
				x: x + rect.left,
				y: y + rect.top,
				width: rect.width,
				height: rect.height
			}
		};
	});
}



// LOAD and RELOAD


function _Browser_reload(skipCache)
{
	return A2($elm$core$Task$perform, $elm$core$Basics$never, _Scheduler_binding(function(callback)
	{
		_VirtualDom_doc.location.reload(skipCache);
	}));
}

function _Browser_load(url)
{
	return A2($elm$core$Task$perform, $elm$core$Basics$never, _Scheduler_binding(function(callback)
	{
		try
		{
			_Browser_window.location = url;
		}
		catch(err)
		{
			// Only Firefox can throw a NS_ERROR_MALFORMED_URI exception here.
			// Other browsers reload the page, so let's be consistent about that.
			_VirtualDom_doc.location.reload(false);
		}
	}));
}



var _Bitwise_and = F2(function(a, b)
{
	return a & b;
});

var _Bitwise_or = F2(function(a, b)
{
	return a | b;
});

var _Bitwise_xor = F2(function(a, b)
{
	return a ^ b;
});

function _Bitwise_complement(a)
{
	return ~a;
};

var _Bitwise_shiftLeftBy = F2(function(offset, a)
{
	return a << offset;
});

var _Bitwise_shiftRightBy = F2(function(offset, a)
{
	return a >> offset;
});

var _Bitwise_shiftRightZfBy = F2(function(offset, a)
{
	return a >>> offset;
});



function _Time_now(millisToPosix)
{
	return _Scheduler_binding(function(callback)
	{
		callback(_Scheduler_succeed(millisToPosix(Date.now())));
	});
}

var _Time_setInterval = F2(function(interval, task)
{
	return _Scheduler_binding(function(callback)
	{
		var id = setInterval(function() { _Scheduler_rawSpawn(task); }, interval);
		return function() { clearInterval(id); };
	});
});

function _Time_here()
{
	return _Scheduler_binding(function(callback)
	{
		callback(_Scheduler_succeed(
			A2($elm$time$Time$customZone, -(new Date().getTimezoneOffset()), _List_Nil)
		));
	});
}


function _Time_getZoneName()
{
	return _Scheduler_binding(function(callback)
	{
		try
		{
			var name = $elm$time$Time$Name(Intl.DateTimeFormat().resolvedOptions().timeZone);
		}
		catch (e)
		{
			var name = $elm$time$Time$Offset(new Date().getTimezoneOffset());
		}
		callback(_Scheduler_succeed(name));
	});
}




// STRINGS


var _Parser_isSubString = F5(function(smallString, offset, row, col, bigString)
{
	var smallLength = smallString.length;
	var isGood = offset + smallLength <= bigString.length;

	for (var i = 0; isGood && i < smallLength; )
	{
		var code = bigString.charCodeAt(offset);
		isGood =
			smallString[i++] === bigString[offset++]
			&& (
				code === 0x000A /* \n */
					? ( row++, col=1 )
					: ( col++, (code & 0xF800) === 0xD800 ? smallString[i++] === bigString[offset++] : 1 )
			)
	}

	return _Utils_Tuple3(isGood ? offset : -1, row, col);
});



// CHARS


var _Parser_isSubChar = F3(function(predicate, offset, string)
{
	return (
		string.length <= offset
			? -1
			:
		(string.charCodeAt(offset) & 0xF800) === 0xD800
			? (predicate(_Utils_chr(string.substr(offset, 2))) ? offset + 2 : -1)
			:
		(predicate(_Utils_chr(string[offset]))
			? ((string[offset] === '\n') ? -2 : (offset + 1))
			: -1
		)
	);
});


var _Parser_isAsciiCode = F3(function(code, offset, string)
{
	return string.charCodeAt(offset) === code;
});



// NUMBERS


var _Parser_chompBase10 = F2(function(offset, string)
{
	for (; offset < string.length; offset++)
	{
		var code = string.charCodeAt(offset);
		if (code < 0x30 || 0x39 < code)
		{
			return offset;
		}
	}
	return offset;
});


var _Parser_consumeBase = F3(function(base, offset, string)
{
	for (var total = 0; offset < string.length; offset++)
	{
		var digit = string.charCodeAt(offset) - 0x30;
		if (digit < 0 || base <= digit) break;
		total = base * total + digit;
	}
	return _Utils_Tuple2(offset, total);
});


var _Parser_consumeBase16 = F2(function(offset, string)
{
	for (var total = 0; offset < string.length; offset++)
	{
		var code = string.charCodeAt(offset);
		if (0x30 <= code && code <= 0x39)
		{
			total = 16 * total + code - 0x30;
		}
		else if (0x41 <= code && code <= 0x46)
		{
			total = 16 * total + code - 55;
		}
		else if (0x61 <= code && code <= 0x66)
		{
			total = 16 * total + code - 87;
		}
		else
		{
			break;
		}
	}
	return _Utils_Tuple2(offset, total);
});



// FIND STRING


var _Parser_findSubString = F5(function(smallString, offset, row, col, bigString)
{
	var newOffset = bigString.indexOf(smallString, offset);
	var target = newOffset < 0 ? bigString.length : newOffset + smallString.length;

	while (offset < target)
	{
		var code = bigString.charCodeAt(offset++);
		code === 0x000A /* \n */
			? ( col=1, row++ )
			: ( col++, (code & 0xF800) === 0xD800 && offset++ )
	}

	return _Utils_Tuple3(newOffset, row, col);
});
var $author$project$Main$NoOp = {$: 'NoOp'};
var $elm$core$Basics$always = F2(
	function (a, _v0) {
		return a;
	});
var $elm$core$Basics$EQ = {$: 'EQ'};
var $elm$core$Basics$GT = {$: 'GT'};
var $elm$core$Basics$LT = {$: 'LT'};
var $elm$core$List$cons = _List_cons;
var $elm$core$Dict$foldr = F3(
	function (func, acc, t) {
		foldr:
		while (true) {
			if (t.$ === 'RBEmpty_elm_builtin') {
				return acc;
			} else {
				var key = t.b;
				var value = t.c;
				var left = t.d;
				var right = t.e;
				var $temp$func = func,
					$temp$acc = A3(
					func,
					key,
					value,
					A3($elm$core$Dict$foldr, func, acc, right)),
					$temp$t = left;
				func = $temp$func;
				acc = $temp$acc;
				t = $temp$t;
				continue foldr;
			}
		}
	});
var $elm$core$Dict$toList = function (dict) {
	return A3(
		$elm$core$Dict$foldr,
		F3(
			function (key, value, list) {
				return A2(
					$elm$core$List$cons,
					_Utils_Tuple2(key, value),
					list);
			}),
		_List_Nil,
		dict);
};
var $elm$core$Dict$keys = function (dict) {
	return A3(
		$elm$core$Dict$foldr,
		F3(
			function (key, value, keyList) {
				return A2($elm$core$List$cons, key, keyList);
			}),
		_List_Nil,
		dict);
};
var $elm$core$Set$toList = function (_v0) {
	var dict = _v0.a;
	return $elm$core$Dict$keys(dict);
};
var $elm$core$Elm$JsArray$foldr = _JsArray_foldr;
var $elm$core$Array$foldr = F3(
	function (func, baseCase, _v0) {
		var tree = _v0.c;
		var tail = _v0.d;
		var helper = F2(
			function (node, acc) {
				if (node.$ === 'SubTree') {
					var subTree = node.a;
					return A3($elm$core$Elm$JsArray$foldr, helper, acc, subTree);
				} else {
					var values = node.a;
					return A3($elm$core$Elm$JsArray$foldr, func, acc, values);
				}
			});
		return A3(
			$elm$core$Elm$JsArray$foldr,
			helper,
			A3($elm$core$Elm$JsArray$foldr, func, baseCase, tail),
			tree);
	});
var $elm$core$Array$toList = function (array) {
	return A3($elm$core$Array$foldr, $elm$core$List$cons, _List_Nil, array);
};
var $elm$core$Result$Err = function (a) {
	return {$: 'Err', a: a};
};
var $elm$json$Json$Decode$Failure = F2(
	function (a, b) {
		return {$: 'Failure', a: a, b: b};
	});
var $elm$json$Json$Decode$Field = F2(
	function (a, b) {
		return {$: 'Field', a: a, b: b};
	});
var $elm$json$Json$Decode$Index = F2(
	function (a, b) {
		return {$: 'Index', a: a, b: b};
	});
var $elm$core$Result$Ok = function (a) {
	return {$: 'Ok', a: a};
};
var $elm$json$Json$Decode$OneOf = function (a) {
	return {$: 'OneOf', a: a};
};
var $elm$core$Basics$False = {$: 'False'};
var $elm$core$Basics$add = _Basics_add;
var $elm$core$Maybe$Just = function (a) {
	return {$: 'Just', a: a};
};
var $elm$core$Maybe$Nothing = {$: 'Nothing'};
var $elm$core$String$all = _String_all;
var $elm$core$Basics$and = _Basics_and;
var $elm$core$Basics$append = _Utils_append;
var $elm$json$Json$Encode$encode = _Json_encode;
var $elm$core$String$fromInt = _String_fromNumber;
var $elm$core$String$join = F2(
	function (sep, chunks) {
		return A2(
			_String_join,
			sep,
			_List_toArray(chunks));
	});
var $elm$core$String$split = F2(
	function (sep, string) {
		return _List_fromArray(
			A2(_String_split, sep, string));
	});
var $elm$json$Json$Decode$indent = function (str) {
	return A2(
		$elm$core$String$join,
		'\n    ',
		A2($elm$core$String$split, '\n', str));
};
var $elm$core$List$foldl = F3(
	function (func, acc, list) {
		foldl:
		while (true) {
			if (!list.b) {
				return acc;
			} else {
				var x = list.a;
				var xs = list.b;
				var $temp$func = func,
					$temp$acc = A2(func, x, acc),
					$temp$list = xs;
				func = $temp$func;
				acc = $temp$acc;
				list = $temp$list;
				continue foldl;
			}
		}
	});
var $elm$core$List$length = function (xs) {
	return A3(
		$elm$core$List$foldl,
		F2(
			function (_v0, i) {
				return i + 1;
			}),
		0,
		xs);
};
var $elm$core$List$map2 = _List_map2;
var $elm$core$Basics$le = _Utils_le;
var $elm$core$Basics$sub = _Basics_sub;
var $elm$core$List$rangeHelp = F3(
	function (lo, hi, list) {
		rangeHelp:
		while (true) {
			if (_Utils_cmp(lo, hi) < 1) {
				var $temp$lo = lo,
					$temp$hi = hi - 1,
					$temp$list = A2($elm$core$List$cons, hi, list);
				lo = $temp$lo;
				hi = $temp$hi;
				list = $temp$list;
				continue rangeHelp;
			} else {
				return list;
			}
		}
	});
var $elm$core$List$range = F2(
	function (lo, hi) {
		return A3($elm$core$List$rangeHelp, lo, hi, _List_Nil);
	});
var $elm$core$List$indexedMap = F2(
	function (f, xs) {
		return A3(
			$elm$core$List$map2,
			f,
			A2(
				$elm$core$List$range,
				0,
				$elm$core$List$length(xs) - 1),
			xs);
	});
var $elm$core$Char$toCode = _Char_toCode;
var $elm$core$Char$isLower = function (_char) {
	var code = $elm$core$Char$toCode(_char);
	return (97 <= code) && (code <= 122);
};
var $elm$core$Char$isUpper = function (_char) {
	var code = $elm$core$Char$toCode(_char);
	return (code <= 90) && (65 <= code);
};
var $elm$core$Basics$or = _Basics_or;
var $elm$core$Char$isAlpha = function (_char) {
	return $elm$core$Char$isLower(_char) || $elm$core$Char$isUpper(_char);
};
var $elm$core$Char$isDigit = function (_char) {
	var code = $elm$core$Char$toCode(_char);
	return (code <= 57) && (48 <= code);
};
var $elm$core$Char$isAlphaNum = function (_char) {
	return $elm$core$Char$isLower(_char) || ($elm$core$Char$isUpper(_char) || $elm$core$Char$isDigit(_char));
};
var $elm$core$List$reverse = function (list) {
	return A3($elm$core$List$foldl, $elm$core$List$cons, _List_Nil, list);
};
var $elm$core$String$uncons = _String_uncons;
var $elm$json$Json$Decode$errorOneOf = F2(
	function (i, error) {
		return '\n\n(' + ($elm$core$String$fromInt(i + 1) + (') ' + $elm$json$Json$Decode$indent(
			$elm$json$Json$Decode$errorToString(error))));
	});
var $elm$json$Json$Decode$errorToString = function (error) {
	return A2($elm$json$Json$Decode$errorToStringHelp, error, _List_Nil);
};
var $elm$json$Json$Decode$errorToStringHelp = F2(
	function (error, context) {
		errorToStringHelp:
		while (true) {
			switch (error.$) {
				case 'Field':
					var f = error.a;
					var err = error.b;
					var isSimple = function () {
						var _v1 = $elm$core$String$uncons(f);
						if (_v1.$ === 'Nothing') {
							return false;
						} else {
							var _v2 = _v1.a;
							var _char = _v2.a;
							var rest = _v2.b;
							return $elm$core$Char$isAlpha(_char) && A2($elm$core$String$all, $elm$core$Char$isAlphaNum, rest);
						}
					}();
					var fieldName = isSimple ? ('.' + f) : ('[\'' + (f + '\']'));
					var $temp$error = err,
						$temp$context = A2($elm$core$List$cons, fieldName, context);
					error = $temp$error;
					context = $temp$context;
					continue errorToStringHelp;
				case 'Index':
					var i = error.a;
					var err = error.b;
					var indexName = '[' + ($elm$core$String$fromInt(i) + ']');
					var $temp$error = err,
						$temp$context = A2($elm$core$List$cons, indexName, context);
					error = $temp$error;
					context = $temp$context;
					continue errorToStringHelp;
				case 'OneOf':
					var errors = error.a;
					if (!errors.b) {
						return 'Ran into a Json.Decode.oneOf with no possibilities' + function () {
							if (!context.b) {
								return '!';
							} else {
								return ' at json' + A2(
									$elm$core$String$join,
									'',
									$elm$core$List$reverse(context));
							}
						}();
					} else {
						if (!errors.b.b) {
							var err = errors.a;
							var $temp$error = err,
								$temp$context = context;
							error = $temp$error;
							context = $temp$context;
							continue errorToStringHelp;
						} else {
							var starter = function () {
								if (!context.b) {
									return 'Json.Decode.oneOf';
								} else {
									return 'The Json.Decode.oneOf at json' + A2(
										$elm$core$String$join,
										'',
										$elm$core$List$reverse(context));
								}
							}();
							var introduction = starter + (' failed in the following ' + ($elm$core$String$fromInt(
								$elm$core$List$length(errors)) + ' ways:'));
							return A2(
								$elm$core$String$join,
								'\n\n',
								A2(
									$elm$core$List$cons,
									introduction,
									A2($elm$core$List$indexedMap, $elm$json$Json$Decode$errorOneOf, errors)));
						}
					}
				default:
					var msg = error.a;
					var json = error.b;
					var introduction = function () {
						if (!context.b) {
							return 'Problem with the given value:\n\n';
						} else {
							return 'Problem with the value at json' + (A2(
								$elm$core$String$join,
								'',
								$elm$core$List$reverse(context)) + ':\n\n    ');
						}
					}();
					return introduction + ($elm$json$Json$Decode$indent(
						A2($elm$json$Json$Encode$encode, 4, json)) + ('\n\n' + msg));
			}
		}
	});
var $elm$core$Array$branchFactor = 32;
var $elm$core$Array$Array_elm_builtin = F4(
	function (a, b, c, d) {
		return {$: 'Array_elm_builtin', a: a, b: b, c: c, d: d};
	});
var $elm$core$Elm$JsArray$empty = _JsArray_empty;
var $elm$core$Basics$ceiling = _Basics_ceiling;
var $elm$core$Basics$fdiv = _Basics_fdiv;
var $elm$core$Basics$logBase = F2(
	function (base, number) {
		return _Basics_log(number) / _Basics_log(base);
	});
var $elm$core$Basics$toFloat = _Basics_toFloat;
var $elm$core$Array$shiftStep = $elm$core$Basics$ceiling(
	A2($elm$core$Basics$logBase, 2, $elm$core$Array$branchFactor));
var $elm$core$Array$empty = A4($elm$core$Array$Array_elm_builtin, 0, $elm$core$Array$shiftStep, $elm$core$Elm$JsArray$empty, $elm$core$Elm$JsArray$empty);
var $elm$core$Elm$JsArray$initialize = _JsArray_initialize;
var $elm$core$Array$Leaf = function (a) {
	return {$: 'Leaf', a: a};
};
var $elm$core$Basics$apL = F2(
	function (f, x) {
		return f(x);
	});
var $elm$core$Basics$apR = F2(
	function (x, f) {
		return f(x);
	});
var $elm$core$Basics$eq = _Utils_equal;
var $elm$core$Basics$floor = _Basics_floor;
var $elm$core$Elm$JsArray$length = _JsArray_length;
var $elm$core$Basics$gt = _Utils_gt;
var $elm$core$Basics$max = F2(
	function (x, y) {
		return (_Utils_cmp(x, y) > 0) ? x : y;
	});
var $elm$core$Basics$mul = _Basics_mul;
var $elm$core$Array$SubTree = function (a) {
	return {$: 'SubTree', a: a};
};
var $elm$core$Elm$JsArray$initializeFromList = _JsArray_initializeFromList;
var $elm$core$Array$compressNodes = F2(
	function (nodes, acc) {
		compressNodes:
		while (true) {
			var _v0 = A2($elm$core$Elm$JsArray$initializeFromList, $elm$core$Array$branchFactor, nodes);
			var node = _v0.a;
			var remainingNodes = _v0.b;
			var newAcc = A2(
				$elm$core$List$cons,
				$elm$core$Array$SubTree(node),
				acc);
			if (!remainingNodes.b) {
				return $elm$core$List$reverse(newAcc);
			} else {
				var $temp$nodes = remainingNodes,
					$temp$acc = newAcc;
				nodes = $temp$nodes;
				acc = $temp$acc;
				continue compressNodes;
			}
		}
	});
var $elm$core$Tuple$first = function (_v0) {
	var x = _v0.a;
	return x;
};
var $elm$core$Array$treeFromBuilder = F2(
	function (nodeList, nodeListSize) {
		treeFromBuilder:
		while (true) {
			var newNodeSize = $elm$core$Basics$ceiling(nodeListSize / $elm$core$Array$branchFactor);
			if (newNodeSize === 1) {
				return A2($elm$core$Elm$JsArray$initializeFromList, $elm$core$Array$branchFactor, nodeList).a;
			} else {
				var $temp$nodeList = A2($elm$core$Array$compressNodes, nodeList, _List_Nil),
					$temp$nodeListSize = newNodeSize;
				nodeList = $temp$nodeList;
				nodeListSize = $temp$nodeListSize;
				continue treeFromBuilder;
			}
		}
	});
var $elm$core$Array$builderToArray = F2(
	function (reverseNodeList, builder) {
		if (!builder.nodeListSize) {
			return A4(
				$elm$core$Array$Array_elm_builtin,
				$elm$core$Elm$JsArray$length(builder.tail),
				$elm$core$Array$shiftStep,
				$elm$core$Elm$JsArray$empty,
				builder.tail);
		} else {
			var treeLen = builder.nodeListSize * $elm$core$Array$branchFactor;
			var depth = $elm$core$Basics$floor(
				A2($elm$core$Basics$logBase, $elm$core$Array$branchFactor, treeLen - 1));
			var correctNodeList = reverseNodeList ? $elm$core$List$reverse(builder.nodeList) : builder.nodeList;
			var tree = A2($elm$core$Array$treeFromBuilder, correctNodeList, builder.nodeListSize);
			return A4(
				$elm$core$Array$Array_elm_builtin,
				$elm$core$Elm$JsArray$length(builder.tail) + treeLen,
				A2($elm$core$Basics$max, 5, depth * $elm$core$Array$shiftStep),
				tree,
				builder.tail);
		}
	});
var $elm$core$Basics$idiv = _Basics_idiv;
var $elm$core$Basics$lt = _Utils_lt;
var $elm$core$Array$initializeHelp = F5(
	function (fn, fromIndex, len, nodeList, tail) {
		initializeHelp:
		while (true) {
			if (fromIndex < 0) {
				return A2(
					$elm$core$Array$builderToArray,
					false,
					{nodeList: nodeList, nodeListSize: (len / $elm$core$Array$branchFactor) | 0, tail: tail});
			} else {
				var leaf = $elm$core$Array$Leaf(
					A3($elm$core$Elm$JsArray$initialize, $elm$core$Array$branchFactor, fromIndex, fn));
				var $temp$fn = fn,
					$temp$fromIndex = fromIndex - $elm$core$Array$branchFactor,
					$temp$len = len,
					$temp$nodeList = A2($elm$core$List$cons, leaf, nodeList),
					$temp$tail = tail;
				fn = $temp$fn;
				fromIndex = $temp$fromIndex;
				len = $temp$len;
				nodeList = $temp$nodeList;
				tail = $temp$tail;
				continue initializeHelp;
			}
		}
	});
var $elm$core$Basics$remainderBy = _Basics_remainderBy;
var $elm$core$Array$initialize = F2(
	function (len, fn) {
		if (len <= 0) {
			return $elm$core$Array$empty;
		} else {
			var tailLen = len % $elm$core$Array$branchFactor;
			var tail = A3($elm$core$Elm$JsArray$initialize, tailLen, len - tailLen, fn);
			var initialFromIndex = (len - tailLen) - $elm$core$Array$branchFactor;
			return A5($elm$core$Array$initializeHelp, fn, initialFromIndex, len, _List_Nil, tail);
		}
	});
var $elm$core$Basics$True = {$: 'True'};
var $elm$core$Result$isOk = function (result) {
	if (result.$ === 'Ok') {
		return true;
	} else {
		return false;
	}
};
var $elm$json$Json$Decode$map = _Json_map1;
var $elm$json$Json$Decode$map2 = _Json_map2;
var $elm$json$Json$Decode$succeed = _Json_succeed;
var $elm$virtual_dom$VirtualDom$toHandlerInt = function (handler) {
	switch (handler.$) {
		case 'Normal':
			return 0;
		case 'MayStopPropagation':
			return 1;
		case 'MayPreventDefault':
			return 2;
		default:
			return 3;
	}
};
var $elm$browser$Browser$External = function (a) {
	return {$: 'External', a: a};
};
var $elm$browser$Browser$Internal = function (a) {
	return {$: 'Internal', a: a};
};
var $elm$core$Basics$identity = function (x) {
	return x;
};
var $elm$browser$Browser$Dom$NotFound = function (a) {
	return {$: 'NotFound', a: a};
};
var $elm$url$Url$Http = {$: 'Http'};
var $elm$url$Url$Https = {$: 'Https'};
var $elm$url$Url$Url = F6(
	function (protocol, host, port_, path, query, fragment) {
		return {fragment: fragment, host: host, path: path, port_: port_, protocol: protocol, query: query};
	});
var $elm$core$String$contains = _String_contains;
var $elm$core$String$length = _String_length;
var $elm$core$String$slice = _String_slice;
var $elm$core$String$dropLeft = F2(
	function (n, string) {
		return (n < 1) ? string : A3(
			$elm$core$String$slice,
			n,
			$elm$core$String$length(string),
			string);
	});
var $elm$core$String$indexes = _String_indexes;
var $elm$core$String$isEmpty = function (string) {
	return string === '';
};
var $elm$core$String$left = F2(
	function (n, string) {
		return (n < 1) ? '' : A3($elm$core$String$slice, 0, n, string);
	});
var $elm$core$String$toInt = _String_toInt;
var $elm$url$Url$chompBeforePath = F5(
	function (protocol, path, params, frag, str) {
		if ($elm$core$String$isEmpty(str) || A2($elm$core$String$contains, '@', str)) {
			return $elm$core$Maybe$Nothing;
		} else {
			var _v0 = A2($elm$core$String$indexes, ':', str);
			if (!_v0.b) {
				return $elm$core$Maybe$Just(
					A6($elm$url$Url$Url, protocol, str, $elm$core$Maybe$Nothing, path, params, frag));
			} else {
				if (!_v0.b.b) {
					var i = _v0.a;
					var _v1 = $elm$core$String$toInt(
						A2($elm$core$String$dropLeft, i + 1, str));
					if (_v1.$ === 'Nothing') {
						return $elm$core$Maybe$Nothing;
					} else {
						var port_ = _v1;
						return $elm$core$Maybe$Just(
							A6(
								$elm$url$Url$Url,
								protocol,
								A2($elm$core$String$left, i, str),
								port_,
								path,
								params,
								frag));
					}
				} else {
					return $elm$core$Maybe$Nothing;
				}
			}
		}
	});
var $elm$url$Url$chompBeforeQuery = F4(
	function (protocol, params, frag, str) {
		if ($elm$core$String$isEmpty(str)) {
			return $elm$core$Maybe$Nothing;
		} else {
			var _v0 = A2($elm$core$String$indexes, '/', str);
			if (!_v0.b) {
				return A5($elm$url$Url$chompBeforePath, protocol, '/', params, frag, str);
			} else {
				var i = _v0.a;
				return A5(
					$elm$url$Url$chompBeforePath,
					protocol,
					A2($elm$core$String$dropLeft, i, str),
					params,
					frag,
					A2($elm$core$String$left, i, str));
			}
		}
	});
var $elm$url$Url$chompBeforeFragment = F3(
	function (protocol, frag, str) {
		if ($elm$core$String$isEmpty(str)) {
			return $elm$core$Maybe$Nothing;
		} else {
			var _v0 = A2($elm$core$String$indexes, '?', str);
			if (!_v0.b) {
				return A4($elm$url$Url$chompBeforeQuery, protocol, $elm$core$Maybe$Nothing, frag, str);
			} else {
				var i = _v0.a;
				return A4(
					$elm$url$Url$chompBeforeQuery,
					protocol,
					$elm$core$Maybe$Just(
						A2($elm$core$String$dropLeft, i + 1, str)),
					frag,
					A2($elm$core$String$left, i, str));
			}
		}
	});
var $elm$url$Url$chompAfterProtocol = F2(
	function (protocol, str) {
		if ($elm$core$String$isEmpty(str)) {
			return $elm$core$Maybe$Nothing;
		} else {
			var _v0 = A2($elm$core$String$indexes, '#', str);
			if (!_v0.b) {
				return A3($elm$url$Url$chompBeforeFragment, protocol, $elm$core$Maybe$Nothing, str);
			} else {
				var i = _v0.a;
				return A3(
					$elm$url$Url$chompBeforeFragment,
					protocol,
					$elm$core$Maybe$Just(
						A2($elm$core$String$dropLeft, i + 1, str)),
					A2($elm$core$String$left, i, str));
			}
		}
	});
var $elm$core$String$startsWith = _String_startsWith;
var $elm$url$Url$fromString = function (str) {
	return A2($elm$core$String$startsWith, 'http://', str) ? A2(
		$elm$url$Url$chompAfterProtocol,
		$elm$url$Url$Http,
		A2($elm$core$String$dropLeft, 7, str)) : (A2($elm$core$String$startsWith, 'https://', str) ? A2(
		$elm$url$Url$chompAfterProtocol,
		$elm$url$Url$Https,
		A2($elm$core$String$dropLeft, 8, str)) : $elm$core$Maybe$Nothing);
};
var $elm$core$Basics$never = function (_v0) {
	never:
	while (true) {
		var nvr = _v0.a;
		var $temp$_v0 = nvr;
		_v0 = $temp$_v0;
		continue never;
	}
};
var $elm$core$Task$Perform = function (a) {
	return {$: 'Perform', a: a};
};
var $elm$core$Task$succeed = _Scheduler_succeed;
var $elm$core$Task$init = $elm$core$Task$succeed(_Utils_Tuple0);
var $elm$core$List$foldrHelper = F4(
	function (fn, acc, ctr, ls) {
		if (!ls.b) {
			return acc;
		} else {
			var a = ls.a;
			var r1 = ls.b;
			if (!r1.b) {
				return A2(fn, a, acc);
			} else {
				var b = r1.a;
				var r2 = r1.b;
				if (!r2.b) {
					return A2(
						fn,
						a,
						A2(fn, b, acc));
				} else {
					var c = r2.a;
					var r3 = r2.b;
					if (!r3.b) {
						return A2(
							fn,
							a,
							A2(
								fn,
								b,
								A2(fn, c, acc)));
					} else {
						var d = r3.a;
						var r4 = r3.b;
						var res = (ctr > 500) ? A3(
							$elm$core$List$foldl,
							fn,
							acc,
							$elm$core$List$reverse(r4)) : A4($elm$core$List$foldrHelper, fn, acc, ctr + 1, r4);
						return A2(
							fn,
							a,
							A2(
								fn,
								b,
								A2(
									fn,
									c,
									A2(fn, d, res))));
					}
				}
			}
		}
	});
var $elm$core$List$foldr = F3(
	function (fn, acc, ls) {
		return A4($elm$core$List$foldrHelper, fn, acc, 0, ls);
	});
var $elm$core$List$map = F2(
	function (f, xs) {
		return A3(
			$elm$core$List$foldr,
			F2(
				function (x, acc) {
					return A2(
						$elm$core$List$cons,
						f(x),
						acc);
				}),
			_List_Nil,
			xs);
	});
var $elm$core$Task$andThen = _Scheduler_andThen;
var $elm$core$Task$map = F2(
	function (func, taskA) {
		return A2(
			$elm$core$Task$andThen,
			function (a) {
				return $elm$core$Task$succeed(
					func(a));
			},
			taskA);
	});
var $elm$core$Task$map2 = F3(
	function (func, taskA, taskB) {
		return A2(
			$elm$core$Task$andThen,
			function (a) {
				return A2(
					$elm$core$Task$andThen,
					function (b) {
						return $elm$core$Task$succeed(
							A2(func, a, b));
					},
					taskB);
			},
			taskA);
	});
var $elm$core$Task$sequence = function (tasks) {
	return A3(
		$elm$core$List$foldr,
		$elm$core$Task$map2($elm$core$List$cons),
		$elm$core$Task$succeed(_List_Nil),
		tasks);
};
var $elm$core$Platform$sendToApp = _Platform_sendToApp;
var $elm$core$Task$spawnCmd = F2(
	function (router, _v0) {
		var task = _v0.a;
		return _Scheduler_spawn(
			A2(
				$elm$core$Task$andThen,
				$elm$core$Platform$sendToApp(router),
				task));
	});
var $elm$core$Task$onEffects = F3(
	function (router, commands, state) {
		return A2(
			$elm$core$Task$map,
			function (_v0) {
				return _Utils_Tuple0;
			},
			$elm$core$Task$sequence(
				A2(
					$elm$core$List$map,
					$elm$core$Task$spawnCmd(router),
					commands)));
	});
var $elm$core$Task$onSelfMsg = F3(
	function (_v0, _v1, _v2) {
		return $elm$core$Task$succeed(_Utils_Tuple0);
	});
var $elm$core$Task$cmdMap = F2(
	function (tagger, _v0) {
		var task = _v0.a;
		return $elm$core$Task$Perform(
			A2($elm$core$Task$map, tagger, task));
	});
_Platform_effectManagers['Task'] = _Platform_createManager($elm$core$Task$init, $elm$core$Task$onEffects, $elm$core$Task$onSelfMsg, $elm$core$Task$cmdMap);
var $elm$core$Task$command = _Platform_leaf('Task');
var $elm$core$Task$perform = F2(
	function (toMessage, task) {
		return $elm$core$Task$command(
			$elm$core$Task$Perform(
				A2($elm$core$Task$map, toMessage, task)));
	});
var $elm$browser$Browser$application = _Browser_application;
var $author$project$Main$Ttrl = function (a) {
	return {$: 'Ttrl', a: a};
};
var $elm$core$Platform$Cmd$batch = _Platform_batch;
var $author$project$Main$GotBoard = function (a) {
	return {$: 'GotBoard', a: a};
};
var $elm$core$Basics$composeL = F3(
	function (g, f, x) {
		return g(
			f(x));
	});
var $elm$core$Task$onError = _Scheduler_onError;
var $elm$core$Task$attempt = F2(
	function (resultToMessage, task) {
		return $elm$core$Task$command(
			$elm$core$Task$Perform(
				A2(
					$elm$core$Task$onError,
					A2(
						$elm$core$Basics$composeL,
						A2($elm$core$Basics$composeL, $elm$core$Task$succeed, resultToMessage),
						$elm$core$Result$Err),
					A2(
						$elm$core$Task$andThen,
						A2(
							$elm$core$Basics$composeL,
							A2($elm$core$Basics$composeL, $elm$core$Task$succeed, resultToMessage),
							$elm$core$Result$Ok),
						task))));
	});
var $author$project$Main$boardId = 'board';
var $elm$browser$Browser$Dom$getElement = _Browser_getElement;
var $author$project$Main$getBoard = A2(
	$elm$core$Task$attempt,
	$author$project$Main$GotBoard,
	$elm$browser$Browser$Dom$getElement($author$project$Main$boardId));
var $author$project$Main$buildMultilineId = F2(
	function (prefix, i) {
		return prefix + ('-' + $elm$core$String$fromInt(i));
	});
var $elm$core$Bitwise$and = _Bitwise_and;
var $elm$core$Bitwise$shiftRightZfBy = _Bitwise_shiftRightZfBy;
var $elm$core$Array$bitMask = 4294967295 >>> (32 - $elm$core$Array$shiftStep);
var $elm$core$Basics$ge = _Utils_ge;
var $elm$core$Elm$JsArray$unsafeGet = _JsArray_unsafeGet;
var $elm$core$Array$getHelp = F3(
	function (shift, index, tree) {
		getHelp:
		while (true) {
			var pos = $elm$core$Array$bitMask & (index >>> shift);
			var _v0 = A2($elm$core$Elm$JsArray$unsafeGet, pos, tree);
			if (_v0.$ === 'SubTree') {
				var subTree = _v0.a;
				var $temp$shift = shift - $elm$core$Array$shiftStep,
					$temp$index = index,
					$temp$tree = subTree;
				shift = $temp$shift;
				index = $temp$index;
				tree = $temp$tree;
				continue getHelp;
			} else {
				var values = _v0.a;
				return A2($elm$core$Elm$JsArray$unsafeGet, $elm$core$Array$bitMask & index, values);
			}
		}
	});
var $elm$core$Bitwise$shiftLeftBy = _Bitwise_shiftLeftBy;
var $elm$core$Array$tailIndex = function (len) {
	return (len >>> 5) << 5;
};
var $elm$core$Array$get = F2(
	function (index, _v0) {
		var len = _v0.a;
		var startShift = _v0.b;
		var tree = _v0.c;
		var tail = _v0.d;
		return ((index < 0) || (_Utils_cmp(index, len) > -1)) ? $elm$core$Maybe$Nothing : ((_Utils_cmp(
			index,
			$elm$core$Array$tailIndex(len)) > -1) ? $elm$core$Maybe$Just(
			A2($elm$core$Elm$JsArray$unsafeGet, $elm$core$Array$bitMask & index, tail)) : $elm$core$Maybe$Just(
			A3($elm$core$Array$getHelp, startShift, index, tree)));
	});
var $elm$core$Maybe$map = F2(
	function (f, maybe) {
		if (maybe.$ === 'Just') {
			var value = maybe.a;
			return $elm$core$Maybe$Just(
				f(value));
		} else {
			return $elm$core$Maybe$Nothing;
		}
	});
var $author$project$Main$stepToText = function (step) {
	var _v0 = step.instr;
	if (_v0.$ === 'StaticInstr') {
		var text = _v0.a.text;
		return text;
	} else {
		var text = _v0.a.text;
		return text;
	}
};
var $author$project$Main$Act = {$: 'Act'};
var $author$project$Main$Callout = function (a) {
	return {$: 'Callout', a: a};
};
var $author$project$Main$Collect = {$: 'Collect'};
var $author$project$Main$GUBoard = {$: 'GUBoard'};
var $author$project$Main$GUConfirmButton = {$: 'GUConfirmButton'};
var $author$project$Main$GUCprIcon = {$: 'GUCprIcon'};
var $author$project$Main$GUCprTotal = {$: 'GUCprTotal'};
var $author$project$Main$GUOppPay = {$: 'GUOppPay'};
var $author$project$Main$GUOthers = {$: 'GUOthers'};
var $author$project$Main$GUPttIcon = {$: 'GUPttIcon'};
var $author$project$Main$GUPttTotal = {$: 'GUPttTotal'};
var $author$project$Main$GUSlfPay = {$: 'GUSlfPay'};
var $author$project$Main$GUSlider = {$: 'GUSlider'};
var $author$project$Main$GoTo = function (a) {
	return {$: 'GoTo', a: a};
};
var $author$project$Main$Opp = {$: 'Opp'};
var $author$project$Main$PostAct = {$: 'PostAct'};
var $author$project$Main$PostCollect = {$: 'PostCollect'};
var $author$project$Main$ProceedAfterWait = function (a) {
	return {$: 'ProceedAfterWait', a: a};
};
var $author$project$Main$ProceedOnMsg = function (a) {
	return {$: 'ProceedOnMsg', a: a};
};
var $author$project$Main$Ptt = {$: 'Ptt'};
var $author$project$Main$ShowAll = {$: 'ShowAll'};
var $author$project$Main$ShowSome = function (a) {
	return {$: 'ShowSome', a: a};
};
var $author$project$Main$StaticInstr = function (a) {
	return {$: 'StaticInstr', a: a};
};
var $author$project$Main$dFullWidth = 1000;
var $author$project$Main$cCenterX = $author$project$Main$dFullWidth / 2;
var $author$project$Main$dFullHeight = 680;
var $author$project$Main$cCenterY = $author$project$Main$dFullHeight / 2;
var $author$project$Main$confirmButtonId = 'confirmButton';
var $author$project$Main$cprIconId = 'cprIcon';
var $author$project$Main$dBoardSize = 350;
var $elm$core$Basics$composeR = F3(
	function (f, g, x) {
		return g(
			f(x));
	});
var $elm$core$String$trim = _String_trim;
var $elm$core$String$any = _String_any;
var $elm$core$List$filter = F2(
	function (isGood, list) {
		return A3(
			$elm$core$List$foldr,
			F2(
				function (x, xs) {
					return isGood(x) ? A2($elm$core$List$cons, x, xs) : xs;
				}),
			_List_Nil,
			list);
	});
var $elm$core$String$lines = _String_lines;
var $elm$core$Basics$min = F2(
	function (x, y) {
		return (_Utils_cmp(x, y) < 0) ? x : y;
	});
var $elm$core$List$minimum = function (list) {
	if (list.b) {
		var x = list.a;
		var xs = list.b;
		return $elm$core$Maybe$Just(
			A3($elm$core$List$foldl, $elm$core$Basics$min, x, xs));
	} else {
		return $elm$core$Maybe$Nothing;
	}
};
var $elm$core$Basics$neq = _Utils_notEqual;
var $elm$core$Maybe$withDefault = F2(
	function (_default, maybe) {
		if (maybe.$ === 'Just') {
			var value = maybe.a;
			return value;
		} else {
			return _default;
		}
	});
var $elm_community$string_extra$String$Extra$unindent = function (multilineSting) {
	var lines = $elm$core$String$lines(multilineSting);
	var isNotWhitespace = function (_char) {
		return (!_Utils_eq(
			_char,
			_Utils_chr(' '))) && (!_Utils_eq(
			_char,
			_Utils_chr('\t')));
	};
	var countLeadingWhitespace = F2(
		function (count, line) {
			countLeadingWhitespace:
			while (true) {
				var _v0 = $elm$core$String$uncons(line);
				if (_v0.$ === 'Nothing') {
					return count;
				} else {
					var _v1 = _v0.a;
					var _char = _v1.a;
					var rest = _v1.b;
					switch (_char.valueOf()) {
						case ' ':
							var $temp$count = count + 1,
								$temp$line = rest;
							count = $temp$count;
							line = $temp$line;
							continue countLeadingWhitespace;
						case '\t':
							var $temp$count = count + 1,
								$temp$line = rest;
							count = $temp$count;
							line = $temp$line;
							continue countLeadingWhitespace;
						default:
							return count;
					}
				}
			}
		});
	var minLead = A2(
		$elm$core$Maybe$withDefault,
		0,
		$elm$core$List$minimum(
			A2(
				$elm$core$List$map,
				countLeadingWhitespace(0),
				A2(
					$elm$core$List$filter,
					$elm$core$String$any(isNotWhitespace),
					lines))));
	return A2(
		$elm$core$String$join,
		'\n',
		A2(
			$elm$core$List$map,
			$elm$core$String$dropLeft(minLead),
			lines));
};
var $author$project$Main$dedent = A2($elm$core$Basics$composeR, $elm_community$string_extra$String$Extra$unindent, $elm$core$String$trim);
var $author$project$Main$FullBoard = {$: 'FullBoard'};
var $author$project$Main$defaultBoardConfig = {location: $author$project$Main$FullBoard, scale: 0.5, vx: 0.78125, vy: 0.375};
var $author$project$Main$defaultStep = {
	cmd: $elm$core$Maybe$Nothing,
	gameMsg: $elm$core$Maybe$Nothing,
	gameShow: $author$project$Main$ShowAll,
	instr: $author$project$Main$StaticInstr(
		{
			anchor: {x: 0, y: 0},
			dim: false,
			text: '',
			x: 0,
			y: 0
		}),
	oppReceiver: $author$project$Main$Opp,
	player: $author$project$Main$Ptt,
	proceed: $author$project$Main$ProceedAfterWait(0)
};
var $elm$core$Array$fromListHelp = F3(
	function (list, nodeList, nodeListSize) {
		fromListHelp:
		while (true) {
			var _v0 = A2($elm$core$Elm$JsArray$initializeFromList, $elm$core$Array$branchFactor, list);
			var jsArray = _v0.a;
			var remainingItems = _v0.b;
			if (_Utils_cmp(
				$elm$core$Elm$JsArray$length(jsArray),
				$elm$core$Array$branchFactor) < 0) {
				return A2(
					$elm$core$Array$builderToArray,
					true,
					{nodeList: nodeList, nodeListSize: nodeListSize, tail: jsArray});
			} else {
				var $temp$list = remainingItems,
					$temp$nodeList = A2(
					$elm$core$List$cons,
					$elm$core$Array$Leaf(jsArray),
					nodeList),
					$temp$nodeListSize = nodeListSize + 1;
				list = $temp$list;
				nodeList = $temp$nodeList;
				nodeListSize = $temp$nodeListSize;
				continue fromListHelp;
			}
		}
	});
var $elm$core$Array$fromList = function (list) {
	if (!list.b) {
		return $elm$core$Array$empty;
	} else {
		return A3($elm$core$Array$fromListHelp, list, _List_Nil, 0);
	}
};
var $elm$json$Json$Encode$list = F2(
	function (func, entries) {
		return _Json_wrap(
			A3(
				$elm$core$List$foldl,
				_Json_addEntry(func),
				_Json_emptyArray(_Utils_Tuple0),
				entries));
	});
var $elm$json$Json$Encode$string = _Json_wrap;
var $author$project$Main$getTextLengths = _Platform_outgoingPort(
	'getTextLengths',
	$elm$json$Json$Encode$list($elm$json$Json$Encode$string));
var $elm$core$List$any = F2(
	function (isOkay, list) {
		any:
		while (true) {
			if (!list.b) {
				return false;
			} else {
				var x = list.a;
				var xs = list.b;
				if (isOkay(x)) {
					return true;
				} else {
					var $temp$isOkay = isOkay,
						$temp$list = xs;
					isOkay = $temp$isOkay;
					list = $temp$list;
					continue any;
				}
			}
		}
	});
var $elm$core$List$member = F2(
	function (x, xs) {
		return A2(
			$elm$core$List$any,
			function (a) {
				return _Utils_eq(a, x);
			},
			xs);
	});
var $elm$core$Platform$Cmd$none = $elm$core$Platform$Cmd$batch(_List_Nil);
var $author$project$Main$oppBarNumberId = 'oppBarNumber';
var $author$project$Main$slfBarNumberId = 'slfBarNumber';
var $author$project$Main$getBarNumberLengths = function (show) {
	if (show.$ === 'ShowAll') {
		return $author$project$Main$getTextLengths(
			_List_fromArray(
				[$author$project$Main$slfBarNumberId, $author$project$Main$oppBarNumberId]));
	} else {
		var s = show.a;
		var slf = A2($elm$core$List$member, $author$project$Main$GUSlfPay, s);
		var opp = A2($elm$core$List$member, $author$project$Main$GUOppPay, s);
		var _v1 = _Utils_Tuple2(slf, opp);
		if (_v1.a) {
			if (_v1.b) {
				return $author$project$Main$getTextLengths(
					_List_fromArray(
						[$author$project$Main$slfBarNumberId, $author$project$Main$oppBarNumberId]));
			} else {
				return $author$project$Main$getTextLengths(
					_List_fromArray(
						[$author$project$Main$slfBarNumberId]));
			}
		} else {
			if (_v1.b) {
				return $author$project$Main$getTextLengths(
					_List_fromArray(
						[$author$project$Main$oppBarNumberId]));
			} else {
				return $elm$core$Platform$Cmd$none;
			}
		}
	}
};
var $author$project$Main$prevButtonId = 'prevButton';
var $author$project$Main$pttIconId = 'pttIcon';
var $author$project$Main$pttTotalId = 'pttTotal';
var $elm$core$Process$sleep = _Process_sleep;
var $author$project$Main$sliderId = 'slider';
var $author$project$Main$thumbId = 'thumb';
var $author$project$Main$DownIn = {$: 'DownIn'};
var $author$project$Main$touched = F2(
	function (msg, model) {
		if (msg.$ === 'MouseUp') {
			return _Utils_eq(model.game.mouseStatus, $author$project$Main$DownIn);
		} else {
			return false;
		}
	});
var $author$project$Main$Cpr = {$: 'Cpr'};
var $author$project$Main$Review = {$: 'Review'};
var $author$project$Main$Slf = {$: 'Slf'};
var $elm$core$Basics$negate = function (n) {
	return -n;
};
var $elm$core$Basics$pow = _Basics_pow;
var $elm$core$Basics$sqrt = _Basics_sqrt;
var $author$project$Main$calcAnimation = function (c) {
	var t = (c.t / 1000) * 8;
	var dTotal = $elm$core$Basics$sqrt(
		A2($elm$core$Basics$pow, c.startX - c.endX, 2) + A2($elm$core$Basics$pow, c.startY - c.endY, 2));
	var b = A2($elm$core$Basics$pow, dTotal * 6, 1 / 3);
	var d = (A2($elm$core$Basics$pow, -t, 3) / 3) + ((b * A2($elm$core$Basics$pow, t, 2)) / 2);
	var v = (-t) * (t - b);
	return ((_Utils_cmp(d, dTotal) > -1) || (v <= 0)) ? $elm$core$Maybe$Nothing : $elm$core$Maybe$Just(
		{v: v, x: c.startX + (((c.endX - c.startX) * d) / dTotal), y: c.startY + (((c.endY - c.startY) * d) / dTotal)});
};
var $author$project$Main$halfToTf = F2(
	function (h, x) {
		if (h.$ === 'Lower') {
			return x * 0.5;
		} else {
			return (x * 0.5) + 0.5;
		}
	});
var $author$project$Main$sliderLocationToTfs = function (l) {
	if (l.$ === 'FullBoard') {
		return {xTf: $elm$core$Basics$identity, yTf: $elm$core$Basics$identity};
	} else {
		var xHalf = l.a.xHalf;
		var yHalf = l.a.yHalf;
		return {
			xTf: $author$project$Main$halfToTf(xHalf),
			yTf: $author$project$Main$halfToTf(yHalf)
		};
	}
};
var $author$project$Main$calcPayoffs = F2(
	function (_v0, lambda) {
		var location = _v0.location;
		var vx = _v0.vx;
		var vy = _v0.vy;
		var scale = _v0.scale;
		var _v1 = $author$project$Main$sliderLocationToTfs(location);
		var xTf = _v1.xTf;
		var yTf = _v1.yTf;
		return {
			opp: A3(
				$elm$core$Basics$composeL,
				yTf,
				$elm$core$Basics$max(0),
				vy + ((lambda / 2) * scale)),
			slf: A3(
				$elm$core$Basics$composeL,
				xTf,
				$elm$core$Basics$max(0),
				vx - ((A2($elm$core$Basics$pow, lambda, 2) / 4) * scale))
		};
	});
var $author$project$Main$dlIconOffset = 100 / $author$project$Main$dBoardSize;
var $author$project$Main$clIconY = -$author$project$Main$dlIconOffset;
var $author$project$Main$dlBarSep = 30 / $author$project$Main$dBoardSize;
var $author$project$Main$clOppBarX = -$author$project$Main$dlBarSep;
var $author$project$Main$clSlfBarY = -$author$project$Main$dlBarSep;
var $author$project$Main$dlTotalOffset = 130 / $author$project$Main$dBoardSize;
var $author$project$Main$clTotalX = 0.5 - $author$project$Main$dlTotalOffset;
var $author$project$Main$dlBarNumberHSep = 5 / $author$project$Main$dBoardSize;
var $author$project$Main$dlBarNumberVSep = 16 / $author$project$Main$dBoardSize;
var $author$project$Main$dlBarWidth = 30 / $author$project$Main$dBoardSize;
var $elm$core$Basics$compare = _Utils_compare;
var $elm$core$Dict$get = F2(
	function (targetKey, dict) {
		get:
		while (true) {
			if (dict.$ === 'RBEmpty_elm_builtin') {
				return $elm$core$Maybe$Nothing;
			} else {
				var key = dict.b;
				var value = dict.c;
				var left = dict.d;
				var right = dict.e;
				var _v1 = A2($elm$core$Basics$compare, targetKey, key);
				switch (_v1.$) {
					case 'LT':
						var $temp$targetKey = targetKey,
							$temp$dict = left;
						targetKey = $temp$targetKey;
						dict = $temp$dict;
						continue get;
					case 'EQ':
						return $elm$core$Maybe$Just(value);
					default:
						var $temp$targetKey = targetKey,
							$temp$dict = right;
						targetKey = $temp$targetKey;
						dict = $temp$dict;
						continue get;
				}
			}
		}
	});
var $author$project$Main$payoffScale = 100;
var $elm$core$String$toFloat = _String_toFloat;
var $myrho$elm_round$Round$funNum = F3(
	function (fun, s, fl) {
		return A2(
			$elm$core$Maybe$withDefault,
			0 / 0,
			$elm$core$String$toFloat(
				A2(fun, s, fl)));
	});
var $elm$core$Basics$not = _Basics_not;
var $elm$core$Basics$abs = function (n) {
	return (n < 0) ? (-n) : n;
};
var $elm$core$String$foldr = _String_foldr;
var $elm$core$String$toList = function (string) {
	return A3($elm$core$String$foldr, $elm$core$List$cons, _List_Nil, string);
};
var $myrho$elm_round$Round$addSign = F2(
	function (signed, str) {
		var isNotZero = A2(
			$elm$core$List$any,
			function (c) {
				return (!_Utils_eq(
					c,
					_Utils_chr('0'))) && (!_Utils_eq(
					c,
					_Utils_chr('.')));
			},
			$elm$core$String$toList(str));
		return _Utils_ap(
			(signed && isNotZero) ? '-' : '',
			str);
	});
var $elm$core$String$fromFloat = _String_fromNumber;
var $elm$core$String$cons = _String_cons;
var $elm$core$Char$fromCode = _Char_fromCode;
var $myrho$elm_round$Round$increaseNum = function (_v0) {
	var head = _v0.a;
	var tail = _v0.b;
	if (_Utils_eq(
		head,
		_Utils_chr('9'))) {
		var _v1 = $elm$core$String$uncons(tail);
		if (_v1.$ === 'Nothing') {
			return '01';
		} else {
			var headtail = _v1.a;
			return A2(
				$elm$core$String$cons,
				_Utils_chr('0'),
				$myrho$elm_round$Round$increaseNum(headtail));
		}
	} else {
		var c = $elm$core$Char$toCode(head);
		return ((c >= 48) && (c < 57)) ? A2(
			$elm$core$String$cons,
			$elm$core$Char$fromCode(c + 1),
			tail) : '0';
	}
};
var $elm$core$Basics$isInfinite = _Basics_isInfinite;
var $elm$core$Basics$isNaN = _Basics_isNaN;
var $elm$core$String$fromChar = function (_char) {
	return A2($elm$core$String$cons, _char, '');
};
var $elm$core$Bitwise$shiftRightBy = _Bitwise_shiftRightBy;
var $elm$core$String$repeatHelp = F3(
	function (n, chunk, result) {
		return (n <= 0) ? result : A3(
			$elm$core$String$repeatHelp,
			n >> 1,
			_Utils_ap(chunk, chunk),
			(!(n & 1)) ? result : _Utils_ap(result, chunk));
	});
var $elm$core$String$repeat = F2(
	function (n, chunk) {
		return A3($elm$core$String$repeatHelp, n, chunk, '');
	});
var $elm$core$String$padRight = F3(
	function (n, _char, string) {
		return _Utils_ap(
			string,
			A2(
				$elm$core$String$repeat,
				n - $elm$core$String$length(string),
				$elm$core$String$fromChar(_char)));
	});
var $elm$core$String$reverse = _String_reverse;
var $myrho$elm_round$Round$splitComma = function (str) {
	var _v0 = A2($elm$core$String$split, '.', str);
	if (_v0.b) {
		if (_v0.b.b) {
			var before = _v0.a;
			var _v1 = _v0.b;
			var after = _v1.a;
			return _Utils_Tuple2(before, after);
		} else {
			var before = _v0.a;
			return _Utils_Tuple2(before, '0');
		}
	} else {
		return _Utils_Tuple2('0', '0');
	}
};
var $elm$core$Tuple$mapFirst = F2(
	function (func, _v0) {
		var x = _v0.a;
		var y = _v0.b;
		return _Utils_Tuple2(
			func(x),
			y);
	});
var $myrho$elm_round$Round$toDecimal = function (fl) {
	var _v0 = A2(
		$elm$core$String$split,
		'e',
		$elm$core$String$fromFloat(
			$elm$core$Basics$abs(fl)));
	if (_v0.b) {
		if (_v0.b.b) {
			var num = _v0.a;
			var _v1 = _v0.b;
			var exp = _v1.a;
			var e = A2(
				$elm$core$Maybe$withDefault,
				0,
				$elm$core$String$toInt(
					A2($elm$core$String$startsWith, '+', exp) ? A2($elm$core$String$dropLeft, 1, exp) : exp));
			var _v2 = $myrho$elm_round$Round$splitComma(num);
			var before = _v2.a;
			var after = _v2.b;
			var total = _Utils_ap(before, after);
			var zeroed = (e < 0) ? A2(
				$elm$core$Maybe$withDefault,
				'0',
				A2(
					$elm$core$Maybe$map,
					function (_v3) {
						var a = _v3.a;
						var b = _v3.b;
						return a + ('.' + b);
					},
					A2(
						$elm$core$Maybe$map,
						$elm$core$Tuple$mapFirst($elm$core$String$fromChar),
						$elm$core$String$uncons(
							_Utils_ap(
								A2(
									$elm$core$String$repeat,
									$elm$core$Basics$abs(e),
									'0'),
								total))))) : A3(
				$elm$core$String$padRight,
				e + 1,
				_Utils_chr('0'),
				total);
			return _Utils_ap(
				(fl < 0) ? '-' : '',
				zeroed);
		} else {
			var num = _v0.a;
			return _Utils_ap(
				(fl < 0) ? '-' : '',
				num);
		}
	} else {
		return '';
	}
};
var $myrho$elm_round$Round$roundFun = F3(
	function (functor, s, fl) {
		if ($elm$core$Basics$isInfinite(fl) || $elm$core$Basics$isNaN(fl)) {
			return $elm$core$String$fromFloat(fl);
		} else {
			var signed = fl < 0;
			var _v0 = $myrho$elm_round$Round$splitComma(
				$myrho$elm_round$Round$toDecimal(
					$elm$core$Basics$abs(fl)));
			var before = _v0.a;
			var after = _v0.b;
			var r = $elm$core$String$length(before) + s;
			var normalized = _Utils_ap(
				A2($elm$core$String$repeat, (-r) + 1, '0'),
				A3(
					$elm$core$String$padRight,
					r,
					_Utils_chr('0'),
					_Utils_ap(before, after)));
			var totalLen = $elm$core$String$length(normalized);
			var roundDigitIndex = A2($elm$core$Basics$max, 1, r);
			var increase = A2(
				functor,
				signed,
				A3($elm$core$String$slice, roundDigitIndex, totalLen, normalized));
			var remains = A3($elm$core$String$slice, 0, roundDigitIndex, normalized);
			var num = increase ? $elm$core$String$reverse(
				A2(
					$elm$core$Maybe$withDefault,
					'1',
					A2(
						$elm$core$Maybe$map,
						$myrho$elm_round$Round$increaseNum,
						$elm$core$String$uncons(
							$elm$core$String$reverse(remains))))) : remains;
			var numLen = $elm$core$String$length(num);
			var numZeroed = (num === '0') ? num : ((s <= 0) ? _Utils_ap(
				num,
				A2(
					$elm$core$String$repeat,
					$elm$core$Basics$abs(s),
					'0')) : ((_Utils_cmp(
				s,
				$elm$core$String$length(after)) < 0) ? (A3($elm$core$String$slice, 0, numLen - s, num) + ('.' + A3($elm$core$String$slice, numLen - s, numLen, num))) : _Utils_ap(
				before + '.',
				A3(
					$elm$core$String$padRight,
					s,
					_Utils_chr('0'),
					after))));
			return A2($myrho$elm_round$Round$addSign, signed, numZeroed);
		}
	});
var $myrho$elm_round$Round$round = $myrho$elm_round$Round$roundFun(
	F2(
		function (signed, str) {
			var _v0 = $elm$core$String$uncons(str);
			if (_v0.$ === 'Nothing') {
				return false;
			} else {
				if ('5' === _v0.a.a.valueOf()) {
					if (_v0.a.b === '') {
						var _v1 = _v0.a;
						return !signed;
					} else {
						var _v2 = _v0.a;
						return true;
					}
				} else {
					var _v3 = _v0.a;
					var _int = _v3.a;
					return function (i) {
						return ((i > 53) && signed) || ((i >= 53) && (!signed));
					}(
						$elm$core$Char$toCode(_int));
				}
			}
		}));
var $myrho$elm_round$Round$roundNum = $myrho$elm_round$Round$funNum($myrho$elm_round$Round$round);
var $author$project$Main$roundPayoff = $myrho$elm_round$Round$roundNum(1);
var $author$project$Main$cNwX = $author$project$Main$cCenterX - ($author$project$Main$dBoardSize / 2);
var $author$project$Main$cNwY = $author$project$Main$cCenterY - ($author$project$Main$dBoardSize / 2);
var $author$project$Main$tfCpr = {
	x: function (x) {
		return $author$project$Main$cNwX + ((1 - x) * $author$project$Main$dBoardSize);
	},
	y: function (y) {
		return $author$project$Main$cNwY + (y * $author$project$Main$dBoardSize);
	}
};
var $author$project$Main$tfPtt = {
	x: function (x) {
		return $author$project$Main$cNwX + (x * $author$project$Main$dBoardSize);
	},
	y: function (y) {
		return $author$project$Main$cNwY + ((1 - y) * $author$project$Main$dBoardSize);
	}
};
var $author$project$Main$updateAnimate = F3(
	function (t, model, p) {
		var _v0 = model.animationStartTime;
		if (_v0.$ === 'Just') {
			var t0 = _v0.a;
			var _v1 = model.lambda;
			if (_v1.$ === 'Nothing') {
				return model;
			} else {
				var lambda = _v1.a;
				var payoffs = A2($author$project$Main$calcPayoffs, p.boardConfig, lambda);
				var _v2 = _Utils_eq(p.player, $author$project$Main$Ptt) ? _Utils_Tuple2($author$project$Main$tfPtt, $author$project$Main$tfCpr) : _Utils_Tuple2($author$project$Main$tfCpr, $author$project$Main$tfPtt);
				var tfSlf = _v2.a;
				var tfOpp = _v2.b;
				var oppAnimationState = function () {
					var oppBarNumberLength = A2(
						$elm$core$Maybe$withDefault,
						0,
						A2($elm$core$Dict$get, $author$project$Main$oppBarNumberId, model.textLengths));
					var _v4 = p.oppReceiver;
					switch (_v4.$) {
						case 'Opp':
							return $author$project$Main$calcAnimation(
								{
									endX: tfOpp.x($author$project$Main$clTotalX),
									endY: tfOpp.y($author$project$Main$clIconY),
									startX: tfSlf.x(($author$project$Main$clOppBarX + ($author$project$Main$dlBarWidth / 2)) - ((oppBarNumberLength / 2) / $author$project$Main$dBoardSize)),
									startY: tfSlf.y(payoffs.opp + $author$project$Main$dlBarNumberVSep),
									t: t - t0
								});
						case 'Slf':
							return $author$project$Main$calcAnimation(
								{
									endX: tfSlf.x($author$project$Main$clTotalX),
									endY: tfSlf.y($author$project$Main$clIconY),
									startX: tfSlf.x($author$project$Main$clOppBarX),
									startY: tfSlf.y(payoffs.opp + $author$project$Main$dlBarNumberVSep),
									t: t - t0
								});
						default:
							return $elm$core$Maybe$Nothing;
					}
				}();
				var slfAnimationState = function () {
					var slfBarNumberLength = A2(
						$elm$core$Maybe$withDefault,
						0,
						A2($elm$core$Dict$get, $author$project$Main$slfBarNumberId, model.textLengths));
					return $author$project$Main$calcAnimation(
						{
							endX: tfSlf.x($author$project$Main$clTotalX),
							endY: tfSlf.y($author$project$Main$clIconY),
							startX: tfSlf.x((payoffs.slf + $author$project$Main$dlBarNumberHSep) + ((slfBarNumberLength / 2) / $author$project$Main$dBoardSize)),
							startY: tfSlf.y($author$project$Main$clSlfBarY),
							t: t - t0
						});
				}();
				var pttTotal = (_Utils_eq(p.player, $author$project$Main$Ptt) && ((!_Utils_eq(model.slfAnimationState, $elm$core$Maybe$Nothing)) && _Utils_eq(slfAnimationState, $elm$core$Maybe$Nothing))) ? (model.pttTotal + $author$project$Main$roundPayoff(payoffs.slf * $author$project$Main$payoffScale)) : ((((_Utils_eq(p.player, $author$project$Main$Ptt) && _Utils_eq(p.oppReceiver, $author$project$Main$Slf)) || (_Utils_eq(p.player, $author$project$Main$Cpr) && _Utils_eq(p.oppReceiver, $author$project$Main$Opp))) && ((!_Utils_eq(model.oppAnimationState, $elm$core$Maybe$Nothing)) && _Utils_eq(oppAnimationState, $elm$core$Maybe$Nothing))) ? (model.pttTotal + $author$project$Main$roundPayoff(payoffs.opp * $author$project$Main$payoffScale)) : model.pttTotal);
				var _v3 = (_Utils_eq(slfAnimationState, $elm$core$Maybe$Nothing) && _Utils_eq(oppAnimationState, $elm$core$Maybe$Nothing)) ? _Utils_Tuple2(
					p.isTtrl ? $author$project$Main$PostCollect : $author$project$Main$Review,
					$elm$core$Maybe$Nothing) : _Utils_Tuple2(model.stage, model.animationStartTime);
				var stage = _v3.a;
				var animationStartTime = _v3.b;
				return _Utils_update(
					model,
					{animationStartTime: animationStartTime, oppAnimationState: oppAnimationState, pttTotal: pttTotal, slfAnimationState: slfAnimationState, stage: stage});
			}
		} else {
			return _Utils_update(
				model,
				{
					animationStartTime: $elm$core$Maybe$Just(t)
				});
		}
	});
var $author$project$Main$ttrlGameProps = function (m) {
	var step = A2(
		$elm$core$Array$get,
		m.step - 1,
		$author$project$Main$cyclic$ttrlSteps());
	return {
		boardConfig: $author$project$Main$defaultBoardConfig,
		isTtrl: true,
		memory: false,
		oppReceiver: $author$project$Main$Opp,
		player: A2(
			$elm$core$Maybe$withDefault,
			$author$project$Main$Ptt,
			A2(
				$elm$core$Maybe$map,
				function ($) {
					return $.player;
				},
				step)),
		show: A2(
			$elm$core$Maybe$withDefault,
			$author$project$Main$ShowAll,
			A2(
				$elm$core$Maybe$map,
				function ($) {
					return $.gameShow;
				},
				step))
	};
};
function $author$project$Main$cyclic$ttrlSteps() {
	return $elm$core$Array$fromList(
		_List_fromArray(
			[
				_Utils_update(
				$author$project$Main$defaultStep,
				{
					gameShow: $author$project$Main$ShowSome(
						_List_fromArray(
							[$author$project$Main$GUOthers])),
					instr: $author$project$Main$Callout(
						{
							instrAnchor: {x: 1, y: 1},
							sep: 10,
							target: $author$project$Main$prevButtonId,
							targetAnchor: {x: 0, y: 0},
							text: $author$project$Main$dedent('\n                        In this tutorial,\n                        use these two buttons\n                        to step forward/backward.\n                        ')
						})
				}),
				_Utils_update(
				$author$project$Main$defaultStep,
				{
					gameShow: $author$project$Main$ShowSome(
						_List_fromArray(
							[$author$project$Main$GUOthers, $author$project$Main$GUPttIcon])),
					instr: $author$project$Main$Callout(
						{
							instrAnchor: {x: 1, y: 1},
							sep: 0,
							target: $author$project$Main$pttIconId,
							targetAnchor: {x: 0, y: 0},
							text: $author$project$Main$dedent('\n                        In this experiment,\n                        you are the [ptt b|red] player.\n                        ')
						}),
					proceed: $author$project$Main$ProceedAfterWait(1.5)
				}),
				_Utils_update(
				$author$project$Main$defaultStep,
				{
					gameShow: $author$project$Main$ShowSome(
						_List_fromArray(
							[$author$project$Main$GUOthers, $author$project$Main$GUPttIcon, $author$project$Main$GUPttTotal])),
					instr: $author$project$Main$Callout(
						{
							instrAnchor: {x: 0.5, y: 1},
							sep: 10,
							target: $author$project$Main$pttTotalId,
							targetAnchor: {x: 0.5, y: 0},
							text: $author$project$Main$dedent('\n                        You start with a total reward of 0\n                        (in an arbitrary unit).\n                        ')
						}),
					proceed: $author$project$Main$ProceedAfterWait(1.5)
				}),
				_Utils_update(
				$author$project$Main$defaultStep,
				{
					gameShow: $author$project$Main$ShowSome(
						_List_fromArray(
							[$author$project$Main$GUOthers, $author$project$Main$GUPttIcon, $author$project$Main$GUPttTotal, $author$project$Main$GUCprIcon, $author$project$Main$GUCprTotal])),
					instr: $author$project$Main$Callout(
						{
							instrAnchor: {x: 0.5, y: 0},
							sep: 10,
							target: $author$project$Main$cprIconId,
							targetAnchor: {x: 0.5, y: 1},
							text: $author$project$Main$dedent('\n                        You will play a multi-round game\n                        with a [cpr b|blue] player (we will call it [cpr|Blue]).\n                        [cpr|Blue] also starts with a total reward of 0,\n                        but their total is hidden from you.\n                        [cpr|Blue] will be a person randomly paired with you,\n                        and they walk through exactly the same tutorial\n                        as you do now.\n                        ')
						}),
					proceed: $author$project$Main$ProceedAfterWait(5)
				}),
				_Utils_update(
				$author$project$Main$defaultStep,
				{
					gameShow: $author$project$Main$ShowSome(
						_List_fromArray(
							[$author$project$Main$GUOthers, $author$project$Main$GUPttIcon, $author$project$Main$GUPttTotal, $author$project$Main$GUCprIcon, $author$project$Main$GUCprTotal, $author$project$Main$GUBoard])),
					instr: $author$project$Main$Callout(
						{
							instrAnchor: {x: 1, y: 0},
							sep: 0,
							target: $author$project$Main$boardId,
							targetAnchor: {x: 0.4, y: 0.6},
							text: $author$project$Main$dedent('\n                        You and [cpr|Blue] will take turns\n                        making decisions on this square board.\n                        Now let\'s see what [ptt|your turn] looks like.\n                        ')
						}),
					proceed: $author$project$Main$ProceedAfterWait(1.5)
				}),
				_Utils_update(
				$author$project$Main$defaultStep,
				{
					cmd: $elm$core$Maybe$Just($author$project$Main$getBoard),
					gameMsg: $elm$core$Maybe$Just(
						$author$project$Main$GoTo($author$project$Main$Act)),
					gameShow: $author$project$Main$ShowSome(
						_List_fromArray(
							[$author$project$Main$GUOthers, $author$project$Main$GUPttIcon, $author$project$Main$GUPttTotal, $author$project$Main$GUCprIcon, $author$project$Main$GUCprTotal, $author$project$Main$GUBoard, $author$project$Main$GUSlider])),
					instr: $author$project$Main$Callout(
						{
							instrAnchor: {x: 0, y: 0.5},
							sep: 12,
							target: $author$project$Main$sliderId,
							targetAnchor: {x: 0.5, y: 0},
							text: $author$project$Main$dedent('\n                        There is a [b|curve] on the board.\n                        Now click somewhere on the curve.\n                        ')
						}),
					proceed: $author$project$Main$ProceedOnMsg($author$project$Main$touched)
				}),
				_Utils_update(
				$author$project$Main$defaultStep,
				{
					gameShow: $author$project$Main$ShowSome(
						_List_fromArray(
							[$author$project$Main$GUOthers, $author$project$Main$GUPttIcon, $author$project$Main$GUPttTotal, $author$project$Main$GUCprIcon, $author$project$Main$GUCprTotal, $author$project$Main$GUBoard, $author$project$Main$GUSlider])),
					instr: $author$project$Main$Callout(
						{
							instrAnchor: {x: 0, y: 0.5},
							sep: 5,
							target: $author$project$Main$thumbId,
							targetAnchor: {x: 1, y: 0.5},
							text: $author$project$Main$dedent('\n                        The curve is actually a slider track.\n                        Now try sliding the “handle”\n                        along the track.\n                        ')
						}),
					proceed: $author$project$Main$ProceedOnMsg($author$project$Main$touched)
				}),
				_Utils_update(
				$author$project$Main$defaultStep,
				{
					cmd: A3(
						$elm$core$Basics$composeL,
						$elm$core$Maybe$Just,
						$author$project$Main$getBarNumberLengths,
						$author$project$Main$ShowSome(
							_List_fromArray(
								[$author$project$Main$GUSlfPay]))),
					gameShow: $author$project$Main$ShowSome(
						_List_fromArray(
							[$author$project$Main$GUOthers, $author$project$Main$GUPttIcon, $author$project$Main$GUPttTotal, $author$project$Main$GUCprIcon, $author$project$Main$GUCprTotal, $author$project$Main$GUBoard, $author$project$Main$GUSlider, $author$project$Main$GUSlfPay])),
					instr: $author$project$Main$Callout(
						{
							instrAnchor: {x: 0.1, y: 1},
							sep: 5,
							target: $author$project$Main$slfBarNumberId,
							targetAnchor: {x: 1, y: 0},
							text: $author$project$Main$dedent('\n                        The [b|horizontal] location of the handle\n                        corresponds to a [ptt b|reward for you],\n                        which is proportional to\n                        the length of the [ptt b|red bar].\n                        Now slide the handle\n                        to see how the reward changes.\n                        ')
						}),
					proceed: $author$project$Main$ProceedOnMsg($author$project$Main$touched)
				}),
				_Utils_update(
				$author$project$Main$defaultStep,
				{
					cmd: A3(
						$elm$core$Basics$composeL,
						$elm$core$Maybe$Just,
						$author$project$Main$getBarNumberLengths,
						$author$project$Main$ShowSome(
							_List_fromArray(
								[$author$project$Main$GUOppPay]))),
					gameShow: $author$project$Main$ShowSome(
						_List_fromArray(
							[$author$project$Main$GUOthers, $author$project$Main$GUPttIcon, $author$project$Main$GUPttTotal, $author$project$Main$GUCprIcon, $author$project$Main$GUCprTotal, $author$project$Main$GUBoard, $author$project$Main$GUSlider, $author$project$Main$GUOppPay])),
					instr: $author$project$Main$Callout(
						{
							instrAnchor: {x: 0, y: 0.8},
							sep: 5,
							target: $author$project$Main$oppBarNumberId,
							targetAnchor: {x: 1, y: 0},
							text: $author$project$Main$dedent('\n                        The [b|vertical] location of the handle\n                        corresponds to a [cpr b|reward for Blue],\n                        which is proportional to the length of the [cpr b|blue bar].\n                        Now slide the handle to see how the reward changes.\n                        ')
						}),
					proceed: $author$project$Main$ProceedOnMsg($author$project$Main$touched)
				}),
				_Utils_update(
				$author$project$Main$defaultStep,
				{
					cmd: A3($elm$core$Basics$composeL, $elm$core$Maybe$Just, $author$project$Main$getBarNumberLengths, $author$project$Main$ShowAll),
					gameShow: $author$project$Main$ShowSome(
						_List_fromArray(
							[$author$project$Main$GUOthers, $author$project$Main$GUPttIcon, $author$project$Main$GUPttTotal, $author$project$Main$GUCprIcon, $author$project$Main$GUCprTotal, $author$project$Main$GUBoard, $author$project$Main$GUSlider, $author$project$Main$GUSlfPay, $author$project$Main$GUOppPay])),
					instr: $author$project$Main$StaticInstr(
						{
							anchor: {x: 0, y: 0.5},
							dim: false,
							text: $author$project$Main$dedent('\n                        Now slide the handle to see\n                        how both rewards\n                        change simultaneously.\n                        '),
							x: ($author$project$Main$cCenterX + ($author$project$Main$dBoardSize / 2)) + 10,
							y: $author$project$Main$cCenterY
						}),
					proceed: $author$project$Main$ProceedOnMsg($author$project$Main$touched)
				}),
				_Utils_update(
				$author$project$Main$defaultStep,
				{
					gameShow: $author$project$Main$ShowSome(
						_List_fromArray(
							[$author$project$Main$GUOthers, $author$project$Main$GUPttIcon, $author$project$Main$GUPttTotal, $author$project$Main$GUCprIcon, $author$project$Main$GUCprTotal, $author$project$Main$GUBoard, $author$project$Main$GUSlider, $author$project$Main$GUSlfPay, $author$project$Main$GUOppPay, $author$project$Main$GUConfirmButton])),
					instr: $author$project$Main$Callout(
						{
							instrAnchor: {x: 0.22, y: 1},
							sep: 5,
							target: $author$project$Main$confirmButtonId,
							targetAnchor: {x: 1, y: 0},
							text: $author$project$Main$dedent('\n                        Slide the handle to the position\n                        where the [b|two rewards]\n                        look the best to you.\n                        After that, click the “Confirm” button.\n                        ')
						}),
					proceed: $author$project$Main$ProceedOnMsg(
						F2(
							function (m, _v0) {
								return _Utils_eq(
									m,
									$author$project$Main$GoTo($author$project$Main$PostAct));
							}))
				}),
				_Utils_update(
				$author$project$Main$defaultStep,
				{
					cmd: $elm$core$Maybe$Just(
						A2(
							$elm$core$Task$perform,
							$elm$core$Basics$always(
								$author$project$Main$GoTo($author$project$Main$Collect)),
							$elm$core$Process$sleep(1000))),
					gameShow: $author$project$Main$ShowSome(
						_List_fromArray(
							[$author$project$Main$GUOthers, $author$project$Main$GUPttIcon, $author$project$Main$GUPttTotal, $author$project$Main$GUCprIcon, $author$project$Main$GUCprTotal, $author$project$Main$GUBoard, $author$project$Main$GUSlider, $author$project$Main$GUSlfPay, $author$project$Main$GUOppPay, $author$project$Main$GUConfirmButton])),
					instr: $author$project$Main$StaticInstr(
						{
							anchor: {x: 0, y: 0.5},
							dim: false,
							text: $author$project$Main$dedent('\n                        Then the two rewards will be added\n                        to [ptt|your total] and [cpr|Blue’s total].\n                        '),
							x: ($author$project$Main$cCenterX + ($author$project$Main$dBoardSize / 2)) - 10,
							y: $author$project$Main$cCenterY
						}),
					proceed: $author$project$Main$ProceedOnMsg(
						F2(
							function (msg, model) {
								if (msg.$ === 'Animate') {
									var t = msg.a;
									return _Utils_eq(
										A3(
											$author$project$Main$updateAnimate,
											t,
											model.game,
											$author$project$Main$ttrlGameProps(model)).stage,
										$author$project$Main$PostCollect);
								} else {
									return false;
								}
							}))
				}),
				_Utils_update(
				$author$project$Main$defaultStep,
				{
					gameShow: $author$project$Main$ShowAll,
					instr: $author$project$Main$StaticInstr(
						{
							anchor: {x: 0.5, y: 0.5},
							dim: true,
							text: 'Some text',
							x: $author$project$Main$dFullWidth / 2,
							y: $author$project$Main$dFullHeight / 2
						}),
					proceed: $author$project$Main$ProceedAfterWait(0)
				})
			]));
}
try {
	var $author$project$Main$ttrlSteps = $author$project$Main$cyclic$ttrlSteps();
	$author$project$Main$cyclic$ttrlSteps = function () {
		return $author$project$Main$ttrlSteps;
	};
} catch ($) {
	throw 'Some top-level definitions from `Main` are causing infinite recursion:\n\n  ┌─────┐\n  │    ttrlGameProps\n  │     ↓\n  │    ttrlSteps\n  └─────┘\n\nThese errors are very tricky, so read https://elm-lang.org/0.19.1/bad-recursion to learn how to fix it!';}
var $author$project$Main$getInstrText = function (i) {
	return A3(
		$elm$core$Basics$composeL,
		$elm$core$Maybe$withDefault(''),
		$elm$core$Maybe$map($author$project$Main$stepToText),
		A2($elm$core$Array$get, i - 1, $author$project$Main$ttrlSteps));
};
var $author$project$Main$instrId = 'message';
var $author$project$Main$getInstrLengths = function (i) {
	return A3(
		$elm$core$Basics$composeL,
		A2(
			$elm$core$Basics$composeL,
			A2(
				$elm$core$Basics$composeL,
				A2(
					$elm$core$Basics$composeL,
					$author$project$Main$getTextLengths,
					$elm$core$List$map(
						$author$project$Main$buildMultilineId(
							A2($author$project$Main$buildMultilineId, $author$project$Main$instrId, i)))),
				$elm$core$List$range(1)),
			$elm$core$List$length),
		$elm$core$String$split('\n'),
		$author$project$Main$getInstrText(i));
};
var $author$project$Main$PreAct = {$: 'PreAct'};
var $author$project$Main$UpOut = {$: 'UpOut'};
var $elm$core$Dict$RBEmpty_elm_builtin = {$: 'RBEmpty_elm_builtin'};
var $elm$core$Dict$empty = $elm$core$Dict$RBEmpty_elm_builtin;
var $author$project$Main$initGame = {
	animationStartTime: $elm$core$Maybe$Nothing,
	board: {height: 0, width: 0, x: 0, y: 0},
	cprActed: false,
	fixedLambda: $elm$core$Maybe$Nothing,
	lambda: $elm$core$Maybe$Nothing,
	loadingStep: 0,
	mouseStatus: $author$project$Main$UpOut,
	oppAnimationState: $elm$core$Maybe$Nothing,
	prediction: $elm$core$Maybe$Nothing,
	pttTotal: 0,
	slfAnimationState: $elm$core$Maybe$Nothing,
	stage: $author$project$Main$PreAct,
	textLengths: $elm$core$Dict$empty
};
var $elm$core$Array$length = function (_v0) {
	var len = _v0.a;
	return len;
};
var $elm$core$Array$repeat = F2(
	function (n, e) {
		return A2(
			$elm$core$Array$initialize,
			n,
			function (_v0) {
				return e;
			});
	});
var $author$project$Main$init = F3(
	function (_v0, _v1, _v2) {
		return _Utils_Tuple2(
			$author$project$Main$Ttrl(
				{
					game: $author$project$Main$initGame,
					gameStates: A2(
						$elm$core$Array$repeat,
						$elm$core$Array$length($author$project$Main$ttrlSteps),
						$author$project$Main$initGame),
					instrLength: $elm$core$Maybe$Nothing,
					latestStep: 1,
					readyForNext: true,
					step: 1
				}),
			$elm$core$Platform$Cmd$batch(
				_List_fromArray(
					[
						$author$project$Main$getInstrLengths(1),
						$author$project$Main$getBoard
					])));
	});
var $author$project$Main$GUCprStatus = {$: 'GUCprStatus'};
var $author$project$Main$GotTextLengths = function (a) {
	return {$: 'GotTextLengths', a: a};
};
var $author$project$Main$LoadingStep = {$: 'LoadingStep'};
var $author$project$Main$MouseDown = function (a) {
	return {$: 'MouseDown', a: a};
};
var $author$project$Main$MouseMove = function (a) {
	return {$: 'MouseMove', a: a};
};
var $author$project$Main$MouseUp = function (a) {
	return {$: 'MouseUp', a: a};
};
var $author$project$Main$NormalGameMsg = function (a) {
	return {$: 'NormalGameMsg', a: a};
};
var $author$project$Main$StateLoaded = function (a) {
	return {$: 'StateLoaded', a: a};
};
var $author$project$Main$TestTtrlGameMsg = function (a) {
	return {$: 'TestTtrlGameMsg', a: a};
};
var $author$project$Main$WindowResize = {$: 'WindowResize'};
var $elm$core$Platform$Sub$batch = _Platform_batch;
var $elm$json$Json$Decode$decodeValue = _Json_run;
var $elm$core$Dict$Black = {$: 'Black'};
var $elm$core$Dict$RBNode_elm_builtin = F5(
	function (a, b, c, d, e) {
		return {$: 'RBNode_elm_builtin', a: a, b: b, c: c, d: d, e: e};
	});
var $elm$core$Dict$Red = {$: 'Red'};
var $elm$core$Dict$balance = F5(
	function (color, key, value, left, right) {
		if ((right.$ === 'RBNode_elm_builtin') && (right.a.$ === 'Red')) {
			var _v1 = right.a;
			var rK = right.b;
			var rV = right.c;
			var rLeft = right.d;
			var rRight = right.e;
			if ((left.$ === 'RBNode_elm_builtin') && (left.a.$ === 'Red')) {
				var _v3 = left.a;
				var lK = left.b;
				var lV = left.c;
				var lLeft = left.d;
				var lRight = left.e;
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Red,
					key,
					value,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, lK, lV, lLeft, lRight),
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, rK, rV, rLeft, rRight));
			} else {
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					color,
					rK,
					rV,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, key, value, left, rLeft),
					rRight);
			}
		} else {
			if ((((left.$ === 'RBNode_elm_builtin') && (left.a.$ === 'Red')) && (left.d.$ === 'RBNode_elm_builtin')) && (left.d.a.$ === 'Red')) {
				var _v5 = left.a;
				var lK = left.b;
				var lV = left.c;
				var _v6 = left.d;
				var _v7 = _v6.a;
				var llK = _v6.b;
				var llV = _v6.c;
				var llLeft = _v6.d;
				var llRight = _v6.e;
				var lRight = left.e;
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Red,
					lK,
					lV,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, llK, llV, llLeft, llRight),
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, key, value, lRight, right));
			} else {
				return A5($elm$core$Dict$RBNode_elm_builtin, color, key, value, left, right);
			}
		}
	});
var $elm$core$Dict$insertHelp = F3(
	function (key, value, dict) {
		if (dict.$ === 'RBEmpty_elm_builtin') {
			return A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, key, value, $elm$core$Dict$RBEmpty_elm_builtin, $elm$core$Dict$RBEmpty_elm_builtin);
		} else {
			var nColor = dict.a;
			var nKey = dict.b;
			var nValue = dict.c;
			var nLeft = dict.d;
			var nRight = dict.e;
			var _v1 = A2($elm$core$Basics$compare, key, nKey);
			switch (_v1.$) {
				case 'LT':
					return A5(
						$elm$core$Dict$balance,
						nColor,
						nKey,
						nValue,
						A3($elm$core$Dict$insertHelp, key, value, nLeft),
						nRight);
				case 'EQ':
					return A5($elm$core$Dict$RBNode_elm_builtin, nColor, nKey, value, nLeft, nRight);
				default:
					return A5(
						$elm$core$Dict$balance,
						nColor,
						nKey,
						nValue,
						nLeft,
						A3($elm$core$Dict$insertHelp, key, value, nRight));
			}
		}
	});
var $elm$core$Dict$insert = F3(
	function (key, value, dict) {
		var _v0 = A3($elm$core$Dict$insertHelp, key, value, dict);
		if ((_v0.$ === 'RBNode_elm_builtin') && (_v0.a.$ === 'Red')) {
			var _v1 = _v0.a;
			var k = _v0.b;
			var v = _v0.c;
			var l = _v0.d;
			var r = _v0.e;
			return A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, k, v, l, r);
		} else {
			var x = _v0;
			return x;
		}
	});
var $elm$core$Dict$fromList = function (assocs) {
	return A3(
		$elm$core$List$foldl,
		F2(
			function (_v0, dict) {
				var key = _v0.a;
				var value = _v0.b;
				return A3($elm$core$Dict$insert, key, value, dict);
			}),
		$elm$core$Dict$empty,
		assocs);
};
var $elm$json$Json$Decode$keyValuePairs = _Json_decodeKeyValuePairs;
var $elm$json$Json$Decode$dict = function (decoder) {
	return A2(
		$elm$json$Json$Decode$map,
		$elm$core$Dict$fromList,
		$elm$json$Json$Decode$keyValuePairs(decoder));
};
var $elm$time$Time$Every = F2(
	function (a, b) {
		return {$: 'Every', a: a, b: b};
	});
var $elm$time$Time$State = F2(
	function (taggers, processes) {
		return {processes: processes, taggers: taggers};
	});
var $elm$time$Time$init = $elm$core$Task$succeed(
	A2($elm$time$Time$State, $elm$core$Dict$empty, $elm$core$Dict$empty));
var $elm$time$Time$addMySub = F2(
	function (_v0, state) {
		var interval = _v0.a;
		var tagger = _v0.b;
		var _v1 = A2($elm$core$Dict$get, interval, state);
		if (_v1.$ === 'Nothing') {
			return A3(
				$elm$core$Dict$insert,
				interval,
				_List_fromArray(
					[tagger]),
				state);
		} else {
			var taggers = _v1.a;
			return A3(
				$elm$core$Dict$insert,
				interval,
				A2($elm$core$List$cons, tagger, taggers),
				state);
		}
	});
var $elm$core$Process$kill = _Scheduler_kill;
var $elm$core$Dict$foldl = F3(
	function (func, acc, dict) {
		foldl:
		while (true) {
			if (dict.$ === 'RBEmpty_elm_builtin') {
				return acc;
			} else {
				var key = dict.b;
				var value = dict.c;
				var left = dict.d;
				var right = dict.e;
				var $temp$func = func,
					$temp$acc = A3(
					func,
					key,
					value,
					A3($elm$core$Dict$foldl, func, acc, left)),
					$temp$dict = right;
				func = $temp$func;
				acc = $temp$acc;
				dict = $temp$dict;
				continue foldl;
			}
		}
	});
var $elm$core$Dict$merge = F6(
	function (leftStep, bothStep, rightStep, leftDict, rightDict, initialResult) {
		var stepState = F3(
			function (rKey, rValue, _v0) {
				stepState:
				while (true) {
					var list = _v0.a;
					var result = _v0.b;
					if (!list.b) {
						return _Utils_Tuple2(
							list,
							A3(rightStep, rKey, rValue, result));
					} else {
						var _v2 = list.a;
						var lKey = _v2.a;
						var lValue = _v2.b;
						var rest = list.b;
						if (_Utils_cmp(lKey, rKey) < 0) {
							var $temp$rKey = rKey,
								$temp$rValue = rValue,
								$temp$_v0 = _Utils_Tuple2(
								rest,
								A3(leftStep, lKey, lValue, result));
							rKey = $temp$rKey;
							rValue = $temp$rValue;
							_v0 = $temp$_v0;
							continue stepState;
						} else {
							if (_Utils_cmp(lKey, rKey) > 0) {
								return _Utils_Tuple2(
									list,
									A3(rightStep, rKey, rValue, result));
							} else {
								return _Utils_Tuple2(
									rest,
									A4(bothStep, lKey, lValue, rValue, result));
							}
						}
					}
				}
			});
		var _v3 = A3(
			$elm$core$Dict$foldl,
			stepState,
			_Utils_Tuple2(
				$elm$core$Dict$toList(leftDict),
				initialResult),
			rightDict);
		var leftovers = _v3.a;
		var intermediateResult = _v3.b;
		return A3(
			$elm$core$List$foldl,
			F2(
				function (_v4, result) {
					var k = _v4.a;
					var v = _v4.b;
					return A3(leftStep, k, v, result);
				}),
			intermediateResult,
			leftovers);
	});
var $elm$core$Platform$sendToSelf = _Platform_sendToSelf;
var $elm$time$Time$Name = function (a) {
	return {$: 'Name', a: a};
};
var $elm$time$Time$Offset = function (a) {
	return {$: 'Offset', a: a};
};
var $elm$time$Time$Zone = F2(
	function (a, b) {
		return {$: 'Zone', a: a, b: b};
	});
var $elm$time$Time$customZone = $elm$time$Time$Zone;
var $elm$time$Time$setInterval = _Time_setInterval;
var $elm$core$Process$spawn = _Scheduler_spawn;
var $elm$time$Time$spawnHelp = F3(
	function (router, intervals, processes) {
		if (!intervals.b) {
			return $elm$core$Task$succeed(processes);
		} else {
			var interval = intervals.a;
			var rest = intervals.b;
			var spawnTimer = $elm$core$Process$spawn(
				A2(
					$elm$time$Time$setInterval,
					interval,
					A2($elm$core$Platform$sendToSelf, router, interval)));
			var spawnRest = function (id) {
				return A3(
					$elm$time$Time$spawnHelp,
					router,
					rest,
					A3($elm$core$Dict$insert, interval, id, processes));
			};
			return A2($elm$core$Task$andThen, spawnRest, spawnTimer);
		}
	});
var $elm$time$Time$onEffects = F3(
	function (router, subs, _v0) {
		var processes = _v0.processes;
		var rightStep = F3(
			function (_v6, id, _v7) {
				var spawns = _v7.a;
				var existing = _v7.b;
				var kills = _v7.c;
				return _Utils_Tuple3(
					spawns,
					existing,
					A2(
						$elm$core$Task$andThen,
						function (_v5) {
							return kills;
						},
						$elm$core$Process$kill(id)));
			});
		var newTaggers = A3($elm$core$List$foldl, $elm$time$Time$addMySub, $elm$core$Dict$empty, subs);
		var leftStep = F3(
			function (interval, taggers, _v4) {
				var spawns = _v4.a;
				var existing = _v4.b;
				var kills = _v4.c;
				return _Utils_Tuple3(
					A2($elm$core$List$cons, interval, spawns),
					existing,
					kills);
			});
		var bothStep = F4(
			function (interval, taggers, id, _v3) {
				var spawns = _v3.a;
				var existing = _v3.b;
				var kills = _v3.c;
				return _Utils_Tuple3(
					spawns,
					A3($elm$core$Dict$insert, interval, id, existing),
					kills);
			});
		var _v1 = A6(
			$elm$core$Dict$merge,
			leftStep,
			bothStep,
			rightStep,
			newTaggers,
			processes,
			_Utils_Tuple3(
				_List_Nil,
				$elm$core$Dict$empty,
				$elm$core$Task$succeed(_Utils_Tuple0)));
		var spawnList = _v1.a;
		var existingDict = _v1.b;
		var killTask = _v1.c;
		return A2(
			$elm$core$Task$andThen,
			function (newProcesses) {
				return $elm$core$Task$succeed(
					A2($elm$time$Time$State, newTaggers, newProcesses));
			},
			A2(
				$elm$core$Task$andThen,
				function (_v2) {
					return A3($elm$time$Time$spawnHelp, router, spawnList, existingDict);
				},
				killTask));
	});
var $elm$time$Time$Posix = function (a) {
	return {$: 'Posix', a: a};
};
var $elm$time$Time$millisToPosix = $elm$time$Time$Posix;
var $elm$time$Time$now = _Time_now($elm$time$Time$millisToPosix);
var $elm$time$Time$onSelfMsg = F3(
	function (router, interval, state) {
		var _v0 = A2($elm$core$Dict$get, interval, state.taggers);
		if (_v0.$ === 'Nothing') {
			return $elm$core$Task$succeed(state);
		} else {
			var taggers = _v0.a;
			var tellTaggers = function (time) {
				return $elm$core$Task$sequence(
					A2(
						$elm$core$List$map,
						function (tagger) {
							return A2(
								$elm$core$Platform$sendToApp,
								router,
								tagger(time));
						},
						taggers));
			};
			return A2(
				$elm$core$Task$andThen,
				function (_v1) {
					return $elm$core$Task$succeed(state);
				},
				A2($elm$core$Task$andThen, tellTaggers, $elm$time$Time$now));
		}
	});
var $elm$time$Time$subMap = F2(
	function (f, _v0) {
		var interval = _v0.a;
		var tagger = _v0.b;
		return A2(
			$elm$time$Time$Every,
			interval,
			A2($elm$core$Basics$composeL, f, tagger));
	});
_Platform_effectManagers['Time'] = _Platform_createManager($elm$time$Time$init, $elm$time$Time$onEffects, $elm$time$Time$onSelfMsg, 0, $elm$time$Time$subMap);
var $elm$time$Time$subscription = _Platform_leaf('Time');
var $elm$time$Time$every = F2(
	function (interval, tagger) {
		return $elm$time$Time$subscription(
			A2($elm$time$Time$Every, interval, tagger));
	});
var $elm$json$Json$Decode$field = _Json_decodeField;
var $elm$json$Json$Decode$float = _Json_decodeFloat;
var $elm$json$Json$Decode$value = _Json_decodeValue;
var $author$project$Main$gotTextLengths = _Platform_incomingPort('gotTextLengths', $elm$json$Json$Decode$value);
var $author$project$Main$Memory = {$: 'Memory'};
var $author$project$Main$isActiveStage = function (s) {
	return A2(
		$elm$core$List$member,
		s,
		_List_fromArray(
			[$author$project$Main$Act, $author$project$Main$Review, $author$project$Main$Memory]));
};
var $author$project$Main$isShowing = F2(
	function (u, s) {
		if (s.$ === 'ShowAll') {
			return true;
		} else {
			var l = s.a;
			return A2($elm$core$List$member, u, l);
		}
	});
var $elm$core$Platform$Sub$map = _Platform_map;
var $author$project$Main$Test = function (a) {
	return {$: 'Test', a: a};
};
var $elm$json$Json$Decode$andThen = _Json_andThen;
var $elm$json$Json$Decode$fail = _Json_fail;
var $elm$json$Json$Decode$string = _Json_decodeString;
var $elm$json$Json$Decode$bool = _Json_decodeBool;
var $elm$json$Json$Decode$map3 = _Json_map3;
var $elm$json$Json$Decode$null = _Json_decodeNull;
var $elm$json$Json$Decode$oneOf = _Json_oneOf;
var $elm$json$Json$Decode$nullable = function (decoder) {
	return $elm$json$Json$Decode$oneOf(
		_List_fromArray(
			[
				$elm$json$Json$Decode$null($elm$core$Maybe$Nothing),
				A2($elm$json$Json$Decode$map, $elm$core$Maybe$Just, decoder)
			]));
};
var $author$project$Main$animationStateDecoder = $elm$json$Json$Decode$nullable(
	A4(
		$elm$json$Json$Decode$map3,
		F3(
			function (x, y, v) {
				return {v: v, x: x, y: y};
			}),
		A2($elm$json$Json$Decode$field, 'x', $elm$json$Json$Decode$float),
		A2($elm$json$Json$Decode$field, 'y', $elm$json$Json$Decode$float),
		A2($elm$json$Json$Decode$field, 'v', $elm$json$Json$Decode$float)));
var $elm$json$Json$Decode$map4 = _Json_map4;
var $author$project$Main$bBoxDecoder = A5(
	$elm$json$Json$Decode$map4,
	F4(
		function (x, y, width, height) {
			return {height: height, width: width, x: x, y: y};
		}),
	A2($elm$json$Json$Decode$field, 'x', $elm$json$Json$Decode$float),
	A2($elm$json$Json$Decode$field, 'y', $elm$json$Json$Decode$float),
	A2($elm$json$Json$Decode$field, 'width', $elm$json$Json$Decode$float),
	A2($elm$json$Json$Decode$field, 'height', $elm$json$Json$Decode$float));
var $elm$json$Json$Decode$int = _Json_decodeInt;
var $author$project$Main$mFloatDecoder = $elm$json$Json$Decode$nullable($elm$json$Json$Decode$float);
var $author$project$Main$mIntDecoder = $elm$json$Json$Decode$nullable($elm$json$Json$Decode$int);
var $author$project$Main$DownOut = {$: 'DownOut'};
var $author$project$Main$UpIn = {$: 'UpIn'};
var $author$project$Main$stringToMouseStatus = function (s) {
	switch (s) {
		case 'UpOut':
			return $elm$json$Json$Decode$succeed($author$project$Main$UpOut);
		case 'UpIn':
			return $elm$json$Json$Decode$succeed($author$project$Main$UpIn);
		case 'DownOut':
			return $elm$json$Json$Decode$succeed($author$project$Main$DownOut);
		case 'DownIn':
			return $elm$json$Json$Decode$succeed($author$project$Main$DownIn);
		default:
			return $elm$json$Json$Decode$fail('Unknown mouse status: ' + s);
	}
};
var $author$project$Main$mouseStatusDecoder = A2($elm$json$Json$Decode$andThen, $author$project$Main$stringToMouseStatus, $elm$json$Json$Decode$string);
var $NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$custom = $elm$json$Json$Decode$map2($elm$core$Basics$apR);
var $NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required = F3(
	function (key, valDecoder, decoder) {
		return A2(
			$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$custom,
			A2($elm$json$Json$Decode$field, key, valDecoder),
			decoder);
	});
var $author$project$Main$ShowCpr = {$: 'ShowCpr'};
var $author$project$Main$stringToStage = function (s) {
	switch (s) {
		case 'PreAct':
			return $elm$json$Json$Decode$succeed($author$project$Main$PreAct);
		case 'Act':
			return $elm$json$Json$Decode$succeed($author$project$Main$Act);
		case 'PostAct':
			return $elm$json$Json$Decode$succeed($author$project$Main$PostAct);
		case 'ShowCpr':
			return $elm$json$Json$Decode$succeed($author$project$Main$ShowCpr);
		case 'Collect':
			return $elm$json$Json$Decode$succeed($author$project$Main$Collect);
		case 'PostCollect':
			return $elm$json$Json$Decode$succeed($author$project$Main$PostCollect);
		case 'Review':
			return $elm$json$Json$Decode$succeed($author$project$Main$Review);
		case 'Memory':
			return $elm$json$Json$Decode$succeed($author$project$Main$Memory);
		default:
			return $elm$json$Json$Decode$fail('Unknown stage: ' + s);
	}
};
var $author$project$Main$stageDecoder = A2($elm$json$Json$Decode$andThen, $author$project$Main$stringToStage, $elm$json$Json$Decode$string);
var $author$project$Main$gameDecoder = A3(
	$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
	'loadingStep',
	$elm$json$Json$Decode$int,
	A3(
		$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
		'oppAnimationState',
		$author$project$Main$animationStateDecoder,
		A3(
			$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
			'slfAnimationState',
			$author$project$Main$animationStateDecoder,
			A3(
				$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
				'animationStartTime',
				$author$project$Main$mIntDecoder,
				A3(
					$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
					'textLengths',
					$elm$json$Json$Decode$dict($elm$json$Json$Decode$float),
					A3(
						$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
						'board',
						$author$project$Main$bBoxDecoder,
						A3(
							$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
							'mouseStatus',
							$author$project$Main$mouseStatusDecoder,
							A3(
								$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
								'pttTotal',
								$elm$json$Json$Decode$float,
								A3(
									$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
									'cprActed',
									$elm$json$Json$Decode$bool,
									A3(
										$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
										'prediction',
										$author$project$Main$mFloatDecoder,
										A3(
											$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
											'fixedLambda',
											$author$project$Main$mFloatDecoder,
											A3(
												$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
												'lambda',
												$author$project$Main$mFloatDecoder,
												A3(
													$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
													'stage',
													$author$project$Main$stageDecoder,
													$elm$json$Json$Decode$succeed(
														function (s) {
															return function (l) {
																return function (fl) {
																	return function (p) {
																		return function (c) {
																			return function (pt) {
																				return function (m) {
																					return function (b) {
																						return function (t) {
																							return function (a) {
																								return function (sa) {
																									return function (oa) {
																										return function (ls) {
																											return {animationStartTime: a, board: b, cprActed: c, fixedLambda: fl, lambda: l, loadingStep: ls, mouseStatus: m, oppAnimationState: oa, prediction: p, pttTotal: pt, slfAnimationState: sa, stage: s, textLengths: t};
																										};
																									};
																								};
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														}))))))))))))));
var $elm$json$Json$Decode$array = _Json_decodeArray;
var $author$project$Main$ttrlDecoder = A3(
	$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
	'gameStates',
	$elm$json$Json$Decode$array($author$project$Main$gameDecoder),
	A3(
		$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
		'readyForNext',
		$elm$json$Json$Decode$bool,
		A3(
			$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
			'instrLength',
			$author$project$Main$mFloatDecoder,
			A3(
				$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
				'latestStep',
				$elm$json$Json$Decode$int,
				A3(
					$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
					'step',
					$elm$json$Json$Decode$int,
					A3(
						$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
						'game',
						$author$project$Main$gameDecoder,
						$elm$json$Json$Decode$succeed(
							F6(
								function (g, s, l, m, r, gs) {
									return {game: g, gameStates: gs, instrLength: m, latestStep: l, readyForNext: r, step: s};
								}))))))));
var $author$project$Main$testDecoder = A3(
	$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
	'ttrl',
	$author$project$Main$ttrlDecoder,
	A3(
		$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
		'showTtrl',
		$elm$json$Json$Decode$bool,
		A3(
			$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
			'round',
			$elm$json$Json$Decode$int,
			A3(
				$NoRedInk$elm_json_decode_pipeline$Json$Decode$Pipeline$required,
				'game',
				$author$project$Main$gameDecoder,
				$elm$json$Json$Decode$succeed(
					F4(
						function (g, r, s, t) {
							return {game: g, round: r, showTtrl: s, ttrl: t};
						}))))));
var $author$project$Main$modelDecoder = A2(
	$elm$json$Json$Decode$andThen,
	function (k) {
		switch (k) {
			case 'Ttrl':
				return A2(
					$elm$json$Json$Decode$map,
					$author$project$Main$Ttrl,
					A2($elm$json$Json$Decode$field, 'state', $author$project$Main$ttrlDecoder));
			case 'Test':
				return A2(
					$elm$json$Json$Decode$map,
					$author$project$Main$Test,
					A2($elm$json$Json$Decode$field, 'state', $author$project$Main$testDecoder));
			default:
				return $elm$json$Json$Decode$fail('Unknown kind: ' + k);
		}
	},
	A2($elm$json$Json$Decode$field, 'kind', $elm$json$Json$Decode$string));
var $elm$core$Platform$Sub$none = $elm$core$Platform$Sub$batch(_List_Nil);
var $elm$browser$Browser$Events$Document = {$: 'Document'};
var $elm$browser$Browser$Events$MySub = F3(
	function (a, b, c) {
		return {$: 'MySub', a: a, b: b, c: c};
	});
var $elm$browser$Browser$Events$State = F2(
	function (subs, pids) {
		return {pids: pids, subs: subs};
	});
var $elm$browser$Browser$Events$init = $elm$core$Task$succeed(
	A2($elm$browser$Browser$Events$State, _List_Nil, $elm$core$Dict$empty));
var $elm$browser$Browser$Events$nodeToKey = function (node) {
	if (node.$ === 'Document') {
		return 'd_';
	} else {
		return 'w_';
	}
};
var $elm$browser$Browser$Events$addKey = function (sub) {
	var node = sub.a;
	var name = sub.b;
	return _Utils_Tuple2(
		_Utils_ap(
			$elm$browser$Browser$Events$nodeToKey(node),
			name),
		sub);
};
var $elm$browser$Browser$Events$Event = F2(
	function (key, event) {
		return {event: event, key: key};
	});
var $elm$browser$Browser$Events$spawn = F3(
	function (router, key, _v0) {
		var node = _v0.a;
		var name = _v0.b;
		var actualNode = function () {
			if (node.$ === 'Document') {
				return _Browser_doc;
			} else {
				return _Browser_window;
			}
		}();
		return A2(
			$elm$core$Task$map,
			function (value) {
				return _Utils_Tuple2(key, value);
			},
			A3(
				_Browser_on,
				actualNode,
				name,
				function (event) {
					return A2(
						$elm$core$Platform$sendToSelf,
						router,
						A2($elm$browser$Browser$Events$Event, key, event));
				}));
	});
var $elm$core$Dict$union = F2(
	function (t1, t2) {
		return A3($elm$core$Dict$foldl, $elm$core$Dict$insert, t2, t1);
	});
var $elm$browser$Browser$Events$onEffects = F3(
	function (router, subs, state) {
		var stepRight = F3(
			function (key, sub, _v6) {
				var deads = _v6.a;
				var lives = _v6.b;
				var news = _v6.c;
				return _Utils_Tuple3(
					deads,
					lives,
					A2(
						$elm$core$List$cons,
						A3($elm$browser$Browser$Events$spawn, router, key, sub),
						news));
			});
		var stepLeft = F3(
			function (_v4, pid, _v5) {
				var deads = _v5.a;
				var lives = _v5.b;
				var news = _v5.c;
				return _Utils_Tuple3(
					A2($elm$core$List$cons, pid, deads),
					lives,
					news);
			});
		var stepBoth = F4(
			function (key, pid, _v2, _v3) {
				var deads = _v3.a;
				var lives = _v3.b;
				var news = _v3.c;
				return _Utils_Tuple3(
					deads,
					A3($elm$core$Dict$insert, key, pid, lives),
					news);
			});
		var newSubs = A2($elm$core$List$map, $elm$browser$Browser$Events$addKey, subs);
		var _v0 = A6(
			$elm$core$Dict$merge,
			stepLeft,
			stepBoth,
			stepRight,
			state.pids,
			$elm$core$Dict$fromList(newSubs),
			_Utils_Tuple3(_List_Nil, $elm$core$Dict$empty, _List_Nil));
		var deadPids = _v0.a;
		var livePids = _v0.b;
		var makeNewPids = _v0.c;
		return A2(
			$elm$core$Task$andThen,
			function (pids) {
				return $elm$core$Task$succeed(
					A2(
						$elm$browser$Browser$Events$State,
						newSubs,
						A2(
							$elm$core$Dict$union,
							livePids,
							$elm$core$Dict$fromList(pids))));
			},
			A2(
				$elm$core$Task$andThen,
				function (_v1) {
					return $elm$core$Task$sequence(makeNewPids);
				},
				$elm$core$Task$sequence(
					A2($elm$core$List$map, $elm$core$Process$kill, deadPids))));
	});
var $elm$core$List$maybeCons = F3(
	function (f, mx, xs) {
		var _v0 = f(mx);
		if (_v0.$ === 'Just') {
			var x = _v0.a;
			return A2($elm$core$List$cons, x, xs);
		} else {
			return xs;
		}
	});
var $elm$core$List$filterMap = F2(
	function (f, xs) {
		return A3(
			$elm$core$List$foldr,
			$elm$core$List$maybeCons(f),
			_List_Nil,
			xs);
	});
var $elm$browser$Browser$Events$onSelfMsg = F3(
	function (router, _v0, state) {
		var key = _v0.key;
		var event = _v0.event;
		var toMessage = function (_v2) {
			var subKey = _v2.a;
			var _v3 = _v2.b;
			var node = _v3.a;
			var name = _v3.b;
			var decoder = _v3.c;
			return _Utils_eq(subKey, key) ? A2(_Browser_decodeEvent, decoder, event) : $elm$core$Maybe$Nothing;
		};
		var messages = A2($elm$core$List$filterMap, toMessage, state.subs);
		return A2(
			$elm$core$Task$andThen,
			function (_v1) {
				return $elm$core$Task$succeed(state);
			},
			$elm$core$Task$sequence(
				A2(
					$elm$core$List$map,
					$elm$core$Platform$sendToApp(router),
					messages)));
	});
var $elm$browser$Browser$Events$subMap = F2(
	function (func, _v0) {
		var node = _v0.a;
		var name = _v0.b;
		var decoder = _v0.c;
		return A3(
			$elm$browser$Browser$Events$MySub,
			node,
			name,
			A2($elm$json$Json$Decode$map, func, decoder));
	});
_Platform_effectManagers['Browser.Events'] = _Platform_createManager($elm$browser$Browser$Events$init, $elm$browser$Browser$Events$onEffects, $elm$browser$Browser$Events$onSelfMsg, 0, $elm$browser$Browser$Events$subMap);
var $elm$browser$Browser$Events$subscription = _Platform_leaf('Browser.Events');
var $elm$browser$Browser$Events$on = F3(
	function (node, name, decoder) {
		return $elm$browser$Browser$Events$subscription(
			A3($elm$browser$Browser$Events$MySub, node, name, decoder));
	});
var $elm$browser$Browser$Events$onMouseDown = A2($elm$browser$Browser$Events$on, $elm$browser$Browser$Events$Document, 'mousedown');
var $elm$browser$Browser$Events$onMouseMove = A2($elm$browser$Browser$Events$on, $elm$browser$Browser$Events$Document, 'mousemove');
var $elm$browser$Browser$Events$onMouseUp = A2($elm$browser$Browser$Events$on, $elm$browser$Browser$Events$Document, 'mouseup');
var $elm$browser$Browser$Events$Window = {$: 'Window'};
var $elm$browser$Browser$Events$onResize = function (func) {
	return A3(
		$elm$browser$Browser$Events$on,
		$elm$browser$Browser$Events$Window,
		'resize',
		A2(
			$elm$json$Json$Decode$field,
			'target',
			A3(
				$elm$json$Json$Decode$map2,
				func,
				A2($elm$json$Json$Decode$field, 'innerWidth', $elm$json$Json$Decode$int),
				A2($elm$json$Json$Decode$field, 'innerHeight', $elm$json$Json$Decode$int))));
};
var $author$project$Main$Point = F2(
	function (x, y) {
		return {x: x, y: y};
	});
var $author$project$Main$pointThen = F3(
	function (f, x, y) {
		return f(
			A2($author$project$Main$Point, x, y));
	});
var $author$project$Main$stateLoaded = _Platform_incomingPort('stateLoaded', $elm$json$Json$Decode$value);
var $author$project$Main$Animate = function (a) {
	return {$: 'Animate', a: a};
};
var $elm$browser$Browser$AnimationManager$Time = function (a) {
	return {$: 'Time', a: a};
};
var $elm$browser$Browser$AnimationManager$State = F3(
	function (subs, request, oldTime) {
		return {oldTime: oldTime, request: request, subs: subs};
	});
var $elm$browser$Browser$AnimationManager$init = $elm$core$Task$succeed(
	A3($elm$browser$Browser$AnimationManager$State, _List_Nil, $elm$core$Maybe$Nothing, 0));
var $elm$browser$Browser$AnimationManager$now = _Browser_now(_Utils_Tuple0);
var $elm$browser$Browser$AnimationManager$rAF = _Browser_rAF(_Utils_Tuple0);
var $elm$browser$Browser$AnimationManager$onEffects = F3(
	function (router, subs, _v0) {
		var request = _v0.request;
		var oldTime = _v0.oldTime;
		var _v1 = _Utils_Tuple2(request, subs);
		if (_v1.a.$ === 'Nothing') {
			if (!_v1.b.b) {
				var _v2 = _v1.a;
				return $elm$browser$Browser$AnimationManager$init;
			} else {
				var _v4 = _v1.a;
				return A2(
					$elm$core$Task$andThen,
					function (pid) {
						return A2(
							$elm$core$Task$andThen,
							function (time) {
								return $elm$core$Task$succeed(
									A3(
										$elm$browser$Browser$AnimationManager$State,
										subs,
										$elm$core$Maybe$Just(pid),
										time));
							},
							$elm$browser$Browser$AnimationManager$now);
					},
					$elm$core$Process$spawn(
						A2(
							$elm$core$Task$andThen,
							$elm$core$Platform$sendToSelf(router),
							$elm$browser$Browser$AnimationManager$rAF)));
			}
		} else {
			if (!_v1.b.b) {
				var pid = _v1.a.a;
				return A2(
					$elm$core$Task$andThen,
					function (_v3) {
						return $elm$browser$Browser$AnimationManager$init;
					},
					$elm$core$Process$kill(pid));
			} else {
				return $elm$core$Task$succeed(
					A3($elm$browser$Browser$AnimationManager$State, subs, request, oldTime));
			}
		}
	});
var $elm$browser$Browser$AnimationManager$onSelfMsg = F3(
	function (router, newTime, _v0) {
		var subs = _v0.subs;
		var oldTime = _v0.oldTime;
		var send = function (sub) {
			if (sub.$ === 'Time') {
				var tagger = sub.a;
				return A2(
					$elm$core$Platform$sendToApp,
					router,
					tagger(
						$elm$time$Time$millisToPosix(newTime)));
			} else {
				var tagger = sub.a;
				return A2(
					$elm$core$Platform$sendToApp,
					router,
					tagger(newTime - oldTime));
			}
		};
		return A2(
			$elm$core$Task$andThen,
			function (pid) {
				return A2(
					$elm$core$Task$andThen,
					function (_v1) {
						return $elm$core$Task$succeed(
							A3(
								$elm$browser$Browser$AnimationManager$State,
								subs,
								$elm$core$Maybe$Just(pid),
								newTime));
					},
					$elm$core$Task$sequence(
						A2($elm$core$List$map, send, subs)));
			},
			$elm$core$Process$spawn(
				A2(
					$elm$core$Task$andThen,
					$elm$core$Platform$sendToSelf(router),
					$elm$browser$Browser$AnimationManager$rAF)));
	});
var $elm$browser$Browser$AnimationManager$Delta = function (a) {
	return {$: 'Delta', a: a};
};
var $elm$browser$Browser$AnimationManager$subMap = F2(
	function (func, sub) {
		if (sub.$ === 'Time') {
			var tagger = sub.a;
			return $elm$browser$Browser$AnimationManager$Time(
				A2($elm$core$Basics$composeL, func, tagger));
		} else {
			var tagger = sub.a;
			return $elm$browser$Browser$AnimationManager$Delta(
				A2($elm$core$Basics$composeL, func, tagger));
		}
	});
_Platform_effectManagers['Browser.AnimationManager'] = _Platform_createManager($elm$browser$Browser$AnimationManager$init, $elm$browser$Browser$AnimationManager$onEffects, $elm$browser$Browser$AnimationManager$onSelfMsg, 0, $elm$browser$Browser$AnimationManager$subMap);
var $elm$browser$Browser$AnimationManager$subscription = _Platform_leaf('Browser.AnimationManager');
var $elm$browser$Browser$AnimationManager$onAnimationFrame = function (tagger) {
	return $elm$browser$Browser$AnimationManager$subscription(
		$elm$browser$Browser$AnimationManager$Time(tagger));
};
var $elm$browser$Browser$Events$onAnimationFrame = $elm$browser$Browser$AnimationManager$onAnimationFrame;
var $elm$time$Time$posixToMillis = function (_v0) {
	var millis = _v0.a;
	return millis;
};
var $author$project$Main$subsToWrap = function (game) {
	var animationFrame = _Utils_eq(game.stage, $author$project$Main$Collect) ? $elm$browser$Browser$Events$onAnimationFrame(
		A2($elm$core$Basics$composeR, $elm$time$Time$posixToMillis, $author$project$Main$Animate)) : $elm$core$Platform$Sub$none;
	return animationFrame;
};
var $author$project$Main$memoryRound = function (r) {
	return A2(
		$elm$core$List$member,
		r,
		_List_fromArray(
			[2, 3]));
};
var $elm$core$Basics$modBy = _Basics_modBy;
var $author$project$Main$roundToPlayer = function (i) {
	return (A2($elm$core$Basics$modBy, 2, i) === 1) ? $author$project$Main$Ptt : $author$project$Main$Cpr;
};
var $folkertdev$elm_state$State$State = function (a) {
	return {$: 'State', a: a};
};
var $folkertdev$elm_state$State$advance = function (f) {
	return $folkertdev$elm_state$State$State(f);
};
var $elm$random$Random$Seed = F2(
	function (a, b) {
		return {$: 'Seed', a: a, b: b};
	});
var $elm$random$Random$next = function (_v0) {
	var state0 = _v0.a;
	var incr = _v0.b;
	return A2($elm$random$Random$Seed, ((state0 * 1664525) + incr) >>> 0, incr);
};
var $elm$random$Random$initialSeed = function (x) {
	var _v0 = $elm$random$Random$next(
		A2($elm$random$Random$Seed, 0, 1013904223));
	var state1 = _v0.a;
	var incr = _v0.b;
	var state2 = (state1 + x) >>> 0;
	return $elm$random$Random$next(
		A2($elm$random$Random$Seed, state2, incr));
};
var $author$project$Main$Lower = {$: 'Lower'};
var $author$project$Main$Quadrant = function (a) {
	return {$: 'Quadrant', a: a};
};
var $author$project$Main$Upper = {$: 'Upper'};
var $elm$random$Random$Generator = function (a) {
	return {$: 'Generator', a: a};
};
var $elm$core$Bitwise$xor = _Bitwise_xor;
var $elm$random$Random$peel = function (_v0) {
	var state = _v0.a;
	var word = (state ^ (state >>> ((state >>> 28) + 4))) * 277803737;
	return ((word >>> 22) ^ word) >>> 0;
};
var $elm$random$Random$float = F2(
	function (a, b) {
		return $elm$random$Random$Generator(
			function (seed0) {
				var seed1 = $elm$random$Random$next(seed0);
				var range = $elm$core$Basics$abs(b - a);
				var n1 = $elm$random$Random$peel(seed1);
				var n0 = $elm$random$Random$peel(seed0);
				var lo = (134217727 & n1) * 1.0;
				var hi = (67108863 & n0) * 1.0;
				var val = ((hi * 134217728.0) + lo) / 9007199254740992.0;
				var scaled = (val * range) + a;
				return _Utils_Tuple2(
					scaled,
					$elm$random$Random$next(seed1));
			});
	});
var $elm$random$Random$map5 = F6(
	function (func, _v0, _v1, _v2, _v3, _v4) {
		var genA = _v0.a;
		var genB = _v1.a;
		var genC = _v2.a;
		var genD = _v3.a;
		var genE = _v4.a;
		return $elm$random$Random$Generator(
			function (seed0) {
				var _v5 = genA(seed0);
				var a = _v5.a;
				var seed1 = _v5.b;
				var _v6 = genB(seed1);
				var b = _v6.a;
				var seed2 = _v6.b;
				var _v7 = genC(seed2);
				var c = _v7.a;
				var seed3 = _v7.b;
				var _v8 = genD(seed3);
				var d = _v8.a;
				var seed4 = _v8.b;
				var _v9 = genE(seed4);
				var e = _v9.a;
				var seed5 = _v9.b;
				return _Utils_Tuple2(
					A5(func, a, b, c, d, e),
					seed5);
			});
	});
var $elm$random$Random$addOne = function (value) {
	return _Utils_Tuple2(1, value);
};
var $elm$random$Random$getByWeight = F3(
	function (_v0, others, countdown) {
		getByWeight:
		while (true) {
			var weight = _v0.a;
			var value = _v0.b;
			if (!others.b) {
				return value;
			} else {
				var second = others.a;
				var otherOthers = others.b;
				if (_Utils_cmp(
					countdown,
					$elm$core$Basics$abs(weight)) < 1) {
					return value;
				} else {
					var $temp$_v0 = second,
						$temp$others = otherOthers,
						$temp$countdown = countdown - $elm$core$Basics$abs(weight);
					_v0 = $temp$_v0;
					others = $temp$others;
					countdown = $temp$countdown;
					continue getByWeight;
				}
			}
		}
	});
var $elm$random$Random$map = F2(
	function (func, _v0) {
		var genA = _v0.a;
		return $elm$random$Random$Generator(
			function (seed0) {
				var _v1 = genA(seed0);
				var a = _v1.a;
				var seed1 = _v1.b;
				return _Utils_Tuple2(
					func(a),
					seed1);
			});
	});
var $elm$core$List$sum = function (numbers) {
	return A3($elm$core$List$foldl, $elm$core$Basics$add, 0, numbers);
};
var $elm$random$Random$weighted = F2(
	function (first, others) {
		var normalize = function (_v0) {
			var weight = _v0.a;
			return $elm$core$Basics$abs(weight);
		};
		var total = normalize(first) + $elm$core$List$sum(
			A2($elm$core$List$map, normalize, others));
		return A2(
			$elm$random$Random$map,
			A2($elm$random$Random$getByWeight, first, others),
			A2($elm$random$Random$float, 0, total));
	});
var $elm$random$Random$uniform = F2(
	function (value, valueList) {
		return A2(
			$elm$random$Random$weighted,
			$elm$random$Random$addOne(value),
			A2($elm$core$List$map, $elm$random$Random$addOne, valueList));
	});
var $author$project$Main$randomBoardConfig = function () {
	var c = $author$project$Main$defaultBoardConfig;
	var f = F5(
		function (xHalf, yHalf, dVx, dVy, dScale) {
			return {
				location: $author$project$Main$Quadrant(
					{xHalf: xHalf, yHalf: yHalf}),
				scale: c.scale + dScale,
				vx: c.vx + dVx,
				vy: c.vy + dVy
			};
		});
	return A6(
		$elm$random$Random$map5,
		f,
		A2(
			$elm$random$Random$uniform,
			$author$project$Main$Lower,
			_List_fromArray(
				[$author$project$Main$Upper])),
		A2(
			$elm$random$Random$uniform,
			$author$project$Main$Lower,
			_List_fromArray(
				[$author$project$Main$Upper])),
		A2($elm$random$Random$float, -0.1, 0.1),
		A2($elm$random$Random$float, -0.1, 0.1),
		A2($elm$random$Random$float, -0.1, 0.1));
}();
var $elm$core$List$repeatHelp = F3(
	function (result, n, value) {
		repeatHelp:
		while (true) {
			if (n <= 0) {
				return result;
			} else {
				var $temp$result = A2($elm$core$List$cons, value, result),
					$temp$n = n - 1,
					$temp$value = value;
				result = $temp$result;
				n = $temp$n;
				value = $temp$value;
				continue repeatHelp;
			}
		}
	});
var $elm$core$List$repeat = F2(
	function (n, value) {
		return A3($elm$core$List$repeatHelp, _List_Nil, n, value);
	});
var $folkertdev$elm_state$State$run = F2(
	function (initialState, _v0) {
		var s = _v0.a;
		return s(initialState);
	});
var $elm$random$Random$step = F2(
	function (_v0, seed) {
		var generator = _v0.a;
		return generator(seed);
	});
var $folkertdev$elm_state$State$Done = function (a) {
	return {$: 'Done', a: a};
};
var $folkertdev$elm_state$State$Loop = function (a) {
	return {$: 'Loop', a: a};
};
var $folkertdev$elm_state$State$map = F2(
	function (f, _v0) {
		var step = _v0.a;
		return $folkertdev$elm_state$State$State(
			function (currentState) {
				var _v1 = step(currentState);
				var value = _v1.a;
				var newState = _v1.b;
				return _Utils_Tuple2(
					f(value),
					newState);
			});
	});
var $folkertdev$elm_state$State$state = function (value) {
	return $folkertdev$elm_state$State$State(
		function (s) {
			return _Utils_Tuple2(value, s);
		});
};
var $folkertdev$elm_state$State$tailRec = function (f) {
	var go = function (step) {
		go:
		while (true) {
			if (step.$ === 'Loop') {
				var a = step.a;
				var $temp$step = f(a);
				step = $temp$step;
				continue go;
			} else {
				var b = step.a;
				return b;
			}
		}
	};
	return A2($elm$core$Basics$composeL, go, f);
};
var $folkertdev$elm_state$State$tailRecM = F2(
	function (f, a) {
		var helper = function (_v3) {
			var m = _v3.a;
			var s1 = _v3.b;
			if (m.$ === 'Loop') {
				var x = m.a;
				return $folkertdev$elm_state$State$Loop(
					_Utils_Tuple2(x, s1));
			} else {
				var y = m.a;
				return $folkertdev$elm_state$State$Done(
					_Utils_Tuple2(y, s1));
			}
		};
		var step = function (_v1) {
			var value = _v1.a;
			var s = _v1.b;
			var _v0 = f(value);
			var st = _v0.a;
			return helper(
				st(s));
		};
		return $folkertdev$elm_state$State$State(
			function (s) {
				return A2(
					$folkertdev$elm_state$State$tailRec,
					step,
					_Utils_Tuple2(a, s));
			});
	});
var $folkertdev$elm_state$State$tailRecM2 = F3(
	function (f, a, b) {
		return A2(
			$folkertdev$elm_state$State$tailRecM,
			function (_v0) {
				var x = _v0.a;
				var y = _v0.b;
				return A2(f, x, y);
			},
			_Utils_Tuple2(a, b));
	});
var $folkertdev$elm_state$State$foldlM = function (f) {
	var step = F2(
		function (accum, elements) {
			if (!elements.b) {
				return $folkertdev$elm_state$State$state(
					$folkertdev$elm_state$State$Done(accum));
			} else {
				var x = elements.a;
				var xs = elements.b;
				return A2(
					$folkertdev$elm_state$State$map,
					function (a_) {
						return $folkertdev$elm_state$State$Loop(
							_Utils_Tuple2(a_, xs));
					},
					A2(f, accum, x));
			}
		});
	return $folkertdev$elm_state$State$tailRecM2(step);
};
var $folkertdev$elm_state$State$map2 = F3(
	function (f, _v0, _v1) {
		var step1 = _v0.a;
		var step2 = _v1.a;
		return $folkertdev$elm_state$State$State(
			function (currentState) {
				var _v2 = step1(currentState);
				var value1 = _v2.a;
				var newState = _v2.b;
				var _v3 = step2(newState);
				var value2 = _v3.a;
				var newerState = _v3.b;
				return _Utils_Tuple2(
					A2(f, value1, value2),
					newerState);
			});
	});
var $folkertdev$elm_state$State$traverse = function (f) {
	return A2(
		$elm$core$Basics$composeL,
		$folkertdev$elm_state$State$map($elm$core$List$reverse),
		A2(
			$folkertdev$elm_state$State$foldlM,
			F2(
				function (accum, elem) {
					return A3(
						$folkertdev$elm_state$State$map2,
						$elm$core$List$cons,
						f(elem),
						$folkertdev$elm_state$State$state(accum));
				}),
			_List_Nil));
};
var $author$project$Main$generateBoardConfigs = F2(
	function (seed, n) {
		var s = $elm$random$Random$initialSeed(seed);
		var _v0 = A2(
			$folkertdev$elm_state$State$run,
			s,
			A2(
				$folkertdev$elm_state$State$traverse,
				A2($elm$core$Basics$composeL, $folkertdev$elm_state$State$advance, $elm$random$Random$step),
				A2($elm$core$List$repeat, n, $author$project$Main$randomBoardConfig)));
		var l = _v0.a;
		return $elm$core$Array$fromList(l);
	});
var $author$project$Main$nTestRounds = 20;
var $author$project$Main$testBoardConfigs = A2($author$project$Main$generateBoardConfigs, 3509, $author$project$Main$nTestRounds);
var $author$project$Main$testGameProps = function (m) {
	return {
		boardConfig: A2(
			$elm$core$Maybe$withDefault,
			$author$project$Main$defaultBoardConfig,
			A2($elm$core$Array$get, m.round - 1, $author$project$Main$testBoardConfigs)),
		isTtrl: false,
		memory: $author$project$Main$memoryRound(m.round),
		oppReceiver: $author$project$Main$Opp,
		player: $author$project$Main$roundToPlayer(m.round),
		show: $author$project$Main$ShowAll
	};
};
var $author$project$Main$subscriptions = function (m) {
	var wrappedSubs = function () {
		if (m.$ === 'Ttrl') {
			var t = m.a;
			return $author$project$Main$subsToWrap(t.game);
		} else {
			var t = m.a;
			return $elm$core$Platform$Sub$batch(
				_List_fromArray(
					[
						A2(
						$elm$core$Platform$Sub$map,
						$author$project$Main$NormalGameMsg,
						$author$project$Main$subsToWrap(t.game)),
						A2(
						$elm$core$Platform$Sub$map,
						$author$project$Main$TestTtrlGameMsg,
						$author$project$Main$subsToWrap(t.ttrl.game))
					]));
		}
	}();
	var windowResize = $elm$browser$Browser$Events$onResize(
		F2(
			function (_v2, _v3) {
				return $author$project$Main$WindowResize;
			}));
	var _v0 = function () {
		if (m.$ === 'Ttrl') {
			var t = m.a;
			return _Utils_Tuple2(
				t.game,
				$author$project$Main$ttrlGameProps(t));
		} else {
			var t = m.a;
			return _Utils_Tuple2(
				t.showTtrl ? t.ttrl.game : t.game,
				$author$project$Main$testGameProps(t));
		}
	}();
	var activeGame = _v0.a;
	var gameProps = _v0.b;
	var mouseDownUp = $author$project$Main$isActiveStage(activeGame.stage) ? $elm$core$Platform$Sub$batch(
		_List_fromArray(
			[
				$elm$browser$Browser$Events$onMouseDown(
				A3(
					$elm$json$Json$Decode$map2,
					$author$project$Main$pointThen($author$project$Main$MouseDown),
					A2($elm$json$Json$Decode$field, 'pageX', $elm$json$Json$Decode$float),
					A2($elm$json$Json$Decode$field, 'pageY', $elm$json$Json$Decode$float))),
				$elm$browser$Browser$Events$onMouseUp(
				A3(
					$elm$json$Json$Decode$map2,
					$author$project$Main$pointThen($author$project$Main$MouseUp),
					A2($elm$json$Json$Decode$field, 'pageX', $elm$json$Json$Decode$float),
					A2($elm$json$Json$Decode$field, 'pageY', $elm$json$Json$Decode$float)))
			])) : $elm$core$Platform$Sub$none;
	var mouseMove = ($author$project$Main$isActiveStage(activeGame.stage) && _Utils_eq(activeGame.mouseStatus, $author$project$Main$DownIn)) ? $elm$browser$Browser$Events$onMouseMove(
		A3(
			$elm$json$Json$Decode$map2,
			$author$project$Main$pointThen($author$project$Main$MouseMove),
			A2($elm$json$Json$Decode$field, 'pageX', $elm$json$Json$Decode$float),
			A2($elm$json$Json$Decode$field, 'pageY', $elm$json$Json$Decode$float))) : $elm$core$Platform$Sub$none;
	var loadingStep = (activeGame.cprActed || (_Utils_eq(activeGame.stage, $author$project$Main$PreAct) || (!A2($author$project$Main$isShowing, $author$project$Main$GUCprStatus, gameProps.show)))) ? $elm$core$Platform$Sub$none : A2(
		$elm$time$Time$every,
		200,
		$elm$core$Basics$always($author$project$Main$LoadingStep));
	return $elm$core$Platform$Sub$batch(
		_List_fromArray(
			[
				$author$project$Main$stateLoaded(
				A2(
					$elm$core$Basics$composeL,
					$author$project$Main$StateLoaded,
					$elm$json$Json$Decode$decodeValue($author$project$Main$modelDecoder))),
				$author$project$Main$gotTextLengths(
				A2(
					$elm$core$Basics$composeL,
					$author$project$Main$GotTextLengths,
					$elm$json$Json$Decode$decodeValue(
						$elm$json$Json$Decode$dict($elm$json$Json$Decode$float)))),
				mouseDownUp,
				mouseMove,
				windowResize,
				loadingStep,
				wrappedSubs
			]));
};
var $elm$json$Json$Encode$bool = _Json_wrap;
var $elm$json$Json$Encode$dict = F3(
	function (toKey, toValue, dictionary) {
		return _Json_wrap(
			A3(
				$elm$core$Dict$foldl,
				F3(
					function (key, value, obj) {
						return A3(
							_Json_addField,
							toKey(key),
							toValue(value),
							obj);
					}),
				_Json_emptyObject(_Utils_Tuple0),
				dictionary));
	});
var $elm$json$Json$Encode$float = _Json_wrap;
var $elm$core$Tuple$mapSecond = F2(
	function (func, _v0) {
		var x = _v0.a;
		var y = _v0.b;
		return _Utils_Tuple2(
			x,
			func(y));
	});
var $elm$json$Json$Encode$null = _Json_encodeNull;
var $elm$json$Json$Encode$object = function (pairs) {
	return _Json_wrap(
		A3(
			$elm$core$List$foldl,
			F2(
				function (_v0, obj) {
					var k = _v0.a;
					var v = _v0.b;
					return A3(_Json_addField, k, v, obj);
				}),
			_Json_emptyObject(_Utils_Tuple0),
			pairs));
};
var $author$project$Main$encodeAnimationState = function (a) {
	if (a.$ === 'Nothing') {
		return $elm$json$Json$Encode$null;
	} else {
		var x = a.a.x;
		var y = a.a.y;
		var v = a.a.v;
		return $elm$json$Json$Encode$object(
			A2(
				$elm$core$List$map,
				$elm$core$Tuple$mapSecond($elm$json$Json$Encode$float),
				_List_fromArray(
					[
						_Utils_Tuple2('x', x),
						_Utils_Tuple2('y', y),
						_Utils_Tuple2('v', v)
					])));
	}
};
var $author$project$Main$encodeBBox = function (b) {
	return $elm$json$Json$Encode$object(
		A2(
			$elm$core$List$map,
			$elm$core$Tuple$mapSecond($elm$json$Json$Encode$float),
			_List_fromArray(
				[
					_Utils_Tuple2('x', b.x),
					_Utils_Tuple2('y', b.y),
					_Utils_Tuple2('width', b.width),
					_Utils_Tuple2('height', b.height)
				])));
};
var $author$project$Main$encodeMFloat = function (mf) {
	if (mf.$ === 'Nothing') {
		return $elm$json$Json$Encode$null;
	} else {
		var f = mf.a;
		return $elm$json$Json$Encode$float(f);
	}
};
var $elm$json$Json$Encode$int = _Json_wrap;
var $author$project$Main$encodeMInt = function (mf) {
	if (mf.$ === 'Nothing') {
		return $elm$json$Json$Encode$null;
	} else {
		var f = mf.a;
		return $elm$json$Json$Encode$int(f);
	}
};
var $author$project$Main$encodeMouseStatus = function (m) {
	var string = function () {
		switch (m.$) {
			case 'UpOut':
				return 'UpOut';
			case 'UpIn':
				return 'UpIn';
			case 'DownOut':
				return 'DownOut';
			default:
				return 'DownIn';
		}
	}();
	return $elm$json$Json$Encode$string(string);
};
var $author$project$Main$encodeStage = function (s) {
	var string = function () {
		switch (s.$) {
			case 'PreAct':
				return 'PreAct';
			case 'Act':
				return 'Act';
			case 'PostAct':
				return 'PostAct';
			case 'ShowCpr':
				return 'ShowCpr';
			case 'Collect':
				return 'Collect';
			case 'PostCollect':
				return 'PostCollect';
			case 'Review':
				return 'Review';
			default:
				return 'Memory';
		}
	}();
	return $elm$json$Json$Encode$string(string);
};
var $author$project$Main$encodeGame = function (g) {
	return $elm$json$Json$Encode$object(
		_List_fromArray(
			[
				_Utils_Tuple2(
				'stage',
				$author$project$Main$encodeStage(g.stage)),
				_Utils_Tuple2(
				'lambda',
				$author$project$Main$encodeMFloat(g.lambda)),
				_Utils_Tuple2(
				'fixedLambda',
				$author$project$Main$encodeMFloat(g.fixedLambda)),
				_Utils_Tuple2(
				'prediction',
				$author$project$Main$encodeMFloat(g.prediction)),
				_Utils_Tuple2(
				'cprActed',
				$elm$json$Json$Encode$bool(g.cprActed)),
				_Utils_Tuple2(
				'pttTotal',
				$elm$json$Json$Encode$float(g.pttTotal)),
				_Utils_Tuple2(
				'mouseStatus',
				$author$project$Main$encodeMouseStatus(g.mouseStatus)),
				_Utils_Tuple2(
				'board',
				$author$project$Main$encodeBBox(g.board)),
				_Utils_Tuple2(
				'textLengths',
				A3($elm$json$Json$Encode$dict, $elm$core$Basics$identity, $elm$json$Json$Encode$float, g.textLengths)),
				_Utils_Tuple2(
				'animationStartTime',
				$author$project$Main$encodeMInt(g.animationStartTime)),
				_Utils_Tuple2(
				'slfAnimationState',
				$author$project$Main$encodeAnimationState(g.slfAnimationState)),
				_Utils_Tuple2(
				'oppAnimationState',
				$author$project$Main$encodeAnimationState(g.oppAnimationState)),
				_Utils_Tuple2(
				'loadingStep',
				$elm$json$Json$Encode$int(g.loadingStep))
			]));
};
var $elm$core$Elm$JsArray$foldl = _JsArray_foldl;
var $elm$core$Array$foldl = F3(
	function (func, baseCase, _v0) {
		var tree = _v0.c;
		var tail = _v0.d;
		var helper = F2(
			function (node, acc) {
				if (node.$ === 'SubTree') {
					var subTree = node.a;
					return A3($elm$core$Elm$JsArray$foldl, helper, acc, subTree);
				} else {
					var values = node.a;
					return A3($elm$core$Elm$JsArray$foldl, func, acc, values);
				}
			});
		return A3(
			$elm$core$Elm$JsArray$foldl,
			func,
			A3($elm$core$Elm$JsArray$foldl, helper, baseCase, tree),
			tail);
	});
var $elm$json$Json$Encode$array = F2(
	function (func, entries) {
		return _Json_wrap(
			A3(
				$elm$core$Array$foldl,
				_Json_addEntry(func),
				_Json_emptyArray(_Utils_Tuple0),
				entries));
	});
var $author$project$Main$encodeTtrl = function (t) {
	return $elm$json$Json$Encode$object(
		_List_fromArray(
			[
				_Utils_Tuple2(
				'game',
				$author$project$Main$encodeGame(t.game)),
				_Utils_Tuple2(
				'step',
				$elm$json$Json$Encode$int(t.step)),
				_Utils_Tuple2(
				'latestStep',
				$elm$json$Json$Encode$int(t.latestStep)),
				_Utils_Tuple2(
				'instrLength',
				$author$project$Main$encodeMFloat(t.instrLength)),
				_Utils_Tuple2(
				'readyForNext',
				$elm$json$Json$Encode$bool(t.readyForNext)),
				_Utils_Tuple2(
				'gameStates',
				A2($elm$json$Json$Encode$array, $author$project$Main$encodeGame, t.gameStates))
			]));
};
var $author$project$Main$encodeTest = function (t) {
	return $elm$json$Json$Encode$object(
		_List_fromArray(
			[
				_Utils_Tuple2(
				'game',
				$author$project$Main$encodeGame(t.game)),
				_Utils_Tuple2(
				'round',
				$elm$json$Json$Encode$int(t.round)),
				_Utils_Tuple2(
				'showTtrl',
				$elm$json$Json$Encode$bool(t.showTtrl)),
				_Utils_Tuple2(
				'ttrl',
				$author$project$Main$encodeTtrl(t.ttrl))
			]));
};
var $author$project$Main$encodeModel = function (m) {
	if (m.$ === 'Ttrl') {
		var t = m.a;
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'kind',
					$elm$json$Json$Encode$string('Ttrl')),
					_Utils_Tuple2(
					'state',
					$author$project$Main$encodeTtrl(t))
				]));
	} else {
		var t = m.a;
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'kind',
					$elm$json$Json$Encode$string('Test')),
					_Utils_Tuple2(
					'state',
					$author$project$Main$encodeTest(t))
				]));
	}
};
var $author$project$Main$loadState = _Platform_outgoingPort(
	'loadState',
	function ($) {
		return $elm$json$Json$Encode$null;
	});
var $author$project$Main$saveState = _Platform_outgoingPort('saveState', $elm$core$Basics$identity);
var $elm$core$Platform$Cmd$map = _Platform_map;
var $author$project$Main$setTestModelGame = F2(
	function (f, m) {
		return _Utils_update(
			m,
			{
				game: f(m.game)
			});
	});
var $author$project$Main$setTestModelTttr = F2(
	function (f, m) {
		return _Utils_update(
			m,
			{
				ttrl: f(m.ttrl)
			});
	});
var $author$project$Main$setTtrlModelGame = F2(
	function (f, m) {
		return _Utils_update(
			m,
			{
				game: f(m.game)
			});
	});
var $author$project$Main$CprAct = {$: 'CprAct'};
var $elm$core$Dict$filter = F2(
	function (isGood, dict) {
		return A3(
			$elm$core$Dict$foldl,
			F3(
				function (k, v, d) {
					return A2(isGood, k, v) ? A3($elm$core$Dict$insert, k, v, d) : d;
				}),
			$elm$core$Dict$empty,
			dict);
	});
var $author$project$Main$inBBox = F3(
	function (x, y, b) {
		return (_Utils_cmp(x, b.x) > 0) && ((_Utils_cmp(x, b.x + b.width) < 0) && ((_Utils_cmp(y, b.y) > 0) && (_Utils_cmp(y, b.y + b.height) < 0)));
	});
var $author$project$Main$localYCpr = F2(
	function (y, b) {
		return (y - b.y) / b.height;
	});
var $author$project$Main$localYPtt = F2(
	function (y, b) {
		return 1 - ((y - b.y) / b.height);
	});
var $author$project$Main$noCmd = function (a) {
	return _Utils_Tuple3(a, $elm$core$Platform$Cmd$none, false);
};
var $author$project$Main$calcParabola = function (_v0) {
	var location = _v0.location;
	var vx = _v0.vx;
	var vy = _v0.vy;
	var scale = _v0.scale;
	var xTop = vx - (A2($elm$core$Basics$pow, 1 - vy, 2) / scale);
	var xBottom = vx - (A2($elm$core$Basics$pow, vy, 2) / scale);
	var _v1 = $author$project$Main$sliderLocationToTfs(location);
	var xTf = _v1.xTf;
	var yTf = _v1.yTf;
	var _v2 = (xTop >= 0) ? _Utils_Tuple2(xTop, 1) : _Utils_Tuple2(
		0,
		vy + $elm$core$Basics$sqrt(vx * scale));
	var x2 = _v2.a;
	var y2 = _v2.b;
	var _v3 = (xBottom >= 0) ? _Utils_Tuple2(xBottom, 0) : _Utils_Tuple2(
		0,
		vy - $elm$core$Basics$sqrt(vx * scale));
	var x1 = _v3.a;
	var y1 = _v3.b;
	var cx = x1 + (((vy - y1) / scale) * (y2 - y1));
	var cy = (y1 + y2) / 2;
	return {
		cx: xTf(cx),
		cy: yTf(cy),
		x1: xTf(x1),
		x2: xTf(x2),
		y1: yTf(y1),
		y2: yTf(y2)
	};
};
var $elm$core$Basics$clamp = F3(
	function (low, high, number) {
		return (_Utils_cmp(number, low) < 0) ? low : ((_Utils_cmp(number, high) > 0) ? high : number);
	});
var $author$project$Main$yToLambda = F2(
	function (c, y) {
		var extraScale = function () {
			var _v2 = c.location;
			if (_v2.$ === 'FullBoard') {
				return 2;
			} else {
				return 4;
			}
		}();
		var _v0 = $author$project$Main$sliderLocationToTfs(c.location);
		var yTf = _v0.yTf;
		var _v1 = $author$project$Main$calcParabola(c);
		var y1 = _v1.y1;
		var y2 = _v1.y2;
		return ((A3($elm$core$Basics$clamp, y1, y2, y) - yTf(c.vy)) / c.scale) * extraScale;
	});
var $author$project$Main$updateGame = F3(
	function (msg, p, model) {
		var localY = _Utils_eq(p.player, $author$project$Main$Ptt) ? $author$project$Main$localYPtt : $author$project$Main$localYCpr;
		var getLambda = function (y) {
			return A3(
				$elm$core$Basics$composeL,
				$elm$core$Maybe$Just,
				$author$project$Main$yToLambda(p.boardConfig),
				A2(localY, y, model.board));
		};
		_v0$17:
		while (true) {
			switch (msg.$) {
				case 'GotTextLengths':
					if (msg.a.$ === 'Ok') {
						var ls = msg.a.a;
						var newLengths = A2(
							$elm$core$Dict$union,
							A2(
								$elm$core$Dict$filter,
								F2(
									function (k, _v1) {
										return !A2($elm$core$String$startsWith, $author$project$Main$instrId, k);
									}),
								ls),
							model.textLengths);
						return $author$project$Main$noCmd(
							_Utils_update(
								model,
								{textLengths: newLengths}));
					} else {
						break _v0$17;
					}
				case 'MouseEnter':
					return $author$project$Main$noCmd(
						_Utils_update(
							model,
							{
								mouseStatus: _Utils_eq(model.mouseStatus, $author$project$Main$UpOut) ? $author$project$Main$UpIn : model.mouseStatus
							}));
				case 'MouseLeave':
					return $author$project$Main$noCmd(
						_Utils_update(
							model,
							{
								mouseStatus: _Utils_eq(model.mouseStatus, $author$project$Main$UpIn) ? $author$project$Main$UpOut : model.mouseStatus
							}));
				case 'MouseDown':
					var x = msg.a.x;
					var y = msg.a.y;
					if (A3($author$project$Main$inBBox, x, y, model.board)) {
						var _v2 = $author$project$Main$isActiveStage(model.stage) ? _Utils_Tuple2(
							getLambda(y),
							$author$project$Main$getBarNumberLengths(p.show)) : _Utils_Tuple2(model.lambda, $elm$core$Platform$Cmd$none);
						var lambda = _v2.a;
						var cmd = _v2.b;
						return _Utils_Tuple3(
							_Utils_update(
								model,
								{lambda: lambda, mouseStatus: $author$project$Main$DownIn}),
							cmd,
							false);
					} else {
						return $author$project$Main$noCmd(
							_Utils_update(
								model,
								{mouseStatus: $author$project$Main$DownOut}));
					}
				case 'MouseUp':
					var x = msg.a.x;
					var y = msg.a.y;
					return $author$project$Main$noCmd(
						_Utils_update(
							model,
							{
								lambda: _Utils_eq(model.fixedLambda, $elm$core$Maybe$Nothing) ? model.lambda : model.fixedLambda,
								mouseStatus: A3($author$project$Main$inBBox, x, y, model.board) ? $author$project$Main$UpIn : $author$project$Main$UpOut
							}));
				case 'MouseMove':
					var y = msg.a.y;
					return _Utils_Tuple3(
						_Utils_update(
							model,
							{
								lambda: getLambda(y)
							}),
						$author$project$Main$getBarNumberLengths(p.show),
						false);
				case 'WindowResize':
					return _Utils_Tuple3(model, $author$project$Main$getBoard, false);
				case 'GotBoard':
					if (msg.a.$ === 'Ok') {
						var element = msg.a.a.element;
						return $author$project$Main$noCmd(
							_Utils_update(
								model,
								{board: element}));
					} else {
						break _v0$17;
					}
				case 'GoTo':
					switch (msg.a.$) {
						case 'Act':
							var _v3 = msg.a;
							return _Utils_Tuple3(
								_Utils_update(
									model,
									{cprActed: false, fixedLambda: $elm$core$Maybe$Nothing, lambda: $elm$core$Maybe$Nothing, prediction: $elm$core$Maybe$Nothing, stage: $author$project$Main$Act}),
								p.isTtrl ? $elm$core$Platform$Cmd$none : A2(
									$elm$core$Task$perform,
									function (_v4) {
										return $author$project$Main$CprAct;
									},
									$elm$core$Process$sleep(2000)),
								true);
						case 'PostAct':
							var _v5 = msg.a;
							var newModel = function () {
								var _v6 = p.player;
								if (_v6.$ === 'Ptt') {
									return _Utils_update(
										model,
										{fixedLambda: model.lambda, stage: $author$project$Main$PostAct});
								} else {
									return _Utils_update(
										model,
										{lambda: $elm$core$Maybe$Nothing, prediction: model.lambda, stage: $author$project$Main$PostAct});
								}
							}();
							var cmd = function () {
								if (model.cprActed && (!p.isTtrl)) {
									var newStage = _Utils_eq(p.player, $author$project$Main$Ptt) ? $author$project$Main$Collect : $author$project$Main$ShowCpr;
									return A2(
										$elm$core$Task$perform,
										$elm$core$Basics$always(
											$author$project$Main$GoTo(newStage)),
										$elm$core$Process$sleep(1000));
								} else {
									return $elm$core$Platform$Cmd$none;
								}
							}();
							return _Utils_Tuple3(newModel, cmd, true);
						case 'Memory':
							var _v7 = msg.a;
							return $author$project$Main$noCmd(
								_Utils_update(
									model,
									{fixedLambda: $elm$core$Maybe$Nothing, lambda: $elm$core$Maybe$Nothing, prediction: $elm$core$Maybe$Nothing, stage: $author$project$Main$Memory}));
						case 'ShowCpr':
							var _v8 = msg.a;
							return _Utils_Tuple3(
								_Utils_update(
									model,
									{
										fixedLambda: $elm$core$Maybe$Just(1),
										lambda: $elm$core$Maybe$Just(1),
										stage: $author$project$Main$ShowCpr
									}),
								p.isTtrl ? $elm$core$Platform$Cmd$none : A2(
									$elm$core$Task$perform,
									function (_v9) {
										return $author$project$Main$GoTo($author$project$Main$Collect);
									},
									$elm$core$Process$sleep(1000)),
								true);
						case 'Collect':
							var _v10 = msg.a;
							return _Utils_Tuple3(
								_Utils_update(
									model,
									{stage: $author$project$Main$Collect}),
								$author$project$Main$getBarNumberLengths(p.show),
								false);
						default:
							var stage = msg.a;
							return $author$project$Main$noCmd(
								_Utils_update(
									model,
									{stage: stage}));
					}
				case 'Animate':
					var t = msg.a;
					return $author$project$Main$noCmd(
						A3($author$project$Main$updateAnimate, t, model, p));
				case 'LoadingStep':
					return $author$project$Main$noCmd(
						_Utils_update(
							model,
							{loadingStep: model.loadingStep + 1}));
				case 'CprAct':
					var cmd = function () {
						if (_Utils_eq(model.stage, $author$project$Main$PostAct) && (!p.isTtrl)) {
							var newStage = _Utils_eq(p.player, $author$project$Main$Ptt) ? $author$project$Main$Collect : $author$project$Main$ShowCpr;
							return A2(
								$elm$core$Task$perform,
								$elm$core$Basics$always(
									$author$project$Main$GoTo(newStage)),
								$elm$core$Process$sleep(1000));
						} else {
							return $elm$core$Platform$Cmd$none;
						}
					}();
					return _Utils_Tuple3(
						_Utils_update(
							model,
							{cprActed: true}),
						cmd,
						true);
				default:
					break _v0$17;
			}
		}
		return $author$project$Main$noCmd(model);
	});
var $author$project$Main$TtrlProceed = {$: 'TtrlProceed'};
var $author$project$Main$getStep = function (i) {
	return A2(
		$elm$core$Maybe$withDefault,
		$author$project$Main$defaultStep,
		A2($elm$core$Array$get, i - 1, $author$project$Main$ttrlSteps));
};
var $elm$core$List$maximum = function (list) {
	if (list.b) {
		var x = list.a;
		var xs = list.b;
		return $elm$core$Maybe$Just(
			A3($elm$core$List$foldl, $elm$core$Basics$max, x, xs));
	} else {
		return $elm$core$Maybe$Nothing;
	}
};
var $author$project$Main$maybeSet = F2(
	function (setter, value) {
		return A2(
			$elm$core$Maybe$withDefault,
			$elm$core$Basics$identity,
			A2(
				$elm$core$Maybe$map,
				A2($elm$core$Basics$composeL, setter, $elm$core$Basics$always),
				value));
	});
var $elm$core$Elm$JsArray$unsafeSet = _JsArray_unsafeSet;
var $elm$core$Array$setHelp = F4(
	function (shift, index, value, tree) {
		var pos = $elm$core$Array$bitMask & (index >>> shift);
		var _v0 = A2($elm$core$Elm$JsArray$unsafeGet, pos, tree);
		if (_v0.$ === 'SubTree') {
			var subTree = _v0.a;
			var newSub = A4($elm$core$Array$setHelp, shift - $elm$core$Array$shiftStep, index, value, subTree);
			return A3(
				$elm$core$Elm$JsArray$unsafeSet,
				pos,
				$elm$core$Array$SubTree(newSub),
				tree);
		} else {
			var values = _v0.a;
			var newLeaf = A3($elm$core$Elm$JsArray$unsafeSet, $elm$core$Array$bitMask & index, value, values);
			return A3(
				$elm$core$Elm$JsArray$unsafeSet,
				pos,
				$elm$core$Array$Leaf(newLeaf),
				tree);
		}
	});
var $elm$core$Array$set = F3(
	function (index, value, array) {
		var len = array.a;
		var startShift = array.b;
		var tree = array.c;
		var tail = array.d;
		return ((index < 0) || (_Utils_cmp(index, len) > -1)) ? array : ((_Utils_cmp(
			index,
			$elm$core$Array$tailIndex(len)) > -1) ? A4(
			$elm$core$Array$Array_elm_builtin,
			len,
			startShift,
			tree,
			A3($elm$core$Elm$JsArray$unsafeSet, $elm$core$Array$bitMask & index, value, tail)) : A4(
			$elm$core$Array$Array_elm_builtin,
			len,
			startShift,
			A4($elm$core$Array$setHelp, startShift, index, value, tree),
			tail));
	});
var $author$project$Main$setInstrLength = F2(
	function (f, m) {
		return _Utils_update(
			m,
			{
				instrLength: f(m.instrLength)
			});
	});
var $elm$core$Dict$values = function (dict) {
	return A3(
		$elm$core$Dict$foldr,
		F3(
			function (key, value, valueList) {
				return A2($elm$core$List$cons, value, valueList);
			}),
		_List_Nil,
		dict);
};
var $author$project$Main$updateTtrl = F3(
	function (ignoreGame, msg, model) {
		var _v0 = function () {
			_v1$4:
			while (true) {
				switch (msg.$) {
					case 'GotTextLengths':
						if (msg.a.$ === 'Ok') {
							var ls = msg.a.a;
							var maybeInstrLength = A3(
								$elm$core$Basics$composeL,
								$elm$core$List$maximum,
								$elm$core$Dict$values,
								A2(
									$elm$core$Dict$filter,
									F2(
										function (k, _v2) {
											return A2($elm$core$String$startsWith, $author$project$Main$instrId, k);
										}),
									ls));
							return _Utils_Tuple2(
								A3(
									$elm$core$Basics$apL,
									A2(
										$elm$core$Basics$composeL,
										$author$project$Main$maybeSet($author$project$Main$setInstrLength),
										$elm$core$Maybe$map($elm$core$Maybe$Just)),
									maybeInstrLength,
									model),
								$elm$core$Platform$Cmd$none);
						} else {
							break _v1$4;
						}
					case 'PrevStep':
						return (model.step === 1) ? _Utils_Tuple2(model, $elm$core$Platform$Cmd$none) : _Utils_Tuple2(
							_Utils_update(
								model,
								{
									game: A2(
										$elm$core$Maybe$withDefault,
										$author$project$Main$initGame,
										A2($elm$core$Array$get, model.step - 2, model.gameStates)),
									instrLength: $elm$core$Maybe$Nothing,
									step: model.step - 1
								}),
							$author$project$Main$getInstrLengths(model.step - 1));
					case 'NextStep':
						if (_Utils_eq(
							model.step,
							$elm$core$Array$length($author$project$Main$ttrlSteps))) {
							return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
						} else {
							var step = A2(
								$elm$core$Maybe$withDefault,
								$author$project$Main$defaultStep,
								A2($elm$core$Array$get, model.step, $author$project$Main$ttrlSteps));
							var proceed = function () {
								var _v5 = step.proceed;
								if (_v5.$ === 'ProceedAfterWait') {
									var t = _v5.a;
									return _Utils_eq(model.step, model.latestStep) ? A2(
										$elm$core$Task$perform,
										$elm$core$Basics$always($author$project$Main$TtrlProceed),
										$elm$core$Process$sleep(t * 100)) : A2(
										$elm$core$Task$perform,
										$elm$core$Basics$always($author$project$Main$TtrlProceed),
										$elm$core$Process$sleep(0));
								} else {
									return $elm$core$Platform$Cmd$none;
								}
							}();
							var _v3 = function () {
								var _v4 = step.gameMsg;
								if (_v4.$ === 'Nothing') {
									return $author$project$Main$noCmd(model.game);
								} else {
									var m = _v4.a;
									return A3(
										$author$project$Main$updateGame,
										m,
										$author$project$Main$ttrlGameProps(model),
										model.game);
								}
							}();
							var newGame = _v3.a;
							var gameCmd = _v3.b;
							return _Utils_Tuple2(
								_Utils_update(
									model,
									{
										game: newGame,
										gameStates: A3($elm$core$Array$set, model.step - 1, model.game, model.gameStates),
										instrLength: $elm$core$Maybe$Nothing,
										latestStep: A2($elm$core$Basics$max, model.latestStep, model.step + 1),
										readyForNext: false,
										step: model.step + 1
									}),
								$elm$core$Platform$Cmd$batch(
									_List_fromArray(
										[
											proceed,
											A2($elm$core$Maybe$withDefault, $elm$core$Platform$Cmd$none, step.cmd),
											$author$project$Main$getInstrLengths(model.step + 1),
											gameCmd
										])));
						}
					case 'TtrlProceed':
						return _Utils_Tuple2(
							_Utils_update(
								model,
								{readyForNext: true}),
							$elm$core$Platform$Cmd$none);
					default:
						break _v1$4;
				}
			}
			var step = $author$project$Main$getStep(model.step);
			var model2 = function () {
				var _v6 = step.proceed;
				if (_v6.$ === 'ProceedOnMsg') {
					var f = _v6.a;
					return A2(f, msg, model) ? _Utils_update(
						model,
						{readyForNext: true}) : model;
				} else {
					return model;
				}
			}();
			return _Utils_Tuple2(model2, $elm$core$Platform$Cmd$none);
		}();
		var model1 = _v0.a;
		var cmd1 = _v0.b;
		if (ignoreGame) {
			return _Utils_Tuple2(model1, cmd1);
		} else {
			var _v7 = A3(
				$author$project$Main$updateGame,
				msg,
				$author$project$Main$ttrlGameProps(model1),
				model1.game);
			var newGame = _v7.a;
			var gameCmd = _v7.b;
			return _Utils_Tuple2(
				_Utils_update(
					model1,
					{game: newGame}),
				$elm$core$Platform$Cmd$batch(
					_List_fromArray(
						[cmd1, gameCmd])));
		}
	});
var $author$project$Main$updateTest = F2(
	function (msg, model) {
		switch (msg.$) {
			case 'NormalGameMsg':
				var m = msg.a;
				var _v1 = A3(
					$author$project$Main$updateGame,
					m,
					$author$project$Main$testGameProps(model),
					model.game);
				var newGame = _v1.a;
				var cmd = _v1.b;
				var wrap = _v1.c;
				var wrapper = wrap ? $author$project$Main$NormalGameMsg : $elm$core$Basics$identity;
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{game: newGame}),
					A2($elm$core$Platform$Cmd$map, wrapper, cmd));
			case 'TestTtrlGameMsg':
				var m = msg.a;
				var _v2 = A3(
					$author$project$Main$updateGame,
					m,
					$author$project$Main$ttrlGameProps(model.ttrl),
					model.ttrl.game);
				var newGame = _v2.a;
				var cmd = _v2.b;
				var wrap = _v2.c;
				var wrapper = wrap ? $author$project$Main$TestTtrlGameMsg : $elm$core$Basics$identity;
				return _Utils_Tuple2(
					A3(
						$elm$core$Basics$apL,
						A2(
							$elm$core$Basics$composeL,
							A2($elm$core$Basics$composeL, $author$project$Main$setTestModelTttr, $author$project$Main$setTtrlModelGame),
							$elm$core$Basics$always),
						newGame,
						model),
					A2($elm$core$Platform$Cmd$map, wrapper, cmd));
			default:
				var _v3 = A3($author$project$Main$updateTtrl, true, msg, model.ttrl);
				var newTtrl = _v3.a;
				var ttrlCmd = _v3.b;
				var _v4 = model.showTtrl ? _Utils_Tuple2(
					A3(
						$author$project$Main$updateGame,
						msg,
						$author$project$Main$ttrlGameProps(model.ttrl),
						model.ttrl.game),
					A2(
						$elm$core$Basics$composeL,
						A2($elm$core$Basics$composeL, $author$project$Main$setTestModelTttr, $author$project$Main$setTtrlModelGame),
						$elm$core$Basics$always)) : _Utils_Tuple2(
					A3(
						$author$project$Main$updateGame,
						msg,
						$author$project$Main$testGameProps(model),
						model.game),
					A2($elm$core$Basics$composeL, $author$project$Main$setTestModelGame, $elm$core$Basics$always));
				var _v5 = _v4.a;
				var newGame = _v5.a;
				var gameCmd = _v5.b;
				var wrap = _v5.c;
				var gameSetter = _v4.b;
				var wrapper = wrap ? (model.showTtrl ? $author$project$Main$TestTtrlGameMsg : $author$project$Main$NormalGameMsg) : $elm$core$Basics$identity;
				return _Utils_Tuple2(
					A2(
						gameSetter,
						newGame,
						_Utils_update(
							model,
							{ttrl: newTtrl})),
					$elm$core$Platform$Cmd$batch(
						_List_fromArray(
							[
								ttrlCmd,
								A2($elm$core$Platform$Cmd$map, wrapper, gameCmd)
							])));
		}
	});
var $author$project$Main$update = F2(
	function (msg, model) {
		switch (msg.$) {
			case 'StateLoaded':
				if (msg.a.$ === 'Ok') {
					var m = msg.a.a;
					return _Utils_Tuple2(m, $elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 'SaveState':
				return _Utils_Tuple2(
					model,
					$author$project$Main$saveState(
						$author$project$Main$encodeModel(model)));
			case 'LoadState':
				return _Utils_Tuple2(
					model,
					$author$project$Main$loadState(_Utils_Tuple0));
			default:
				if (model.$ === 'Ttrl') {
					var m = model.a;
					return A2(
						$elm$core$Tuple$mapFirst,
						$author$project$Main$Ttrl,
						A3($author$project$Main$updateTtrl, false, msg, m));
				} else {
					var m = model.a;
					return A2(
						$elm$core$Tuple$mapFirst,
						$author$project$Main$Test,
						A2($author$project$Main$updateTest, msg, m));
				}
		}
	});
var $author$project$Main$LoadState = {$: 'LoadState'};
var $author$project$Main$SaveState = {$: 'SaveState'};
var $elm$core$List$append = F2(
	function (xs, ys) {
		if (!ys.b) {
			return xs;
		} else {
			return A3($elm$core$List$foldr, $elm$core$List$cons, ys, xs);
		}
	});
var $elm$html$Html$button = _VirtualDom_node('button');
var $avh4$elm_color$Color$RgbaSpace = F4(
	function (a, b, c, d) {
		return {$: 'RgbaSpace', a: a, b: b, c: c, d: d};
	});
var $avh4$elm_color$Color$blue = A4($avh4$elm_color$Color$RgbaSpace, 52 / 255, 101 / 255, 164 / 255, 1.0);
var $avh4$elm_color$Color$scaleFrom255 = function (c) {
	return c / 255;
};
var $avh4$elm_color$Color$rgb255 = F3(
	function (r, g, b) {
		return A4(
			$avh4$elm_color$Color$RgbaSpace,
			$avh4$elm_color$Color$scaleFrom255(r),
			$avh4$elm_color$Color$scaleFrom255(g),
			$avh4$elm_color$Color$scaleFrom255(b),
			1.0);
	});
var $author$project$Colors$blues = function (l) {
	switch (l) {
		case 1:
			return A3($avh4$elm_color$Color$rgb255, 2, 6, 22);
		case 2:
			return A3($avh4$elm_color$Color$rgb255, 5, 18, 49);
		case 3:
			return A3($avh4$elm_color$Color$rgb255, 12, 30, 71);
		case 4:
			return A3($avh4$elm_color$Color$rgb255, 18, 42, 95);
		case 5:
			return A3($avh4$elm_color$Color$rgb255, 23, 53, 120);
		case 6:
			return A3($avh4$elm_color$Color$rgb255, 29, 64, 142);
		case 7:
			return A3($avh4$elm_color$Color$rgb255, 35, 75, 165);
		case 8:
			return A3($avh4$elm_color$Color$rgb255, 44, 87, 183);
		case 9:
			return A3($avh4$elm_color$Color$rgb255, 49, 98, 208);
		case 10:
			return A3($avh4$elm_color$Color$rgb255, 54, 109, 234);
		case 11:
			return A3($avh4$elm_color$Color$rgb255, 62, 121, 254);
		case 12:
			return A3($avh4$elm_color$Color$rgb255, 83, 136, 253);
		case 13:
			return A3($avh4$elm_color$Color$rgb255, 103, 150, 254);
		case 14:
			return A3($avh4$elm_color$Color$rgb255, 125, 165, 251);
		case 15:
			return A3($avh4$elm_color$Color$rgb255, 146, 179, 250);
		case 16:
			return A3($avh4$elm_color$Color$rgb255, 169, 193, 248);
		case 17:
			return A3($avh4$elm_color$Color$rgb255, 192, 207, 244);
		case 18:
			return A3($avh4$elm_color$Color$rgb255, 216, 222, 242);
		case 19:
			return A3($avh4$elm_color$Color$rgb255, 237, 238, 246);
		default:
			return $avh4$elm_color$Color$blue;
	}
};
var $author$project$Main$hCpr = $author$project$Colors$blues;
var $avh4$elm_color$Color$red = A4($avh4$elm_color$Color$RgbaSpace, 204 / 255, 0 / 255, 0 / 255, 1.0);
var $author$project$Colors$reds = function (l) {
	switch (l) {
		case 1:
			return A3($avh4$elm_color$Color$rgb255, 17, 2, 1);
		case 2:
			return A3($avh4$elm_color$Color$rgb255, 39, 5, 2);
		case 3:
			return A3($avh4$elm_color$Color$rgb255, 59, 13, 6);
		case 4:
			return A3($avh4$elm_color$Color$rgb255, 79, 19, 10);
		case 5:
			return A3($avh4$elm_color$Color$rgb255, 98, 24, 13);
		case 6:
			return A3($avh4$elm_color$Color$rgb255, 117, 31, 18);
		case 7:
			return A3($avh4$elm_color$Color$rgb255, 135, 37, 23);
		case 8:
			return A3($avh4$elm_color$Color$rgb255, 153, 46, 30);
		case 9:
			return A3($avh4$elm_color$Color$rgb255, 172, 52, 34);
		case 10:
			return A3($avh4$elm_color$Color$rgb255, 193, 57, 37);
		case 11:
			return A3($avh4$elm_color$Color$rgb255, 212, 65, 44);
		case 12:
			return A3($avh4$elm_color$Color$rgb255, 223, 84, 61);
		case 13:
			return A3($avh4$elm_color$Color$rgb255, 234, 102, 78);
		case 14:
			return A3($avh4$elm_color$Color$rgb255, 242, 122, 99);
		case 15:
			return A3($avh4$elm_color$Color$rgb255, 250, 142, 121);
		case 16:
			return A3($avh4$elm_color$Color$rgb255, 254, 164, 145);
		case 17:
			return A3($avh4$elm_color$Color$rgb255, 255, 187, 172);
		case 18:
			return A3($avh4$elm_color$Color$rgb255, 252, 210, 202);
		case 19:
			return A3($avh4$elm_color$Color$rgb255, 254, 232, 228);
		default:
			return $avh4$elm_color$Color$red;
	}
};
var $author$project$Main$hPtt = $author$project$Colors$reds;
var $author$project$Main$colorsDict = $elm$core$Dict$fromList(
	_List_fromArray(
		[
			_Utils_Tuple2(
			'ptt',
			$author$project$Main$hPtt(10)),
			_Utils_Tuple2(
			'cpr',
			$author$project$Main$hCpr(10))
		]));
var $elm$core$List$concat = function (lists) {
	return A3($elm$core$List$foldr, $elm$core$List$append, _List_Nil, lists);
};
var $elm$core$List$concatMap = F2(
	function (f, list) {
		return $elm$core$List$concat(
			A2($elm$core$List$map, f, list));
	});
var $rtfeldman$elm_css$VirtualDom$Styled$Attribute = F3(
	function (a, b, c) {
		return {$: 'Attribute', a: a, b: b, c: c};
	});
var $elm$virtual_dom$VirtualDom$attribute = F2(
	function (key, value) {
		return A2(
			_VirtualDom_attribute,
			_VirtualDom_noOnOrFormAction(key),
			_VirtualDom_noJavaScriptOrHtmlUri(value));
	});
var $elm$core$List$all = F2(
	function (isOkay, list) {
		return !A2(
			$elm$core$List$any,
			A2($elm$core$Basics$composeL, $elm$core$Basics$not, isOkay),
			list);
	});
var $elm$core$List$isEmpty = function (xs) {
	if (!xs.b) {
		return true;
	} else {
		return false;
	}
};
var $rtfeldman$elm_css$Css$Structure$compactHelp = F2(
	function (declaration, _v0) {
		var keyframesByName = _v0.a;
		var declarations = _v0.b;
		switch (declaration.$) {
			case 'StyleBlockDeclaration':
				var _v2 = declaration.a;
				var properties = _v2.c;
				return $elm$core$List$isEmpty(properties) ? _Utils_Tuple2(keyframesByName, declarations) : _Utils_Tuple2(
					keyframesByName,
					A2($elm$core$List$cons, declaration, declarations));
			case 'MediaRule':
				var styleBlocks = declaration.b;
				return A2(
					$elm$core$List$all,
					function (_v3) {
						var properties = _v3.c;
						return $elm$core$List$isEmpty(properties);
					},
					styleBlocks) ? _Utils_Tuple2(keyframesByName, declarations) : _Utils_Tuple2(
					keyframesByName,
					A2($elm$core$List$cons, declaration, declarations));
			case 'SupportsRule':
				var otherDeclarations = declaration.b;
				return $elm$core$List$isEmpty(otherDeclarations) ? _Utils_Tuple2(keyframesByName, declarations) : _Utils_Tuple2(
					keyframesByName,
					A2($elm$core$List$cons, declaration, declarations));
			case 'DocumentRule':
				return _Utils_Tuple2(
					keyframesByName,
					A2($elm$core$List$cons, declaration, declarations));
			case 'PageRule':
				var properties = declaration.a;
				return $elm$core$List$isEmpty(properties) ? _Utils_Tuple2(keyframesByName, declarations) : _Utils_Tuple2(
					keyframesByName,
					A2($elm$core$List$cons, declaration, declarations));
			case 'FontFace':
				var properties = declaration.a;
				return $elm$core$List$isEmpty(properties) ? _Utils_Tuple2(keyframesByName, declarations) : _Utils_Tuple2(
					keyframesByName,
					A2($elm$core$List$cons, declaration, declarations));
			case 'Keyframes':
				var record = declaration.a;
				return $elm$core$String$isEmpty(record.declaration) ? _Utils_Tuple2(keyframesByName, declarations) : _Utils_Tuple2(
					A3($elm$core$Dict$insert, record.name, record.declaration, keyframesByName),
					declarations);
			case 'Viewport':
				var properties = declaration.a;
				return $elm$core$List$isEmpty(properties) ? _Utils_Tuple2(keyframesByName, declarations) : _Utils_Tuple2(
					keyframesByName,
					A2($elm$core$List$cons, declaration, declarations));
			case 'CounterStyle':
				var properties = declaration.a;
				return $elm$core$List$isEmpty(properties) ? _Utils_Tuple2(keyframesByName, declarations) : _Utils_Tuple2(
					keyframesByName,
					A2($elm$core$List$cons, declaration, declarations));
			default:
				var tuples = declaration.a;
				return A2(
					$elm$core$List$all,
					function (_v4) {
						var properties = _v4.b;
						return $elm$core$List$isEmpty(properties);
					},
					tuples) ? _Utils_Tuple2(keyframesByName, declarations) : _Utils_Tuple2(
					keyframesByName,
					A2($elm$core$List$cons, declaration, declarations));
		}
	});
var $rtfeldman$elm_css$Css$Structure$Keyframes = function (a) {
	return {$: 'Keyframes', a: a};
};
var $rtfeldman$elm_css$Css$Structure$withKeyframeDeclarations = F2(
	function (keyframesByName, compactedDeclarations) {
		return A2(
			$elm$core$List$append,
			A2(
				$elm$core$List$map,
				function (_v0) {
					var name = _v0.a;
					var decl = _v0.b;
					return $rtfeldman$elm_css$Css$Structure$Keyframes(
						{declaration: decl, name: name});
				},
				$elm$core$Dict$toList(keyframesByName)),
			compactedDeclarations);
	});
var $rtfeldman$elm_css$Css$Structure$compactDeclarations = function (declarations) {
	var _v0 = A3(
		$elm$core$List$foldr,
		$rtfeldman$elm_css$Css$Structure$compactHelp,
		_Utils_Tuple2($elm$core$Dict$empty, _List_Nil),
		declarations);
	var keyframesByName = _v0.a;
	var compactedDeclarations = _v0.b;
	return A2($rtfeldman$elm_css$Css$Structure$withKeyframeDeclarations, keyframesByName, compactedDeclarations);
};
var $rtfeldman$elm_css$Css$Structure$compactStylesheet = function (_v0) {
	var charset = _v0.charset;
	var imports = _v0.imports;
	var namespaces = _v0.namespaces;
	var declarations = _v0.declarations;
	return {
		charset: charset,
		declarations: $rtfeldman$elm_css$Css$Structure$compactDeclarations(declarations),
		imports: imports,
		namespaces: namespaces
	};
};
var $rtfeldman$elm_css$Css$Structure$Output$charsetToString = function (charset) {
	return A2(
		$elm$core$Maybe$withDefault,
		'',
		A2(
			$elm$core$Maybe$map,
			function (str) {
				return '@charset \"' + (str + '\"');
			},
			charset));
};
var $rtfeldman$elm_css$Css$String$mapJoinHelp = F4(
	function (map, sep, strs, result) {
		mapJoinHelp:
		while (true) {
			if (!strs.b) {
				return result;
			} else {
				if (!strs.b.b) {
					var first = strs.a;
					return result + (map(first) + '');
				} else {
					var first = strs.a;
					var rest = strs.b;
					var $temp$map = map,
						$temp$sep = sep,
						$temp$strs = rest,
						$temp$result = result + (map(first) + (sep + ''));
					map = $temp$map;
					sep = $temp$sep;
					strs = $temp$strs;
					result = $temp$result;
					continue mapJoinHelp;
				}
			}
		}
	});
var $rtfeldman$elm_css$Css$String$mapJoin = F3(
	function (map, sep, strs) {
		return A4($rtfeldman$elm_css$Css$String$mapJoinHelp, map, sep, strs, '');
	});
var $rtfeldman$elm_css$Css$Structure$Output$mediaExpressionToString = function (expression) {
	return '(' + (expression.feature + (A2(
		$elm$core$Maybe$withDefault,
		'',
		A2(
			$elm$core$Maybe$map,
			$elm$core$Basics$append(': '),
			expression.value)) + ')'));
};
var $rtfeldman$elm_css$Css$Structure$Output$mediaTypeToString = function (mediaType) {
	switch (mediaType.$) {
		case 'Print':
			return 'print';
		case 'Screen':
			return 'screen';
		default:
			return 'speech';
	}
};
var $rtfeldman$elm_css$Css$Structure$Output$mediaQueryToString = function (mediaQuery) {
	var prefixWith = F3(
		function (str, mediaType, expressions) {
			return str + (' ' + A2(
				$elm$core$String$join,
				' and ',
				A2(
					$elm$core$List$cons,
					$rtfeldman$elm_css$Css$Structure$Output$mediaTypeToString(mediaType),
					A2($elm$core$List$map, $rtfeldman$elm_css$Css$Structure$Output$mediaExpressionToString, expressions))));
		});
	switch (mediaQuery.$) {
		case 'AllQuery':
			var expressions = mediaQuery.a;
			return A3($rtfeldman$elm_css$Css$String$mapJoin, $rtfeldman$elm_css$Css$Structure$Output$mediaExpressionToString, ' and ', expressions);
		case 'OnlyQuery':
			var mediaType = mediaQuery.a;
			var expressions = mediaQuery.b;
			return A3(prefixWith, 'only', mediaType, expressions);
		case 'NotQuery':
			var mediaType = mediaQuery.a;
			var expressions = mediaQuery.b;
			return A3(prefixWith, 'not', mediaType, expressions);
		default:
			var str = mediaQuery.a;
			return str;
	}
};
var $rtfeldman$elm_css$Css$Structure$Output$importMediaQueryToString = F2(
	function (name, mediaQuery) {
		return '@import \"' + (name + ($rtfeldman$elm_css$Css$Structure$Output$mediaQueryToString(mediaQuery) + '\"'));
	});
var $rtfeldman$elm_css$Css$Structure$Output$importToString = function (_v0) {
	var name = _v0.a;
	var mediaQueries = _v0.b;
	return A3(
		$rtfeldman$elm_css$Css$String$mapJoin,
		$rtfeldman$elm_css$Css$Structure$Output$importMediaQueryToString(name),
		'\n',
		mediaQueries);
};
var $rtfeldman$elm_css$Css$Structure$Output$namespaceToString = function (_v0) {
	var prefix = _v0.a;
	var str = _v0.b;
	return '@namespace ' + (prefix + ('\"' + (str + '\"')));
};
var $rtfeldman$elm_css$Css$Structure$Output$emitProperties = function (properties) {
	return A3(
		$rtfeldman$elm_css$Css$String$mapJoin,
		function (_v0) {
			var prop = _v0.a;
			return prop + ';';
		},
		'',
		properties);
};
var $elm$core$String$append = _String_append;
var $rtfeldman$elm_css$Css$Structure$Output$pseudoElementToString = function (_v0) {
	var str = _v0.a;
	return '::' + str;
};
var $rtfeldman$elm_css$Css$Structure$Output$combinatorToString = function (combinator) {
	switch (combinator.$) {
		case 'AdjacentSibling':
			return '+';
		case 'GeneralSibling':
			return '~';
		case 'Child':
			return '>';
		default:
			return '';
	}
};
var $rtfeldman$elm_css$Css$Structure$Output$repeatableSimpleSelectorToString = function (repeatableSimpleSelector) {
	switch (repeatableSimpleSelector.$) {
		case 'ClassSelector':
			var str = repeatableSimpleSelector.a;
			return '.' + str;
		case 'IdSelector':
			var str = repeatableSimpleSelector.a;
			return '#' + str;
		case 'PseudoClassSelector':
			var str = repeatableSimpleSelector.a;
			return ':' + str;
		default:
			var str = repeatableSimpleSelector.a;
			return '[' + (str + ']');
	}
};
var $rtfeldman$elm_css$Css$Structure$Output$simpleSelectorSequenceToString = function (simpleSelectorSequence) {
	switch (simpleSelectorSequence.$) {
		case 'TypeSelectorSequence':
			var str = simpleSelectorSequence.a.a;
			var repeatableSimpleSelectors = simpleSelectorSequence.b;
			return _Utils_ap(
				str,
				A3($rtfeldman$elm_css$Css$String$mapJoin, $rtfeldman$elm_css$Css$Structure$Output$repeatableSimpleSelectorToString, '', repeatableSimpleSelectors));
		case 'UniversalSelectorSequence':
			var repeatableSimpleSelectors = simpleSelectorSequence.a;
			return $elm$core$List$isEmpty(repeatableSimpleSelectors) ? '*' : A3($rtfeldman$elm_css$Css$String$mapJoin, $rtfeldman$elm_css$Css$Structure$Output$repeatableSimpleSelectorToString, '', repeatableSimpleSelectors);
		default:
			var str = simpleSelectorSequence.a;
			var repeatableSimpleSelectors = simpleSelectorSequence.b;
			return _Utils_ap(
				str,
				A3($rtfeldman$elm_css$Css$String$mapJoin, $rtfeldman$elm_css$Css$Structure$Output$repeatableSimpleSelectorToString, '', repeatableSimpleSelectors));
	}
};
var $rtfeldman$elm_css$Css$Structure$Output$selectorChainToString = function (_v0) {
	var combinator = _v0.a;
	var sequence = _v0.b;
	return $rtfeldman$elm_css$Css$Structure$Output$combinatorToString(combinator) + (' ' + $rtfeldman$elm_css$Css$Structure$Output$simpleSelectorSequenceToString(sequence));
};
var $rtfeldman$elm_css$Css$Structure$Output$selectorToString = function (_v0) {
	var simpleSelectorSequence = _v0.a;
	var chain = _v0.b;
	var pseudoElement = _v0.c;
	var segments = A2(
		$elm$core$List$cons,
		$rtfeldman$elm_css$Css$Structure$Output$simpleSelectorSequenceToString(simpleSelectorSequence),
		A2($elm$core$List$map, $rtfeldman$elm_css$Css$Structure$Output$selectorChainToString, chain));
	var pseudoElementsString = A2(
		$elm$core$Maybe$withDefault,
		'',
		A2($elm$core$Maybe$map, $rtfeldman$elm_css$Css$Structure$Output$pseudoElementToString, pseudoElement));
	return A2(
		$elm$core$String$append,
		A2($elm$core$String$join, ' ', segments),
		pseudoElementsString);
};
var $rtfeldman$elm_css$Css$Structure$Output$prettyPrintStyleBlock = function (_v0) {
	var firstSelector = _v0.a;
	var otherSelectors = _v0.b;
	var properties = _v0.c;
	var selectorStr = A3(
		$rtfeldman$elm_css$Css$String$mapJoin,
		$rtfeldman$elm_css$Css$Structure$Output$selectorToString,
		',',
		A2($elm$core$List$cons, firstSelector, otherSelectors));
	return selectorStr + ('{' + ($rtfeldman$elm_css$Css$Structure$Output$emitProperties(properties) + '}'));
};
var $rtfeldman$elm_css$Css$Structure$Output$prettyPrintDeclaration = function (decl) {
	switch (decl.$) {
		case 'StyleBlockDeclaration':
			var styleBlock = decl.a;
			return $rtfeldman$elm_css$Css$Structure$Output$prettyPrintStyleBlock(styleBlock);
		case 'MediaRule':
			var mediaQueries = decl.a;
			var styleBlocks = decl.b;
			var query = A3($rtfeldman$elm_css$Css$String$mapJoin, $rtfeldman$elm_css$Css$Structure$Output$mediaQueryToString, ', ', mediaQueries);
			var blocks = A3($rtfeldman$elm_css$Css$String$mapJoin, $rtfeldman$elm_css$Css$Structure$Output$prettyPrintStyleBlock, '\n', styleBlocks);
			return '@media ' + (query + ('{' + (blocks + '}')));
		case 'SupportsRule':
			return 'TODO';
		case 'DocumentRule':
			return 'TODO';
		case 'PageRule':
			return 'TODO';
		case 'FontFace':
			return 'TODO';
		case 'Keyframes':
			var name = decl.a.name;
			var declaration = decl.a.declaration;
			return '@keyframes ' + (name + ('{' + (declaration + '}')));
		case 'Viewport':
			return 'TODO';
		case 'CounterStyle':
			return 'TODO';
		default:
			return 'TODO';
	}
};
var $rtfeldman$elm_css$Css$Structure$Output$prettyPrint = function (_v0) {
	var charset = _v0.charset;
	var imports = _v0.imports;
	var namespaces = _v0.namespaces;
	var declarations = _v0.declarations;
	return $rtfeldman$elm_css$Css$Structure$Output$charsetToString(charset) + (A3($rtfeldman$elm_css$Css$String$mapJoin, $rtfeldman$elm_css$Css$Structure$Output$importToString, '\n', imports) + (A3($rtfeldman$elm_css$Css$String$mapJoin, $rtfeldman$elm_css$Css$Structure$Output$namespaceToString, '\n', namespaces) + (A3($rtfeldman$elm_css$Css$String$mapJoin, $rtfeldman$elm_css$Css$Structure$Output$prettyPrintDeclaration, '\n', declarations) + '')));
};
var $rtfeldman$elm_css$Css$Structure$CounterStyle = function (a) {
	return {$: 'CounterStyle', a: a};
};
var $rtfeldman$elm_css$Css$Structure$FontFace = function (a) {
	return {$: 'FontFace', a: a};
};
var $rtfeldman$elm_css$Css$Structure$PageRule = function (a) {
	return {$: 'PageRule', a: a};
};
var $rtfeldman$elm_css$Css$Structure$Property = function (a) {
	return {$: 'Property', a: a};
};
var $rtfeldman$elm_css$Css$Structure$Selector = F3(
	function (a, b, c) {
		return {$: 'Selector', a: a, b: b, c: c};
	});
var $rtfeldman$elm_css$Css$Structure$StyleBlock = F3(
	function (a, b, c) {
		return {$: 'StyleBlock', a: a, b: b, c: c};
	});
var $rtfeldman$elm_css$Css$Structure$StyleBlockDeclaration = function (a) {
	return {$: 'StyleBlockDeclaration', a: a};
};
var $rtfeldman$elm_css$Css$Structure$SupportsRule = F2(
	function (a, b) {
		return {$: 'SupportsRule', a: a, b: b};
	});
var $rtfeldman$elm_css$Css$Structure$Viewport = function (a) {
	return {$: 'Viewport', a: a};
};
var $rtfeldman$elm_css$Css$Structure$MediaRule = F2(
	function (a, b) {
		return {$: 'MediaRule', a: a, b: b};
	});
var $rtfeldman$elm_css$Css$Structure$mapLast = F2(
	function (update, list) {
		if (!list.b) {
			return list;
		} else {
			if (!list.b.b) {
				var only = list.a;
				return _List_fromArray(
					[
						update(only)
					]);
			} else {
				var first = list.a;
				var rest = list.b;
				return A2(
					$elm$core$List$cons,
					first,
					A2($rtfeldman$elm_css$Css$Structure$mapLast, update, rest));
			}
		}
	});
var $rtfeldman$elm_css$Css$Structure$withPropertyAppended = F2(
	function (property, _v0) {
		var firstSelector = _v0.a;
		var otherSelectors = _v0.b;
		var properties = _v0.c;
		return A3(
			$rtfeldman$elm_css$Css$Structure$StyleBlock,
			firstSelector,
			otherSelectors,
			_Utils_ap(
				properties,
				_List_fromArray(
					[property])));
	});
var $rtfeldman$elm_css$Css$Structure$appendProperty = F2(
	function (property, declarations) {
		if (!declarations.b) {
			return declarations;
		} else {
			if (!declarations.b.b) {
				switch (declarations.a.$) {
					case 'StyleBlockDeclaration':
						var styleBlock = declarations.a.a;
						return _List_fromArray(
							[
								$rtfeldman$elm_css$Css$Structure$StyleBlockDeclaration(
								A2($rtfeldman$elm_css$Css$Structure$withPropertyAppended, property, styleBlock))
							]);
					case 'MediaRule':
						var _v1 = declarations.a;
						var mediaQueries = _v1.a;
						var styleBlocks = _v1.b;
						return _List_fromArray(
							[
								A2(
								$rtfeldman$elm_css$Css$Structure$MediaRule,
								mediaQueries,
								A2(
									$rtfeldman$elm_css$Css$Structure$mapLast,
									$rtfeldman$elm_css$Css$Structure$withPropertyAppended(property),
									styleBlocks))
							]);
					default:
						return declarations;
				}
			} else {
				var first = declarations.a;
				var rest = declarations.b;
				return A2(
					$elm$core$List$cons,
					first,
					A2($rtfeldman$elm_css$Css$Structure$appendProperty, property, rest));
			}
		}
	});
var $rtfeldman$elm_css$Css$Structure$appendToLastSelector = F2(
	function (f, styleBlock) {
		if (!styleBlock.b.b) {
			var only = styleBlock.a;
			var properties = styleBlock.c;
			return _List_fromArray(
				[
					A3($rtfeldman$elm_css$Css$Structure$StyleBlock, only, _List_Nil, properties),
					A3(
					$rtfeldman$elm_css$Css$Structure$StyleBlock,
					f(only),
					_List_Nil,
					_List_Nil)
				]);
		} else {
			var first = styleBlock.a;
			var rest = styleBlock.b;
			var properties = styleBlock.c;
			var newRest = A2($elm$core$List$map, f, rest);
			var newFirst = f(first);
			return _List_fromArray(
				[
					A3($rtfeldman$elm_css$Css$Structure$StyleBlock, first, rest, properties),
					A3($rtfeldman$elm_css$Css$Structure$StyleBlock, newFirst, newRest, _List_Nil)
				]);
		}
	});
var $rtfeldman$elm_css$Css$Structure$applyPseudoElement = F2(
	function (pseudo, _v0) {
		var sequence = _v0.a;
		var selectors = _v0.b;
		return A3(
			$rtfeldman$elm_css$Css$Structure$Selector,
			sequence,
			selectors,
			$elm$core$Maybe$Just(pseudo));
	});
var $rtfeldman$elm_css$Css$Structure$appendPseudoElementToLastSelector = F2(
	function (pseudo, styleBlock) {
		return A2(
			$rtfeldman$elm_css$Css$Structure$appendToLastSelector,
			$rtfeldman$elm_css$Css$Structure$applyPseudoElement(pseudo),
			styleBlock);
	});
var $rtfeldman$elm_css$Css$Structure$CustomSelector = F2(
	function (a, b) {
		return {$: 'CustomSelector', a: a, b: b};
	});
var $rtfeldman$elm_css$Css$Structure$TypeSelectorSequence = F2(
	function (a, b) {
		return {$: 'TypeSelectorSequence', a: a, b: b};
	});
var $rtfeldman$elm_css$Css$Structure$UniversalSelectorSequence = function (a) {
	return {$: 'UniversalSelectorSequence', a: a};
};
var $rtfeldman$elm_css$Css$Structure$appendRepeatable = F2(
	function (selector, sequence) {
		switch (sequence.$) {
			case 'TypeSelectorSequence':
				var typeSelector = sequence.a;
				var list = sequence.b;
				return A2(
					$rtfeldman$elm_css$Css$Structure$TypeSelectorSequence,
					typeSelector,
					_Utils_ap(
						list,
						_List_fromArray(
							[selector])));
			case 'UniversalSelectorSequence':
				var list = sequence.a;
				return $rtfeldman$elm_css$Css$Structure$UniversalSelectorSequence(
					_Utils_ap(
						list,
						_List_fromArray(
							[selector])));
			default:
				var str = sequence.a;
				var list = sequence.b;
				return A2(
					$rtfeldman$elm_css$Css$Structure$CustomSelector,
					str,
					_Utils_ap(
						list,
						_List_fromArray(
							[selector])));
		}
	});
var $rtfeldman$elm_css$Css$Structure$appendRepeatableWithCombinator = F2(
	function (selector, list) {
		if (!list.b) {
			return _List_Nil;
		} else {
			if (!list.b.b) {
				var _v1 = list.a;
				var combinator = _v1.a;
				var sequence = _v1.b;
				return _List_fromArray(
					[
						_Utils_Tuple2(
						combinator,
						A2($rtfeldman$elm_css$Css$Structure$appendRepeatable, selector, sequence))
					]);
			} else {
				var first = list.a;
				var rest = list.b;
				return A2(
					$elm$core$List$cons,
					first,
					A2($rtfeldman$elm_css$Css$Structure$appendRepeatableWithCombinator, selector, rest));
			}
		}
	});
var $rtfeldman$elm_css$Css$Structure$appendRepeatableSelector = F2(
	function (repeatableSimpleSelector, selector) {
		if (!selector.b.b) {
			var sequence = selector.a;
			var pseudoElement = selector.c;
			return A3(
				$rtfeldman$elm_css$Css$Structure$Selector,
				A2($rtfeldman$elm_css$Css$Structure$appendRepeatable, repeatableSimpleSelector, sequence),
				_List_Nil,
				pseudoElement);
		} else {
			var firstSelector = selector.a;
			var tuples = selector.b;
			var pseudoElement = selector.c;
			return A3(
				$rtfeldman$elm_css$Css$Structure$Selector,
				firstSelector,
				A2($rtfeldman$elm_css$Css$Structure$appendRepeatableWithCombinator, repeatableSimpleSelector, tuples),
				pseudoElement);
		}
	});
var $rtfeldman$elm_css$Css$Structure$appendRepeatableToLastSelector = F2(
	function (selector, styleBlock) {
		return A2(
			$rtfeldman$elm_css$Css$Structure$appendToLastSelector,
			$rtfeldman$elm_css$Css$Structure$appendRepeatableSelector(selector),
			styleBlock);
	});
var $rtfeldman$elm_css$Css$Preprocess$Resolve$collectSelectors = function (declarations) {
	collectSelectors:
	while (true) {
		if (!declarations.b) {
			return _List_Nil;
		} else {
			if (declarations.a.$ === 'StyleBlockDeclaration') {
				var _v1 = declarations.a.a;
				var firstSelector = _v1.a;
				var otherSelectors = _v1.b;
				var rest = declarations.b;
				return _Utils_ap(
					A2($elm$core$List$cons, firstSelector, otherSelectors),
					$rtfeldman$elm_css$Css$Preprocess$Resolve$collectSelectors(rest));
			} else {
				var rest = declarations.b;
				var $temp$declarations = rest;
				declarations = $temp$declarations;
				continue collectSelectors;
			}
		}
	}
};
var $rtfeldman$elm_css$Css$Structure$DocumentRule = F5(
	function (a, b, c, d, e) {
		return {$: 'DocumentRule', a: a, b: b, c: c, d: d, e: e};
	});
var $rtfeldman$elm_css$Css$Structure$concatMapLastStyleBlock = F2(
	function (update, declarations) {
		_v0$12:
		while (true) {
			if (!declarations.b) {
				return declarations;
			} else {
				if (!declarations.b.b) {
					switch (declarations.a.$) {
						case 'StyleBlockDeclaration':
							var styleBlock = declarations.a.a;
							return A2(
								$elm$core$List$map,
								$rtfeldman$elm_css$Css$Structure$StyleBlockDeclaration,
								update(styleBlock));
						case 'MediaRule':
							if (declarations.a.b.b) {
								if (!declarations.a.b.b.b) {
									var _v1 = declarations.a;
									var mediaQueries = _v1.a;
									var _v2 = _v1.b;
									var styleBlock = _v2.a;
									return _List_fromArray(
										[
											A2(
											$rtfeldman$elm_css$Css$Structure$MediaRule,
											mediaQueries,
											update(styleBlock))
										]);
								} else {
									var _v3 = declarations.a;
									var mediaQueries = _v3.a;
									var _v4 = _v3.b;
									var first = _v4.a;
									var rest = _v4.b;
									var _v5 = A2(
										$rtfeldman$elm_css$Css$Structure$concatMapLastStyleBlock,
										update,
										_List_fromArray(
											[
												A2($rtfeldman$elm_css$Css$Structure$MediaRule, mediaQueries, rest)
											]));
									if ((_v5.b && (_v5.a.$ === 'MediaRule')) && (!_v5.b.b)) {
										var _v6 = _v5.a;
										var newMediaQueries = _v6.a;
										var newStyleBlocks = _v6.b;
										return _List_fromArray(
											[
												A2(
												$rtfeldman$elm_css$Css$Structure$MediaRule,
												newMediaQueries,
												A2($elm$core$List$cons, first, newStyleBlocks))
											]);
									} else {
										var newDeclarations = _v5;
										return newDeclarations;
									}
								}
							} else {
								break _v0$12;
							}
						case 'SupportsRule':
							var _v7 = declarations.a;
							var str = _v7.a;
							var nestedDeclarations = _v7.b;
							return _List_fromArray(
								[
									A2(
									$rtfeldman$elm_css$Css$Structure$SupportsRule,
									str,
									A2($rtfeldman$elm_css$Css$Structure$concatMapLastStyleBlock, update, nestedDeclarations))
								]);
						case 'DocumentRule':
							var _v8 = declarations.a;
							var str1 = _v8.a;
							var str2 = _v8.b;
							var str3 = _v8.c;
							var str4 = _v8.d;
							var styleBlock = _v8.e;
							return A2(
								$elm$core$List$map,
								A4($rtfeldman$elm_css$Css$Structure$DocumentRule, str1, str2, str3, str4),
								update(styleBlock));
						case 'PageRule':
							return declarations;
						case 'FontFace':
							return declarations;
						case 'Keyframes':
							return declarations;
						case 'Viewport':
							return declarations;
						case 'CounterStyle':
							return declarations;
						default:
							return declarations;
					}
				} else {
					break _v0$12;
				}
			}
		}
		var first = declarations.a;
		var rest = declarations.b;
		return A2(
			$elm$core$List$cons,
			first,
			A2($rtfeldman$elm_css$Css$Structure$concatMapLastStyleBlock, update, rest));
	});
var $robinheghan$murmur3$Murmur3$HashData = F4(
	function (shift, seed, hash, charsProcessed) {
		return {charsProcessed: charsProcessed, hash: hash, seed: seed, shift: shift};
	});
var $robinheghan$murmur3$Murmur3$c1 = 3432918353;
var $robinheghan$murmur3$Murmur3$c2 = 461845907;
var $robinheghan$murmur3$Murmur3$multiplyBy = F2(
	function (b, a) {
		return ((a & 65535) * b) + ((((a >>> 16) * b) & 65535) << 16);
	});
var $elm$core$Bitwise$or = _Bitwise_or;
var $robinheghan$murmur3$Murmur3$rotlBy = F2(
	function (b, a) {
		return (a << b) | (a >>> (32 - b));
	});
var $robinheghan$murmur3$Murmur3$finalize = function (data) {
	var acc = (!(!data.hash)) ? (data.seed ^ A2(
		$robinheghan$murmur3$Murmur3$multiplyBy,
		$robinheghan$murmur3$Murmur3$c2,
		A2(
			$robinheghan$murmur3$Murmur3$rotlBy,
			15,
			A2($robinheghan$murmur3$Murmur3$multiplyBy, $robinheghan$murmur3$Murmur3$c1, data.hash)))) : data.seed;
	var h0 = acc ^ data.charsProcessed;
	var h1 = A2($robinheghan$murmur3$Murmur3$multiplyBy, 2246822507, h0 ^ (h0 >>> 16));
	var h2 = A2($robinheghan$murmur3$Murmur3$multiplyBy, 3266489909, h1 ^ (h1 >>> 13));
	return (h2 ^ (h2 >>> 16)) >>> 0;
};
var $elm$core$String$foldl = _String_foldl;
var $robinheghan$murmur3$Murmur3$mix = F2(
	function (h1, k1) {
		return A2(
			$robinheghan$murmur3$Murmur3$multiplyBy,
			5,
			A2(
				$robinheghan$murmur3$Murmur3$rotlBy,
				13,
				h1 ^ A2(
					$robinheghan$murmur3$Murmur3$multiplyBy,
					$robinheghan$murmur3$Murmur3$c2,
					A2(
						$robinheghan$murmur3$Murmur3$rotlBy,
						15,
						A2($robinheghan$murmur3$Murmur3$multiplyBy, $robinheghan$murmur3$Murmur3$c1, k1))))) + 3864292196;
	});
var $robinheghan$murmur3$Murmur3$hashFold = F2(
	function (c, data) {
		var res = data.hash | ((255 & $elm$core$Char$toCode(c)) << data.shift);
		var _v0 = data.shift;
		if (_v0 === 24) {
			return {
				charsProcessed: data.charsProcessed + 1,
				hash: 0,
				seed: A2($robinheghan$murmur3$Murmur3$mix, data.seed, res),
				shift: 0
			};
		} else {
			return {charsProcessed: data.charsProcessed + 1, hash: res, seed: data.seed, shift: data.shift + 8};
		}
	});
var $robinheghan$murmur3$Murmur3$hashString = F2(
	function (seed, str) {
		return $robinheghan$murmur3$Murmur3$finalize(
			A3(
				$elm$core$String$foldl,
				$robinheghan$murmur3$Murmur3$hashFold,
				A4($robinheghan$murmur3$Murmur3$HashData, 0, seed, 0, 0),
				str));
	});
var $rtfeldman$elm_css$Hash$initialSeed = 15739;
var $elm$core$String$fromList = _String_fromList;
var $rtfeldman$elm_hex$Hex$unsafeToDigit = function (num) {
	unsafeToDigit:
	while (true) {
		switch (num) {
			case 0:
				return _Utils_chr('0');
			case 1:
				return _Utils_chr('1');
			case 2:
				return _Utils_chr('2');
			case 3:
				return _Utils_chr('3');
			case 4:
				return _Utils_chr('4');
			case 5:
				return _Utils_chr('5');
			case 6:
				return _Utils_chr('6');
			case 7:
				return _Utils_chr('7');
			case 8:
				return _Utils_chr('8');
			case 9:
				return _Utils_chr('9');
			case 10:
				return _Utils_chr('a');
			case 11:
				return _Utils_chr('b');
			case 12:
				return _Utils_chr('c');
			case 13:
				return _Utils_chr('d');
			case 14:
				return _Utils_chr('e');
			case 15:
				return _Utils_chr('f');
			default:
				var $temp$num = num;
				num = $temp$num;
				continue unsafeToDigit;
		}
	}
};
var $rtfeldman$elm_hex$Hex$unsafePositiveToDigits = F2(
	function (digits, num) {
		unsafePositiveToDigits:
		while (true) {
			if (num < 16) {
				return A2(
					$elm$core$List$cons,
					$rtfeldman$elm_hex$Hex$unsafeToDigit(num),
					digits);
			} else {
				var $temp$digits = A2(
					$elm$core$List$cons,
					$rtfeldman$elm_hex$Hex$unsafeToDigit(
						A2($elm$core$Basics$modBy, 16, num)),
					digits),
					$temp$num = (num / 16) | 0;
				digits = $temp$digits;
				num = $temp$num;
				continue unsafePositiveToDigits;
			}
		}
	});
var $rtfeldman$elm_hex$Hex$toString = function (num) {
	return $elm$core$String$fromList(
		(num < 0) ? A2(
			$elm$core$List$cons,
			_Utils_chr('-'),
			A2($rtfeldman$elm_hex$Hex$unsafePositiveToDigits, _List_Nil, -num)) : A2($rtfeldman$elm_hex$Hex$unsafePositiveToDigits, _List_Nil, num));
};
var $rtfeldman$elm_css$Hash$fromString = function (str) {
	return A2(
		$elm$core$String$cons,
		_Utils_chr('_'),
		$rtfeldman$elm_hex$Hex$toString(
			A2($robinheghan$murmur3$Murmur3$hashString, $rtfeldman$elm_css$Hash$initialSeed, str)));
};
var $elm$core$List$head = function (list) {
	if (list.b) {
		var x = list.a;
		var xs = list.b;
		return $elm$core$Maybe$Just(x);
	} else {
		return $elm$core$Maybe$Nothing;
	}
};
var $rtfeldman$elm_css$Css$Preprocess$Resolve$last = function (list) {
	last:
	while (true) {
		if (!list.b) {
			return $elm$core$Maybe$Nothing;
		} else {
			if (!list.b.b) {
				var singleton = list.a;
				return $elm$core$Maybe$Just(singleton);
			} else {
				var rest = list.b;
				var $temp$list = rest;
				list = $temp$list;
				continue last;
			}
		}
	}
};
var $rtfeldman$elm_css$Css$Preprocess$Resolve$lastDeclaration = function (declarations) {
	lastDeclaration:
	while (true) {
		if (!declarations.b) {
			return $elm$core$Maybe$Nothing;
		} else {
			if (!declarations.b.b) {
				var x = declarations.a;
				return $elm$core$Maybe$Just(
					_List_fromArray(
						[x]));
			} else {
				var xs = declarations.b;
				var $temp$declarations = xs;
				declarations = $temp$declarations;
				continue lastDeclaration;
			}
		}
	}
};
var $rtfeldman$elm_css$Css$Preprocess$Resolve$oneOf = function (maybes) {
	oneOf:
	while (true) {
		if (!maybes.b) {
			return $elm$core$Maybe$Nothing;
		} else {
			var maybe = maybes.a;
			var rest = maybes.b;
			if (maybe.$ === 'Nothing') {
				var $temp$maybes = rest;
				maybes = $temp$maybes;
				continue oneOf;
			} else {
				return maybe;
			}
		}
	}
};
var $rtfeldman$elm_css$Css$Structure$FontFeatureValues = function (a) {
	return {$: 'FontFeatureValues', a: a};
};
var $rtfeldman$elm_css$Css$Preprocess$Resolve$resolveFontFeatureValues = function (tuples) {
	var expandTuples = function (tuplesToExpand) {
		if (!tuplesToExpand.b) {
			return _List_Nil;
		} else {
			var properties = tuplesToExpand.a;
			var rest = tuplesToExpand.b;
			return A2(
				$elm$core$List$cons,
				properties,
				expandTuples(rest));
		}
	};
	var newTuples = expandTuples(tuples);
	return _List_fromArray(
		[
			$rtfeldman$elm_css$Css$Structure$FontFeatureValues(newTuples)
		]);
};
var $elm$core$List$singleton = function (value) {
	return _List_fromArray(
		[value]);
};
var $rtfeldman$elm_css$Css$Structure$styleBlockToMediaRule = F2(
	function (mediaQueries, declaration) {
		if (declaration.$ === 'StyleBlockDeclaration') {
			var styleBlock = declaration.a;
			return A2(
				$rtfeldman$elm_css$Css$Structure$MediaRule,
				mediaQueries,
				_List_fromArray(
					[styleBlock]));
		} else {
			return declaration;
		}
	});
var $elm$core$List$tail = function (list) {
	if (list.b) {
		var x = list.a;
		var xs = list.b;
		return $elm$core$Maybe$Just(xs);
	} else {
		return $elm$core$Maybe$Nothing;
	}
};
var $elm$core$List$takeReverse = F3(
	function (n, list, kept) {
		takeReverse:
		while (true) {
			if (n <= 0) {
				return kept;
			} else {
				if (!list.b) {
					return kept;
				} else {
					var x = list.a;
					var xs = list.b;
					var $temp$n = n - 1,
						$temp$list = xs,
						$temp$kept = A2($elm$core$List$cons, x, kept);
					n = $temp$n;
					list = $temp$list;
					kept = $temp$kept;
					continue takeReverse;
				}
			}
		}
	});
var $elm$core$List$takeTailRec = F2(
	function (n, list) {
		return $elm$core$List$reverse(
			A3($elm$core$List$takeReverse, n, list, _List_Nil));
	});
var $elm$core$List$takeFast = F3(
	function (ctr, n, list) {
		if (n <= 0) {
			return _List_Nil;
		} else {
			var _v0 = _Utils_Tuple2(n, list);
			_v0$1:
			while (true) {
				_v0$5:
				while (true) {
					if (!_v0.b.b) {
						return list;
					} else {
						if (_v0.b.b.b) {
							switch (_v0.a) {
								case 1:
									break _v0$1;
								case 2:
									var _v2 = _v0.b;
									var x = _v2.a;
									var _v3 = _v2.b;
									var y = _v3.a;
									return _List_fromArray(
										[x, y]);
								case 3:
									if (_v0.b.b.b.b) {
										var _v4 = _v0.b;
										var x = _v4.a;
										var _v5 = _v4.b;
										var y = _v5.a;
										var _v6 = _v5.b;
										var z = _v6.a;
										return _List_fromArray(
											[x, y, z]);
									} else {
										break _v0$5;
									}
								default:
									if (_v0.b.b.b.b && _v0.b.b.b.b.b) {
										var _v7 = _v0.b;
										var x = _v7.a;
										var _v8 = _v7.b;
										var y = _v8.a;
										var _v9 = _v8.b;
										var z = _v9.a;
										var _v10 = _v9.b;
										var w = _v10.a;
										var tl = _v10.b;
										return (ctr > 1000) ? A2(
											$elm$core$List$cons,
											x,
											A2(
												$elm$core$List$cons,
												y,
												A2(
													$elm$core$List$cons,
													z,
													A2(
														$elm$core$List$cons,
														w,
														A2($elm$core$List$takeTailRec, n - 4, tl))))) : A2(
											$elm$core$List$cons,
											x,
											A2(
												$elm$core$List$cons,
												y,
												A2(
													$elm$core$List$cons,
													z,
													A2(
														$elm$core$List$cons,
														w,
														A3($elm$core$List$takeFast, ctr + 1, n - 4, tl)))));
									} else {
										break _v0$5;
									}
							}
						} else {
							if (_v0.a === 1) {
								break _v0$1;
							} else {
								break _v0$5;
							}
						}
					}
				}
				return list;
			}
			var _v1 = _v0.b;
			var x = _v1.a;
			return _List_fromArray(
				[x]);
		}
	});
var $elm$core$List$take = F2(
	function (n, list) {
		return A3($elm$core$List$takeFast, 0, n, list);
	});
var $rtfeldman$elm_css$Css$Preprocess$Resolve$toDocumentRule = F5(
	function (str1, str2, str3, str4, declaration) {
		if (declaration.$ === 'StyleBlockDeclaration') {
			var structureStyleBlock = declaration.a;
			return A5($rtfeldman$elm_css$Css$Structure$DocumentRule, str1, str2, str3, str4, structureStyleBlock);
		} else {
			return declaration;
		}
	});
var $rtfeldman$elm_css$Css$Preprocess$Resolve$toMediaRule = F2(
	function (mediaQueries, declaration) {
		switch (declaration.$) {
			case 'StyleBlockDeclaration':
				var structureStyleBlock = declaration.a;
				return A2(
					$rtfeldman$elm_css$Css$Structure$MediaRule,
					mediaQueries,
					_List_fromArray(
						[structureStyleBlock]));
			case 'MediaRule':
				var newMediaQueries = declaration.a;
				var structureStyleBlocks = declaration.b;
				return A2(
					$rtfeldman$elm_css$Css$Structure$MediaRule,
					_Utils_ap(mediaQueries, newMediaQueries),
					structureStyleBlocks);
			case 'SupportsRule':
				var str = declaration.a;
				var declarations = declaration.b;
				return A2(
					$rtfeldman$elm_css$Css$Structure$SupportsRule,
					str,
					A2(
						$elm$core$List$map,
						$rtfeldman$elm_css$Css$Preprocess$Resolve$toMediaRule(mediaQueries),
						declarations));
			case 'DocumentRule':
				var str1 = declaration.a;
				var str2 = declaration.b;
				var str3 = declaration.c;
				var str4 = declaration.d;
				var structureStyleBlock = declaration.e;
				return A5($rtfeldman$elm_css$Css$Structure$DocumentRule, str1, str2, str3, str4, structureStyleBlock);
			case 'PageRule':
				return declaration;
			case 'FontFace':
				return declaration;
			case 'Keyframes':
				return declaration;
			case 'Viewport':
				return declaration;
			case 'CounterStyle':
				return declaration;
			default:
				return declaration;
		}
	});
var $rtfeldman$elm_css$Css$Preprocess$unwrapSnippet = function (_v0) {
	var declarations = _v0.a;
	return declarations;
};
var $rtfeldman$elm_css$Css$Preprocess$Resolve$applyNestedStylesToLast = F4(
	function (nestedStyles, rest, f, declarations) {
		var withoutParent = function (decls) {
			return A2(
				$elm$core$Maybe$withDefault,
				_List_Nil,
				$elm$core$List$tail(decls));
		};
		var nextResult = A2(
			$rtfeldman$elm_css$Css$Preprocess$Resolve$applyStyles,
			rest,
			A2(
				$elm$core$Maybe$withDefault,
				_List_Nil,
				$rtfeldman$elm_css$Css$Preprocess$Resolve$lastDeclaration(declarations)));
		var newDeclarations = function () {
			var _v14 = _Utils_Tuple2(
				$elm$core$List$head(nextResult),
				$rtfeldman$elm_css$Css$Preprocess$Resolve$last(declarations));
			if ((_v14.a.$ === 'Just') && (_v14.b.$ === 'Just')) {
				var nextResultParent = _v14.a.a;
				var originalParent = _v14.b.a;
				return _Utils_ap(
					A2(
						$elm$core$List$take,
						$elm$core$List$length(declarations) - 1,
						declarations),
					_List_fromArray(
						[
							(!_Utils_eq(originalParent, nextResultParent)) ? nextResultParent : originalParent
						]));
			} else {
				return declarations;
			}
		}();
		var insertStylesToNestedDecl = function (lastDecl) {
			return $elm$core$List$concat(
				A2(
					$rtfeldman$elm_css$Css$Structure$mapLast,
					$rtfeldman$elm_css$Css$Preprocess$Resolve$applyStyles(nestedStyles),
					A2(
						$elm$core$List$map,
						$elm$core$List$singleton,
						A2($rtfeldman$elm_css$Css$Structure$concatMapLastStyleBlock, f, lastDecl))));
		};
		var initialResult = A2(
			$elm$core$Maybe$withDefault,
			_List_Nil,
			A2(
				$elm$core$Maybe$map,
				insertStylesToNestedDecl,
				$rtfeldman$elm_css$Css$Preprocess$Resolve$lastDeclaration(declarations)));
		return _Utils_ap(
			newDeclarations,
			_Utils_ap(
				withoutParent(initialResult),
				withoutParent(nextResult)));
	});
var $rtfeldman$elm_css$Css$Preprocess$Resolve$applyStyles = F2(
	function (styles, declarations) {
		if (!styles.b) {
			return declarations;
		} else {
			switch (styles.a.$) {
				case 'AppendProperty':
					var property = styles.a.a;
					var rest = styles.b;
					return A2(
						$rtfeldman$elm_css$Css$Preprocess$Resolve$applyStyles,
						rest,
						A2($rtfeldman$elm_css$Css$Structure$appendProperty, property, declarations));
				case 'ExtendSelector':
					var _v4 = styles.a;
					var selector = _v4.a;
					var nestedStyles = _v4.b;
					var rest = styles.b;
					return A4(
						$rtfeldman$elm_css$Css$Preprocess$Resolve$applyNestedStylesToLast,
						nestedStyles,
						rest,
						$rtfeldman$elm_css$Css$Structure$appendRepeatableToLastSelector(selector),
						declarations);
				case 'NestSnippet':
					var _v5 = styles.a;
					var selectorCombinator = _v5.a;
					var snippets = _v5.b;
					var rest = styles.b;
					var chain = F2(
						function (_v9, _v10) {
							var originalSequence = _v9.a;
							var originalTuples = _v9.b;
							var originalPseudoElement = _v9.c;
							var newSequence = _v10.a;
							var newTuples = _v10.b;
							var newPseudoElement = _v10.c;
							return A3(
								$rtfeldman$elm_css$Css$Structure$Selector,
								originalSequence,
								_Utils_ap(
									originalTuples,
									A2(
										$elm$core$List$cons,
										_Utils_Tuple2(selectorCombinator, newSequence),
										newTuples)),
								$rtfeldman$elm_css$Css$Preprocess$Resolve$oneOf(
									_List_fromArray(
										[newPseudoElement, originalPseudoElement])));
						});
					var expandDeclaration = function (declaration) {
						switch (declaration.$) {
							case 'StyleBlockDeclaration':
								var _v7 = declaration.a;
								var firstSelector = _v7.a;
								var otherSelectors = _v7.b;
								var nestedStyles = _v7.c;
								var newSelectors = A2(
									$elm$core$List$concatMap,
									function (originalSelector) {
										return A2(
											$elm$core$List$map,
											chain(originalSelector),
											A2($elm$core$List$cons, firstSelector, otherSelectors));
									},
									$rtfeldman$elm_css$Css$Preprocess$Resolve$collectSelectors(declarations));
								var newDeclarations = function () {
									if (!newSelectors.b) {
										return _List_Nil;
									} else {
										var first = newSelectors.a;
										var remainder = newSelectors.b;
										return _List_fromArray(
											[
												$rtfeldman$elm_css$Css$Structure$StyleBlockDeclaration(
												A3($rtfeldman$elm_css$Css$Structure$StyleBlock, first, remainder, _List_Nil))
											]);
									}
								}();
								return A2($rtfeldman$elm_css$Css$Preprocess$Resolve$applyStyles, nestedStyles, newDeclarations);
							case 'MediaRule':
								var mediaQueries = declaration.a;
								var styleBlocks = declaration.b;
								return A2($rtfeldman$elm_css$Css$Preprocess$Resolve$resolveMediaRule, mediaQueries, styleBlocks);
							case 'SupportsRule':
								var str = declaration.a;
								var otherSnippets = declaration.b;
								return A2($rtfeldman$elm_css$Css$Preprocess$Resolve$resolveSupportsRule, str, otherSnippets);
							case 'DocumentRule':
								var str1 = declaration.a;
								var str2 = declaration.b;
								var str3 = declaration.c;
								var str4 = declaration.d;
								var styleBlock = declaration.e;
								return A2(
									$elm$core$List$map,
									A4($rtfeldman$elm_css$Css$Preprocess$Resolve$toDocumentRule, str1, str2, str3, str4),
									$rtfeldman$elm_css$Css$Preprocess$Resolve$expandStyleBlock(styleBlock));
							case 'PageRule':
								var properties = declaration.a;
								return _List_fromArray(
									[
										$rtfeldman$elm_css$Css$Structure$PageRule(properties)
									]);
							case 'FontFace':
								var properties = declaration.a;
								return _List_fromArray(
									[
										$rtfeldman$elm_css$Css$Structure$FontFace(properties)
									]);
							case 'Viewport':
								var properties = declaration.a;
								return _List_fromArray(
									[
										$rtfeldman$elm_css$Css$Structure$Viewport(properties)
									]);
							case 'CounterStyle':
								var properties = declaration.a;
								return _List_fromArray(
									[
										$rtfeldman$elm_css$Css$Structure$CounterStyle(properties)
									]);
							default:
								var tuples = declaration.a;
								return $rtfeldman$elm_css$Css$Preprocess$Resolve$resolveFontFeatureValues(tuples);
						}
					};
					return $elm$core$List$concat(
						_Utils_ap(
							_List_fromArray(
								[
									A2($rtfeldman$elm_css$Css$Preprocess$Resolve$applyStyles, rest, declarations)
								]),
							A2(
								$elm$core$List$map,
								expandDeclaration,
								A2($elm$core$List$concatMap, $rtfeldman$elm_css$Css$Preprocess$unwrapSnippet, snippets))));
				case 'WithPseudoElement':
					var _v11 = styles.a;
					var pseudoElement = _v11.a;
					var nestedStyles = _v11.b;
					var rest = styles.b;
					return A4(
						$rtfeldman$elm_css$Css$Preprocess$Resolve$applyNestedStylesToLast,
						nestedStyles,
						rest,
						$rtfeldman$elm_css$Css$Structure$appendPseudoElementToLastSelector(pseudoElement),
						declarations);
				case 'WithKeyframes':
					var str = styles.a.a;
					var rest = styles.b;
					var name = $rtfeldman$elm_css$Hash$fromString(str);
					var newProperty = $rtfeldman$elm_css$Css$Structure$Property('animation-name:' + name);
					var newDeclarations = A2(
						$rtfeldman$elm_css$Css$Preprocess$Resolve$applyStyles,
						rest,
						A2($rtfeldman$elm_css$Css$Structure$appendProperty, newProperty, declarations));
					return A2(
						$elm$core$List$append,
						newDeclarations,
						_List_fromArray(
							[
								$rtfeldman$elm_css$Css$Structure$Keyframes(
								{declaration: str, name: name})
							]));
				case 'WithMedia':
					var _v12 = styles.a;
					var mediaQueries = _v12.a;
					var nestedStyles = _v12.b;
					var rest = styles.b;
					var extraDeclarations = function () {
						var _v13 = $rtfeldman$elm_css$Css$Preprocess$Resolve$collectSelectors(declarations);
						if (!_v13.b) {
							return _List_Nil;
						} else {
							var firstSelector = _v13.a;
							var otherSelectors = _v13.b;
							return A2(
								$elm$core$List$map,
								$rtfeldman$elm_css$Css$Structure$styleBlockToMediaRule(mediaQueries),
								A2(
									$rtfeldman$elm_css$Css$Preprocess$Resolve$applyStyles,
									nestedStyles,
									$elm$core$List$singleton(
										$rtfeldman$elm_css$Css$Structure$StyleBlockDeclaration(
											A3($rtfeldman$elm_css$Css$Structure$StyleBlock, firstSelector, otherSelectors, _List_Nil)))));
						}
					}();
					return _Utils_ap(
						A2($rtfeldman$elm_css$Css$Preprocess$Resolve$applyStyles, rest, declarations),
						extraDeclarations);
				default:
					var otherStyles = styles.a.a;
					var rest = styles.b;
					return A2(
						$rtfeldman$elm_css$Css$Preprocess$Resolve$applyStyles,
						_Utils_ap(otherStyles, rest),
						declarations);
			}
		}
	});
var $rtfeldman$elm_css$Css$Preprocess$Resolve$expandStyleBlock = function (_v2) {
	var firstSelector = _v2.a;
	var otherSelectors = _v2.b;
	var styles = _v2.c;
	return A2(
		$rtfeldman$elm_css$Css$Preprocess$Resolve$applyStyles,
		styles,
		_List_fromArray(
			[
				$rtfeldman$elm_css$Css$Structure$StyleBlockDeclaration(
				A3($rtfeldman$elm_css$Css$Structure$StyleBlock, firstSelector, otherSelectors, _List_Nil))
			]));
};
var $rtfeldman$elm_css$Css$Preprocess$Resolve$extract = function (snippetDeclarations) {
	if (!snippetDeclarations.b) {
		return _List_Nil;
	} else {
		var first = snippetDeclarations.a;
		var rest = snippetDeclarations.b;
		return _Utils_ap(
			$rtfeldman$elm_css$Css$Preprocess$Resolve$toDeclarations(first),
			$rtfeldman$elm_css$Css$Preprocess$Resolve$extract(rest));
	}
};
var $rtfeldman$elm_css$Css$Preprocess$Resolve$resolveMediaRule = F2(
	function (mediaQueries, styleBlocks) {
		var handleStyleBlock = function (styleBlock) {
			return A2(
				$elm$core$List$map,
				$rtfeldman$elm_css$Css$Preprocess$Resolve$toMediaRule(mediaQueries),
				$rtfeldman$elm_css$Css$Preprocess$Resolve$expandStyleBlock(styleBlock));
		};
		return A2($elm$core$List$concatMap, handleStyleBlock, styleBlocks);
	});
var $rtfeldman$elm_css$Css$Preprocess$Resolve$resolveSupportsRule = F2(
	function (str, snippets) {
		var declarations = $rtfeldman$elm_css$Css$Preprocess$Resolve$extract(
			A2($elm$core$List$concatMap, $rtfeldman$elm_css$Css$Preprocess$unwrapSnippet, snippets));
		return _List_fromArray(
			[
				A2($rtfeldman$elm_css$Css$Structure$SupportsRule, str, declarations)
			]);
	});
var $rtfeldman$elm_css$Css$Preprocess$Resolve$toDeclarations = function (snippetDeclaration) {
	switch (snippetDeclaration.$) {
		case 'StyleBlockDeclaration':
			var styleBlock = snippetDeclaration.a;
			return $rtfeldman$elm_css$Css$Preprocess$Resolve$expandStyleBlock(styleBlock);
		case 'MediaRule':
			var mediaQueries = snippetDeclaration.a;
			var styleBlocks = snippetDeclaration.b;
			return A2($rtfeldman$elm_css$Css$Preprocess$Resolve$resolveMediaRule, mediaQueries, styleBlocks);
		case 'SupportsRule':
			var str = snippetDeclaration.a;
			var snippets = snippetDeclaration.b;
			return A2($rtfeldman$elm_css$Css$Preprocess$Resolve$resolveSupportsRule, str, snippets);
		case 'DocumentRule':
			var str1 = snippetDeclaration.a;
			var str2 = snippetDeclaration.b;
			var str3 = snippetDeclaration.c;
			var str4 = snippetDeclaration.d;
			var styleBlock = snippetDeclaration.e;
			return A2(
				$elm$core$List$map,
				A4($rtfeldman$elm_css$Css$Preprocess$Resolve$toDocumentRule, str1, str2, str3, str4),
				$rtfeldman$elm_css$Css$Preprocess$Resolve$expandStyleBlock(styleBlock));
		case 'PageRule':
			var properties = snippetDeclaration.a;
			return _List_fromArray(
				[
					$rtfeldman$elm_css$Css$Structure$PageRule(properties)
				]);
		case 'FontFace':
			var properties = snippetDeclaration.a;
			return _List_fromArray(
				[
					$rtfeldman$elm_css$Css$Structure$FontFace(properties)
				]);
		case 'Viewport':
			var properties = snippetDeclaration.a;
			return _List_fromArray(
				[
					$rtfeldman$elm_css$Css$Structure$Viewport(properties)
				]);
		case 'CounterStyle':
			var properties = snippetDeclaration.a;
			return _List_fromArray(
				[
					$rtfeldman$elm_css$Css$Structure$CounterStyle(properties)
				]);
		default:
			var tuples = snippetDeclaration.a;
			return $rtfeldman$elm_css$Css$Preprocess$Resolve$resolveFontFeatureValues(tuples);
	}
};
var $rtfeldman$elm_css$Css$Preprocess$Resolve$toStructure = function (_v0) {
	var charset = _v0.charset;
	var imports = _v0.imports;
	var namespaces = _v0.namespaces;
	var snippets = _v0.snippets;
	var declarations = $rtfeldman$elm_css$Css$Preprocess$Resolve$extract(
		A2($elm$core$List$concatMap, $rtfeldman$elm_css$Css$Preprocess$unwrapSnippet, snippets));
	return {charset: charset, declarations: declarations, imports: imports, namespaces: namespaces};
};
var $rtfeldman$elm_css$Css$Preprocess$Resolve$compile = function (sheet) {
	return $rtfeldman$elm_css$Css$Structure$Output$prettyPrint(
		$rtfeldman$elm_css$Css$Structure$compactStylesheet(
			$rtfeldman$elm_css$Css$Preprocess$Resolve$toStructure(sheet)));
};
var $rtfeldman$elm_css$Css$Preprocess$Snippet = function (a) {
	return {$: 'Snippet', a: a};
};
var $rtfeldman$elm_css$Css$Preprocess$StyleBlock = F3(
	function (a, b, c) {
		return {$: 'StyleBlock', a: a, b: b, c: c};
	});
var $rtfeldman$elm_css$Css$Preprocess$StyleBlockDeclaration = function (a) {
	return {$: 'StyleBlockDeclaration', a: a};
};
var $rtfeldman$elm_css$VirtualDom$Styled$makeSnippet = F2(
	function (styles, sequence) {
		var selector = A3($rtfeldman$elm_css$Css$Structure$Selector, sequence, _List_Nil, $elm$core$Maybe$Nothing);
		return $rtfeldman$elm_css$Css$Preprocess$Snippet(
			_List_fromArray(
				[
					$rtfeldman$elm_css$Css$Preprocess$StyleBlockDeclaration(
					A3($rtfeldman$elm_css$Css$Preprocess$StyleBlock, selector, _List_Nil, styles))
				]));
	});
var $rtfeldman$elm_css$Css$Preprocess$stylesheet = function (snippets) {
	return {charset: $elm$core$Maybe$Nothing, imports: _List_Nil, namespaces: _List_Nil, snippets: snippets};
};
var $rtfeldman$elm_css$Css$Structure$ClassSelector = function (a) {
	return {$: 'ClassSelector', a: a};
};
var $rtfeldman$elm_css$VirtualDom$Styled$classnameStandin = '\u0007';
var $rtfeldman$elm_css$VirtualDom$Styled$templateSelector = $rtfeldman$elm_css$Css$Structure$UniversalSelectorSequence(
	_List_fromArray(
		[
			$rtfeldman$elm_css$Css$Structure$ClassSelector($rtfeldman$elm_css$VirtualDom$Styled$classnameStandin)
		]));
var $rtfeldman$elm_css$VirtualDom$Styled$getCssTemplate = function (styles) {
	if (!styles.b) {
		return '';
	} else {
		var otherwise = styles;
		return $rtfeldman$elm_css$Css$Preprocess$Resolve$compile(
			$rtfeldman$elm_css$Css$Preprocess$stylesheet(
				_List_fromArray(
					[
						A2($rtfeldman$elm_css$VirtualDom$Styled$makeSnippet, styles, $rtfeldman$elm_css$VirtualDom$Styled$templateSelector)
					])));
	}
};
var $rtfeldman$elm_css$Svg$Styled$Internal$css = function (styles) {
	var cssTemplate = $rtfeldman$elm_css$VirtualDom$Styled$getCssTemplate(styles);
	var classAttribute = A2($elm$virtual_dom$VirtualDom$attribute, '', '');
	return A3($rtfeldman$elm_css$VirtualDom$Styled$Attribute, classAttribute, true, cssTemplate);
};
var $rtfeldman$elm_css$Svg$Styled$Attributes$css = $rtfeldman$elm_css$Svg$Styled$Internal$css;
var $elm$html$Html$div = _VirtualDom_node('div');
var $author$project$SvgHelper$Alphabetic = {$: 'Alphabetic'};
var $author$project$SvgHelper$Plain = function (a) {
	return {$: 'Plain', a: a};
};
var $rtfeldman$elm_css$Css$Preprocess$ExtendSelector = F2(
	function (a, b) {
		return {$: 'ExtendSelector', a: a, b: b};
	});
var $rtfeldman$elm_css$Css$Structure$PseudoClassSelector = function (a) {
	return {$: 'PseudoClassSelector', a: a};
};
var $rtfeldman$elm_css$Css$pseudoClass = function (_class) {
	return $rtfeldman$elm_css$Css$Preprocess$ExtendSelector(
		$rtfeldman$elm_css$Css$Structure$PseudoClassSelector(_class));
};
var $rtfeldman$elm_css$Css$active = $rtfeldman$elm_css$Css$pseudoClass('active');
var $elm$core$Basics$atan2 = _Basics_atan2;
var $rtfeldman$elm_css$VirtualDom$Styled$NodeNS = F4(
	function (a, b, c, d) {
		return {$: 'NodeNS', a: a, b: b, c: c, d: d};
	});
var $rtfeldman$elm_css$VirtualDom$Styled$nodeNS = $rtfeldman$elm_css$VirtualDom$Styled$NodeNS;
var $rtfeldman$elm_css$Svg$Styled$node = $rtfeldman$elm_css$VirtualDom$Styled$nodeNS('http://www.w3.org/2000/svg');
var $rtfeldman$elm_css$Svg$Styled$circle = $rtfeldman$elm_css$Svg$Styled$node('circle');
var $elm$core$Basics$round = _Basics_round;
var $elm$core$String$padLeft = F3(
	function (n, _char, string) {
		return _Utils_ap(
			A2(
				$elm$core$String$repeat,
				n - $elm$core$String$length(string),
				$elm$core$String$fromChar(_char)),
			string);
	});
var $noahzgordon$elm_color_extra$Color$Convert$toRadix = function (n) {
	var getChr = function (c) {
		return (c < 10) ? $elm$core$String$fromInt(c) : $elm$core$String$fromChar(
			$elm$core$Char$fromCode(87 + c));
	};
	return (n < 16) ? getChr(n) : _Utils_ap(
		$noahzgordon$elm_color_extra$Color$Convert$toRadix((n / 16) | 0),
		getChr(
			A2($elm$core$Basics$modBy, 16, n)));
};
var $noahzgordon$elm_color_extra$Color$Convert$toHex = A2(
	$elm$core$Basics$composeR,
	$noahzgordon$elm_color_extra$Color$Convert$toRadix,
	A2(
		$elm$core$String$padLeft,
		2,
		_Utils_chr('0')));
var $avh4$elm_color$Color$toRgba = function (_v0) {
	var r = _v0.a;
	var g = _v0.b;
	var b = _v0.c;
	var a = _v0.d;
	return {alpha: a, blue: b, green: g, red: r};
};
var $noahzgordon$elm_color_extra$Color$Convert$colorToHex = function (cl) {
	var _v0 = $avh4$elm_color$Color$toRgba(cl);
	var red = _v0.red;
	var green = _v0.green;
	var blue = _v0.blue;
	return A2(
		$elm$core$String$join,
		'',
		A2(
			$elm$core$List$cons,
			'#',
			A2(
				$elm$core$List$map,
				A2($elm$core$Basics$composeR, $elm$core$Basics$round, $noahzgordon$elm_color_extra$Color$Convert$toHex),
				_List_fromArray(
					[red * 255, green * 255, blue * 255]))));
};
var $noahzgordon$elm_color_extra$Color$Convert$colorToHexWithAlpha = function (color) {
	var _v0 = $avh4$elm_color$Color$toRgba(color);
	var red = _v0.red;
	var green = _v0.green;
	var blue = _v0.blue;
	var alpha = _v0.alpha;
	return (alpha === 1) ? $noahzgordon$elm_color_extra$Color$Convert$colorToHex(color) : A2(
		$elm$core$String$join,
		'',
		A2(
			$elm$core$List$cons,
			'#',
			A2(
				$elm$core$List$map,
				A2($elm$core$Basics$composeR, $elm$core$Basics$round, $noahzgordon$elm_color_extra$Color$Convert$toHex),
				_List_fromArray(
					[red * 255, green * 255, blue * 255, alpha * 255]))));
};
var $rtfeldman$elm_css$Css$Structure$Compatible = {$: 'Compatible'};
var $rtfeldman$elm_css$Css$withPrecedingHash = function (str) {
	return A2($elm$core$String$startsWith, '#', str) ? str : A2(
		$elm$core$String$cons,
		_Utils_chr('#'),
		str);
};
var $rtfeldman$elm_css$Css$erroneousHex = function (str) {
	return {
		alpha: 1,
		blue: 0,
		color: $rtfeldman$elm_css$Css$Structure$Compatible,
		green: 0,
		red: 0,
		value: $rtfeldman$elm_css$Css$withPrecedingHash(str)
	};
};
var $rtfeldman$elm_hex$Hex$fromStringHelp = F3(
	function (position, chars, accumulated) {
		fromStringHelp:
		while (true) {
			if (!chars.b) {
				return $elm$core$Result$Ok(accumulated);
			} else {
				var _char = chars.a;
				var rest = chars.b;
				switch (_char.valueOf()) {
					case '0':
						var $temp$position = position - 1,
							$temp$chars = rest,
							$temp$accumulated = accumulated;
						position = $temp$position;
						chars = $temp$chars;
						accumulated = $temp$accumulated;
						continue fromStringHelp;
					case '1':
						var $temp$position = position - 1,
							$temp$chars = rest,
							$temp$accumulated = accumulated + A2($elm$core$Basics$pow, 16, position);
						position = $temp$position;
						chars = $temp$chars;
						accumulated = $temp$accumulated;
						continue fromStringHelp;
					case '2':
						var $temp$position = position - 1,
							$temp$chars = rest,
							$temp$accumulated = accumulated + (2 * A2($elm$core$Basics$pow, 16, position));
						position = $temp$position;
						chars = $temp$chars;
						accumulated = $temp$accumulated;
						continue fromStringHelp;
					case '3':
						var $temp$position = position - 1,
							$temp$chars = rest,
							$temp$accumulated = accumulated + (3 * A2($elm$core$Basics$pow, 16, position));
						position = $temp$position;
						chars = $temp$chars;
						accumulated = $temp$accumulated;
						continue fromStringHelp;
					case '4':
						var $temp$position = position - 1,
							$temp$chars = rest,
							$temp$accumulated = accumulated + (4 * A2($elm$core$Basics$pow, 16, position));
						position = $temp$position;
						chars = $temp$chars;
						accumulated = $temp$accumulated;
						continue fromStringHelp;
					case '5':
						var $temp$position = position - 1,
							$temp$chars = rest,
							$temp$accumulated = accumulated + (5 * A2($elm$core$Basics$pow, 16, position));
						position = $temp$position;
						chars = $temp$chars;
						accumulated = $temp$accumulated;
						continue fromStringHelp;
					case '6':
						var $temp$position = position - 1,
							$temp$chars = rest,
							$temp$accumulated = accumulated + (6 * A2($elm$core$Basics$pow, 16, position));
						position = $temp$position;
						chars = $temp$chars;
						accumulated = $temp$accumulated;
						continue fromStringHelp;
					case '7':
						var $temp$position = position - 1,
							$temp$chars = rest,
							$temp$accumulated = accumulated + (7 * A2($elm$core$Basics$pow, 16, position));
						position = $temp$position;
						chars = $temp$chars;
						accumulated = $temp$accumulated;
						continue fromStringHelp;
					case '8':
						var $temp$position = position - 1,
							$temp$chars = rest,
							$temp$accumulated = accumulated + (8 * A2($elm$core$Basics$pow, 16, position));
						position = $temp$position;
						chars = $temp$chars;
						accumulated = $temp$accumulated;
						continue fromStringHelp;
					case '9':
						var $temp$position = position - 1,
							$temp$chars = rest,
							$temp$accumulated = accumulated + (9 * A2($elm$core$Basics$pow, 16, position));
						position = $temp$position;
						chars = $temp$chars;
						accumulated = $temp$accumulated;
						continue fromStringHelp;
					case 'a':
						var $temp$position = position - 1,
							$temp$chars = rest,
							$temp$accumulated = accumulated + (10 * A2($elm$core$Basics$pow, 16, position));
						position = $temp$position;
						chars = $temp$chars;
						accumulated = $temp$accumulated;
						continue fromStringHelp;
					case 'b':
						var $temp$position = position - 1,
							$temp$chars = rest,
							$temp$accumulated = accumulated + (11 * A2($elm$core$Basics$pow, 16, position));
						position = $temp$position;
						chars = $temp$chars;
						accumulated = $temp$accumulated;
						continue fromStringHelp;
					case 'c':
						var $temp$position = position - 1,
							$temp$chars = rest,
							$temp$accumulated = accumulated + (12 * A2($elm$core$Basics$pow, 16, position));
						position = $temp$position;
						chars = $temp$chars;
						accumulated = $temp$accumulated;
						continue fromStringHelp;
					case 'd':
						var $temp$position = position - 1,
							$temp$chars = rest,
							$temp$accumulated = accumulated + (13 * A2($elm$core$Basics$pow, 16, position));
						position = $temp$position;
						chars = $temp$chars;
						accumulated = $temp$accumulated;
						continue fromStringHelp;
					case 'e':
						var $temp$position = position - 1,
							$temp$chars = rest,
							$temp$accumulated = accumulated + (14 * A2($elm$core$Basics$pow, 16, position));
						position = $temp$position;
						chars = $temp$chars;
						accumulated = $temp$accumulated;
						continue fromStringHelp;
					case 'f':
						var $temp$position = position - 1,
							$temp$chars = rest,
							$temp$accumulated = accumulated + (15 * A2($elm$core$Basics$pow, 16, position));
						position = $temp$position;
						chars = $temp$chars;
						accumulated = $temp$accumulated;
						continue fromStringHelp;
					default:
						var nonHex = _char;
						return $elm$core$Result$Err(
							$elm$core$String$fromChar(nonHex) + ' is not a valid hexadecimal character.');
				}
			}
		}
	});
var $elm$core$Result$map = F2(
	function (func, ra) {
		if (ra.$ === 'Ok') {
			var a = ra.a;
			return $elm$core$Result$Ok(
				func(a));
		} else {
			var e = ra.a;
			return $elm$core$Result$Err(e);
		}
	});
var $elm$core$Result$mapError = F2(
	function (f, result) {
		if (result.$ === 'Ok') {
			var v = result.a;
			return $elm$core$Result$Ok(v);
		} else {
			var e = result.a;
			return $elm$core$Result$Err(
				f(e));
		}
	});
var $rtfeldman$elm_hex$Hex$fromString = function (str) {
	if ($elm$core$String$isEmpty(str)) {
		return $elm$core$Result$Err('Empty strings are not valid hexadecimal strings.');
	} else {
		var result = function () {
			if (A2($elm$core$String$startsWith, '-', str)) {
				var list = A2(
					$elm$core$Maybe$withDefault,
					_List_Nil,
					$elm$core$List$tail(
						$elm$core$String$toList(str)));
				return A2(
					$elm$core$Result$map,
					$elm$core$Basics$negate,
					A3(
						$rtfeldman$elm_hex$Hex$fromStringHelp,
						$elm$core$List$length(list) - 1,
						list,
						0));
			} else {
				return A3(
					$rtfeldman$elm_hex$Hex$fromStringHelp,
					$elm$core$String$length(str) - 1,
					$elm$core$String$toList(str),
					0);
			}
		}();
		var formatError = function (err) {
			return A2(
				$elm$core$String$join,
				' ',
				_List_fromArray(
					['\"' + (str + '\"'), 'is not a valid hexadecimal string because', err]));
		};
		return A2($elm$core$Result$mapError, formatError, result);
	}
};
var $elm$core$String$toLower = _String_toLower;
var $rtfeldman$elm_css$Css$validHex = F5(
	function (str, _v0, _v1, _v2, _v3) {
		var r1 = _v0.a;
		var r2 = _v0.b;
		var g1 = _v1.a;
		var g2 = _v1.b;
		var b1 = _v2.a;
		var b2 = _v2.b;
		var a1 = _v3.a;
		var a2 = _v3.b;
		var toResult = A2(
			$elm$core$Basics$composeR,
			$elm$core$String$fromList,
			A2($elm$core$Basics$composeR, $elm$core$String$toLower, $rtfeldman$elm_hex$Hex$fromString));
		var results = _Utils_Tuple2(
			_Utils_Tuple2(
				toResult(
					_List_fromArray(
						[r1, r2])),
				toResult(
					_List_fromArray(
						[g1, g2]))),
			_Utils_Tuple2(
				toResult(
					_List_fromArray(
						[b1, b2])),
				toResult(
					_List_fromArray(
						[a1, a2]))));
		if ((((results.a.a.$ === 'Ok') && (results.a.b.$ === 'Ok')) && (results.b.a.$ === 'Ok')) && (results.b.b.$ === 'Ok')) {
			var _v5 = results.a;
			var red = _v5.a.a;
			var green = _v5.b.a;
			var _v6 = results.b;
			var blue = _v6.a.a;
			var alpha = _v6.b.a;
			return {
				alpha: alpha / 255,
				blue: blue,
				color: $rtfeldman$elm_css$Css$Structure$Compatible,
				green: green,
				red: red,
				value: $rtfeldman$elm_css$Css$withPrecedingHash(str)
			};
		} else {
			return $rtfeldman$elm_css$Css$erroneousHex(str);
		}
	});
var $rtfeldman$elm_css$Css$hex = function (str) {
	var withoutHash = A2($elm$core$String$startsWith, '#', str) ? A2($elm$core$String$dropLeft, 1, str) : str;
	var _v0 = $elm$core$String$toList(withoutHash);
	_v0$4:
	while (true) {
		if ((_v0.b && _v0.b.b) && _v0.b.b.b) {
			if (!_v0.b.b.b.b) {
				var r = _v0.a;
				var _v1 = _v0.b;
				var g = _v1.a;
				var _v2 = _v1.b;
				var b = _v2.a;
				return A5(
					$rtfeldman$elm_css$Css$validHex,
					str,
					_Utils_Tuple2(r, r),
					_Utils_Tuple2(g, g),
					_Utils_Tuple2(b, b),
					_Utils_Tuple2(
						_Utils_chr('f'),
						_Utils_chr('f')));
			} else {
				if (!_v0.b.b.b.b.b) {
					var r = _v0.a;
					var _v3 = _v0.b;
					var g = _v3.a;
					var _v4 = _v3.b;
					var b = _v4.a;
					var _v5 = _v4.b;
					var a = _v5.a;
					return A5(
						$rtfeldman$elm_css$Css$validHex,
						str,
						_Utils_Tuple2(r, r),
						_Utils_Tuple2(g, g),
						_Utils_Tuple2(b, b),
						_Utils_Tuple2(a, a));
				} else {
					if (_v0.b.b.b.b.b.b) {
						if (!_v0.b.b.b.b.b.b.b) {
							var r1 = _v0.a;
							var _v6 = _v0.b;
							var r2 = _v6.a;
							var _v7 = _v6.b;
							var g1 = _v7.a;
							var _v8 = _v7.b;
							var g2 = _v8.a;
							var _v9 = _v8.b;
							var b1 = _v9.a;
							var _v10 = _v9.b;
							var b2 = _v10.a;
							return A5(
								$rtfeldman$elm_css$Css$validHex,
								str,
								_Utils_Tuple2(r1, r2),
								_Utils_Tuple2(g1, g2),
								_Utils_Tuple2(b1, b2),
								_Utils_Tuple2(
									_Utils_chr('f'),
									_Utils_chr('f')));
						} else {
							if (_v0.b.b.b.b.b.b.b.b && (!_v0.b.b.b.b.b.b.b.b.b)) {
								var r1 = _v0.a;
								var _v11 = _v0.b;
								var r2 = _v11.a;
								var _v12 = _v11.b;
								var g1 = _v12.a;
								var _v13 = _v12.b;
								var g2 = _v13.a;
								var _v14 = _v13.b;
								var b1 = _v14.a;
								var _v15 = _v14.b;
								var b2 = _v15.a;
								var _v16 = _v15.b;
								var a1 = _v16.a;
								var _v17 = _v16.b;
								var a2 = _v17.a;
								return A5(
									$rtfeldman$elm_css$Css$validHex,
									str,
									_Utils_Tuple2(r1, r2),
									_Utils_Tuple2(g1, g2),
									_Utils_Tuple2(b1, b2),
									_Utils_Tuple2(a1, a2));
							} else {
								break _v0$4;
							}
						}
					} else {
						break _v0$4;
					}
				}
			}
		} else {
			break _v0$4;
		}
	}
	return $rtfeldman$elm_css$Css$erroneousHex(str);
};
var $author$project$SvgHelper$colorToCssColor = A2($elm$core$Basics$composeR, $noahzgordon$elm_color_extra$Color$Convert$colorToHexWithAlpha, $rtfeldman$elm_css$Css$hex);
var $noahzgordon$elm_color_extra$Color$Convert$cssColorString = F2(
	function (kind, values) {
		return kind + ('(' + (A2($elm$core$String$join, ', ', values) + ')'));
	});
var $noahzgordon$elm_color_extra$Color$Convert$colorToCssRgba = function (cl) {
	var _v0 = $avh4$elm_color$Color$toRgba(cl);
	var red = _v0.red;
	var green = _v0.green;
	var blue = _v0.blue;
	var alpha = _v0.alpha;
	return A2(
		$noahzgordon$elm_color_extra$Color$Convert$cssColorString,
		'rgba',
		_List_fromArray(
			[
				$elm$core$String$fromFloat(red * 255),
				$elm$core$String$fromFloat(green * 255),
				$elm$core$String$fromFloat(blue * 255),
				$elm$core$String$fromFloat(alpha)
			]));
};
var $rtfeldman$elm_css$VirtualDom$Styled$attribute = F2(
	function (key, value) {
		return A3(
			$rtfeldman$elm_css$VirtualDom$Styled$Attribute,
			A2($elm$virtual_dom$VirtualDom$attribute, key, value),
			false,
			'');
	});
var $rtfeldman$elm_css$Svg$Styled$Attributes$cx = $rtfeldman$elm_css$VirtualDom$Styled$attribute('cx');
var $rtfeldman$elm_css$Svg$Styled$Attributes$cy = $rtfeldman$elm_css$VirtualDom$Styled$attribute('cy');
var $rtfeldman$elm_css$Svg$Styled$Attributes$d = $rtfeldman$elm_css$VirtualDom$Styled$attribute('d');
var $author$project$Utils$maybeToList = function (m) {
	if (m.$ === 'Just') {
		var a = m.a;
		return _List_fromArray(
			[a]);
	} else {
		return _List_Nil;
	}
};
var $author$project$SvgHelper$flattenMaybe = $elm$core$List$concatMap($author$project$Utils$maybeToList);
var $rtfeldman$elm_css$Css$bold = {fontWeight: $rtfeldman$elm_css$Css$Structure$Compatible, value: 'bold'};
var $rtfeldman$elm_css$Css$Preprocess$AppendProperty = function (a) {
	return {$: 'AppendProperty', a: a};
};
var $rtfeldman$elm_css$Css$property = F2(
	function (key, value) {
		return $rtfeldman$elm_css$Css$Preprocess$AppendProperty(
			$rtfeldman$elm_css$Css$Structure$Property(key + (':' + value)));
	});
var $rtfeldman$elm_css$Css$fontWeight = function (_v0) {
	var value = _v0.value;
	return A2($rtfeldman$elm_css$Css$property, 'font-weight', value);
};
var $author$project$SvgHelper$baseStylesDict = $elm$core$Dict$fromList(
	_List_fromArray(
		[
			_Utils_Tuple2(
			'b',
			$rtfeldman$elm_css$Css$fontWeight($rtfeldman$elm_css$Css$bold))
		]));
var $rtfeldman$elm_css$Css$prop1 = F2(
	function (key, arg) {
		return A2($rtfeldman$elm_css$Css$property, key, arg.value);
	});
var $rtfeldman$elm_css$Css$fill = $rtfeldman$elm_css$Css$prop1('fill');
var $elm$core$Dict$map = F2(
	function (func, dict) {
		if (dict.$ === 'RBEmpty_elm_builtin') {
			return $elm$core$Dict$RBEmpty_elm_builtin;
		} else {
			var color = dict.a;
			var key = dict.b;
			var value = dict.c;
			var left = dict.d;
			var right = dict.e;
			return A5(
				$elm$core$Dict$RBNode_elm_builtin,
				color,
				key,
				A2(func, key, value),
				A2($elm$core$Dict$map, func, left),
				A2($elm$core$Dict$map, func, right));
		}
	});
var $author$project$SvgHelper$makeStylesDict = function (colors) {
	return A2(
		$elm$core$Dict$union,
		$author$project$SvgHelper$baseStylesDict,
		A2(
			$elm$core$Dict$map,
			F2(
				function (_v0, c) {
					return $rtfeldman$elm_css$Css$fill(
						$author$project$SvgHelper$colorToCssColor(c));
				}),
			colors));
};
var $rtfeldman$elm_css$VirtualDom$Styled$Unstyled = function (a) {
	return {$: 'Unstyled', a: a};
};
var $elm$virtual_dom$VirtualDom$text = _VirtualDom_text;
var $rtfeldman$elm_css$VirtualDom$Styled$text = function (str) {
	return $rtfeldman$elm_css$VirtualDom$Styled$Unstyled(
		$elm$virtual_dom$VirtualDom$text(str));
};
var $rtfeldman$elm_css$Svg$Styled$text = $rtfeldman$elm_css$VirtualDom$Styled$text;
var $rtfeldman$elm_css$Svg$Styled$tspan = $rtfeldman$elm_css$Svg$Styled$node('tspan');
var $author$project$SvgHelper$drawFragment = F2(
	function (colors, f) {
		if (f.$ === 'Plain') {
			var t = f.a;
			return $rtfeldman$elm_css$Svg$Styled$text(t);
		} else {
			var styles = f.a.styles;
			var text = f.a.text;
			return A2(
				$rtfeldman$elm_css$Svg$Styled$tspan,
				_List_fromArray(
					[
						A3(
						$elm$core$Basics$composeL,
						$rtfeldman$elm_css$Svg$Styled$Attributes$css,
						$author$project$SvgHelper$flattenMaybe,
						A2(
							$elm$core$List$map,
							function (s) {
								return A2(
									$elm$core$Dict$get,
									s,
									$author$project$SvgHelper$makeStylesDict(colors));
							},
							styles))
					]),
				_List_fromArray(
					[
						$rtfeldman$elm_css$Svg$Styled$text(text)
					]));
		}
	});
var $elm$core$String$replace = F3(
	function (before, after, string) {
		return A2(
			$elm$core$String$join,
			after,
			A2($elm$core$String$split, before, string));
	});
var $author$project$SvgHelper$fFloat = F2(
	function (old, _new) {
		return A2(
			$elm$core$String$replace,
			'{' + (old + '}'),
			$elm$core$String$fromFloat(_new));
	});
var $rtfeldman$elm_css$Svg$Styled$Attributes$fill = $rtfeldman$elm_css$VirtualDom$Styled$attribute('fill');
var $rtfeldman$elm_css$Svg$Styled$Attributes$fontSize = $rtfeldman$elm_css$VirtualDom$Styled$attribute('font-size');
var $rtfeldman$elm_css$Svg$Styled$g = $rtfeldman$elm_css$Svg$Styled$node('g');
var $rtfeldman$elm_css$Svg$Styled$Attributes$height = $rtfeldman$elm_css$VirtualDom$Styled$attribute('height');
var $rtfeldman$elm_css$Css$hidden = {borderStyle: $rtfeldman$elm_css$Css$Structure$Compatible, overflow: $rtfeldman$elm_css$Css$Structure$Compatible, value: 'hidden', visibility: $rtfeldman$elm_css$Css$Structure$Compatible};
var $rtfeldman$elm_css$Css$hover = $rtfeldman$elm_css$Css$pseudoClass('hover');
var $rtfeldman$elm_css$Svg$Styled$Attributes$id = $rtfeldman$elm_css$VirtualDom$Styled$attribute('id');
var $elm$core$Basics$pi = _Basics_pi;
var $elm$core$Basics$degrees = function (angleInDegrees) {
	return (angleInDegrees * $elm$core$Basics$pi) / 180;
};
var $elm_community$basics_extra$Basics$Extra$inDegrees = function (angle) {
	return angle / $elm$core$Basics$degrees(1);
};
var $rtfeldman$elm_css$Svg$Styled$line = $rtfeldman$elm_css$Svg$Styled$node('line');
var $author$project$SvgHelper$listToMaybe = function (l) {
	if (!l.b) {
		return $elm$core$Maybe$Nothing;
	} else {
		return $elm$core$Maybe$Just(l);
	}
};
var $elm$virtual_dom$VirtualDom$Normal = function (a) {
	return {$: 'Normal', a: a};
};
var $elm$virtual_dom$VirtualDom$on = _VirtualDom_on;
var $rtfeldman$elm_css$VirtualDom$Styled$on = F2(
	function (eventName, handler) {
		return A3(
			$rtfeldman$elm_css$VirtualDom$Styled$Attribute,
			A2($elm$virtual_dom$VirtualDom$on, eventName, handler),
			false,
			'');
	});
var $rtfeldman$elm_css$Html$Styled$Events$on = F2(
	function (event, decoder) {
		return A2(
			$rtfeldman$elm_css$VirtualDom$Styled$on,
			event,
			$elm$virtual_dom$VirtualDom$Normal(decoder));
	});
var $rtfeldman$elm_css$Svg$Styled$Events$on = $rtfeldman$elm_css$Html$Styled$Events$on;
var $rtfeldman$elm_css$Svg$Styled$Events$onClick = function (msg) {
	return A2(
		$rtfeldman$elm_css$Html$Styled$Events$on,
		'click',
		$elm$json$Json$Decode$succeed(msg));
};
var $rtfeldman$elm_css$Svg$Styled$path = $rtfeldman$elm_css$Svg$Styled$node('path');
var $rtfeldman$elm_css$Svg$Styled$Attributes$pointerEvents = $rtfeldman$elm_css$VirtualDom$Styled$attribute('pointer-events');
var $author$project$SvgHelper$pointerEventsToString = function (pe) {
	if (pe.$ === 'PENone') {
		return 'none';
	} else {
		return 'visiblePainted';
	}
};
var $rtfeldman$elm_css$Svg$Styled$Attributes$points = $rtfeldman$elm_css$VirtualDom$Styled$attribute('points');
var $author$project$SvgHelper$points = function (p) {
	return A3(
		$elm$core$Basics$composeL,
		$rtfeldman$elm_css$Svg$Styled$Attributes$points,
		$elm$core$String$join(' '),
		A2(
			$elm$core$List$map,
			function (_v0) {
				var x = _v0.a;
				var y = _v0.b;
				return $elm$core$String$fromFloat(x) + (',' + $elm$core$String$fromFloat(y));
			},
			p));
};
var $rtfeldman$elm_css$Svg$Styled$polygon = $rtfeldman$elm_css$Svg$Styled$node('polygon');
var $rtfeldman$elm_css$Svg$Styled$Attributes$r = $rtfeldman$elm_css$VirtualDom$Styled$attribute('r');
var $rtfeldman$elm_css$Svg$Styled$rect = $rtfeldman$elm_css$Svg$Styled$node('rect');
var $author$project$SvgHelper$rotate = function (d) {
	return 'rotate(' + ($elm$core$String$fromFloat(d) + ')');
};
var $elm$parser$Parser$DeadEnd = F3(
	function (row, col, problem) {
		return {col: col, problem: problem, row: row};
	});
var $elm$parser$Parser$problemToDeadEnd = function (p) {
	return A3($elm$parser$Parser$DeadEnd, p.row, p.col, p.problem);
};
var $elm$parser$Parser$Advanced$bagToList = F2(
	function (bag, list) {
		bagToList:
		while (true) {
			switch (bag.$) {
				case 'Empty':
					return list;
				case 'AddRight':
					var bag1 = bag.a;
					var x = bag.b;
					var $temp$bag = bag1,
						$temp$list = A2($elm$core$List$cons, x, list);
					bag = $temp$bag;
					list = $temp$list;
					continue bagToList;
				default:
					var bag1 = bag.a;
					var bag2 = bag.b;
					var $temp$bag = bag1,
						$temp$list = A2($elm$parser$Parser$Advanced$bagToList, bag2, list);
					bag = $temp$bag;
					list = $temp$list;
					continue bagToList;
			}
		}
	});
var $elm$parser$Parser$Advanced$run = F2(
	function (_v0, src) {
		var parse = _v0.a;
		var _v1 = parse(
			{col: 1, context: _List_Nil, indent: 1, offset: 0, row: 1, src: src});
		if (_v1.$ === 'Good') {
			var value = _v1.b;
			return $elm$core$Result$Ok(value);
		} else {
			var bag = _v1.b;
			return $elm$core$Result$Err(
				A2($elm$parser$Parser$Advanced$bagToList, bag, _List_Nil));
		}
	});
var $elm$parser$Parser$run = F2(
	function (parser, source) {
		var _v0 = A2($elm$parser$Parser$Advanced$run, parser, source);
		if (_v0.$ === 'Ok') {
			var a = _v0.a;
			return $elm$core$Result$Ok(a);
		} else {
			var problems = _v0.a;
			return $elm$core$Result$Err(
				A2($elm$core$List$map, $elm$parser$Parser$problemToDeadEnd, problems));
		}
	});
var $rtfeldman$elm_css$Svg$Styled$Attributes$rx = $rtfeldman$elm_css$VirtualDom$Styled$attribute('rx');
var $rtfeldman$elm_css$Svg$Styled$Attributes$stroke = $rtfeldman$elm_css$VirtualDom$Styled$attribute('stroke');
var $rtfeldman$elm_css$Svg$Styled$Attributes$strokeDasharray = $rtfeldman$elm_css$VirtualDom$Styled$attribute('stroke-dasharray');
var $rtfeldman$elm_css$Svg$Styled$Attributes$strokeDashoffset = $rtfeldman$elm_css$VirtualDom$Styled$attribute('stroke-dashoffset');
var $rtfeldman$elm_css$Svg$Styled$Attributes$strokeWidth = $rtfeldman$elm_css$VirtualDom$Styled$attribute('stroke-width');
var $author$project$SvgHelper$tScale = function (s) {
	return 'scale(' + ($elm$core$String$fromFloat(s) + ')');
};
var $rtfeldman$elm_css$Svg$Styled$Attributes$textAnchor = $rtfeldman$elm_css$VirtualDom$Styled$attribute('text-anchor');
var $author$project$SvgHelper$textBaselineToOffset = function (b) {
	switch (b.$) {
		case 'Alphabetic':
			return 0.8;
		case 'TBMiddle':
			return 0.48;
		default:
			return 0;
	}
};
var $elm$parser$Parser$Advanced$Parser = function (a) {
	return {$: 'Parser', a: a};
};
var $elm$parser$Parser$Advanced$Bad = F2(
	function (a, b) {
		return {$: 'Bad', a: a, b: b};
	});
var $elm$parser$Parser$Advanced$Good = F3(
	function (a, b, c) {
		return {$: 'Good', a: a, b: b, c: c};
	});
var $elm$parser$Parser$Advanced$loopHelp = F4(
	function (p, state, callback, s0) {
		loopHelp:
		while (true) {
			var _v0 = callback(state);
			var parse = _v0.a;
			var _v1 = parse(s0);
			if (_v1.$ === 'Good') {
				var p1 = _v1.a;
				var step = _v1.b;
				var s1 = _v1.c;
				if (step.$ === 'Loop') {
					var newState = step.a;
					var $temp$p = p || p1,
						$temp$state = newState,
						$temp$callback = callback,
						$temp$s0 = s1;
					p = $temp$p;
					state = $temp$state;
					callback = $temp$callback;
					s0 = $temp$s0;
					continue loopHelp;
				} else {
					var result = step.a;
					return A3($elm$parser$Parser$Advanced$Good, p || p1, result, s1);
				}
			} else {
				var p1 = _v1.a;
				var x = _v1.b;
				return A2($elm$parser$Parser$Advanced$Bad, p || p1, x);
			}
		}
	});
var $elm$parser$Parser$Advanced$loop = F2(
	function (state, callback) {
		return $elm$parser$Parser$Advanced$Parser(
			function (s) {
				return A4($elm$parser$Parser$Advanced$loopHelp, false, state, callback, s);
			});
	});
var $elm$parser$Parser$Advanced$map = F2(
	function (func, _v0) {
		var parse = _v0.a;
		return $elm$parser$Parser$Advanced$Parser(
			function (s0) {
				var _v1 = parse(s0);
				if (_v1.$ === 'Good') {
					var p = _v1.a;
					var a = _v1.b;
					var s1 = _v1.c;
					return A3(
						$elm$parser$Parser$Advanced$Good,
						p,
						func(a),
						s1);
				} else {
					var p = _v1.a;
					var x = _v1.b;
					return A2($elm$parser$Parser$Advanced$Bad, p, x);
				}
			});
	});
var $elm$parser$Parser$map = $elm$parser$Parser$Advanced$map;
var $elm$parser$Parser$Advanced$Done = function (a) {
	return {$: 'Done', a: a};
};
var $elm$parser$Parser$Advanced$Loop = function (a) {
	return {$: 'Loop', a: a};
};
var $elm$parser$Parser$toAdvancedStep = function (step) {
	if (step.$ === 'Loop') {
		var s = step.a;
		return $elm$parser$Parser$Advanced$Loop(s);
	} else {
		var a = step.a;
		return $elm$parser$Parser$Advanced$Done(a);
	}
};
var $elm$parser$Parser$loop = F2(
	function (state, callback) {
		return A2(
			$elm$parser$Parser$Advanced$loop,
			state,
			function (s) {
				return A2(
					$elm$parser$Parser$map,
					$elm$parser$Parser$toAdvancedStep,
					callback(s));
			});
	});
var $elm$parser$Parser$Done = function (a) {
	return {$: 'Done', a: a};
};
var $elm$parser$Parser$Loop = function (a) {
	return {$: 'Loop', a: a};
};
var $author$project$SvgHelper$TSpan = function (a) {
	return {$: 'TSpan', a: a};
};
var $elm$parser$Parser$UnexpectedChar = {$: 'UnexpectedChar'};
var $elm$parser$Parser$Advanced$AddRight = F2(
	function (a, b) {
		return {$: 'AddRight', a: a, b: b};
	});
var $elm$parser$Parser$Advanced$DeadEnd = F4(
	function (row, col, problem, contextStack) {
		return {col: col, contextStack: contextStack, problem: problem, row: row};
	});
var $elm$parser$Parser$Advanced$Empty = {$: 'Empty'};
var $elm$parser$Parser$Advanced$fromState = F2(
	function (s, x) {
		return A2(
			$elm$parser$Parser$Advanced$AddRight,
			$elm$parser$Parser$Advanced$Empty,
			A4($elm$parser$Parser$Advanced$DeadEnd, s.row, s.col, x, s.context));
	});
var $elm$parser$Parser$Advanced$isSubChar = _Parser_isSubChar;
var $elm$parser$Parser$Advanced$chompIf = F2(
	function (isGood, expecting) {
		return $elm$parser$Parser$Advanced$Parser(
			function (s) {
				var newOffset = A3($elm$parser$Parser$Advanced$isSubChar, isGood, s.offset, s.src);
				return _Utils_eq(newOffset, -1) ? A2(
					$elm$parser$Parser$Advanced$Bad,
					false,
					A2($elm$parser$Parser$Advanced$fromState, s, expecting)) : (_Utils_eq(newOffset, -2) ? A3(
					$elm$parser$Parser$Advanced$Good,
					true,
					_Utils_Tuple0,
					{col: 1, context: s.context, indent: s.indent, offset: s.offset + 1, row: s.row + 1, src: s.src}) : A3(
					$elm$parser$Parser$Advanced$Good,
					true,
					_Utils_Tuple0,
					{col: s.col + 1, context: s.context, indent: s.indent, offset: newOffset, row: s.row, src: s.src}));
			});
	});
var $elm$parser$Parser$chompIf = function (isGood) {
	return A2($elm$parser$Parser$Advanced$chompIf, isGood, $elm$parser$Parser$UnexpectedChar);
};
var $elm$parser$Parser$Advanced$chompWhileHelp = F5(
	function (isGood, offset, row, col, s0) {
		chompWhileHelp:
		while (true) {
			var newOffset = A3($elm$parser$Parser$Advanced$isSubChar, isGood, offset, s0.src);
			if (_Utils_eq(newOffset, -1)) {
				return A3(
					$elm$parser$Parser$Advanced$Good,
					_Utils_cmp(s0.offset, offset) < 0,
					_Utils_Tuple0,
					{col: col, context: s0.context, indent: s0.indent, offset: offset, row: row, src: s0.src});
			} else {
				if (_Utils_eq(newOffset, -2)) {
					var $temp$isGood = isGood,
						$temp$offset = offset + 1,
						$temp$row = row + 1,
						$temp$col = 1,
						$temp$s0 = s0;
					isGood = $temp$isGood;
					offset = $temp$offset;
					row = $temp$row;
					col = $temp$col;
					s0 = $temp$s0;
					continue chompWhileHelp;
				} else {
					var $temp$isGood = isGood,
						$temp$offset = newOffset,
						$temp$row = row,
						$temp$col = col + 1,
						$temp$s0 = s0;
					isGood = $temp$isGood;
					offset = $temp$offset;
					row = $temp$row;
					col = $temp$col;
					s0 = $temp$s0;
					continue chompWhileHelp;
				}
			}
		}
	});
var $elm$parser$Parser$Advanced$chompWhile = function (isGood) {
	return $elm$parser$Parser$Advanced$Parser(
		function (s) {
			return A5($elm$parser$Parser$Advanced$chompWhileHelp, isGood, s.offset, s.row, s.col, s);
		});
};
var $elm$parser$Parser$chompWhile = $elm$parser$Parser$Advanced$chompWhile;
var $elm$parser$Parser$Advanced$mapChompedString = F2(
	function (func, _v0) {
		var parse = _v0.a;
		return $elm$parser$Parser$Advanced$Parser(
			function (s0) {
				var _v1 = parse(s0);
				if (_v1.$ === 'Bad') {
					var p = _v1.a;
					var x = _v1.b;
					return A2($elm$parser$Parser$Advanced$Bad, p, x);
				} else {
					var p = _v1.a;
					var a = _v1.b;
					var s1 = _v1.c;
					return A3(
						$elm$parser$Parser$Advanced$Good,
						p,
						A2(
							func,
							A3($elm$core$String$slice, s0.offset, s1.offset, s0.src),
							a),
						s1);
				}
			});
	});
var $elm$parser$Parser$Advanced$getChompedString = function (parser) {
	return A2($elm$parser$Parser$Advanced$mapChompedString, $elm$core$Basics$always, parser);
};
var $elm$parser$Parser$getChompedString = $elm$parser$Parser$Advanced$getChompedString;
var $elm$parser$Parser$Advanced$getOffset = $elm$parser$Parser$Advanced$Parser(
	function (s) {
		return A3($elm$parser$Parser$Advanced$Good, false, s.offset, s);
	});
var $elm$parser$Parser$getOffset = $elm$parser$Parser$Advanced$getOffset;
var $elm$parser$Parser$Advanced$map2 = F3(
	function (func, _v0, _v1) {
		var parseA = _v0.a;
		var parseB = _v1.a;
		return $elm$parser$Parser$Advanced$Parser(
			function (s0) {
				var _v2 = parseA(s0);
				if (_v2.$ === 'Bad') {
					var p = _v2.a;
					var x = _v2.b;
					return A2($elm$parser$Parser$Advanced$Bad, p, x);
				} else {
					var p1 = _v2.a;
					var a = _v2.b;
					var s1 = _v2.c;
					var _v3 = parseB(s1);
					if (_v3.$ === 'Bad') {
						var p2 = _v3.a;
						var x = _v3.b;
						return A2($elm$parser$Parser$Advanced$Bad, p1 || p2, x);
					} else {
						var p2 = _v3.a;
						var b = _v3.b;
						var s2 = _v3.c;
						return A3(
							$elm$parser$Parser$Advanced$Good,
							p1 || p2,
							A2(func, a, b),
							s2);
					}
				}
			});
	});
var $elm$parser$Parser$Advanced$ignorer = F2(
	function (keepParser, ignoreParser) {
		return A3($elm$parser$Parser$Advanced$map2, $elm$core$Basics$always, keepParser, ignoreParser);
	});
var $elm$parser$Parser$ignorer = $elm$parser$Parser$Advanced$ignorer;
var $elm$parser$Parser$Advanced$keeper = F2(
	function (parseFunc, parseArg) {
		return A3($elm$parser$Parser$Advanced$map2, $elm$core$Basics$apL, parseFunc, parseArg);
	});
var $elm$parser$Parser$keeper = $elm$parser$Parser$Advanced$keeper;
var $elm$parser$Parser$Advanced$Append = F2(
	function (a, b) {
		return {$: 'Append', a: a, b: b};
	});
var $elm$parser$Parser$Advanced$oneOfHelp = F3(
	function (s0, bag, parsers) {
		oneOfHelp:
		while (true) {
			if (!parsers.b) {
				return A2($elm$parser$Parser$Advanced$Bad, false, bag);
			} else {
				var parse = parsers.a.a;
				var remainingParsers = parsers.b;
				var _v1 = parse(s0);
				if (_v1.$ === 'Good') {
					var step = _v1;
					return step;
				} else {
					var step = _v1;
					var p = step.a;
					var x = step.b;
					if (p) {
						return step;
					} else {
						var $temp$s0 = s0,
							$temp$bag = A2($elm$parser$Parser$Advanced$Append, bag, x),
							$temp$parsers = remainingParsers;
						s0 = $temp$s0;
						bag = $temp$bag;
						parsers = $temp$parsers;
						continue oneOfHelp;
					}
				}
			}
		}
	});
var $elm$parser$Parser$Advanced$oneOf = function (parsers) {
	return $elm$parser$Parser$Advanced$Parser(
		function (s) {
			return A3($elm$parser$Parser$Advanced$oneOfHelp, s, $elm$parser$Parser$Advanced$Empty, parsers);
		});
};
var $elm$parser$Parser$oneOf = $elm$parser$Parser$Advanced$oneOf;
var $elm$parser$Parser$Advanced$succeed = function (a) {
	return $elm$parser$Parser$Advanced$Parser(
		function (s) {
			return A3($elm$parser$Parser$Advanced$Good, false, a, s);
		});
};
var $elm$parser$Parser$succeed = $elm$parser$Parser$Advanced$succeed;
var $elm$parser$Parser$Expecting = function (a) {
	return {$: 'Expecting', a: a};
};
var $elm$parser$Parser$Advanced$Token = F2(
	function (a, b) {
		return {$: 'Token', a: a, b: b};
	});
var $elm$parser$Parser$toToken = function (str) {
	return A2(
		$elm$parser$Parser$Advanced$Token,
		str,
		$elm$parser$Parser$Expecting(str));
};
var $elm$parser$Parser$Advanced$isSubString = _Parser_isSubString;
var $elm$parser$Parser$Advanced$token = function (_v0) {
	var str = _v0.a;
	var expecting = _v0.b;
	var progress = !$elm$core$String$isEmpty(str);
	return $elm$parser$Parser$Advanced$Parser(
		function (s) {
			var _v1 = A5($elm$parser$Parser$Advanced$isSubString, str, s.offset, s.row, s.col, s.src);
			var newOffset = _v1.a;
			var newRow = _v1.b;
			var newCol = _v1.c;
			return _Utils_eq(newOffset, -1) ? A2(
				$elm$parser$Parser$Advanced$Bad,
				false,
				A2($elm$parser$Parser$Advanced$fromState, s, expecting)) : A3(
				$elm$parser$Parser$Advanced$Good,
				progress,
				_Utils_Tuple0,
				{col: newCol, context: s.context, indent: s.indent, offset: newOffset, row: newRow, src: s.src});
		});
};
var $elm$parser$Parser$token = function (str) {
	return $elm$parser$Parser$Advanced$token(
		$elm$parser$Parser$toToken(str));
};
var $author$project$SvgHelper$textParserHelp = function (fs) {
	return $elm$parser$Parser$oneOf(
		_List_fromArray(
			[
				A2(
				$elm$parser$Parser$keeper,
				A2(
					$elm$parser$Parser$keeper,
					A2(
						$elm$parser$Parser$ignorer,
						$elm$parser$Parser$succeed(
							F2(
								function (s, t) {
									return $elm$parser$Parser$Loop(
										A2(
											$elm$core$List$cons,
											$author$project$SvgHelper$TSpan(
												{
													styles: A2($elm$core$String$split, ' ', s),
													text: t
												}),
											fs));
								})),
						$elm$parser$Parser$chompIf(
							function (c) {
								return _Utils_eq(
									c,
									_Utils_chr('['));
							})),
					A2(
						$elm$parser$Parser$ignorer,
						$elm$parser$Parser$getChompedString(
							$elm$parser$Parser$chompWhile(
								function (c) {
									return !_Utils_eq(
										c,
										_Utils_chr('|'));
								})),
						$elm$parser$Parser$token('|'))),
				A2(
					$elm$parser$Parser$ignorer,
					$elm$parser$Parser$getChompedString(
						$elm$parser$Parser$chompWhile(
							function (c) {
								return !_Utils_eq(
									c,
									_Utils_chr(']'));
							})),
					$elm$parser$Parser$token(']'))),
				A2(
				$elm$parser$Parser$keeper,
				A2(
					$elm$parser$Parser$keeper,
					A2(
						$elm$parser$Parser$keeper,
						$elm$parser$Parser$succeed(
							F3(
								function (start, t, end) {
									return _Utils_eq(start, end) ? $elm$parser$Parser$Done(
										$elm$core$List$reverse(fs)) : $elm$parser$Parser$Loop(
										A2(
											$elm$core$List$cons,
											$author$project$SvgHelper$Plain(t),
											fs));
								})),
						$elm$parser$Parser$getOffset),
					$elm$parser$Parser$getChompedString(
						$elm$parser$Parser$chompWhile(
							function (c) {
								return !_Utils_eq(
									c,
									_Utils_chr('['));
							}))),
				$elm$parser$Parser$getOffset)
			]));
};
var $author$project$SvgHelper$textParser = A2($elm$parser$Parser$loop, _List_Nil, $author$project$SvgHelper$textParserHelp);
var $rtfeldman$elm_css$Svg$Styled$text_ = $rtfeldman$elm_css$Svg$Styled$node('text');
var $rtfeldman$elm_css$Svg$Styled$Attributes$transform = $rtfeldman$elm_css$VirtualDom$Styled$attribute('transform');
var $author$project$SvgHelper$transforms = function (l) {
	return $rtfeldman$elm_css$Svg$Styled$Attributes$transform(
		A2($elm$core$String$join, ' ', l));
};
var $author$project$SvgHelper$translate = F2(
	function (x, y) {
		return 'translate(' + ($elm$core$String$fromFloat(x) + (' ' + ($elm$core$String$fromFloat(y) + ')')));
	});
var $author$project$SvgHelper$vectorLength = F2(
	function (x, y) {
		return $elm$core$Basics$sqrt(
			A2($elm$core$Basics$pow, x, 2) + A2($elm$core$Basics$pow, y, 2));
	});
var $rtfeldman$elm_css$Css$visibility = $rtfeldman$elm_css$Css$prop1('visibility');
var $rtfeldman$elm_css$Svg$Styled$Attributes$width = $rtfeldman$elm_css$VirtualDom$Styled$attribute('width');
var $rtfeldman$elm_css$Svg$Styled$Attributes$x = $rtfeldman$elm_css$VirtualDom$Styled$attribute('x');
var $rtfeldman$elm_css$Svg$Styled$Attributes$x1 = $rtfeldman$elm_css$VirtualDom$Styled$attribute('x1');
var $rtfeldman$elm_css$Svg$Styled$Attributes$x2 = $rtfeldman$elm_css$VirtualDom$Styled$attribute('x2');
var $rtfeldman$elm_css$Svg$Styled$Attributes$y = $rtfeldman$elm_css$VirtualDom$Styled$attribute('y');
var $rtfeldman$elm_css$Svg$Styled$Attributes$y1 = $rtfeldman$elm_css$VirtualDom$Styled$attribute('y1');
var $rtfeldman$elm_css$Svg$Styled$Attributes$y2 = $rtfeldman$elm_css$VirtualDom$Styled$attribute('y2');
var $author$project$SvgHelper$draw = F2(
	function (colors, _v0) {
		var shape = _v0.a;
		var style = _v0.b;
		var styleAttrs = $author$project$SvgHelper$flattenMaybe(
			_List_fromArray(
				[
					A2(
					$elm$core$Maybe$map,
					A2($elm$core$Basics$composeL, $rtfeldman$elm_css$Svg$Styled$Attributes$stroke, $noahzgordon$elm_color_extra$Color$Convert$colorToCssRgba),
					style.stroke),
					A2(
					$elm$core$Maybe$map,
					A2($elm$core$Basics$composeL, $rtfeldman$elm_css$Svg$Styled$Attributes$strokeWidth, $elm$core$String$fromFloat),
					style.strokeWidth),
					A2(
					$elm$core$Maybe$map,
					A2(
						$elm$core$Basics$composeL,
						A2(
							$elm$core$Basics$composeL,
							$rtfeldman$elm_css$Svg$Styled$Attributes$strokeDasharray,
							$elm$core$String$join(' ')),
						$elm$core$List$map($elm$core$String$fromFloat)),
					style.strokeDash),
					A2(
					$elm$core$Maybe$map,
					A2($elm$core$Basics$composeL, $rtfeldman$elm_css$Svg$Styled$Attributes$strokeDashoffset, $elm$core$String$fromFloat),
					style.strokeDashoffset),
					A2(
					$elm$core$Maybe$map,
					A2($elm$core$Basics$composeL, $rtfeldman$elm_css$Svg$Styled$Attributes$fill, $noahzgordon$elm_color_extra$Color$Convert$colorToCssRgba),
					style.fill),
					A2($elm$core$Maybe$map, $rtfeldman$elm_css$Svg$Styled$Attributes$id, style.id),
					A2(
					$elm$core$Maybe$map,
					A2(
						$elm$core$Basics$composeL,
						$rtfeldman$elm_css$Svg$Styled$Events$on('mouseenter'),
						$elm$json$Json$Decode$succeed),
					style.onMouseEnter),
					A2(
					$elm$core$Maybe$map,
					A2(
						$elm$core$Basics$composeL,
						$rtfeldman$elm_css$Svg$Styled$Events$on('mouseleave'),
						$elm$json$Json$Decode$succeed),
					style.onMouseLeave),
					A2($elm$core$Maybe$map, $rtfeldman$elm_css$Svg$Styled$Events$onClick, style.onClick),
					A2(
					$elm$core$Maybe$map,
					A2($elm$core$Basics$composeL, $rtfeldman$elm_css$Svg$Styled$Attributes$pointerEvents, $author$project$SvgHelper$pointerEventsToString),
					style.pointerEvents),
					A3(
					$elm$core$Basics$composeL,
					$elm$core$Maybe$map($rtfeldman$elm_css$Svg$Styled$Attributes$css),
					$author$project$SvgHelper$listToMaybe,
					$author$project$SvgHelper$flattenMaybe(
						_List_fromArray(
							[
								A2(
								$elm$core$Maybe$map,
								A2(
									$elm$core$Basics$composeL,
									A2(
										$elm$core$Basics$composeL,
										A2($elm$core$Basics$composeL, $rtfeldman$elm_css$Css$hover, $elm$core$List$singleton),
										$rtfeldman$elm_css$Css$fill),
									$author$project$SvgHelper$colorToCssColor),
								style.hoverFill),
								A2(
								$elm$core$Maybe$map,
								A2(
									$elm$core$Basics$composeL,
									A2(
										$elm$core$Basics$composeL,
										A2($elm$core$Basics$composeL, $rtfeldman$elm_css$Css$active, $elm$core$List$singleton),
										$rtfeldman$elm_css$Css$fill),
									$author$project$SvgHelper$colorToCssColor),
								style.activeFill),
								style.hidden ? $elm$core$Maybe$Just(
								$rtfeldman$elm_css$Css$visibility($rtfeldman$elm_css$Css$hidden)) : $elm$core$Maybe$Nothing
							])))
				]));
		switch (shape.$) {
			case 'Rect':
				var x = shape.a.x;
				var y = shape.a.y;
				var w = shape.a.w;
				var h = shape.a.h;
				var r = shape.a.r;
				return _List_fromArray(
					[
						A2(
						$rtfeldman$elm_css$Svg$Styled$rect,
						$elm$core$List$concat(
							_List_fromArray(
								[
									A3(
									$elm$core$List$map2,
									$elm$core$Basics$composeR($elm$core$String$fromFloat),
									_List_fromArray(
										[$rtfeldman$elm_css$Svg$Styled$Attributes$x, $rtfeldman$elm_css$Svg$Styled$Attributes$y, $rtfeldman$elm_css$Svg$Styled$Attributes$width, $rtfeldman$elm_css$Svg$Styled$Attributes$height]),
									_List_fromArray(
										[x, y, w, h])),
									(!r) ? _List_Nil : _List_fromArray(
									[
										$rtfeldman$elm_css$Svg$Styled$Attributes$rx(
										$elm$core$String$fromFloat(r))
									]),
									styleAttrs
								])),
						_List_Nil)
					]);
			case 'Circle':
				var x = shape.a.x;
				var y = shape.a.y;
				var r = shape.a.r;
				return _List_fromArray(
					[
						A2(
						$rtfeldman$elm_css$Svg$Styled$circle,
						A2(
							$elm$core$List$append,
							A3(
								$elm$core$List$map2,
								$elm$core$Basics$composeR($elm$core$String$fromFloat),
								_List_fromArray(
									[$rtfeldman$elm_css$Svg$Styled$Attributes$cx, $rtfeldman$elm_css$Svg$Styled$Attributes$cy, $rtfeldman$elm_css$Svg$Styled$Attributes$r]),
								_List_fromArray(
									[x, y, r])),
							styleAttrs),
						_List_Nil)
					]);
			case 'Line':
				var x1 = shape.a.x1;
				var y1 = shape.a.y1;
				var x2 = shape.a.x2;
				var y2 = shape.a.y2;
				var arrow = shape.a.arrow;
				if (arrow.$ === 'Nothing') {
					return _List_fromArray(
						[
							A2(
							$rtfeldman$elm_css$Svg$Styled$line,
							A2(
								$elm$core$List$append,
								A3(
									$elm$core$List$map2,
									$elm$core$Basics$composeR($elm$core$String$fromFloat),
									_List_fromArray(
										[$rtfeldman$elm_css$Svg$Styled$Attributes$x1, $rtfeldman$elm_css$Svg$Styled$Attributes$y1, $rtfeldman$elm_css$Svg$Styled$Attributes$x2, $rtfeldman$elm_css$Svg$Styled$Attributes$y2]),
									_List_fromArray(
										[x1, y1, x2, y2])),
								styleAttrs),
							_List_Nil)
						]);
				} else {
					var size = arrow.a;
					var totalLength = A2($author$project$SvgHelper$vectorLength, x2 - x1, y2 - y1);
					var rotation = $elm_community$basics_extra$Basics$Extra$inDegrees(
						A2($elm$core$Basics$atan2, y2 - y1, x2 - x1));
					var arrowWidth = A2($elm$core$Maybe$withDefault, 0, style.strokeWidth) * size;
					var arrowLength = arrowWidth / 1.2;
					var lineLength = totalLength - arrowLength;
					var jointX = x1 + (((x2 - x1) * lineLength) / totalLength);
					var jointY = y1 + (((y2 - y1) * lineLength) / totalLength);
					return _List_fromArray(
						[
							A2(
							$rtfeldman$elm_css$Svg$Styled$line,
							A2(
								$elm$core$List$append,
								A3(
									$elm$core$List$map2,
									$elm$core$Basics$composeR($elm$core$String$fromFloat),
									_List_fromArray(
										[$rtfeldman$elm_css$Svg$Styled$Attributes$x1, $rtfeldman$elm_css$Svg$Styled$Attributes$y1, $rtfeldman$elm_css$Svg$Styled$Attributes$x2, $rtfeldman$elm_css$Svg$Styled$Attributes$y2]),
									_List_fromArray(
										[x1, y1, jointX, jointY])),
								styleAttrs),
							_List_Nil),
							A2(
							$rtfeldman$elm_css$Svg$Styled$polygon,
							A3(
								$elm$core$Basics$composeL,
								$elm$core$List$append(
									_List_fromArray(
										[
											$author$project$SvgHelper$transforms(
											_List_fromArray(
												[
													A2($author$project$SvgHelper$translate, jointX, jointY),
													$author$project$SvgHelper$tScale(arrowLength),
													$author$project$SvgHelper$rotate(rotation)
												])),
											$author$project$SvgHelper$points(
											_List_fromArray(
												[
													_Utils_Tuple2(0, 0),
													_Utils_Tuple2(-0.5, -0.6),
													_Utils_Tuple2(1, 0),
													_Utils_Tuple2(-0.5, 0.6)
												]))
										])),
								$author$project$Utils$maybeToList,
								A2(
									$elm$core$Maybe$map,
									A2($elm$core$Basics$composeL, $rtfeldman$elm_css$Svg$Styled$Attributes$fill, $noahzgordon$elm_color_extra$Color$Convert$colorToCssRgba),
									style.stroke)),
							_List_Nil)
						]);
				}
			case 'QBezier':
				var x1 = shape.a.x1;
				var y1 = shape.a.y1;
				var cx = shape.a.cx;
				var cy = shape.a.cy;
				var x2 = shape.a.x2;
				var y2 = shape.a.y2;
				return _List_fromArray(
					[
						A2(
						$rtfeldman$elm_css$Svg$Styled$path,
						A2(
							$elm$core$List$append,
							_List_fromArray(
								[
									$rtfeldman$elm_css$Svg$Styled$Attributes$d(
									A3(
										$author$project$SvgHelper$fFloat,
										'y2',
										y2,
										A3(
											$author$project$SvgHelper$fFloat,
											'x2',
											x2,
											A3(
												$author$project$SvgHelper$fFloat,
												'cy',
												cy,
												A3(
													$author$project$SvgHelper$fFloat,
													'cx',
													cx,
													A3(
														$author$project$SvgHelper$fFloat,
														'y1',
														y1,
														A3($author$project$SvgHelper$fFloat, 'x1', x1, 'M{x1} {y1}Q{cx} {cy} {x2} {y2}'))))))),
									$rtfeldman$elm_css$Svg$Styled$Attributes$fill('none')
								]),
							styleAttrs),
						_List_Nil)
					]);
			case 'Complex':
				var x = shape.a.x;
				var y = shape.a.y;
				var scale = shape.a.scale;
				var paths = shape.a.paths;
				return _List_fromArray(
					[
						A2(
						$rtfeldman$elm_css$Svg$Styled$g,
						A2(
							$elm$core$List$cons,
							$author$project$SvgHelper$transforms(
								_List_fromArray(
									[
										A2($author$project$SvgHelper$translate, x, y),
										$author$project$SvgHelper$tScale(scale)
									])),
							styleAttrs),
						A2(
							$elm$core$List$map,
							function (p) {
								return A2(
									$rtfeldman$elm_css$Svg$Styled$path,
									_List_fromArray(
										[
											$rtfeldman$elm_css$Svg$Styled$Attributes$d(p)
										]),
									_List_Nil);
							},
							paths))
					]);
			default:
				var t = shape.a;
				var shift = $author$project$SvgHelper$textBaselineToOffset($author$project$SvgHelper$Alphabetic) - $author$project$SvgHelper$textBaselineToOffset(t.baseline);
				var results = A2($elm$parser$Parser$run, $author$project$SvgHelper$textParser, t.text);
				var fragments = function () {
					if (results.$ === 'Ok') {
						var f = results.a;
						return f;
					} else {
						var ds = results.a;
						var d = $elm$core$List$head(ds);
						return _List_fromArray(
							[
								$author$project$SvgHelper$Plain(
								A2(
									$elm$core$Maybe$withDefault,
									'',
									A2(
										$elm$core$Maybe$map,
										function (_v5) {
											var col = _v5.col;
											return $elm$core$String$fromInt(col);
										},
										d)))
							]);
					}
				}();
				var anchor = function () {
					var _v3 = t.anchor;
					switch (_v3.$) {
						case 'Start':
							return 'start';
						case 'TAMiddle':
							return 'middle';
						default:
							return 'end';
					}
				}();
				return _List_fromArray(
					[
						A2(
						$rtfeldman$elm_css$Svg$Styled$text_,
						$elm$core$List$concat(
							_List_fromArray(
								[
									A3(
									$elm$core$List$map2,
									$elm$core$Basics$composeR($elm$core$String$fromFloat),
									_List_fromArray(
										[$rtfeldman$elm_css$Svg$Styled$Attributes$x, $rtfeldman$elm_css$Svg$Styled$Attributes$y, $rtfeldman$elm_css$Svg$Styled$Attributes$fontSize]),
									_List_fromArray(
										[t.x, t.y + (shift * t.size), t.size])),
									_List_fromArray(
									[
										$rtfeldman$elm_css$Svg$Styled$Attributes$textAnchor(anchor)
									]),
									styleAttrs
								])),
						A2(
							$elm$core$List$map,
							$author$project$SvgHelper$drawFragment(colors),
							fragments))
					]);
		}
	});
var $rtfeldman$elm_css$Css$fontVariantNumeric = $rtfeldman$elm_css$Css$prop1('font-variant-numeric');
var $elm$virtual_dom$VirtualDom$node = function (tag) {
	return _VirtualDom_node(
		_VirtualDom_noScript(tag));
};
var $rtfeldman$elm_css$VirtualDom$Styled$unstyledNode = $rtfeldman$elm_css$VirtualDom$Styled$Unstyled;
var $rtfeldman$elm_css$Css$Global$global = function (snippets) {
	return $rtfeldman$elm_css$VirtualDom$Styled$unstyledNode(
		A3(
			$elm$virtual_dom$VirtualDom$node,
			'span',
			_List_fromArray(
				[
					A2($elm$virtual_dom$VirtualDom$attribute, 'style', 'display: none;'),
					A2($elm$virtual_dom$VirtualDom$attribute, 'class', 'elm-css-style-wrapper')
				]),
			$elm$core$List$singleton(
				A3(
					$elm$virtual_dom$VirtualDom$node,
					'style',
					_List_Nil,
					$elm$core$List$singleton(
						$elm$virtual_dom$VirtualDom$text(
							$rtfeldman$elm_css$Css$Preprocess$Resolve$compile(
								$rtfeldman$elm_css$Css$Preprocess$stylesheet(snippets))))))));
};
var $rtfeldman$elm_css$Css$auto = {alignItemsOrAuto: $rtfeldman$elm_css$Css$Structure$Compatible, cursor: $rtfeldman$elm_css$Css$Structure$Compatible, flexBasis: $rtfeldman$elm_css$Css$Structure$Compatible, intOrAuto: $rtfeldman$elm_css$Css$Structure$Compatible, justifyContentOrAuto: $rtfeldman$elm_css$Css$Structure$Compatible, lengthOrAuto: $rtfeldman$elm_css$Css$Structure$Compatible, lengthOrAutoOrCoverOrContain: $rtfeldman$elm_css$Css$Structure$Compatible, lengthOrNumberOrAutoOrNoneOrContent: $rtfeldman$elm_css$Css$Structure$Compatible, overflow: $rtfeldman$elm_css$Css$Structure$Compatible, pointerEvents: $rtfeldman$elm_css$Css$Structure$Compatible, tableLayout: $rtfeldman$elm_css$Css$Structure$Compatible, textRendering: $rtfeldman$elm_css$Css$Structure$Compatible, touchAction: $rtfeldman$elm_css$Css$Structure$Compatible, value: 'auto'};
var $rtfeldman$elm_css$Css$baseline = $rtfeldman$elm_css$Css$prop1('baseline');
var $rtfeldman$elm_css$Css$bolder = {fontWeight: $rtfeldman$elm_css$Css$Structure$Compatible, value: 'bolder'};
var $rtfeldman$elm_css$Css$borderBox = {backgroundClip: $rtfeldman$elm_css$Css$Structure$Compatible, boxSizing: $rtfeldman$elm_css$Css$Structure$Compatible, value: 'border-box'};
var $rtfeldman$elm_css$Css$borderColor = function (c) {
	return A2($rtfeldman$elm_css$Css$property, 'border-color', c.value);
};
var $rtfeldman$elm_css$Css$borderStyle = $rtfeldman$elm_css$Css$prop1('border-style');
var $rtfeldman$elm_css$Css$bottom = $rtfeldman$elm_css$Css$prop1('bottom');
var $rtfeldman$elm_css$Css$boxShadow = $rtfeldman$elm_css$Css$prop1('box-shadow');
var $rtfeldman$elm_css$Css$boxSizing = $rtfeldman$elm_css$Css$prop1('box-sizing');
var $rtfeldman$elm_css$Css$color = function (c) {
	return A2($rtfeldman$elm_css$Css$property, 'color', c.value);
};
var $rtfeldman$elm_css$Css$display = $rtfeldman$elm_css$Css$prop1('display');
var $rtfeldman$elm_css$Css$dotted = {borderStyle: $rtfeldman$elm_css$Css$Structure$Compatible, textDecorationStyle: $rtfeldman$elm_css$Css$Structure$Compatible, value: 'dotted'};
var $rtfeldman$elm_css$Css$EmUnits = {$: 'EmUnits'};
var $rtfeldman$elm_css$Css$Internal$lengthConverter = F3(
	function (units, unitLabel, numericValue) {
		return {
			absoluteLength: $rtfeldman$elm_css$Css$Structure$Compatible,
			calc: $rtfeldman$elm_css$Css$Structure$Compatible,
			flexBasis: $rtfeldman$elm_css$Css$Structure$Compatible,
			fontSize: $rtfeldman$elm_css$Css$Structure$Compatible,
			length: $rtfeldman$elm_css$Css$Structure$Compatible,
			lengthOrAuto: $rtfeldman$elm_css$Css$Structure$Compatible,
			lengthOrAutoOrCoverOrContain: $rtfeldman$elm_css$Css$Structure$Compatible,
			lengthOrMinMaxDimension: $rtfeldman$elm_css$Css$Structure$Compatible,
			lengthOrNone: $rtfeldman$elm_css$Css$Structure$Compatible,
			lengthOrNoneOrMinMaxDimension: $rtfeldman$elm_css$Css$Structure$Compatible,
			lengthOrNumber: $rtfeldman$elm_css$Css$Structure$Compatible,
			lengthOrNumberOrAutoOrNoneOrContent: $rtfeldman$elm_css$Css$Structure$Compatible,
			lineHeight: $rtfeldman$elm_css$Css$Structure$Compatible,
			numericValue: numericValue,
			textIndent: $rtfeldman$elm_css$Css$Structure$Compatible,
			unitLabel: unitLabel,
			units: units,
			value: _Utils_ap(
				$elm$core$String$fromFloat(numericValue),
				unitLabel)
		};
	});
var $rtfeldman$elm_css$Css$em = A2($rtfeldman$elm_css$Css$Internal$lengthConverter, $rtfeldman$elm_css$Css$EmUnits, 'em');
var $rtfeldman$elm_css$Css$stringsToValue = function (list) {
	return $elm$core$List$isEmpty(list) ? {value: 'none'} : {
		value: A2($elm$core$String$join, ', ', list)
	};
};
var $rtfeldman$elm_css$Css$fontFamilies = A2(
	$elm$core$Basics$composeL,
	$rtfeldman$elm_css$Css$prop1('font-family'),
	$rtfeldman$elm_css$Css$stringsToValue);
var $rtfeldman$elm_css$Css$fontFamily = $rtfeldman$elm_css$Css$prop1('font-family');
var $rtfeldman$elm_css$Css$fontSize = $rtfeldman$elm_css$Css$prop1('font-size');
var $rtfeldman$elm_css$Css$height = $rtfeldman$elm_css$Css$prop1('height');
var $rtfeldman$elm_css$Css$Internal$IncompatibleUnits = {$: 'IncompatibleUnits'};
var $rtfeldman$elm_css$Css$initial = {alignItems: $rtfeldman$elm_css$Css$Structure$Compatible, all: $rtfeldman$elm_css$Css$Structure$Compatible, backgroundAttachment: $rtfeldman$elm_css$Css$Structure$Compatible, backgroundBlendMode: $rtfeldman$elm_css$Css$Structure$Compatible, backgroundImage: $rtfeldman$elm_css$Css$Structure$Compatible, backgroundOrigin: $rtfeldman$elm_css$Css$Structure$Compatible, backgroundRepeat: $rtfeldman$elm_css$Css$Structure$Compatible, backgroundRepeatShorthand: $rtfeldman$elm_css$Css$Structure$Compatible, borderStyle: $rtfeldman$elm_css$Css$Structure$Compatible, boxSizing: $rtfeldman$elm_css$Css$Structure$Compatible, color: $rtfeldman$elm_css$Css$Structure$Compatible, cursor: $rtfeldman$elm_css$Css$Structure$Compatible, display: $rtfeldman$elm_css$Css$Structure$Compatible, flexBasis: $rtfeldman$elm_css$Css$Structure$Compatible, flexDirection: $rtfeldman$elm_css$Css$Structure$Compatible, flexDirectionOrWrap: $rtfeldman$elm_css$Css$Structure$Compatible, flexWrap: $rtfeldman$elm_css$Css$Structure$Compatible, fontFamily: $rtfeldman$elm_css$Css$Structure$Compatible, fontSize: $rtfeldman$elm_css$Css$Structure$Compatible, fontStyle: $rtfeldman$elm_css$Css$Structure$Compatible, fontVariant: $rtfeldman$elm_css$Css$Structure$Compatible, fontWeight: $rtfeldman$elm_css$Css$Structure$Compatible, intOrAuto: $rtfeldman$elm_css$Css$Structure$Compatible, justifyContent: $rtfeldman$elm_css$Css$Structure$Compatible, keyframes: $rtfeldman$elm_css$Css$Structure$Compatible, length: $rtfeldman$elm_css$Css$Structure$Compatible, lengthOrAuto: $rtfeldman$elm_css$Css$Structure$Compatible, lengthOrAutoOrCoverOrContain: $rtfeldman$elm_css$Css$Structure$Compatible, lengthOrMinMaxDimension: $rtfeldman$elm_css$Css$Structure$Compatible, lengthOrNone: $rtfeldman$elm_css$Css$Structure$Compatible, lengthOrNoneOrMinMaxDimension: $rtfeldman$elm_css$Css$Structure$Compatible, lengthOrNumber: $rtfeldman$elm_css$Css$Structure$Compatible, lengthOrNumberOrAutoOrNoneOrContent: $rtfeldman$elm_css$Css$Structure$Compatible, lineHeight: $rtfeldman$elm_css$Css$Structure$Compatible, listStylePosition: $rtfeldman$elm_css$Css$Structure$Compatible, listStyleType: $rtfeldman$elm_css$Css$Structure$Compatible, listStyleTypeOrPositionOrImage: $rtfeldman$elm_css$Css$Structure$Compatible, none: $rtfeldman$elm_css$Css$Structure$Compatible, number: $rtfeldman$elm_css$Css$Structure$Compatible, numericValue: 0, outline: $rtfeldman$elm_css$Css$Structure$Compatible, overflow: $rtfeldman$elm_css$Css$Structure$Compatible, pointerEvents: $rtfeldman$elm_css$Css$Structure$Compatible, tableLayout: $rtfeldman$elm_css$Css$Structure$Compatible, textDecorationLine: $rtfeldman$elm_css$Css$Structure$Compatible, textDecorationStyle: $rtfeldman$elm_css$Css$Structure$Compatible, textIndent: $rtfeldman$elm_css$Css$Structure$Compatible, textRendering: $rtfeldman$elm_css$Css$Structure$Compatible, textTransform: $rtfeldman$elm_css$Css$Structure$Compatible, touchAction: $rtfeldman$elm_css$Css$Structure$Compatible, unitLabel: '', units: $rtfeldman$elm_css$Css$Internal$IncompatibleUnits, value: 'initial', visibility: $rtfeldman$elm_css$Css$Structure$Compatible, whiteSpace: $rtfeldman$elm_css$Css$Structure$Compatible};
var $rtfeldman$elm_css$Css$inherit = _Utils_update(
	$rtfeldman$elm_css$Css$initial,
	{value: 'inherit'});
var $rtfeldman$elm_css$Css$lineHeight = $rtfeldman$elm_css$Css$prop1('line-height');
var $rtfeldman$elm_css$Css$listItem = {display: $rtfeldman$elm_css$Css$Structure$Compatible, value: 'list-item'};
var $rtfeldman$elm_css$Css$margin = $rtfeldman$elm_css$Css$prop1('margin');
var $rtfeldman$elm_css$Css$none = {backgroundImage: $rtfeldman$elm_css$Css$Structure$Compatible, blockAxisOverflow: $rtfeldman$elm_css$Css$Structure$Compatible, borderStyle: $rtfeldman$elm_css$Css$Structure$Compatible, cursor: $rtfeldman$elm_css$Css$Structure$Compatible, display: $rtfeldman$elm_css$Css$Structure$Compatible, hoverCapability: $rtfeldman$elm_css$Css$Structure$Compatible, inlineAxisOverflow: $rtfeldman$elm_css$Css$Structure$Compatible, keyframes: $rtfeldman$elm_css$Css$Structure$Compatible, lengthOrNone: $rtfeldman$elm_css$Css$Structure$Compatible, lengthOrNoneOrMinMaxDimension: $rtfeldman$elm_css$Css$Structure$Compatible, lengthOrNumberOrAutoOrNoneOrContent: $rtfeldman$elm_css$Css$Structure$Compatible, listStyleType: $rtfeldman$elm_css$Css$Structure$Compatible, listStyleTypeOrPositionOrImage: $rtfeldman$elm_css$Css$Structure$Compatible, none: $rtfeldman$elm_css$Css$Structure$Compatible, outline: $rtfeldman$elm_css$Css$Structure$Compatible, pointerDevice: $rtfeldman$elm_css$Css$Structure$Compatible, pointerEvents: $rtfeldman$elm_css$Css$Structure$Compatible, resize: $rtfeldman$elm_css$Css$Structure$Compatible, scriptingSupport: $rtfeldman$elm_css$Css$Structure$Compatible, textDecorationLine: $rtfeldman$elm_css$Css$Structure$Compatible, textTransform: $rtfeldman$elm_css$Css$Structure$Compatible, touchAction: $rtfeldman$elm_css$Css$Structure$Compatible, transform: $rtfeldman$elm_css$Css$Structure$Compatible, updateFrequency: $rtfeldman$elm_css$Css$Structure$Compatible, value: 'none'};
var $rtfeldman$elm_css$Css$UnitlessFloat = {$: 'UnitlessFloat'};
var $rtfeldman$elm_css$Css$num = function (val) {
	return {
		lengthOrNumber: $rtfeldman$elm_css$Css$Structure$Compatible,
		lengthOrNumberOrAutoOrNoneOrContent: $rtfeldman$elm_css$Css$Structure$Compatible,
		lineHeight: $rtfeldman$elm_css$Css$Structure$Compatible,
		number: $rtfeldman$elm_css$Css$Structure$Compatible,
		numberOrInfinite: $rtfeldman$elm_css$Css$Structure$Compatible,
		numericValue: val,
		unitLabel: '',
		units: $rtfeldman$elm_css$Css$UnitlessFloat,
		value: $elm$core$String$fromFloat(val)
	};
};
var $rtfeldman$elm_css$Css$outlineOffset = $rtfeldman$elm_css$Css$prop1('outline-offset');
var $rtfeldman$elm_css$Css$padding = $rtfeldman$elm_css$Css$prop1('padding');
var $rtfeldman$elm_css$Css$PercentageUnits = {$: 'PercentageUnits'};
var $rtfeldman$elm_css$Css$pct = A2($rtfeldman$elm_css$Css$Internal$lengthConverter, $rtfeldman$elm_css$Css$PercentageUnits, '%');
var $rtfeldman$elm_css$Css$position = $rtfeldman$elm_css$Css$prop1('position');
var $rtfeldman$elm_css$Css$PxUnits = {$: 'PxUnits'};
var $rtfeldman$elm_css$Css$px = A2($rtfeldman$elm_css$Css$Internal$lengthConverter, $rtfeldman$elm_css$Css$PxUnits, 'px');
var $rtfeldman$elm_css$Css$relative = {position: $rtfeldman$elm_css$Css$Structure$Compatible, value: 'relative'};
var $rtfeldman$elm_css$Css$Global$selector = F2(
	function (selectorStr, styles) {
		return A2(
			$rtfeldman$elm_css$VirtualDom$Styled$makeSnippet,
			styles,
			A2($rtfeldman$elm_css$Css$Structure$CustomSelector, selectorStr, _List_Nil));
	});
var $rtfeldman$elm_css$Css$prop2 = F3(
	function (key, argA, argB) {
		return A2($rtfeldman$elm_css$Css$property, key, argA.value + (' ' + argB.value));
	});
var $rtfeldman$elm_css$Css$textDecoration2 = $rtfeldman$elm_css$Css$prop2('text-decoration');
var $rtfeldman$elm_css$Css$textIndent = $rtfeldman$elm_css$Css$prop1('text-indent');
var $rtfeldman$elm_css$Css$textTransform = $rtfeldman$elm_css$Css$prop1('text-transform');
var $rtfeldman$elm_css$Css$top = $rtfeldman$elm_css$Css$prop1('top');
var $rtfeldman$elm_css$Css$underline = {textDecorationLine: $rtfeldman$elm_css$Css$Structure$Compatible, value: 'underline'};
var $rtfeldman$elm_css$Css$Preprocess$ApplyStyles = function (a) {
	return {$: 'ApplyStyles', a: a};
};
var $rtfeldman$elm_css$Css$Internal$property = F2(
	function (key, value) {
		return $rtfeldman$elm_css$Css$Preprocess$AppendProperty(
			$rtfeldman$elm_css$Css$Structure$Property(key + (':' + value)));
	});
var $rtfeldman$elm_css$Css$Internal$getOverloadedProperty = F3(
	function (functionName, desiredKey, style) {
		getOverloadedProperty:
		while (true) {
			switch (style.$) {
				case 'AppendProperty':
					var str = style.a.a;
					var key = A2(
						$elm$core$Maybe$withDefault,
						'',
						$elm$core$List$head(
							A2($elm$core$String$split, ':', str)));
					return A2($rtfeldman$elm_css$Css$Internal$property, desiredKey, key);
				case 'ExtendSelector':
					var selector = style.a;
					return A2($rtfeldman$elm_css$Css$Internal$property, desiredKey, 'elm-css-error-cannot-apply-' + (functionName + '-with-inapplicable-Style-for-selector'));
				case 'NestSnippet':
					var combinator = style.a;
					return A2($rtfeldman$elm_css$Css$Internal$property, desiredKey, 'elm-css-error-cannot-apply-' + (functionName + '-with-inapplicable-Style-for-combinator'));
				case 'WithPseudoElement':
					var pseudoElement = style.a;
					return A2($rtfeldman$elm_css$Css$Internal$property, desiredKey, 'elm-css-error-cannot-apply-' + (functionName + '-with-inapplicable-Style-for-pseudo-element setter'));
				case 'WithMedia':
					return A2($rtfeldman$elm_css$Css$Internal$property, desiredKey, 'elm-css-error-cannot-apply-' + (functionName + '-with-inapplicable-Style-for-media-query'));
				case 'WithKeyframes':
					return A2($rtfeldman$elm_css$Css$Internal$property, desiredKey, 'elm-css-error-cannot-apply-' + (functionName + '-with-inapplicable-Style-for-keyframes'));
				default:
					if (!style.a.b) {
						return A2($rtfeldman$elm_css$Css$Internal$property, desiredKey, 'elm-css-error-cannot-apply-' + (functionName + '-with-empty-Style'));
					} else {
						if (!style.a.b.b) {
							var _v1 = style.a;
							var only = _v1.a;
							var $temp$functionName = functionName,
								$temp$desiredKey = desiredKey,
								$temp$style = only;
							functionName = $temp$functionName;
							desiredKey = $temp$desiredKey;
							style = $temp$style;
							continue getOverloadedProperty;
						} else {
							var _v2 = style.a;
							var first = _v2.a;
							var rest = _v2.b;
							var $temp$functionName = functionName,
								$temp$desiredKey = desiredKey,
								$temp$style = $rtfeldman$elm_css$Css$Preprocess$ApplyStyles(rest);
							functionName = $temp$functionName;
							desiredKey = $temp$desiredKey;
							style = $temp$style;
							continue getOverloadedProperty;
						}
					}
			}
		}
	});
var $rtfeldman$elm_css$Css$Internal$lengthForOverloadedProperty = A3($rtfeldman$elm_css$Css$Internal$lengthConverter, $rtfeldman$elm_css$Css$Internal$IncompatibleUnits, '', 0);
var $rtfeldman$elm_css$Css$verticalAlign = function (fn) {
	return A3(
		$rtfeldman$elm_css$Css$Internal$getOverloadedProperty,
		'verticalAlign',
		'vertical-align',
		fn($rtfeldman$elm_css$Css$Internal$lengthForOverloadedProperty));
};
var $author$project$Css$ModernNormalize$snippets = _List_fromArray(
	[
		A2(
		$rtfeldman$elm_css$Css$Global$selector,
		'*, ::before, ::after',
		_List_fromArray(
			[
				$rtfeldman$elm_css$Css$boxSizing($rtfeldman$elm_css$Css$borderBox)
			])),
		A2(
		$rtfeldman$elm_css$Css$Global$selector,
		'html',
		_List_fromArray(
			[
				A2($rtfeldman$elm_css$Css$property, '-moz-tab-size', '4'),
				A2($rtfeldman$elm_css$Css$property, 'tab-size', '4')
			])),
		A2(
		$rtfeldman$elm_css$Css$Global$selector,
		'html',
		_List_fromArray(
			[
				$rtfeldman$elm_css$Css$lineHeight(
				$rtfeldman$elm_css$Css$num(1.15)),
				A2($rtfeldman$elm_css$Css$property, '-webkit-text-size-adjust', '100%')
			])),
		A2(
		$rtfeldman$elm_css$Css$Global$selector,
		'body',
		_List_fromArray(
			[
				$rtfeldman$elm_css$Css$margin(
				$rtfeldman$elm_css$Css$px(0)),
				$rtfeldman$elm_css$Css$fontFamilies(
				_List_fromArray(
					['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji']))
			])),
		A2(
		$rtfeldman$elm_css$Css$Global$selector,
		'hr',
		_List_fromArray(
			[
				$rtfeldman$elm_css$Css$height(
				$rtfeldman$elm_css$Css$px(0)),
				$rtfeldman$elm_css$Css$color($rtfeldman$elm_css$Css$inherit)
			])),
		A2(
		$rtfeldman$elm_css$Css$Global$selector,
		'abbr[title]',
		_List_fromArray(
			[
				A2($rtfeldman$elm_css$Css$textDecoration2, $rtfeldman$elm_css$Css$underline, $rtfeldman$elm_css$Css$dotted)
			])),
		A2(
		$rtfeldman$elm_css$Css$Global$selector,
		'b, strong',
		_List_fromArray(
			[
				$rtfeldman$elm_css$Css$fontWeight($rtfeldman$elm_css$Css$bolder)
			])),
		A2(
		$rtfeldman$elm_css$Css$Global$selector,
		'code, kbd, samp, pre',
		_List_fromArray(
			[
				$rtfeldman$elm_css$Css$fontFamilies(
				_List_fromArray(
					['ui-monospace', 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', 'monospace'])),
				$rtfeldman$elm_css$Css$fontSize(
				$rtfeldman$elm_css$Css$em(1))
			])),
		A2(
		$rtfeldman$elm_css$Css$Global$selector,
		'small',
		_List_fromArray(
			[
				$rtfeldman$elm_css$Css$fontSize(
				$rtfeldman$elm_css$Css$pct(80))
			])),
		A2(
		$rtfeldman$elm_css$Css$Global$selector,
		'sub,sup',
		_List_fromArray(
			[
				$rtfeldman$elm_css$Css$fontSize(
				$rtfeldman$elm_css$Css$pct(75)),
				$rtfeldman$elm_css$Css$lineHeight(
				$rtfeldman$elm_css$Css$num(0)),
				$rtfeldman$elm_css$Css$position($rtfeldman$elm_css$Css$relative),
				$rtfeldman$elm_css$Css$verticalAlign($rtfeldman$elm_css$Css$baseline)
			])),
		A2(
		$rtfeldman$elm_css$Css$Global$selector,
		'sub',
		_List_fromArray(
			[
				$rtfeldman$elm_css$Css$bottom(
				$rtfeldman$elm_css$Css$em(-0.25))
			])),
		A2(
		$rtfeldman$elm_css$Css$Global$selector,
		'sup',
		_List_fromArray(
			[
				$rtfeldman$elm_css$Css$top(
				$rtfeldman$elm_css$Css$em(-0.5))
			])),
		A2(
		$rtfeldman$elm_css$Css$Global$selector,
		'table',
		_List_fromArray(
			[
				$rtfeldman$elm_css$Css$textIndent(
				$rtfeldman$elm_css$Css$px(0)),
				$rtfeldman$elm_css$Css$borderColor($rtfeldman$elm_css$Css$inherit)
			])),
		A2(
		$rtfeldman$elm_css$Css$Global$selector,
		'button, input, optgroup, select, textarea',
		_List_fromArray(
			[
				$rtfeldman$elm_css$Css$fontFamily($rtfeldman$elm_css$Css$inherit),
				$rtfeldman$elm_css$Css$fontSize(
				$rtfeldman$elm_css$Css$pct(100)),
				$rtfeldman$elm_css$Css$lineHeight(
				$rtfeldman$elm_css$Css$num(1.15)),
				$rtfeldman$elm_css$Css$margin(
				$rtfeldman$elm_css$Css$px(0))
			])),
		A2(
		$rtfeldman$elm_css$Css$Global$selector,
		'button, select',
		_List_fromArray(
			[
				$rtfeldman$elm_css$Css$textTransform($rtfeldman$elm_css$Css$none)
			])),
		A2(
		$rtfeldman$elm_css$Css$Global$selector,
		'button, [type=\'button\'], [type=\'reset\'], [type=\'submit\']',
		_List_fromArray(
			[
				A2($rtfeldman$elm_css$Css$property, '-webkit-appearance', 'button')
			])),
		A2(
		$rtfeldman$elm_css$Css$Global$selector,
		'::-moz-focus-inner',
		_List_fromArray(
			[
				$rtfeldman$elm_css$Css$borderStyle($rtfeldman$elm_css$Css$none),
				$rtfeldman$elm_css$Css$padding(
				$rtfeldman$elm_css$Css$px(0))
			])),
		A2(
		$rtfeldman$elm_css$Css$Global$selector,
		':-moz-focusring',
		_List_fromArray(
			[
				A2($rtfeldman$elm_css$Css$property, 'outline', '1px dotted ButtonText')
			])),
		A2(
		$rtfeldman$elm_css$Css$Global$selector,
		':-moz-ui-invalid',
		_List_fromArray(
			[
				$rtfeldman$elm_css$Css$boxShadow($rtfeldman$elm_css$Css$none)
			])),
		A2(
		$rtfeldman$elm_css$Css$Global$selector,
		'legend',
		_List_fromArray(
			[
				$rtfeldman$elm_css$Css$padding(
				$rtfeldman$elm_css$Css$px(0))
			])),
		A2(
		$rtfeldman$elm_css$Css$Global$selector,
		'progress',
		_List_fromArray(
			[
				$rtfeldman$elm_css$Css$verticalAlign($rtfeldman$elm_css$Css$baseline)
			])),
		A2(
		$rtfeldman$elm_css$Css$Global$selector,
		'::-webkit-inner-spin-button, ::-webkit-outer-spin-button',
		_List_fromArray(
			[
				$rtfeldman$elm_css$Css$height($rtfeldman$elm_css$Css$auto)
			])),
		A2(
		$rtfeldman$elm_css$Css$Global$selector,
		'[type=\'search\']',
		_List_fromArray(
			[
				$rtfeldman$elm_css$Css$outlineOffset(
				$rtfeldman$elm_css$Css$px(-2)),
				A2($rtfeldman$elm_css$Css$property, '-webkit-appearance', 'textfield')
			])),
		A2(
		$rtfeldman$elm_css$Css$Global$selector,
		'::-webkit-search-decoration',
		_List_fromArray(
			[
				A2($rtfeldman$elm_css$Css$property, '-webkit-appearance', 'none')
			])),
		A2(
		$rtfeldman$elm_css$Css$Global$selector,
		'::-webkit-file-upload-button',
		_List_fromArray(
			[
				A2($rtfeldman$elm_css$Css$property, 'font', 'inherit'),
				A2($rtfeldman$elm_css$Css$property, '-webkit-appearance', 'button')
			])),
		A2(
		$rtfeldman$elm_css$Css$Global$selector,
		'summary',
		_List_fromArray(
			[
				$rtfeldman$elm_css$Css$display($rtfeldman$elm_css$Css$listItem)
			]))
	]);
var $author$project$Css$ModernNormalize$globalStyledHtml = $rtfeldman$elm_css$Css$Global$global($author$project$Css$ModernNormalize$snippets);
var $rtfeldman$elm_css$VirtualDom$Styled$UnscopedStyles = function (a) {
	return {$: 'UnscopedStyles', a: a};
};
var $rtfeldman$elm_css$VirtualDom$Styled$accumulateStyles = F2(
	function (_v0, styles) {
		var isCssStyles = _v0.b;
		var cssTemplate = _v0.c;
		if (isCssStyles) {
			var _v1 = A2($elm$core$Dict$get, cssTemplate, styles);
			if (_v1.$ === 'Just') {
				return styles;
			} else {
				return A3(
					$elm$core$Dict$insert,
					cssTemplate,
					$rtfeldman$elm_css$Hash$fromString(cssTemplate),
					styles);
			}
		} else {
			return styles;
		}
	});
var $elm$virtual_dom$VirtualDom$property = F2(
	function (key, value) {
		return A2(
			_VirtualDom_property,
			_VirtualDom_noInnerHtmlOrFormAction(key),
			_VirtualDom_noJavaScriptOrHtmlJson(value));
	});
var $rtfeldman$elm_css$VirtualDom$Styled$extractUnstyledAttribute = F2(
	function (styles, _v0) {
		var val = _v0.a;
		var isCssStyles = _v0.b;
		var cssTemplate = _v0.c;
		if (isCssStyles) {
			var _v1 = A2($elm$core$Dict$get, cssTemplate, styles);
			if (_v1.$ === 'Just') {
				var classname = _v1.a;
				return A2(
					$elm$virtual_dom$VirtualDom$property,
					'className',
					$elm$json$Json$Encode$string(classname));
			} else {
				return A2(
					$elm$virtual_dom$VirtualDom$property,
					'className',
					$elm$json$Json$Encode$string('_unstyled'));
			}
		} else {
			return val;
		}
	});
var $rtfeldman$elm_css$VirtualDom$Styled$extractUnstyledAttributeNS = F2(
	function (styles, _v0) {
		var val = _v0.a;
		var isCssStyles = _v0.b;
		var cssTemplate = _v0.c;
		if (isCssStyles) {
			var _v1 = A2($elm$core$Dict$get, cssTemplate, styles);
			if (_v1.$ === 'Just') {
				var classname = _v1.a;
				return A2($elm$virtual_dom$VirtualDom$attribute, 'class', classname);
			} else {
				return A2($elm$virtual_dom$VirtualDom$attribute, 'class', '_unstyled');
			}
		} else {
			return val;
		}
	});
var $elm$virtual_dom$VirtualDom$keyedNode = function (tag) {
	return _VirtualDom_keyedNode(
		_VirtualDom_noScript(tag));
};
var $elm$virtual_dom$VirtualDom$keyedNodeNS = F2(
	function (namespace, tag) {
		return A2(
			_VirtualDom_keyedNodeNS,
			namespace,
			_VirtualDom_noScript(tag));
	});
var $elm$virtual_dom$VirtualDom$nodeNS = F2(
	function (namespace, tag) {
		return A2(
			_VirtualDom_nodeNS,
			namespace,
			_VirtualDom_noScript(tag));
	});
var $rtfeldman$elm_css$VirtualDom$Styled$accumulateKeyedStyledHtml = F2(
	function (_v6, _v7) {
		var key = _v6.a;
		var html = _v6.b;
		var pairs = _v7.a;
		var styles = _v7.b;
		switch (html.$) {
			case 'Unstyled':
				var vdom = html.a;
				return _Utils_Tuple2(
					A2(
						$elm$core$List$cons,
						_Utils_Tuple2(key, vdom),
						pairs),
					styles);
			case 'Node':
				var elemType = html.a;
				var properties = html.b;
				var children = html.c;
				var combinedStyles = A3($elm$core$List$foldl, $rtfeldman$elm_css$VirtualDom$Styled$accumulateStyles, styles, properties);
				var _v9 = A3(
					$elm$core$List$foldl,
					$rtfeldman$elm_css$VirtualDom$Styled$accumulateStyledHtml,
					_Utils_Tuple2(_List_Nil, combinedStyles),
					children);
				var childNodes = _v9.a;
				var finalStyles = _v9.b;
				var vdom = A3(
					$elm$virtual_dom$VirtualDom$node,
					elemType,
					A2(
						$elm$core$List$map,
						$rtfeldman$elm_css$VirtualDom$Styled$extractUnstyledAttribute(finalStyles),
						properties),
					$elm$core$List$reverse(childNodes));
				return _Utils_Tuple2(
					A2(
						$elm$core$List$cons,
						_Utils_Tuple2(key, vdom),
						pairs),
					finalStyles);
			case 'NodeNS':
				var ns = html.a;
				var elemType = html.b;
				var properties = html.c;
				var children = html.d;
				var combinedStyles = A3($elm$core$List$foldl, $rtfeldman$elm_css$VirtualDom$Styled$accumulateStyles, styles, properties);
				var _v10 = A3(
					$elm$core$List$foldl,
					$rtfeldman$elm_css$VirtualDom$Styled$accumulateStyledHtml,
					_Utils_Tuple2(_List_Nil, combinedStyles),
					children);
				var childNodes = _v10.a;
				var finalStyles = _v10.b;
				var vdom = A4(
					$elm$virtual_dom$VirtualDom$nodeNS,
					ns,
					elemType,
					A2(
						$elm$core$List$map,
						$rtfeldman$elm_css$VirtualDom$Styled$extractUnstyledAttribute(finalStyles),
						properties),
					$elm$core$List$reverse(childNodes));
				return _Utils_Tuple2(
					A2(
						$elm$core$List$cons,
						_Utils_Tuple2(key, vdom),
						pairs),
					finalStyles);
			case 'KeyedNode':
				var elemType = html.a;
				var properties = html.b;
				var children = html.c;
				var combinedStyles = A3($elm$core$List$foldl, $rtfeldman$elm_css$VirtualDom$Styled$accumulateStyles, styles, properties);
				var _v11 = A3(
					$elm$core$List$foldl,
					$rtfeldman$elm_css$VirtualDom$Styled$accumulateKeyedStyledHtml,
					_Utils_Tuple2(_List_Nil, combinedStyles),
					children);
				var childNodes = _v11.a;
				var finalStyles = _v11.b;
				var vdom = A3(
					$elm$virtual_dom$VirtualDom$keyedNode,
					elemType,
					A2(
						$elm$core$List$map,
						$rtfeldman$elm_css$VirtualDom$Styled$extractUnstyledAttribute(finalStyles),
						properties),
					$elm$core$List$reverse(childNodes));
				return _Utils_Tuple2(
					A2(
						$elm$core$List$cons,
						_Utils_Tuple2(key, vdom),
						pairs),
					finalStyles);
			default:
				var ns = html.a;
				var elemType = html.b;
				var properties = html.c;
				var children = html.d;
				var combinedStyles = A3($elm$core$List$foldl, $rtfeldman$elm_css$VirtualDom$Styled$accumulateStyles, styles, properties);
				var _v12 = A3(
					$elm$core$List$foldl,
					$rtfeldman$elm_css$VirtualDom$Styled$accumulateKeyedStyledHtml,
					_Utils_Tuple2(_List_Nil, combinedStyles),
					children);
				var childNodes = _v12.a;
				var finalStyles = _v12.b;
				var vdom = A4(
					$elm$virtual_dom$VirtualDom$keyedNodeNS,
					ns,
					elemType,
					A2(
						$elm$core$List$map,
						$rtfeldman$elm_css$VirtualDom$Styled$extractUnstyledAttribute(finalStyles),
						properties),
					$elm$core$List$reverse(childNodes));
				return _Utils_Tuple2(
					A2(
						$elm$core$List$cons,
						_Utils_Tuple2(key, vdom),
						pairs),
					finalStyles);
		}
	});
var $rtfeldman$elm_css$VirtualDom$Styled$accumulateStyledHtml = F2(
	function (html, _v0) {
		var nodes = _v0.a;
		var styles = _v0.b;
		switch (html.$) {
			case 'Unstyled':
				var vdomNode = html.a;
				return _Utils_Tuple2(
					A2($elm$core$List$cons, vdomNode, nodes),
					styles);
			case 'Node':
				var elemType = html.a;
				var properties = html.b;
				var children = html.c;
				var combinedStyles = A3($elm$core$List$foldl, $rtfeldman$elm_css$VirtualDom$Styled$accumulateStyles, styles, properties);
				var _v2 = A3(
					$elm$core$List$foldl,
					$rtfeldman$elm_css$VirtualDom$Styled$accumulateStyledHtml,
					_Utils_Tuple2(_List_Nil, combinedStyles),
					children);
				var childNodes = _v2.a;
				var finalStyles = _v2.b;
				var vdomNode = A3(
					$elm$virtual_dom$VirtualDom$node,
					elemType,
					A2(
						$elm$core$List$map,
						$rtfeldman$elm_css$VirtualDom$Styled$extractUnstyledAttribute(finalStyles),
						properties),
					$elm$core$List$reverse(childNodes));
				return _Utils_Tuple2(
					A2($elm$core$List$cons, vdomNode, nodes),
					finalStyles);
			case 'NodeNS':
				var ns = html.a;
				var elemType = html.b;
				var properties = html.c;
				var children = html.d;
				var combinedStyles = A3($elm$core$List$foldl, $rtfeldman$elm_css$VirtualDom$Styled$accumulateStyles, styles, properties);
				var _v3 = A3(
					$elm$core$List$foldl,
					$rtfeldman$elm_css$VirtualDom$Styled$accumulateStyledHtml,
					_Utils_Tuple2(_List_Nil, combinedStyles),
					children);
				var childNodes = _v3.a;
				var finalStyles = _v3.b;
				var vdomNode = A4(
					$elm$virtual_dom$VirtualDom$nodeNS,
					ns,
					elemType,
					A2(
						$elm$core$List$map,
						$rtfeldman$elm_css$VirtualDom$Styled$extractUnstyledAttributeNS(finalStyles),
						properties),
					$elm$core$List$reverse(childNodes));
				return _Utils_Tuple2(
					A2($elm$core$List$cons, vdomNode, nodes),
					finalStyles);
			case 'KeyedNode':
				var elemType = html.a;
				var properties = html.b;
				var children = html.c;
				var combinedStyles = A3($elm$core$List$foldl, $rtfeldman$elm_css$VirtualDom$Styled$accumulateStyles, styles, properties);
				var _v4 = A3(
					$elm$core$List$foldl,
					$rtfeldman$elm_css$VirtualDom$Styled$accumulateKeyedStyledHtml,
					_Utils_Tuple2(_List_Nil, combinedStyles),
					children);
				var childNodes = _v4.a;
				var finalStyles = _v4.b;
				var vdomNode = A3(
					$elm$virtual_dom$VirtualDom$keyedNode,
					elemType,
					A2(
						$elm$core$List$map,
						$rtfeldman$elm_css$VirtualDom$Styled$extractUnstyledAttribute(finalStyles),
						properties),
					$elm$core$List$reverse(childNodes));
				return _Utils_Tuple2(
					A2($elm$core$List$cons, vdomNode, nodes),
					finalStyles);
			default:
				var ns = html.a;
				var elemType = html.b;
				var properties = html.c;
				var children = html.d;
				var combinedStyles = A3($elm$core$List$foldl, $rtfeldman$elm_css$VirtualDom$Styled$accumulateStyles, styles, properties);
				var _v5 = A3(
					$elm$core$List$foldl,
					$rtfeldman$elm_css$VirtualDom$Styled$accumulateKeyedStyledHtml,
					_Utils_Tuple2(_List_Nil, combinedStyles),
					children);
				var childNodes = _v5.a;
				var finalStyles = _v5.b;
				var vdomNode = A4(
					$elm$virtual_dom$VirtualDom$keyedNodeNS,
					ns,
					elemType,
					A2(
						$elm$core$List$map,
						$rtfeldman$elm_css$VirtualDom$Styled$extractUnstyledAttributeNS(finalStyles),
						properties),
					$elm$core$List$reverse(childNodes));
				return _Utils_Tuple2(
					A2($elm$core$List$cons, vdomNode, nodes),
					finalStyles);
		}
	});
var $rtfeldman$elm_css$VirtualDom$Styled$styleToDeclaration = F3(
	function (template, classname, declaration) {
		return declaration + ('\n' + A3($elm$core$String$replace, $rtfeldman$elm_css$VirtualDom$Styled$classnameStandin, classname, template));
	});
var $rtfeldman$elm_css$VirtualDom$Styled$toDeclaration = function (dict) {
	return A3($elm$core$Dict$foldl, $rtfeldman$elm_css$VirtualDom$Styled$styleToDeclaration, '', dict);
};
var $rtfeldman$elm_css$VirtualDom$Styled$toScopedDeclaration = F2(
	function (scopingPrefix, dict) {
		return A3(
			$elm$core$Dict$foldl,
			F3(
				function (template, classname, declaration) {
					return declaration + ('\n' + A3($elm$core$String$replace, '.' + $rtfeldman$elm_css$VirtualDom$Styled$classnameStandin, '#' + (scopingPrefix + ('.' + classname)), template));
				}),
			'',
			dict);
	});
var $rtfeldman$elm_css$VirtualDom$Styled$toStyleNode = F2(
	function (maybeNonce, accumulatedStyles) {
		var cssText = function () {
			if (accumulatedStyles.$ === 'UnscopedStyles') {
				var allStyles = accumulatedStyles.a;
				return $rtfeldman$elm_css$VirtualDom$Styled$toDeclaration(allStyles);
			} else {
				var scope = accumulatedStyles.a.a;
				var rootStyles = accumulatedStyles.b;
				var descendantStyles = accumulatedStyles.c;
				return A2($rtfeldman$elm_css$VirtualDom$Styled$toScopedDeclaration, scope, rootStyles) + ('\n' + A2($rtfeldman$elm_css$VirtualDom$Styled$toScopedDeclaration, scope + ' ', descendantStyles));
			}
		}();
		return A3(
			$elm$virtual_dom$VirtualDom$node,
			'span',
			_List_fromArray(
				[
					A2($elm$virtual_dom$VirtualDom$attribute, 'style', 'display: none;'),
					A2($elm$virtual_dom$VirtualDom$attribute, 'class', 'elm-css-style-wrapper')
				]),
			_List_fromArray(
				[
					A3(
					$elm$virtual_dom$VirtualDom$node,
					'style',
					function () {
						if (maybeNonce.$ === 'Just') {
							var nonce = maybeNonce.a.a;
							return _List_fromArray(
								[
									A2($elm$virtual_dom$VirtualDom$attribute, 'nonce', nonce)
								]);
						} else {
							return _List_Nil;
						}
					}(),
					$elm$core$List$singleton(
						$elm$virtual_dom$VirtualDom$text(cssText)))
				]));
	});
var $rtfeldman$elm_css$VirtualDom$Styled$unstyle = F4(
	function (maybeNonce, elemType, properties, children) {
		var initialStyles = A3($elm$core$List$foldl, $rtfeldman$elm_css$VirtualDom$Styled$accumulateStyles, $elm$core$Dict$empty, properties);
		var _v0 = A3(
			$elm$core$List$foldl,
			$rtfeldman$elm_css$VirtualDom$Styled$accumulateStyledHtml,
			_Utils_Tuple2(_List_Nil, initialStyles),
			children);
		var childNodes = _v0.a;
		var styles = _v0.b;
		var styleNode = A2(
			$rtfeldman$elm_css$VirtualDom$Styled$toStyleNode,
			maybeNonce,
			$rtfeldman$elm_css$VirtualDom$Styled$UnscopedStyles(styles));
		var unstyledProperties = A2(
			$elm$core$List$map,
			$rtfeldman$elm_css$VirtualDom$Styled$extractUnstyledAttribute(styles),
			properties);
		return A3(
			$elm$virtual_dom$VirtualDom$node,
			elemType,
			unstyledProperties,
			A2(
				$elm$core$List$cons,
				styleNode,
				$elm$core$List$reverse(childNodes)));
	});
var $rtfeldman$elm_css$VirtualDom$Styled$containsKey = F2(
	function (key, pairs) {
		containsKey:
		while (true) {
			if (!pairs.b) {
				return false;
			} else {
				var _v1 = pairs.a;
				var str = _v1.a;
				var rest = pairs.b;
				if (_Utils_eq(key, str)) {
					return true;
				} else {
					var $temp$key = key,
						$temp$pairs = rest;
					key = $temp$key;
					pairs = $temp$pairs;
					continue containsKey;
				}
			}
		}
	});
var $rtfeldman$elm_css$VirtualDom$Styled$getUnusedKey = F2(
	function (_default, pairs) {
		getUnusedKey:
		while (true) {
			if (!pairs.b) {
				return _default;
			} else {
				var _v1 = pairs.a;
				var firstKey = _v1.a;
				var rest = pairs.b;
				var newKey = '_' + firstKey;
				if (A2($rtfeldman$elm_css$VirtualDom$Styled$containsKey, newKey, rest)) {
					var $temp$default = newKey,
						$temp$pairs = rest;
					_default = $temp$default;
					pairs = $temp$pairs;
					continue getUnusedKey;
				} else {
					return newKey;
				}
			}
		}
	});
var $rtfeldman$elm_css$VirtualDom$Styled$toKeyedStyleNode = F3(
	function (maybeNonce, accumulatedStyles, keyedChildNodes) {
		var styleNodeKey = A2($rtfeldman$elm_css$VirtualDom$Styled$getUnusedKey, '_', keyedChildNodes);
		var finalNode = A2($rtfeldman$elm_css$VirtualDom$Styled$toStyleNode, maybeNonce, accumulatedStyles);
		return _Utils_Tuple2(styleNodeKey, finalNode);
	});
var $rtfeldman$elm_css$VirtualDom$Styled$unstyleKeyed = F4(
	function (maybeNonce, elemType, properties, keyedChildren) {
		var initialStyles = A3($elm$core$List$foldl, $rtfeldman$elm_css$VirtualDom$Styled$accumulateStyles, $elm$core$Dict$empty, properties);
		var _v0 = A3(
			$elm$core$List$foldl,
			$rtfeldman$elm_css$VirtualDom$Styled$accumulateKeyedStyledHtml,
			_Utils_Tuple2(_List_Nil, initialStyles),
			keyedChildren);
		var keyedChildNodes = _v0.a;
		var styles = _v0.b;
		var keyedStyleNode = A3(
			$rtfeldman$elm_css$VirtualDom$Styled$toKeyedStyleNode,
			maybeNonce,
			$rtfeldman$elm_css$VirtualDom$Styled$UnscopedStyles(styles),
			keyedChildNodes);
		var unstyledProperties = A2(
			$elm$core$List$map,
			$rtfeldman$elm_css$VirtualDom$Styled$extractUnstyledAttribute(styles),
			properties);
		return A3(
			$elm$virtual_dom$VirtualDom$keyedNode,
			elemType,
			unstyledProperties,
			A2(
				$elm$core$List$cons,
				keyedStyleNode,
				$elm$core$List$reverse(keyedChildNodes)));
	});
var $rtfeldman$elm_css$VirtualDom$Styled$unstyleKeyedNS = F5(
	function (maybeNonce, ns, elemType, properties, keyedChildren) {
		var initialStyles = A3($elm$core$List$foldl, $rtfeldman$elm_css$VirtualDom$Styled$accumulateStyles, $elm$core$Dict$empty, properties);
		var _v0 = A3(
			$elm$core$List$foldl,
			$rtfeldman$elm_css$VirtualDom$Styled$accumulateKeyedStyledHtml,
			_Utils_Tuple2(_List_Nil, initialStyles),
			keyedChildren);
		var keyedChildNodes = _v0.a;
		var styles = _v0.b;
		var keyedStyleNode = A3(
			$rtfeldman$elm_css$VirtualDom$Styled$toKeyedStyleNode,
			maybeNonce,
			$rtfeldman$elm_css$VirtualDom$Styled$UnscopedStyles(styles),
			keyedChildNodes);
		var unstyledProperties = A2(
			$elm$core$List$map,
			$rtfeldman$elm_css$VirtualDom$Styled$extractUnstyledAttributeNS(styles),
			properties);
		return A4(
			$elm$virtual_dom$VirtualDom$keyedNodeNS,
			ns,
			elemType,
			unstyledProperties,
			A2(
				$elm$core$List$cons,
				keyedStyleNode,
				$elm$core$List$reverse(keyedChildNodes)));
	});
var $rtfeldman$elm_css$VirtualDom$Styled$unstyleNS = F5(
	function (maybeNonce, ns, elemType, properties, children) {
		var initialStyles = A3($elm$core$List$foldl, $rtfeldman$elm_css$VirtualDom$Styled$accumulateStyles, $elm$core$Dict$empty, properties);
		var _v0 = A3(
			$elm$core$List$foldl,
			$rtfeldman$elm_css$VirtualDom$Styled$accumulateStyledHtml,
			_Utils_Tuple2(_List_Nil, initialStyles),
			children);
		var childNodes = _v0.a;
		var styles = _v0.b;
		var styleNode = A2(
			$rtfeldman$elm_css$VirtualDom$Styled$toStyleNode,
			maybeNonce,
			$rtfeldman$elm_css$VirtualDom$Styled$UnscopedStyles(styles));
		var unstyledProperties = A2(
			$elm$core$List$map,
			$rtfeldman$elm_css$VirtualDom$Styled$extractUnstyledAttributeNS(styles),
			properties);
		return A4(
			$elm$virtual_dom$VirtualDom$nodeNS,
			ns,
			elemType,
			unstyledProperties,
			A2(
				$elm$core$List$cons,
				styleNode,
				$elm$core$List$reverse(childNodes)));
	});
var $rtfeldman$elm_css$VirtualDom$Styled$toUnstyled = function (vdom) {
	switch (vdom.$) {
		case 'Unstyled':
			var plainNode = vdom.a;
			return plainNode;
		case 'Node':
			var elemType = vdom.a;
			var properties = vdom.b;
			var children = vdom.c;
			return A4($rtfeldman$elm_css$VirtualDom$Styled$unstyle, $elm$core$Maybe$Nothing, elemType, properties, children);
		case 'NodeNS':
			var ns = vdom.a;
			var elemType = vdom.b;
			var properties = vdom.c;
			var children = vdom.d;
			return A5($rtfeldman$elm_css$VirtualDom$Styled$unstyleNS, $elm$core$Maybe$Nothing, ns, elemType, properties, children);
		case 'KeyedNode':
			var elemType = vdom.a;
			var properties = vdom.b;
			var children = vdom.c;
			return A4($rtfeldman$elm_css$VirtualDom$Styled$unstyleKeyed, $elm$core$Maybe$Nothing, elemType, properties, children);
		default:
			var ns = vdom.a;
			var elemType = vdom.b;
			var properties = vdom.c;
			var children = vdom.d;
			return A5($rtfeldman$elm_css$VirtualDom$Styled$unstyleKeyedNS, $elm$core$Maybe$Nothing, ns, elemType, properties, children);
	}
};
var $rtfeldman$elm_css$Html$Styled$toUnstyled = $rtfeldman$elm_css$VirtualDom$Styled$toUnstyled;
var $author$project$Css$ModernNormalize$globalHtml = $rtfeldman$elm_css$Html$Styled$toUnstyled($author$project$Css$ModernNormalize$globalStyledHtml);
var $elm$html$Html$Events$on = F2(
	function (event, decoder) {
		return A2(
			$elm$virtual_dom$VirtualDom$on,
			event,
			$elm$virtual_dom$VirtualDom$Normal(decoder));
	});
var $elm$html$Html$Events$onClick = function (msg) {
	return A2(
		$elm$html$Html$Events$on,
		'click',
		$elm$json$Json$Decode$succeed(msg));
};
var $elm$core$List$sortWith = _List_sortWith;
var $elm_community$list_extra$List$Extra$stableSortWith = F2(
	function (pred, list) {
		var predWithIndex = F2(
			function (_v1, _v2) {
				var a1 = _v1.a;
				var i1 = _v1.b;
				var a2 = _v2.a;
				var i2 = _v2.b;
				var result = A2(pred, a1, a2);
				if (result.$ === 'EQ') {
					return A2($elm$core$Basics$compare, i1, i2);
				} else {
					return result;
				}
			});
		var listWithIndex = A2(
			$elm$core$List$indexedMap,
			F2(
				function (i, a) {
					return _Utils_Tuple2(a, i);
				}),
			list);
		return A2(
			$elm$core$List$map,
			$elm$core$Tuple$first,
			A2($elm$core$List$sortWith, predWithIndex, listWithIndex));
	});
var $rtfeldman$elm_css$Svg$Styled$svg = $rtfeldman$elm_css$Svg$Styled$node('svg');
var $rtfeldman$elm_css$Css$tabularNums = {fontVariant: $rtfeldman$elm_css$Css$Structure$Compatible, fontVariantNumeric: $rtfeldman$elm_css$Css$Structure$Compatible, value: 'tabular-nums'};
var $elm$html$Html$text = $elm$virtual_dom$VirtualDom$text;
var $rtfeldman$elm_css$Svg$Styled$toUnstyled = $rtfeldman$elm_css$VirtualDom$Styled$toUnstyled;
var $rtfeldman$elm_css$Svg$Styled$Attributes$viewBox = $rtfeldman$elm_css$VirtualDom$Styled$attribute('viewBox');
var $author$project$SvgHelper$End = {$: 'End'};
var $author$project$Main$MouseEnter = {$: 'MouseEnter'};
var $author$project$Main$MouseLeave = {$: 'MouseLeave'};
var $author$project$SvgHelper$Start = {$: 'Start'};
var $author$project$SvgHelper$VisiblePainted = {$: 'VisiblePainted'};
var $author$project$SvgHelper$check = {
	h: 100,
	paths: _List_fromArray(
		['M0 54L18 36L37 58L81 6L100 22L37 93z']),
	w: 100
};
var $author$project$SvgHelper$Circle = function (a) {
	return {$: 'Circle', a: a};
};
var $author$project$SvgHelper$Element = F2(
	function (a, b) {
		return {$: 'Element', a: a, b: b};
	});
var $author$project$SvgHelper$noStyle = {activeFill: $elm$core$Maybe$Nothing, fill: $elm$core$Maybe$Nothing, hidden: false, hoverFill: $elm$core$Maybe$Nothing, id: $elm$core$Maybe$Nothing, layer: 0, onClick: $elm$core$Maybe$Nothing, onMouseEnter: $elm$core$Maybe$Nothing, onMouseLeave: $elm$core$Maybe$Nothing, pointerEvents: $elm$core$Maybe$Nothing, stroke: $elm$core$Maybe$Nothing, strokeDash: $elm$core$Maybe$Nothing, strokeDashoffset: $elm$core$Maybe$Nothing, strokeWidth: $elm$core$Maybe$Nothing};
var $author$project$SvgHelper$circle = function (xyr) {
	return A2(
		$author$project$SvgHelper$Element,
		$author$project$SvgHelper$Circle(xyr),
		$author$project$SvgHelper$noStyle);
};
var $author$project$SvgHelper$Complex = function (a) {
	return {$: 'Complex', a: a};
};
var $author$project$SvgHelper$complexCW = F2(
	function (s, _v0) {
		var x = _v0.x;
		var y = _v0.y;
		var w = _v0.w;
		var scale = w / s.w;
		return A2(
			$author$project$SvgHelper$Element,
			$author$project$SvgHelper$Complex(
				{h: s.h * scale, paths: s.paths, scale: scale, w: w, x: x - (w / 2), y: y - ((s.h / 2) * scale)}),
			$author$project$SvgHelper$noStyle);
	});
var $author$project$Main$dLeaderDash = _List_fromArray(
	[5, 5]);
var $author$project$Main$dLeaderWidth = 1;
var $author$project$Main$fBarNumber = 18;
var $author$project$SvgHelper$applyStyle = F4(
	function (get, set, s, e) {
		var shape = e.a;
		var style = e.b;
		var _v0 = get(style);
		if (_v0.$ === 'Just') {
			return e;
		} else {
			return A2(
				$author$project$SvgHelper$Element,
				shape,
				A2(
					set,
					$elm$core$Maybe$Just(s),
					style));
		}
	});
var $author$project$SvgHelper$fill = A2(
	$author$project$SvgHelper$applyStyle,
	function ($) {
		return $.fill;
	},
	F2(
		function (b, a) {
			return _Utils_update(
				a,
				{fill: b});
		}));
var $elm_community$basics_extra$Basics$Extra$flip = F3(
	function (f, b, a) {
		return A2(f, a, b);
	});
var $author$project$Main$filterElements = F3(
	function (show, units, f) {
		if (show.$ === 'ShowAll') {
			return A2($elm$core$List$concatMap, f, units);
		} else {
			var l = show.a;
			return A2(
				$elm$core$List$concatMap,
				f,
				A2(
					$elm$core$List$filter,
					A2($elm_community$basics_extra$Basics$Extra$flip, $elm$core$List$member, l),
					units));
		}
	});
var $author$project$Main$formatPayoff = $myrho$elm_round$Round$round(1);
var $author$project$SvgHelper$oppositeAnchor = function (_v0) {
	var x = _v0.x;
	var y = _v0.y;
	return {x: 1 - x, y: 1 - y};
};
var $author$project$SvgHelper$TAMiddle = {$: 'TAMiddle'};
var $author$project$SvgHelper$oppositeTextAnchor = function (a) {
	switch (a.$) {
		case 'Start':
			return $author$project$SvgHelper$End;
		case 'TAMiddle':
			return $author$project$SvgHelper$TAMiddle;
		default:
			return $author$project$SvgHelper$Start;
	}
};
var $author$project$Main$getLocals = function (p) {
	return _Utils_eq(p, $author$project$Main$Ptt) ? {hOpp: $author$project$Main$hCpr, hSlf: $author$project$Main$hPtt, tfA: $elm$core$Basics$identity, tfC: $author$project$Main$tfPtt, tfTA: $elm$core$Basics$identity} : {hOpp: $author$project$Main$hPtt, hSlf: $author$project$Main$hCpr, tfA: $author$project$SvgHelper$oppositeAnchor, tfC: $author$project$Main$tfCpr, tfTA: $author$project$SvgHelper$oppositeTextAnchor};
};
var $avh4$elm_color$Color$gray = A4($avh4$elm_color$Color$RgbaSpace, 211 / 255, 215 / 255, 207 / 255, 1.0);
var $author$project$Colors$grays = function (l) {
	switch (l) {
		case 0:
			return A3($avh4$elm_color$Color$rgb255, 0, 0, 0);
		case 1:
			return A3($avh4$elm_color$Color$rgb255, 13, 13, 13);
		case 2:
			return A3($avh4$elm_color$Color$rgb255, 26, 26, 26);
		case 3:
			return A3($avh4$elm_color$Color$rgb255, 38, 38, 38);
		case 4:
			return A3($avh4$elm_color$Color$rgb255, 51, 51, 51);
		case 5:
			return A3($avh4$elm_color$Color$rgb255, 64, 64, 64);
		case 6:
			return A3($avh4$elm_color$Color$rgb255, 76, 76, 76);
		case 7:
			return A3($avh4$elm_color$Color$rgb255, 89, 89, 89);
		case 8:
			return A3($avh4$elm_color$Color$rgb255, 102, 102, 102);
		case 9:
			return A3($avh4$elm_color$Color$rgb255, 115, 115, 115);
		case 10:
			return A3($avh4$elm_color$Color$rgb255, 128, 128, 128);
		case 11:
			return A3($avh4$elm_color$Color$rgb255, 140, 140, 140);
		case 12:
			return A3($avh4$elm_color$Color$rgb255, 153, 153, 153);
		case 13:
			return A3($avh4$elm_color$Color$rgb255, 166, 166, 166);
		case 14:
			return A3($avh4$elm_color$Color$rgb255, 178, 178, 178);
		case 15:
			return A3($avh4$elm_color$Color$rgb255, 191, 191, 191);
		case 16:
			return A3($avh4$elm_color$Color$rgb255, 204, 204, 204);
		case 17:
			return A3($avh4$elm_color$Color$rgb255, 217, 217, 217);
		case 18:
			return A3($avh4$elm_color$Color$rgb255, 230, 230, 230);
		case 19:
			return A3($avh4$elm_color$Color$rgb255, 242, 242, 242);
		case 20:
			return A3($avh4$elm_color$Color$rgb255, 255, 255, 255);
		default:
			return $avh4$elm_color$Color$gray;
	}
};
var $author$project$SvgHelper$id = A2(
	$author$project$SvgHelper$applyStyle,
	function ($) {
		return $.id;
	},
	F2(
		function (b, a) {
			return _Utils_update(
				a,
				{id: b});
		}));
var $author$project$Main$lBar = 12;
var $author$project$Main$lBarNumber = 8;
var $author$project$Main$lLeader = 10;
var $author$project$SvgHelper$Line = function (a) {
	return {$: 'Line', a: a};
};
var $author$project$SvgHelper$line = function (c) {
	return A2(
		$author$project$SvgHelper$Element,
		$author$project$SvgHelper$Line(c),
		$author$project$SvgHelper$noStyle);
};
var $author$project$SvgHelper$onLayer = F2(
	function (i, _v0) {
		var shape = _v0.a;
		var style = _v0.b;
		return A2(
			$author$project$SvgHelper$Element,
			shape,
			_Utils_update(
				style,
				{layer: i}));
	});
var $author$project$SvgHelper$onMouseEnter = A2(
	$author$project$SvgHelper$applyStyle,
	function ($) {
		return $.onMouseEnter;
	},
	F2(
		function (b, a) {
			return _Utils_update(
				a,
				{onMouseEnter: b});
		}));
var $author$project$SvgHelper$onMouseLeave = A2(
	$author$project$SvgHelper$applyStyle,
	function ($) {
		return $.onMouseLeave;
	},
	F2(
		function (b, a) {
			return _Utils_update(
				a,
				{onMouseLeave: b});
		}));
var $author$project$SvgHelper$pointerEvents = A2(
	$author$project$SvgHelper$applyStyle,
	function ($) {
		return $.pointerEvents;
	},
	F2(
		function (b, a) {
			return _Utils_update(
				a,
				{pointerEvents: b});
		}));
var $author$project$SvgHelper$QBezier = function (a) {
	return {$: 'QBezier', a: a};
};
var $author$project$SvgHelper$qBezier = function (c) {
	return A2(
		$author$project$SvgHelper$Element,
		$author$project$SvgHelper$QBezier(c),
		$author$project$SvgHelper$noStyle);
};
var $author$project$SvgHelper$Rect = function (a) {
	return {$: 'Rect', a: a};
};
var $author$project$SvgHelper$rect = function (_v0) {
	var x = _v0.x;
	var y = _v0.y;
	var w = _v0.w;
	var h = _v0.h;
	return A2(
		$author$project$SvgHelper$Element,
		$author$project$SvgHelper$Rect(
			{h: h, r: 0, w: w, x: x, y: y}),
		$author$project$SvgHelper$noStyle);
};
var $author$project$SvgHelper$rectA = F2(
	function (a, _v0) {
		var x = _v0.x;
		var y = _v0.y;
		var w = _v0.w;
		var h = _v0.h;
		return A2(
			$author$project$SvgHelper$Element,
			$author$project$SvgHelper$Rect(
				{h: h, r: 0, w: w, x: x - (a.x * w), y: y - (a.y * h)}),
			$author$project$SvgHelper$noStyle);
	});
var $author$project$SvgHelper$rectC = function (_v0) {
	var x = _v0.x;
	var y = _v0.y;
	var w = _v0.w;
	var h = _v0.h;
	return A2(
		$author$project$SvgHelper$Element,
		$author$project$SvgHelper$Rect(
			{h: h, r: 0, w: w, x: x - (w / 2), y: y - (h / 2)}),
		$author$project$SvgHelper$noStyle);
};
var $elm$core$Basics$cos = _Basics_cos;
var $elm$core$Basics$sin = _Basics_sin;
var $author$project$Main$rotatePoint = F2(
	function (deg, _v0) {
		var x = _v0.x;
		var y = _v0.y;
		var rad = $elm$core$Basics$degrees(deg);
		return {
			x: (x * $elm$core$Basics$cos(rad)) - (y * $elm$core$Basics$sin(rad)),
			y: (x * $elm$core$Basics$sin(rad)) + (y * $elm$core$Basics$cos(rad))
		};
	});
var $avh4$elm_color$Color$fromRgba = function (components) {
	return A4($avh4$elm_color$Color$RgbaSpace, components.red, components.green, components.blue, components.alpha);
};
var $author$project$Colors$setAlpha = F2(
	function (a, c) {
		var rgba = $avh4$elm_color$Color$toRgba(c);
		return $avh4$elm_color$Color$fromRgba(
			_Utils_update(
				rgba,
				{alpha: a}));
	});
var $author$project$SvgHelper$south = {x: 0.5, y: 1};
var $author$project$SvgHelper$strokeColor = A2(
	$author$project$SvgHelper$applyStyle,
	function ($) {
		return $.stroke;
	},
	F2(
		function (b, a) {
			return _Utils_update(
				a,
				{stroke: b});
		}));
var $author$project$SvgHelper$strokeWidth = A2(
	$author$project$SvgHelper$applyStyle,
	function ($) {
		return $.strokeWidth;
	},
	F2(
		function (b, a) {
			return _Utils_update(
				a,
				{strokeWidth: b});
		}));
var $author$project$SvgHelper$stroke = F2(
	function (c, w) {
		return A2(
			$elm$core$Basics$composeR,
			$author$project$SvgHelper$strokeColor(c),
			$author$project$SvgHelper$strokeWidth(w));
	});
var $author$project$SvgHelper$strokeDash = A2(
	$author$project$SvgHelper$applyStyle,
	function ($) {
		return $.strokeDash;
	},
	F2(
		function (b, a) {
			return _Utils_update(
				a,
				{strokeDash: b});
		}));
var $author$project$SvgHelper$TBMiddle = {$: 'TBMiddle'};
var $author$project$SvgHelper$Text = function (a) {
	return {$: 'Text', a: a};
};
var $author$project$SvgHelper$textA = F3(
	function (t, a, _v0) {
		var x = _v0.x;
		var y = _v0.y;
		var size = _v0.size;
		return A2(
			$author$project$SvgHelper$Element,
			$author$project$SvgHelper$Text(
				{anchor: a, baseline: $author$project$SvgHelper$TBMiddle, size: size, text: t, x: x, y: y}),
			$author$project$SvgHelper$noStyle);
	});
var $author$project$SvgHelper$textC = F2(
	function (t, _v0) {
		var x = _v0.x;
		var y = _v0.y;
		var size = _v0.size;
		return A2(
			$author$project$SvgHelper$Element,
			$author$project$SvgHelper$Text(
				{anchor: $author$project$SvgHelper$TAMiddle, baseline: $author$project$SvgHelper$TBMiddle, size: size, text: t, x: x, y: y}),
			$author$project$SvgHelper$noStyle);
	});
var $author$project$Main$tfParabola = F2(
	function (_v0, c) {
		var x = _v0.x;
		var y = _v0.y;
		return {
			cx: x(c.cx),
			cy: y(c.cy),
			x1: x(c.x1),
			x2: x(c.x2),
			y1: y(c.y1),
			y2: y(c.y2)
		};
	});
var $author$project$SvgHelper$activeFill = A2(
	$author$project$SvgHelper$applyStyle,
	function ($) {
		return $.activeFill;
	},
	F2(
		function (b, a) {
			return _Utils_update(
				a,
				{activeFill: b});
		}));
var $avh4$elm_color$Color$black = A4($avh4$elm_color$Color$RgbaSpace, 0 / 255, 0 / 255, 0 / 255, 1.0);
var $author$project$SvgHelper$hoverFill = A2(
	$author$project$SvgHelper$applyStyle,
	function ($) {
		return $.hoverFill;
	},
	F2(
		function (b, a) {
			return _Utils_update(
				a,
				{hoverFill: b});
		}));
var $author$project$SvgHelper$onClick = A2(
	$author$project$SvgHelper$applyStyle,
	function ($) {
		return $.onClick;
	},
	F2(
		function (b, a) {
			return _Utils_update(
				a,
				{onClick: b});
		}));
var $avh4$elm_color$Color$white = A4($avh4$elm_color$Color$RgbaSpace, 255 / 255, 255 / 255, 255 / 255, 1.0);
var $author$project$Main$viewButton = function (c) {
	return _List_fromArray(
		[
			A3(
			$elm$core$Maybe$withDefault,
			$elm$core$Basics$identity,
			A2($elm$core$Maybe$map, $author$project$SvgHelper$id, c.id),
			A2(
				$author$project$SvgHelper$onClick,
				c.clickMsg,
				A2(
					$author$project$SvgHelper$pointerEvents,
					$author$project$SvgHelper$VisiblePainted,
					A2(
						$author$project$SvgHelper$activeFill,
						$author$project$Colors$grays(16),
						A2(
							$author$project$SvgHelper$hoverFill,
							$author$project$Colors$grays(18),
							A3(
								$author$project$SvgHelper$stroke,
								$avh4$elm_color$Color$black,
								2,
								A2(
									$author$project$SvgHelper$fill,
									$avh4$elm_color$Color$white,
									$author$project$SvgHelper$rectC(
										{h: c.h, w: c.w, x: c.x, y: c.y})))))))),
			A2(
			$author$project$SvgHelper$textC,
			c.text,
			{size: 24, x: c.x, y: c.y})
		]);
};
var $author$project$SvgHelper$user = {
	h: 100,
	paths: _List_fromArray(
		['M49.4,48.2c6.6,0,12.3-2.4,17-7.1c4.7-4.7,7.1-10.4,7.1-17c0-6.6-2.4-12.3-7.1-17C61.7,2.4,56,0,49.4,0' + 'c-6.6,0-12.3,2.4-17,7.1s-7.1,10.4-7.1,17c0,6.6,2.4,12.3,7.1,17C37,45.8,42.8,48.2,49.4,48.2z', 'M91.5,76.9c-0.1-1.9-0.4-4.1-0.8-6.3c-0.4-2.3-0.9-4.4-1.6-6.4c-0.6-2-1.5-4-2.6-5.9c-1.1-2-2.5-3.7-3.9-5.1' + ('c-1.6-1.5-3.5-2.7-5.7-3.6c-2.2-0.9-4.6-1.3-7.2-1.3c-1,0-2,0.4-3.9,1.7c-1.2,0.8-2.5,1.7-4.1,2.6c-1.3,0.8-3.1,1.6-5.3,2.3' + ('c-2.1,0.7-4.3,1-6.5,1s-4.3-0.4-6.5-1c-2.2-0.7-4-1.5-5.3-2.3c-1.5-1-2.9-1.9-4.1-2.6c-1.9-1.2-2.9-1.7-3.9-1.7' + ('c-2.6,0-5,0.4-7.2,1.3c-2.2,0.9-4.1,2.1-5.7,3.6c-1.5,1.4-2.8,3.1-3.9,5.1c-1.1,1.9-2,3.9-2.6,5.9c-0.6,2-1.1,4.1-1.6,6.4' + ('c-0.4,2.2-0.7,4.4-0.8,6.3c-0.1,1.9-0.2,3.9-0.2,5.9c0,5.2,1.7,9.4,4.9,12.6c3.2,3.1,7.5,4.6,12.7,4.6h48.2c5.2,0,9.5-1.6,12.7-4.6' + 'c3.3-3.1,4.9-7.3,4.9-12.6C91.7,80.8,91.6,78.8,91.5,76.9z'))))]),
	w: 100
};
var $author$project$Main$viewIcon = function (_v0) {
	var x = _v0.x;
	var y = _v0.y;
	var hue = _v0.hue;
	return A2(
		$author$project$SvgHelper$fill,
		hue(13),
		A2(
			$author$project$SvgHelper$complexCW,
			$author$project$SvgHelper$user,
			{w: 75, x: x, y: y}));
};
var $author$project$SvgHelper$rRectC = function (_v0) {
	var x = _v0.x;
	var y = _v0.y;
	var w = _v0.w;
	var h = _v0.h;
	var r = _v0.r;
	return A2(
		$author$project$SvgHelper$Element,
		$author$project$SvgHelper$Rect(
			{h: h, r: r, w: w, x: x - (w / 2), y: y - (h / 2)}),
		$author$project$SvgHelper$noStyle);
};
var $author$project$Main$viewMovingBarNumber = function (c) {
	var scale = 1 + (c.v / 10);
	var r = 5;
	return _List_fromArray(
		[
			A2(
			$author$project$SvgHelper$fill,
			$avh4$elm_color$Color$white,
			$author$project$SvgHelper$rRectC(
				{h: ($author$project$Main$fBarNumber + (r * 2)) * scale, r: r * scale, w: (c.w + (r * 2)) * scale, x: c.x, y: c.y})),
			A2(
			$author$project$SvgHelper$fill,
			c.hue($author$project$Main$lBarNumber),
			A2(
				$author$project$SvgHelper$textC,
				$author$project$Main$formatPayoff(c.payoff * $author$project$Main$payoffScale),
				{size: $author$project$Main$fBarNumber * scale, x: c.x, y: c.y}))
		]);
};
var $author$project$Main$viewTotal = function (c) {
	return _List_fromArray(
		[
			A3(
			$elm$core$Maybe$withDefault,
			$elm$core$Basics$identity,
			A2($elm$core$Maybe$map, $author$project$SvgHelper$id, c.id),
			A2(
				$author$project$SvgHelper$fill,
				c.hue(18),
				A3(
					$author$project$SvgHelper$stroke,
					c.hue(10),
					4,
					$author$project$SvgHelper$rRectC(
						{h: 60, r: 20, w: 100, x: c.x, y: c.y})))),
			A2(
			$author$project$SvgHelper$fill,
			c.hue(8),
			A2(
				$author$project$SvgHelper$textC,
				c.text,
				{size: 24, x: c.x, y: c.y}))
		]);
};
var $author$project$SvgHelper$west = {x: 0, y: 0.5};
var $author$project$Main$viewGame = F2(
	function (p, game) {
		var predictionThumb = function () {
			var _v8 = game.prediction;
			if (_v8.$ === 'Nothing') {
				return _List_Nil;
			} else {
				var lambda = _v8.a;
				var payoffs = A2($author$project$Main$calcPayoffs, p.boardConfig, lambda);
				var cSliderY = $author$project$Main$tfCpr.y(payoffs.opp);
				var cSliderX = $author$project$Main$tfCpr.x(payoffs.slf);
				return _List_fromArray(
					[
						A2(
						$author$project$SvgHelper$fill,
						A2(
							$author$project$Colors$setAlpha,
							0.5,
							$author$project$Main$hPtt(17)),
						A3(
							$author$project$SvgHelper$stroke,
							$author$project$Main$hPtt(10),
							2,
							$author$project$SvgHelper$circle(
								{r: 7.5, x: cSliderX, y: cSliderY})))
					]);
			}
		}();
		var memoryLabel = _Utils_eq(game.stage, $author$project$Main$Memory) ? _List_fromArray(
			[
				A2(
				$author$project$SvgHelper$textC,
				'Memory check',
				{size: 20, x: 150, y: 150})
			]) : _List_Nil;
		var highlightBoard = $author$project$Main$isActiveStage(game.stage) && A2(
			$elm$core$List$member,
			game.mouseStatus,
			_List_fromArray(
				[$author$project$Main$UpIn, $author$project$Main$DownIn]));
		var sliderStrokeWidth = highlightBoard ? 4 : 2;
		var background = A2(
			$author$project$SvgHelper$onLayer,
			-1,
			A2(
				$author$project$SvgHelper$fill,
				A3($avh4$elm_color$Color$rgb255, 250, 250, 250),
				$author$project$SvgHelper$rect(
					{h: $author$project$Main$dFullHeight, w: $author$project$Main$dFullWidth, x: 0, y: 0})));
		var _v0 = $author$project$Main$getLocals(p.player);
		var hSlf = _v0.hSlf;
		var hOpp = _v0.hOpp;
		var tfC = _v0.tfC;
		var tfA = _v0.tfA;
		var tfTA = _v0.tfTA;
		var hOppPayoff = function () {
			var _v7 = p.oppReceiver;
			switch (_v7.$) {
				case 'Opp':
					return hOpp;
				case 'Slf':
					return hSlf;
				default:
					return $author$project$Colors$grays;
			}
		}();
		var _v1 = function () {
			var _v2 = game.lambda;
			if (_v2.$ === 'Nothing') {
				return {confirmButton: _List_Nil, oppPay: _List_Nil, othersLambda: _List_Nil, slfPay: _List_Nil};
			} else {
				var lambda = _v2.a;
				var payoffs = A2($author$project$Main$calcPayoffs, p.boardConfig, lambda);
				var slfMovingBarNumber = function () {
					var _v5 = game.slfAnimationState;
					if (_v5.$ === 'Nothing') {
						return _List_Nil;
					} else {
						var x = _v5.a.x;
						var y = _v5.a.y;
						var v = _v5.a.v;
						var slfBarNumberLength = A2(
							$elm$core$Maybe$withDefault,
							0,
							A2($elm$core$Dict$get, $author$project$Main$slfBarNumberId, game.textLengths));
						return $author$project$Main$viewMovingBarNumber(
							{hue: hSlf, payoff: payoffs.slf, v: v, w: slfBarNumberLength, x: x, y: y});
					}
				}();
				var oppMovingBarNumber = function () {
					var _v4 = game.oppAnimationState;
					if (_v4.$ === 'Nothing') {
						return _List_Nil;
					} else {
						var x = _v4.a.x;
						var y = _v4.a.y;
						var v = _v4.a.v;
						var oppBarNumberLength = A2(
							$elm$core$Maybe$withDefault,
							0,
							A2($elm$core$Dict$get, $author$project$Main$oppBarNumberId, game.textLengths));
						return $author$project$Main$viewMovingBarNumber(
							{hue: hOppPayoff, payoff: payoffs.opp, v: v, w: oppBarNumberLength, x: x, y: y});
					}
				}();
				var cSliderY = tfC.y(payoffs.opp);
				var cSliderX = tfC.x(payoffs.slf);
				var thumb = A2(
					$author$project$SvgHelper$id,
					$author$project$Main$thumbId,
					A2(
						$author$project$SvgHelper$fill,
						hSlf(17),
						A3(
							$author$project$SvgHelper$stroke,
							hSlf(10),
							sliderStrokeWidth,
							$author$project$SvgHelper$circle(
								{r: 7.5, x: cSliderX, y: cSliderY}))));
				var button = function () {
					var _v3 = game.stage;
					switch (_v3.$) {
						case 'Act':
							return $author$project$Main$viewButton(
								{
									clickMsg: $author$project$Main$GoTo($author$project$Main$PostAct),
									h: 50,
									id: $elm$core$Maybe$Just($author$project$Main$confirmButtonId),
									text: 'Confirm',
									w: 120,
									x: $author$project$Main$cCenterX + 140,
									y: $author$project$Main$tfPtt.y($author$project$Main$clIconY)
								});
						case 'Review':
							return $author$project$Main$viewButton(
								{
									clickMsg: $author$project$Main$GoTo(
										p.memory ? $author$project$Main$Memory : $author$project$Main$Act),
									h: 50,
									id: $elm$core$Maybe$Nothing,
									text: 'Next round',
									w: 140,
									x: $author$project$Main$cCenterX + 140,
									y: $author$project$Main$tfPtt.y($author$project$Main$clIconY)
								});
						case 'Memory':
							return $author$project$Main$viewButton(
								{
									clickMsg: $author$project$Main$GoTo($author$project$Main$Act),
									h: 50,
									id: $elm$core$Maybe$Nothing,
									text: 'Next round',
									w: 140,
									x: $author$project$Main$cCenterX + 140,
									y: $author$project$Main$tfPtt.y($author$project$Main$clIconY)
								});
						default:
							return _List_Nil;
					}
				}();
				return {
					confirmButton: button,
					oppPay: _List_fromArray(
						[
							A2(
							$author$project$SvgHelper$strokeDash,
							$author$project$Main$dLeaderDash,
							A3(
								$author$project$SvgHelper$stroke,
								hOppPayoff($author$project$Main$lLeader),
								$author$project$Main$dLeaderWidth,
								$author$project$SvgHelper$line(
									{
										arrow: $elm$core$Maybe$Nothing,
										x1: cSliderX,
										x2: tfC.x($author$project$Main$clOppBarX + ($author$project$Main$dlBarWidth / 2)),
										y1: cSliderY,
										y2: cSliderY
									}))),
							A2(
							$author$project$SvgHelper$fill,
							hOppPayoff($author$project$Main$lBar),
							A2(
								$author$project$SvgHelper$rectA,
								tfA($author$project$SvgHelper$south),
								{
									h: payoffs.opp * $author$project$Main$dBoardSize,
									w: $author$project$Main$dlBarWidth * $author$project$Main$dBoardSize,
									x: tfC.x($author$project$Main$clOppBarX),
									y: tfC.y(0)
								})),
							A2(
							$author$project$SvgHelper$fill,
							hOppPayoff($author$project$Main$lBarNumber),
							A2(
								$author$project$SvgHelper$id,
								$author$project$Main$oppBarNumberId,
								A3(
									$author$project$SvgHelper$textA,
									$author$project$Main$formatPayoff(payoffs.opp * $author$project$Main$payoffScale),
									tfTA($author$project$SvgHelper$End),
									{
										size: $author$project$Main$fBarNumber,
										x: tfC.x($author$project$Main$clOppBarX + ($author$project$Main$dlBarWidth / 2)),
										y: tfC.y(payoffs.opp + $author$project$Main$dlBarNumberVSep)
									})))
						]),
					othersLambda: $elm$core$List$concat(
						_List_fromArray(
							[
								_List_fromArray(
								[thumb]),
								slfMovingBarNumber,
								oppMovingBarNumber
							])),
					slfPay: _List_fromArray(
						[
							A2(
							$author$project$SvgHelper$strokeDash,
							$author$project$Main$dLeaderDash,
							A3(
								$author$project$SvgHelper$stroke,
								hSlf($author$project$Main$lLeader),
								$author$project$Main$dLeaderWidth,
								$author$project$SvgHelper$line(
									{
										arrow: $elm$core$Maybe$Nothing,
										x1: cSliderX,
										x2: cSliderX,
										y1: cSliderY,
										y2: tfC.y($author$project$Main$clSlfBarY + ($author$project$Main$dlBarWidth / 2))
									}))),
							A2(
							$author$project$SvgHelper$fill,
							hSlf($author$project$Main$lBar),
							A2(
								$author$project$SvgHelper$rectA,
								tfA($author$project$SvgHelper$west),
								{
									h: $author$project$Main$dlBarWidth * $author$project$Main$dBoardSize,
									w: payoffs.slf * $author$project$Main$dBoardSize,
									x: tfC.x(0),
									y: tfC.y($author$project$Main$clSlfBarY)
								})),
							A2(
							$author$project$SvgHelper$fill,
							hSlf($author$project$Main$lBarNumber),
							A2(
								$author$project$SvgHelper$id,
								$author$project$Main$slfBarNumberId,
								A3(
									$author$project$SvgHelper$textA,
									$author$project$Main$formatPayoff(payoffs.slf * $author$project$Main$payoffScale),
									tfTA($author$project$SvgHelper$Start),
									{
										size: $author$project$Main$fBarNumber,
										x: tfC.x(payoffs.slf + $author$project$Main$dlBarNumberHSep),
										y: tfC.y($author$project$Main$clSlfBarY)
									})))
						])
				};
			}
		}();
		var slfPay = _v1.slfPay;
		var oppPay = _v1.oppPay;
		var confirmButton = _v1.confirmButton;
		var othersLambda = _v1.othersLambda;
		var getElement = function (unit) {
			switch (unit.$) {
				case 'GUBoard':
					return _List_fromArray(
						[
							A2(
							$author$project$SvgHelper$pointerEvents,
							$author$project$SvgHelper$VisiblePainted,
							A2(
								$author$project$SvgHelper$onMouseLeave,
								$author$project$Main$MouseLeave,
								A2(
									$author$project$SvgHelper$onMouseEnter,
									$author$project$Main$MouseEnter,
									A2(
										$author$project$SvgHelper$id,
										'board',
										A2(
											$author$project$SvgHelper$fill,
											hSlf(19),
											$author$project$SvgHelper$rectC(
												{h: $author$project$Main$dBoardSize, w: $author$project$Main$dBoardSize, x: $author$project$Main$cCenterX, y: $author$project$Main$cCenterY}))))))
						]);
				case 'GUPttIcon':
					return _List_fromArray(
						[
							A2(
							$author$project$SvgHelper$id,
							$author$project$Main$pttIconId,
							$author$project$Main$viewIcon(
								{
									hue: $author$project$Main$hPtt,
									x: $author$project$Main$tfPtt.x(0.5),
									y: $author$project$Main$tfPtt.y($author$project$Main$clIconY)
								}))
						]);
				case 'GUCprIcon':
					return _List_fromArray(
						[
							A2(
							$author$project$SvgHelper$id,
							$author$project$Main$cprIconId,
							$author$project$Main$viewIcon(
								{
									hue: $author$project$Main$hCpr,
									x: $author$project$Main$tfCpr.x(0.5),
									y: $author$project$Main$tfCpr.y($author$project$Main$clIconY)
								}))
						]);
				case 'GUPttTotal':
					return $author$project$Main$viewTotal(
						{
							hue: $author$project$Main$hPtt,
							id: $elm$core$Maybe$Just($author$project$Main$pttTotalId),
							text: $author$project$Main$formatPayoff(game.pttTotal),
							x: $author$project$Main$tfPtt.x($author$project$Main$clTotalX),
							y: $author$project$Main$tfPtt.y($author$project$Main$clIconY)
						});
				case 'GUCprTotal':
					return $author$project$Main$viewTotal(
						{
							hue: $author$project$Main$hCpr,
							id: $elm$core$Maybe$Nothing,
							text: '****',
							x: $author$project$Main$tfCpr.x($author$project$Main$clTotalX),
							y: $author$project$Main$tfCpr.y($author$project$Main$clIconY)
						});
				case 'GUSlfPay':
					return slfPay;
				case 'GUOppPay':
					return oppPay;
				case 'GUSlider':
					return _List_fromArray(
						[
							A2(
							$author$project$SvgHelper$id,
							$author$project$Main$sliderId,
							A3(
								$author$project$SvgHelper$stroke,
								hSlf(10),
								sliderStrokeWidth,
								$author$project$SvgHelper$qBezier(
									A2(
										$author$project$Main$tfParabola,
										tfC,
										$author$project$Main$calcParabola(p.boardConfig)))))
						]);
				case 'GUConfirmButton':
					return confirmButton;
				case 'GUCprStatus':
					var y = $author$project$Main$tfCpr.y($author$project$Main$clIconY);
					var x = $author$project$Main$cCenterX - 80;
					return game.cprActed ? _List_fromArray(
						[
							A2(
							$author$project$SvgHelper$fill,
							$author$project$Main$hCpr(10),
							A2(
								$author$project$SvgHelper$complexCW,
								$author$project$SvgHelper$check,
								{w: 40, x: x, y: y}))
						]) : A2(
						$elm$core$List$map,
						function (i) {
							var shift = A2(
								$author$project$Main$rotatePoint,
								45 * (game.loadingStep + i),
								{x: 0, y: 20});
							return A2(
								$author$project$SvgHelper$fill,
								$author$project$Main$hCpr(18 - i),
								$author$project$SvgHelper$circle(
									{r: 2.5 + (i * 0.25), x: x + shift.x, y: y + shift.y}));
						},
						A2($elm$core$List$range, 0, 7));
				default:
					return $elm$core$List$concat(
						_List_fromArray(
							[
								_List_fromArray(
								[background]),
								predictionThumb,
								memoryLabel,
								othersLambda
							]));
			}
		};
		return A3(
			$author$project$Main$filterElements,
			p.show,
			_List_fromArray(
				[$author$project$Main$GUBoard, $author$project$Main$GUPttIcon, $author$project$Main$GUCprIcon, $author$project$Main$GUPttTotal, $author$project$Main$GUCprTotal, $author$project$Main$GUSlfPay, $author$project$Main$GUOppPay, $author$project$Main$GUSlider, $author$project$Main$GUConfirmButton, $author$project$Main$GUCprStatus, $author$project$Main$GUOthers]),
			getElement);
	});
var $author$project$Main$viewRoundCounter = function (c) {
	var y = 80;
	var x = 150;
	var offset = 15;
	var _v0 = _Utils_eq(c.player, $author$project$Main$Ptt) ? _Utils_Tuple2('Your turn', $author$project$Main$hPtt) : _Utils_Tuple2('Their turn', $author$project$Main$hCpr);
	var roleText = _v0.a;
	var roleHue = _v0.b;
	return _List_fromArray(
		[
			A3(
			$author$project$SvgHelper$stroke,
			$author$project$Colors$grays(5),
			2,
			A2(
				$author$project$SvgHelper$fill,
				$avh4$elm_color$Color$white,
				$author$project$SvgHelper$rRectC(
					{h: 80, r: 10, w: 150, x: x, y: y}))),
			A2(
			$author$project$SvgHelper$fill,
			$author$project$Colors$grays(5),
			A2(
				$author$project$SvgHelper$textC,
				'Round ' + ($elm$core$String$fromInt(c.round) + ('/' + $elm$core$String$fromInt(c.totalRounds))),
				{size: 24, x: x, y: y - offset})),
			A2(
			$author$project$SvgHelper$fill,
			roleHue(10),
			A2(
				$author$project$SvgHelper$textC,
				roleText,
				{size: 24, x: x, y: y + offset}))
		]);
};
var $author$project$Main$NextStep = {$: 'NextStep'};
var $author$project$Main$PrevStep = {$: 'PrevStep'};
var $author$project$SvgHelper$hide = function (_v0) {
	var shape = _v0.a;
	var style = _v0.b;
	return A2(
		$author$project$SvgHelper$Element,
		shape,
		_Utils_update(
			style,
			{hidden: true}));
};
var $author$project$Main$buildMessage = function (c) {
	var margin = 10;
	var lines = A2($elm$core$String$split, '\n', c.text);
	var n = $elm$core$List$length(lines);
	var lineSkip = 10;
	var fullW = A2(
		$elm$core$Maybe$map,
		function (l) {
			return l + (margin * 2);
		},
		c.instrLength);
	var fontSize = 20;
	var fullH = ((n * fontSize) + ((n - 1) * lineSkip)) + (margin * 2);
	var centerY = c.y - (fullH * (c.anchor.y - 0.5));
	var centerX = A2(
		$elm$core$Maybe$withDefault,
		c.x,
		A2(
			$elm$core$Maybe$map,
			function (w) {
				return c.x - (w * (c.anchor.x - 0.5));
			},
			fullW));
	var drawLine = F2(
		function (i, l) {
			return (_Utils_eq(c.instrLength, $elm$core$Maybe$Nothing) ? $author$project$SvgHelper$hide : $elm$core$Basics$identity)(
				A2(
					$author$project$SvgHelper$onLayer,
					1,
					A2(
						$author$project$SvgHelper$id,
						A2(
							$author$project$Main$buildMultilineId,
							A2($author$project$Main$buildMultilineId, $author$project$Main$instrId, c.step),
							i + 1),
						A2(
							$author$project$SvgHelper$textC,
							l,
							{size: fontSize, x: centerX, y: centerY + ((((-(n - 1)) / 2) + i) * (fontSize + lineSkip))}))));
		});
	var bg = A2(
		$elm$core$Maybe$map,
		function (w) {
			return A2(
				$author$project$SvgHelper$onLayer,
				1,
				A2(
					$author$project$SvgHelper$fill,
					$avh4$elm_color$Color$white,
					A3(
						$author$project$SvgHelper$stroke,
						$avh4$elm_color$Color$black,
						3,
						$author$project$SvgHelper$rectC(
							{h: fullH, w: w, x: centerX, y: centerY}))));
		},
		fullW);
	return A2(
		$elm$core$List$append,
		$author$project$Utils$maybeToList(bg),
		A2($elm$core$List$indexedMap, drawLine, lines));
};
var $author$project$SvgHelper$getAnchorPos = F2(
	function (s, a) {
		switch (s.$) {
			case 'Rect':
				var r = s.a;
				return {x: r.x + (a.x * r.w), y: r.y + (a.y * r.h)};
			case 'Circle':
				var c = s.a;
				var y = a.y - 0.5;
				var x = a.x - 0.5;
				var r = A2($author$project$SvgHelper$vectorLength, x, y);
				return {x: c.x + ((x / r) * c.r), y: c.y + ((y / r) * c.r)};
			case 'Line':
				var l = s.a;
				return {x: l.x1 + (a.x * (l.x2 - l.x1)), y: l.y1 + (a.x * (l.y2 - l.y1))};
			case 'QBezier':
				var q = s.a;
				var t = a.x;
				return {
					x: ((A2($elm$core$Basics$pow, 1 - t, 2) * q.x1) + (((2 * (1 - t)) * t) * q.cx)) + (A2($elm$core$Basics$pow, t, 2) * q.x2),
					y: ((A2($elm$core$Basics$pow, 1 - t, 2) * q.y1) + (((2 * (1 - t)) * t) * q.cy)) + (A2($elm$core$Basics$pow, t, 2) * q.y2)
				};
			case 'Complex':
				var c = s.a;
				return {x: c.x + (a.x * c.w), y: c.y + (a.y * c.h)};
			default:
				return {x: 0, y: 0};
		}
	});
var $author$project$SvgHelper$textAnchorToOffset = function (a) {
	switch (a.$) {
		case 'Start':
			return 0;
		case 'TAMiddle':
			return 0.5;
		default:
			return 1;
	}
};
var $author$project$SvgHelper$getTextAnchorPos = F3(
	function (t, w, a) {
		return {
			x: t.x + ((a.x - $author$project$SvgHelper$textAnchorToOffset(t.anchor)) * w),
			y: t.y + ((a.y - $author$project$SvgHelper$textBaselineToOffset(t.baseline)) * t.size)
		};
	});
var $author$project$Main$addCallout = F5(
	function (c, step, instrLength, textLengths, _v0) {
		var shape = _v0.a;
		var target = function () {
			var textLength = A2(
				$elm$core$Maybe$withDefault,
				0,
				A2($elm$core$Dict$get, c.target, textLengths));
			if (shape.$ === 'Text') {
				var t = shape.a;
				return A3($author$project$SvgHelper$getTextAnchorPos, t, textLength, c.targetAnchor);
			} else {
				var s = shape;
				return A2($author$project$SvgHelper$getAnchorPos, s, c.targetAnchor);
			}
		}();
		var arrowLength = 50;
		var arrowDir = function () {
			var y = c.instrAnchor.y - 0.5;
			var x = c.instrAnchor.x - 0.5;
			var r = A2($author$project$SvgHelper$vectorLength, x, y);
			return {x: x / r, y: y / r};
		}();
		var arrowEndX = target.x - (c.sep * arrowDir.x);
		var arrowEndY = target.y - (c.sep * arrowDir.y);
		var arrowStartX = arrowEndX - (arrowLength * arrowDir.x);
		var arrowStartY = arrowEndY - (arrowLength * arrowDir.y);
		return A2(
			$elm$core$List$cons,
			A3(
				$author$project$SvgHelper$stroke,
				$avh4$elm_color$Color$black,
				3,
				$author$project$SvgHelper$line(
					{
						arrow: $elm$core$Maybe$Just(5),
						x1: arrowStartX,
						x2: arrowEndX,
						y1: arrowStartY,
						y2: arrowEndY
					})),
			$author$project$Main$buildMessage(
				{anchor: c.instrAnchor, instrLength: instrLength, step: step, text: c.text, x: arrowStartX, y: arrowStartY}));
	});
var $elm_community$list_extra$List$Extra$find = F2(
	function (predicate, list) {
		find:
		while (true) {
			if (!list.b) {
				return $elm$core$Maybe$Nothing;
			} else {
				var first = list.a;
				var rest = list.b;
				if (predicate(first)) {
					return $elm$core$Maybe$Just(first);
				} else {
					var $temp$predicate = predicate,
						$temp$list = rest;
					predicate = $temp$predicate;
					list = $temp$list;
					continue find;
				}
			}
		}
	});
var $author$project$Main$addElements = F3(
	function (id, f, l) {
		var me = A2(
			$elm_community$list_extra$List$Extra$find,
			function (_v1) {
				var style = _v1.b;
				return _Utils_eq(
					style.id,
					$elm$core$Maybe$Just(id));
			},
			l);
		if (me.$ === 'Nothing') {
			return l;
		} else {
			var e = me.a;
			return _Utils_ap(
				l,
				f(e));
		}
	});
var $author$project$Main$addInstr = F4(
	function (m, step, instrLength, textLengths) {
		if (m.$ === 'StaticInstr') {
			var c = m.a;
			return function (l) {
				return $elm$core$List$concat(
					_List_fromArray(
						[
							l,
							c.dim ? _List_fromArray(
							[
								A2(
								$author$project$SvgHelper$onLayer,
								1,
								A2(
									$author$project$SvgHelper$fill,
									A2($author$project$Colors$setAlpha, 0.5, $avh4$elm_color$Color$white),
									$author$project$SvgHelper$rect(
										{h: $author$project$Main$dFullHeight, w: $author$project$Main$dFullWidth, x: 0, y: 0})))
							]) : _List_Nil,
							$author$project$Main$buildMessage(
							{anchor: c.anchor, instrLength: instrLength, step: step, text: c.text, x: c.x, y: c.y})
						]));
			};
		} else {
			var c = m.a;
			return A2(
				$author$project$Main$addElements,
				c.target,
				A4($author$project$Main$addCallout, c, step, instrLength, textLengths));
		}
	});
var $author$project$Main$viewTtrl = function (ttrl) {
	var step = A2($elm$core$Array$get, ttrl.step - 1, $author$project$Main$ttrlSteps);
	var _v0 = ttrl.readyForNext ? _Utils_Tuple2(
		$author$project$Main$viewButton(
			{
				clickMsg: $author$project$Main$PrevStep,
				h: 50,
				id: $elm$core$Maybe$Just($author$project$Main$prevButtonId),
				text: 'Previous',
				w: 120,
				x: $author$project$Main$cCenterX + 140,
				y: $author$project$Main$tfPtt.y($author$project$Main$clIconY)
			}),
		$author$project$Main$viewButton(
			{
				clickMsg: $author$project$Main$NextStep,
				h: 50,
				id: $elm$core$Maybe$Nothing,
				text: 'Next',
				w: 120,
				x: $author$project$Main$cCenterX + 270,
				y: $author$project$Main$tfPtt.y($author$project$Main$clIconY)
			})) : _Utils_Tuple2(_List_Nil, _List_Nil);
	var prevButton = _v0.a;
	var nextButton = _v0.b;
	return A3(
		$elm$core$Maybe$withDefault,
		$elm$core$Basics$identity,
		A2(
			$elm$core$Maybe$map,
			function (s) {
				return A4($author$project$Main$addInstr, s.instr, ttrl.step, ttrl.instrLength, ttrl.game.textLengths);
			},
			step),
		$elm$core$List$concat(
			_List_fromArray(
				[
					A2(
					$author$project$Main$viewGame,
					$author$project$Main$ttrlGameProps(ttrl),
					ttrl.game),
					prevButton,
					nextButton
				])));
};
var $author$project$Main$view = function (m) {
	return {
		body: function () {
			var elements = function () {
				if (m.$ === 'Ttrl') {
					var t = m.a;
					return $author$project$Main$viewTtrl(t);
				} else {
					var t = m.a;
					return t.showTtrl ? $author$project$Main$viewTtrl(t.ttrl) : A2(
						$elm$core$List$append,
						A2(
							$author$project$Main$viewGame,
							$author$project$Main$testGameProps(t),
							t.game),
						$author$project$Main$viewRoundCounter(
							{
								player: $author$project$Main$roundToPlayer(t.round),
								round: t.round,
								totalRounds: $author$project$Main$nTestRounds
							}));
				}
			}();
			return _List_fromArray(
				[
					$author$project$Css$ModernNormalize$globalHtml,
					A2(
					$elm$html$Html$div,
					_List_Nil,
					_List_fromArray(
						[
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Events$onClick($author$project$Main$SaveState)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Save state')
								])),
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Events$onClick($author$project$Main$LoadState)
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Load state')
								]))
						])),
					A3(
					$elm$core$Basics$composeL,
					A2(
						$elm$core$Basics$composeL,
						$rtfeldman$elm_css$Svg$Styled$toUnstyled,
						$rtfeldman$elm_css$Svg$Styled$svg(
							_List_fromArray(
								[
									$rtfeldman$elm_css$Svg$Styled$Attributes$width('100%'),
									$rtfeldman$elm_css$Svg$Styled$Attributes$height(
									$elm$core$String$fromFloat($author$project$Main$dFullHeight)),
									A3(
									$elm$core$Basics$composeL,
									A2(
										$elm$core$Basics$composeL,
										$rtfeldman$elm_css$Svg$Styled$Attributes$viewBox,
										$elm$core$String$join(' ')),
									$elm$core$List$map($elm$core$String$fromFloat),
									_List_fromArray(
										[0, 0, $author$project$Main$dFullWidth, $author$project$Main$dFullHeight])),
									$rtfeldman$elm_css$Svg$Styled$Attributes$pointerEvents('none'),
									$rtfeldman$elm_css$Svg$Styled$Attributes$css(
									_List_fromArray(
										[
											$rtfeldman$elm_css$Css$fontVariantNumeric($rtfeldman$elm_css$Css$tabularNums),
											A2($rtfeldman$elm_css$Css$property, 'user-select', 'none'),
											A2($rtfeldman$elm_css$Css$property, '-webkit-user-select', 'none')
										]))
								]))),
					$elm$core$List$concatMap(
						$author$project$SvgHelper$draw($author$project$Main$colorsDict)),
					A2(
						$elm_community$list_extra$List$Extra$stableSortWith,
						F2(
							function (_v0, _v1) {
								var s1 = _v0.b;
								var s2 = _v1.b;
								return A2($elm$core$Basics$compare, s1.layer, s2.layer);
							}),
						elements))
				]);
		}(),
		title: 'Experiment on games'
	};
};
var $author$project$Main$main = $elm$browser$Browser$application(
	{
		init: $author$project$Main$init,
		onUrlChange: $elm$core$Basics$always($author$project$Main$NoOp),
		onUrlRequest: $elm$core$Basics$always($author$project$Main$NoOp),
		subscriptions: $author$project$Main$subscriptions,
		update: $author$project$Main$update,
		view: $author$project$Main$view
	});
_Platform_export({'Main':{'init':$author$project$Main$main(
	$elm$json$Json$Decode$succeed(_Utils_Tuple0))(0)}});}(this));