/*
	Array Kit

	Copyright (c) 2014 - 2020 Cédric Ronvel

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

"use strict" ;



/*
	Create an array.

	.range( [start] , end , [step] ), where:

	* start `number` (default: 0) the value of the first item
	* end `number` the values end at this number (excluded)
	* step `number` (default: 1) the value of the increment
*/
module.exports = function( start , end , step ) {
	if ( ! arguments.length ) { return [] ; }

	if ( arguments.length === 1 ) {
		end = start ;
		start = 0 ;
	}

	if ( ! step ) { step = start <= end ? 1 : -1 ; }

	if ( ( step > 0 && start >= end ) || ( step < 0 && start <= end ) ) {
		return [] ;
	}

	var i = 0 , v = start , output = [] ;

	if ( step > 0 ) {
		for ( ; v < end ; i ++ , v += step ) { output[ i ] = v ; }
	}
	else {
		for ( ; v > end ; i ++ , v += step ) { output[ i ] = v ; }
	}

	return output ;
} ;

