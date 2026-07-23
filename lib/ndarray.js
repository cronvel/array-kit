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



const ArrayND = require( './ArrayND.js' ) ;
const Array2D = require( './Array2D.js' ) ;



/*
	Contrary to most NDArray implementation, this one allow negative indexes or any non-zero-based array.

	ndarray( [ dataStorage | Constructor ] , [ sizes | region ] , [ params ] )

	Arguments:
		storage: an array-like (Array, TypedArray, Buffer, or any indexable object) that will be used as the storage backend
		Constructor: constructor to create the storage backend with the appropriate size.
		sizes: array of sizes, whose length is also used as the number of dimensions for the NDArray
		region: an array of [ min , max ] (max being INCLUDED), for creating a non-zero-based ND-array
		params: an object of optional parameters, where:
			order: array of coord order stored in the storage, by default [ 0 , 1 , 2 , ..., N ], for 2D it's row-first,
			  if you want column-first, use [ 1 , 0 ], or params.reverse = true
			reverse: syntactic sugar, like params.order = [ N , ... , 2 , 1 , 0 ], means that the slowest moving dimension comes first
			dataStart: the index in the data storage where the ND-array starts (e.g. the start of the view in the Buffer)
			stride: (default: 1) the stride of the fastest moving dimension, usually 1 except if there is faster dimensions
			  that are removed from the view

		Not added yet:
			offset: the offset of the first logical element of the ND-array
			dataEnd: the index in the data storage where the ND-array ends, excluded (e.g. the end of the view in the Buffer)
*/
module.exports = function( dataOrConstructor , sizes , params ) {
	const dimensions = sizes.length ;
	if ( dimensions === 2 ) { return new Array2D( dataOrConstructor , sizes , params ) ; }
	return new ArrayND( dataOrConstructor , sizes , params ) ;
} ;

