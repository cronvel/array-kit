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

	.range( length )
	.range( start , end )
	.range( start , end , step )
	.range( [start] , end , [step] )

	* length `number` the length of the array
	* start `number` (default: 0) the value of the first item
	* end `number` the values end at this number (excluded)
	* step `number` (default: 1) the value of the increment
*/
module.exports = function( start , end , step ) {
	// Fast exit / common path first
	if ( arguments.length === 1 ) {
		const length = start ;
		const output = new Array( length ) ;
		for ( let i = 0 ; i < length ; i ++ ) { output[ i ] = i ; }
		return output ;
	}

	if ( ! arguments.length ) { return [] ; }

	if ( ! step ) {
		step = start <= end ? 1 : - 1 ;
	}

	const length = Math.ceil( ( end - start ) / step ) ;

	if ( length <= 0 ) { return [] ; }

	const output = new Array( length ) ;

	if ( step > 0 ) {
		for ( let i = 0 , v = start ; v < end ; i ++ , v += step ) {
			output[ i ] = v ;
		}
	}
	else {
		for ( let i = 0 , v = start ; v > end ; i ++ , v += step ) {
			output[ i ] = v ;
		}
	}

	return output ;
} ;

