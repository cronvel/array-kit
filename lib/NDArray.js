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
	Contrary to most NDArray implementation, this one allow negative indexes or any non-zero-based array.
*/
function NDArray( dataStoreOrConstructor , sizes , params = {} ) {
	// The number of dimension of the ND-array, e.g. 2D, 3D, ...
	this.dimensions = sizes.length ;

	// Define the size in each axis
	this.sizes = new Array( this.dimensions ) ;

	// The full size of the ND-array, each axis-size multiplied
	this.size = 1 ;

	// Define the min for each axis, when the ND-array is not zero-based
	this.mins = new Array( this.dimensions ) ;

	// Define the max for each axis, the same than .sizes except when the ND-array is not zero-based
	this.maxs = new Array( this.dimensions ) ;

	// Define the axis/coordinate order (row-first, column-first)
	this.order = params.order ? Array.from( params.order ) : Array.from( { length: this.dimensions } , ( v , i ) => i ) ;

	// Define the layout of the array in memory, also the coordinate order (row-first, column-first)
	this.strides = new Array( this.dimensions ) ;

	// When the store is only partially used, this is the offset in the store natural index
	this.dataStoreOffset = params.dataStoreOffset || 0 ;

	// The underlying data store: Array, TypedArray, Buffer... anything that is indexed
	this.dataStore = null ;


	// Compute mins/maxs/sizes
	if ( Array.isArray( sizes[ 0 ] ) ) {
		// This is the min/max variant
		for ( let d = 0 ; d < this.dimensions ; d ++ ) {
			this.mins[ d ] = sizes[ d ][ 0 ] ;
			this.maxs[ d ] = sizes[ d ][ 1 ] ;
			this.sizes[ d ] = this.maxs[ d ] - this.mins[ d ] ;
			this.size *= this.sizes[ d ] ;
		}
	}
	else {
		// This is a zero-based array
		for ( let d = 0 ; d < this.dimensions ; d ++ ) {
			this.mins[ d ] = 0 ;
			this.maxs[ d ] = this.sizes[ d ] = sizes[ d ] ;
			this.size *= this.sizes[ d ] ;
		}
	}

	// Compute the stride
	let stride = 1 ;
	for ( let d = 0 ; d < this.dimensions ; d ++ ) {
		this.strides[ d ] = stride ;
		stride *= this.sizes[ d ] ;
	}

	// Set or create a new data store
	if ( typeof dataStoreOrConstructor === 'function' ) {
		if ( typeof dataStoreOrConstructor.allocUnsafe === 'function' ) {
			// Detect Node.js's Buffer referencing it (avoid browser compatibility layer)
			this.dataStore = dataStoreOrConstructor.allocUnsafe( this.dataStoreOffset + this.size ) ;
		}
		else {
			this.dataStore = new dataStoreOrConstructor( this.dataStoreOffset + this.size ) ;
		}
	}
	else {
		/*
		// Not sure it's good to check the length, since Array is extensible and only rarer TypedArray is fixed
		if ( dataStoreOrConstructor.length < this.dataStoreOffset + this.size ) {
			throw new RangeError( "Provided data store is too small (expecting at least " + ( this.dataStoreOffset + this.size ) + " but got " + dataStoreOrConstructor.length ) ;
		}
		*/
		this.dataStore = dataStoreOrConstructor ;
	}
}

module.exports = NDArray ;



// Internal version without any unnessessary test
NDArray.prototype._getIndex = function( coords ) {
	let index = this.dataStoreOffset ;
	for ( let d = 0 ; d < this.dimensions ; d ++ ) { index += coords[ d ] * this.strides[ d ] ; }
	return index ;
} ;



// Internal version checking range
NDArray.prototype._getIndexCheck = function( coords ) {
	let index = this.dataStoreOffset ;

	for ( let d = 0 ; d < this.dimensions ; d ++ ) {
		const c = coords[ d ] ;

		if ( c < this.mins[ d ] || c >= this.maxs[ d ] ) {
			throw new RangeError( "Coordinate " + c + " out of bounds for dimension #" + d + " which is [" + this.mins[ d ] + "," + this.maxs[ d ] + ")" ) ;
		}

		index += c * this.strides[ d ] ;
	}

	return index ;
} ;

NDArray.prototype.getIndex = function( ... coords ) { return this._getIndexCheck( coords ) ; } ;



NDArray.prototype.get = function( ... coords ) {
	return this.dataStore[ this._getIndexCheck( coords ) ] ;
} ;



NDArray.prototype.set = function( ... args ) {
	const index = this._getIndexCheck( args ) ;
	this.dataStore[ index ] = args[ args.length - 1 ] ;
} ;

