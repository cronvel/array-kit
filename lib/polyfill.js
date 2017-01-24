/*
	Array Kit
	
	Copyright (c) 2014 - 2017 Cédric Ronvel
	
	The MIT License (MIT)
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/
/* All polyfill borrowed from MDN: developer.mozilla.org */



var polyfill = {} ;
module.exports = polyfill ;



// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/fill
polyfill.fill = function(value)
{
  // Steps 1-2.
  if (this === null) {
    throw new TypeError('this is null or not defined');
  }

  var O = Object(this);

  // Steps 3-5.
  var len = O.length >>> 0;

  // Steps 6-7.
  var start = arguments[1];
  var relativeStart = start >> 0;

  // Step 8.
  var k = relativeStart < 0 ?
    Math.max(len + relativeStart, 0) :
    Math.min(relativeStart, len);

  // Steps 9-10.
  var end = arguments[2];
  var relativeEnd = end === undefined ?
    len : end >> 0;

  // Step 11.
  var final = relativeEnd < 0 ?
    Math.max(len + relativeEnd, 0) :
    Math.min(relativeEnd, len);

  // Step 12.
  while (k < final) {
    O[k] = value;
    k++;
  }

  // Step 13.
  return O;
};
