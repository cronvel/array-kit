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

	Arguments:
		dataStoreOrConstructor: either an array-like (Array, TypedArray, Buffer, or any indexable object) that will be used
			as the storage backend, OR a constructor to create the storage backend with the appropriate size.
		sizes: array of sizes, whose length is also used as the number of dimensions for the NDArray, alternatively,
			it could be an array of [ min , max ] (max being excluded), fore creating a non-zero-based ND-array
		params: an object for more parameter, where:
			order: array of coord order stored in the dataStore, by default [ 0 , 1 , 2 , ..., N ], for 2D it's row-first,
				if you want column-first, use [ 1 , 0 ], or params.reverse = true
			reverse: syntactic sugar, like params.order = [ N , ... , 2 , 1 , 0 ]
			dataStoreStart: the offset if the ND-array does not start at the begining of the dataStore (e.g. create a view of a Buffer)

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
	this.order = new Array( this.dimensions ) ;

	// Define the layout of the array in memory, also the coordinate order (row-first, column-first)
	this.strides = new Array( this.dimensions ) ;

	// When the store is only partially used, this is the offset in the store natural index
	this.dataStoreStart = params.dataStoreStart || 0 ;

	// For internal usages
	this.dataStoreEnd = 0 ;

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

	// Compute order
	if ( params.order ) {
		for ( let d = 0 ; d < this.dimensions ; d ++ ) { this.order[ d ] = params.order[ d ] ; }
	}
	else if ( params.reverse ) {
		for ( let d = 0 ; d < this.dimensions ; d ++ ) { this.order[ d ] = this.dimensions - d - 1 ; }
	}
	else {
		for ( let d = 0 ; d < this.dimensions ; d ++ ) { this.order[ d ] = d ; }
	}

	// Compute the stride
	let stride = 1 ;
	for ( let d of this.order ) {
		this.strides[ d ] = stride ;
		stride *= this.sizes[ d ] ;
	}

	// Set or create a new data store
	if ( typeof dataStoreOrConstructor === 'function' ) {
		if ( typeof dataStoreOrConstructor.allocUnsafe === 'function' ) {
			// Detect Node.js's Buffer referencing it (avoid browser compatibility layer)
			this.dataStore = dataStoreOrConstructor.allocUnsafe( this.dataStoreStart + this.size ) ;
		}
		else {
			this.dataStore = new dataStoreOrConstructor( this.dataStoreStart + this.size ) ;
		}
	}
	else {
		/*
		// Not sure it's good to check the length, since Array is extensible and only rarer TypedArray is fixed
		if ( dataStoreOrConstructor.length < this.dataStoreStart + this.size ) {
			throw new RangeError( "Provided data store is too small (expecting at least " + ( this.dataStoreStart + this.size ) + " but got " + dataStoreOrConstructor.length ) ;
		}
		*/
		this.dataStore = dataStoreOrConstructor ;
	}

	this.dataStoreEnd = this.dataStoreStart + this.size ;
}

module.exports = NDArray ;



// Internal version without any unnessessary test
NDArray.prototype._getIndex = function( coords ) {
	let index = this.dataStoreStart ;
	for ( let d of this.order ) { index += coords[ d ] * this.strides[ d ] ; }
	return index ;
} ;



// Internal version checking range
NDArray.prototype._getIndexCheck = function( coords ) {
	let index = this.dataStoreStart ;

	for ( let d of this.order ) {
		const c = coords[ d ] ;

		if ( c < this.mins[ d ] || c >= this.maxs[ d ] ) {
			throw new RangeError( "Coordinate " + c + " out of bounds for dimension #" + d + " which is [" + this.mins[ d ] + "," + this.maxs[ d ] + ")" ) ;
		}

		index += c * this.strides[ d ] ;
	}

	return index ;
} ;

NDArray.prototype.getIndex = function( ... coords ) { return this._getIndexCheck( coords ) ; } ;



NDArray.prototype._getCoords = function( index , coords = new Array( this.dimensions ) ) {
	// Rebase the index
	index -= this.dataStoreStart ;

	for ( let i = this.dimensions - 1 ; i >= 0 ; i -- ) {
		let d = this.order[ i ] ;
		coords[ d ] = Math.floor( index / this.strides[ d ] ) ;
		index = index % this.strides[ d ] ;
	}

	return coords ;
} ;



NDArray.prototype._getCoordsCheck = function( index , coords ) {
	if ( index < this.dataStoreStart || index >= this.dataStoreEnd ) {
		throw new RangeError( "Index " + index + " out of bounds for dimension #" + d + " which is [" + this.dataStoreStart + "," + this.dataStoreEnd + ")" ) ;
	}

	coords = coords ?? new Array( this.dimensions ) ;

	// Rebase the index
	index -= this.dataStoreStart ;

	for ( let i = this.dimensions - 1 ; i >= 0 ; i -- ) {
		let d = this.order[ i ] ;
		coords[ d ] = Math.floor( index / this.strides[ d ] ) ;
		index = index % this.strides[ d ] ;
	}

	return coords ;
} ;

NDArray.prototype.getCoords = NDArray.prototype._getCoordsCheck ;



NDArray.prototype.get = function( ... coords ) {
	return this.dataStore[ this._getIndexCheck( coords ) ] ;
} ;



NDArray.prototype.set = function( ... args ) {
	const index = this._getIndexCheck( args ) ;	// We don't care for the extra element
	this.dataStore[ index ] = args[ args.length - 1 ] ;
} ;



// BE CAREFUL! The callback receive a coords array that is not cloned, because it would slowdown iteration
// and would put a lot of work for the Garbage Collector for large ndarrays
NDArray.prototype.forEach = function( callback ) {
	const coords = new Array( this.dimensions ).fill( 0 ) ;
	let index = this.dataStoreStart ;

	for ( ;; ) {
		callback( this.dataStore[ index ] , coords , index , this ) ;

		index ++ ;
		if ( index >= this.dataStoreEnd ) { break ; }

		for ( let i = 0 ; i < this.dimensions ; i ++ ) {
			let d = this.order[ i ] ;
			coords[ d ] ++ ;
			if ( i < this.dimensions - 1 && coords[ d ] >= this.strides[ this.order[ i + 1 ] ] ) {
				coords[ d ] = 0 ;
			}
			else {
				break ;
			}
		}
	}
} ;

