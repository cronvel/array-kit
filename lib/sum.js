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
	The naive sum, works for arrays of limited size, or array of integers.
*/
exports.sum = ( array , start = 0 , end = array.length ) => {
	let sum = 0 ;
	for ( let i = start ; i < end ; i ++ ) { sum += array[ i ] ; }
	return sum ;
} ;



/*
	This is the Neumaier algorithm, which compensate lost of precision of summing a lot of floats.
*/
exports.floatSum = ( array , start = 0 , end = array.length ) => {
	let sum = 0 ;
	let errorSum = 0 ;

	for ( let i = start ; i < end ; i ++ ) {
		const value = array[ i ] ;
		const nextSum = sum + value ;

		// This is the tricky and sensible part, do not alter it, the order / priority of operation matters.
		// It reverses the summation to get the error.
		// Since errors are tiny, and we sum only tiny numbers here, we ensure good precision for the error sum.
		if ( Math.abs( sum ) >= Math.abs( value ) ) {
			errorSum += ( sum - nextSum ) + value ;
		}
		else {
			errorSum += ( value - nextSum ) + sum ;
		}

		sum = nextSum ;
	}

	// The cumulated errors are added at the end
	return sum + errorSum ;
} ;



/*
	This compute the sum chunk by chunk, avoiding summing numbers that are too big with numbers that are too small.
	The sum of sums itself can be computed recursively (but coded by iteration) if the sub-sums count is also greater
	than the chunkSize.

	It should be theorically better then floatSum() for very large arrays, but it's hard to test it.
*/
exports.chunkedFloatSum = ( array , maxChunkSize = 1024 , start = 0 , end = array.length ) => {
	let currentArray = array ;
	let currentStart = start ;
	let currentEnd = end ;

	while ( currentEnd - currentStart >= maxChunkSize ) {
		const chunkCount = Math.ceil( ( currentEnd - currentStart ) / maxChunkSize ) ;
		const chunkSize = Math.ceil( ( currentEnd - currentStart ) / chunkCount ) ;
		const sumArray = new Array( chunkCount ) ;

		for ( let chunkIndex = 0 ; chunkIndex < chunkCount ; chunkIndex ++ ) {
			sumArray[ chunkIndex ] = exports.floatSum(
				currentArray ,
				currentStart + chunkIndex * chunkSize ,
				Math.min( currentStart + ( chunkIndex + 1 ) * chunkSize , currentEnd )
			) ;
		}

		currentArray = sumArray ;
		currentStart = 0 ;
		currentEnd = currentArray.length ;
	}

	return exports.floatSum( currentArray , currentStart , currentEnd ) ;
} ;



exports.mean = ( array , start = 0 , end = array.length ) => exports.sum( array , start , end ) / ( end - start ) ;
exports.floatMean = ( array , start = 0 , end = array.length ) => exports.floatSum( array , start , end ) / ( end - start ) ;

