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

	NDArray( dimensions )	Internal, special case where nothing is init, it's the bare minium for cloning
	NDArray( [ dataStore | Constructor ] , [ sizes | minsMaxs ] , [ params ] )

	Arguments:
		dataStore: an array-like (Array, TypedArray, Buffer, or any indexable object) that will be used as the storage backend
		Constructor: constructor to create the storage backend with the appropriate size.
		sizes: array of sizes, whose length is also used as the number of dimensions for the NDArray
		minsMaxs: an array of [ min , max ] (max being INCLUDED), for creating a non-zero-based ND-array
		params: an object of optional parameters, where:
			order: array of coord order stored in the dataStore, by default [ 0 , 1 , 2 , ..., N ], for 2D it's row-first,
				if you want column-first, use [ 1 , 0 ], or params.reverse = true
			reverse: syntactic sugar, like params.order = [ N , ... , 2 , 1 , 0 ]
			dataStoreStart: the offset if the ND-array does not start at the begining of the dataStore (e.g. create a view of a Buffer)
*/
function NDArray( dataStoreOrConstructor , sizes , params ) {
	let dimensions , noInit = false ;

	if ( typeof dataStoreOrConstructor === 'number' ) {
		dimensions = dataStoreOrConstructor ;
		noInit = true ;	// Fast mode, for cloning and similar things
	}
	else {
		dimensions = sizes.length ;
	}

	// The number of dimension of the ND-array, e.g. 2D, 3D, ...
	this.dimensions = dimensions ;

	// Define the size in each axis
	this.sizes = new Array( dimensions ) ;

	// The full size of the ND-array, each axis-size multiplied
	this.size = 1 ;

	// Define the min for each axis, when the ND-array is not zero-based
	this.mins = new Array( dimensions ) ;

	// Define the INCLUSIVE max for each axis
	this.maxs = new Array( dimensions ) ;

	// Define the axis/coordinate order (row-first, column-first)
	this.order = new Array( dimensions ) ;

	// Define the layout of the array in memory, also the coordinate order (row-first, column-first)
	this.strides = new Array( dimensions ) ;

	// When the store is only partially used, this is the offset in the store natural index
	this.dataStoreStart = 0 ;

	// For internal usages
	this.dataStoreEnd = 0 ;

	// The underlying data store: Array, TypedArray, Buffer... anything that is indexed
	this.dataStore = null ;

	if ( ! noInit ) {
		this._init( dataStoreOrConstructor , sizes , params ) ;
	}
}

module.exports = NDArray ;



NDArray.prototype._init = function( dataStoreOrConstructor , sizes , params = {} ) {
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

	// Compute mins/maxs/sizes
	if ( Array.isArray( sizes[ 0 ] ) ) {
		// This is the area variant
		this._initMinsMaxsSizesFromArea( sizes ) ;
	}
	else {
		// This is a zero-based array
		this._initMinsMaxsFromSizes( sizes ) ;
	}

	// Compute the stride
	this._initStridesUsingSizes() ;

	// Data store start and end
	this.dataStoreStart = params.dataStoreStart || 0 ;
	this.dataStoreEnd = this.dataStoreStart + this.size ;

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
} ;

// Fragmented init, because it can be re-use by various cloning things

NDArray.prototype._initMinsMaxsSizesFromArea = function( area ) {
	for ( let d = 0 ; d < this.dimensions ; d ++ ) {
		this.mins[ d ] = area[ d ][ 0 ] ;
		this.maxs[ d ] = area[ d ][ 1 ] ;
		this.sizes[ d ] = this.maxs[ d ] - this.mins[ d ] + 1 ;
		this.size *= this.sizes[ d ] ;

		if ( this.sizes[ d ] <= 0 || ! Number.isFinite( this.sizes[ d ] ) ) {
			throw new RangeError( "Bad size (min-max: [" + this.mins[ d ] + "," + this.maxs[ d ] + "]) for dimension #" + d ) ;
		}
	}
} ;

NDArray.prototype._initSizesFromMinsMaxs = function( mins , maxs ) {
	for ( let d = 0 ; d < this.dimensions ; d ++ ) {
		this.mins[ d ] = mins[ d ] ;
		this.maxs[ d ] = maxs[ d ] ;
		this.sizes[ d ] = this.maxs[ d ] - this.mins[ d ] + 1 ;
		this.size *= this.sizes[ d ] ;

		if ( this.sizes[ d ] <= 0 || ! Number.isFinite( this.sizes[ d ] ) ) {
			throw new RangeError( "Bad size (min-max: [" + this.mins[ d ] + "," + this.maxs[ d ] + "]) for dimension #" + d ) ;
		}
	}
} ;

NDArray.prototype._initMinsMaxsFromSizes = function( sizes ) {
	for ( let d = 0 ; d < this.dimensions ; d ++ ) {
		this.sizes[ d ] = sizes[ d ] ;
		this.mins[ d ] = 0 ;
		this.maxs[ d ] = this.sizes[ d ] - 1 ;
		this.size *= this.sizes[ d ] ;

		if ( this.sizes[ d ] <= 0 || ! Number.isFinite( this.sizes[ d ] ) ) {
			throw new RangeError( "Bad size (" + this.sizes[ d ] + ") for dimension #" + d ) ;
		}
	}
} ;

// Sizes is not passed as argument, it should already be computed on the instance
NDArray.prototype._initStridesUsingSizes = function() {
	let stride = 1 ;
	for ( const d of this.order ) {
		this.strides[ d ] = stride ;
		stride *= this.sizes[ d ] ;
	}
} ;



// Create a new clone of the current NDArray with the same geometry but an empty (but ready) dataStore
// The new dataStore is limited to the used size (dataStoreStart = 0 and dataStoreEnd = dataStore.length).
NDArray.prototype._cloneGeometry = function() {
	const newNDArray = new NDArray( this.dimensions ) ;

	// Copy geometry
	Object.assign( newNDArray.order , this.order ) ;
	Object.assign( newNDArray.sizes , this.sizes ) ;
	newNDArray.size = this.size ;
	Object.assign( newNDArray.mins , this.mins ) ;
	Object.assign( newNDArray.maxs , this.maxs ) ;
	Object.assign( newNDArray.strides , this.strides ) ;
	newNDArray.dataStoreEnd = this.size ;

	return newNDArray ;
} ;



// Clone with a modified geometry
NDArray.prototype._resizeGeometry = function( mins , maxs ) {
	const newNDArray = new NDArray( this.dimensions ) ;

	Object.assign( newNDArray.order , this.order ) ;
	newNDArray._initSizesFromMinsMaxs( mins , maxs ) ;
	newNDArray._initStridesUsingSizes() ;
	newNDArray.dataStoreEnd = newNDArray.size ;

	return newNDArray ;
} ;



// Create a new data store of the same type
NDArray.prototype._newDataStoreOfTheSameKind = function( size = this.size ) {
	if ( typeof this.dataStore?.constructor?.allocUnsafe === 'function' ) {
		// Detect Node.js's Buffer referencing it (avoid browser compatibility layer)
		return this.dataStore.constructor.allocUnsafe( size ) ;
	}

	return new this.dataStore.constructor( size ) ;
} ;



// Internal version without any unnessessary test
NDArray.prototype._getIndex = function( coords ) {
	let index = this.dataStoreStart ;
	for ( const d of this.order ) { index += ( coords[ d ] - this.mins[ d ] ) * this.strides[ d ] ; }
	return index ;
} ;

NDArray.prototype._getIndexCheck =
NDArray.prototype.getIndexA = function( coords ) {
	let index = this.dataStoreStart ;

	for ( const d of this.order ) {
		const c = coords[ d ] ;

		if ( c < this.mins[ d ] || c > this.maxs[ d ] ) {
			throw new RangeError( "Coordinate " + c + " out of bounds for dimension #" + d + " which is [" + this.mins[ d ] + "," + this.maxs[ d ] + "]" ) ;
		}

		index += ( c - this.mins[ d ] ) * this.strides[ d ] ;
	}

	return index ;
} ;

NDArray.prototype.getIndex = function( ... coords ) { return this._getIndexCheck( coords ) ; } ;



NDArray.prototype._getCoords = function( index , coords = new Array( this.dimensions ) ) {
	// Rebase the index
	index -= this.dataStoreStart ;

	for ( let i = this.dimensions - 1 ; i >= 0 ; i -- ) {
		const d = this.order[ i ] ;
		coords[ d ] = Math.floor( index / this.strides[ d ] ) + this.mins[ d ] ;
		index = index % this.strides[ d ] ;
	}

	return coords ;
} ;

NDArray.prototype._getCoordsCheck =
NDArray.prototype.getCoords = function( index , coords ) {
	if ( index < this.dataStoreStart || index >= this.dataStoreEnd ) {
		throw new RangeError( "Index " + index + " out of bounds, which is [" + this.dataStoreStart + "," + this.dataStoreEnd + ")" ) ;
	}

	coords = coords ?? new Array( this.dimensions ) ;

	// Rebase the index
	index -= this.dataStoreStart ;

	for ( let i = this.dimensions - 1 ; i >= 0 ; i -- ) {
		const d = this.order[ i ] ;
		coords[ d ] = Math.floor( index / this.strides[ d ] ) + this.mins[ d ] ;
		index = index % this.strides[ d ] ;
	}

	return coords ;
} ;



NDArray.prototype._get = function( coords ) { return this.dataStore[ this._getIndex( coords ) ] ; } ;
NDArray.prototype._getCheck = NDArray.prototype.getA = function( coords ) { return this.dataStore[ this._getIndexCheck( coords ) ] ; } ;
NDArray.prototype.get = function( ... coords ) { return this.dataStore[ this._getIndexCheck( coords ) ] ; } ;



NDArray.prototype._set = function( coords , value ) { this.dataStore[ this._getIndex( coords ) ] = value ; } ;
NDArray.prototype._setCheck = NDArray.prototype.setA = function( coords , value ) { this.dataStore[ this._getIndexCheck( coords ) ] = value ; } ;
NDArray.prototype.set = function( ... args ) {
	// We don't care for the extra element in ._getIndexCheck()
	this.dataStore[ this._getIndexCheck( args ) ] = args[ args.length - 1 ] ;
} ;



/*
	Iterate the whole ND-array over index (and convert to coords).

	BE CAREFUL! The callback receive a coords array that is not cloned, because it would slowdown iteration
	and would put a lot of work for the Garbage Collector for large ndarrays.
*/
NDArray.prototype.forEach =
NDArray.prototype._forEach = function( callback ) {
	// Usually =1, but later we could group neighbours (e.g. for RGBA images => stride0 = 4)
	const stride0 = this.strides[ this.order[ 0 ] ] ;
	const coords = Array.from( this.mins ) ;
	let index = this.dataStoreStart ;

	for ( ;; ) {
		callback( this.dataStore[ index ] , coords , index , this ) ;

		index += stride0 ;
		if ( index >= this.dataStoreEnd ) { return ; }

		for ( let i = 0 ; i < this.dimensions ; i ++ ) {
			const d = this.order[ i ] ;
			coords[ d ] ++ ;
			if (
				i < this.dimensions - 1
				&& coords[ d ] - this.mins[ d ] >= this.strides[ this.order[ i + 1 ] ]
			) {
				coords[ d ] = this.mins[ d ] ;
			}
			else {
				break ;
			}
		}
	}
} ;



/*
	Like foreach, but scan only an area.
	So it does not iterate over index (and convert to coords), but over coords (and convert to index).

	BE CAREFUL! The callback receive a coords array that is not cloned, because it would slowdown iteration
	and would put a lot of work for the Garbage Collector for large ndarrays.

	.forEachInArea( area , callback )
	.forEachInArea( mins , maxs , callback )

	Arguments:
		mins: an array of min coords
		maxs: an array of max coords (they are INCLUDED)
		area: an array of [ min , max ] for each coord (max is INCLUDED)
		callback: the iterator callback
*/
NDArray.prototype.forEachInArea = function( mins , maxs , callback ) {
	if ( typeof maxs === 'function' ) {
		callback = maxs ;
		maxs = mins.map( minmax => minmax[ 1 ] ) ;
		mins = mins.map( minmax => minmax[ 0 ] ) ;
	}

	this._forEachInAreaCheck( mins , maxs , callback ) ;
} ;

NDArray.prototype._forEachInAreaCheck = function( mins , maxs , callback ) {
	this._checkArea( mins , maxs ) ;
	this._forEachInArea( mins , maxs , callback ) ;
} ;

NDArray.prototype._forEachInArea = function( mins , maxs , callback ) {
	const backStrides = mins.map( ( min , d ) => ( min - maxs[ d ] ) * this.strides[ d ] ) ;
	const coords = Array.from( mins ) ;
	let index = this._getIndex( coords ) ;

	for ( ;; ) {
		callback( this.dataStore[ index ] , coords , index , this ) ;

		for ( let i = 0 ; i < this.dimensions ; i ++ ) {
			const d = this.order[ i ] ;

			if ( coords[ d ] >= maxs[ d ] ) {
				if ( i === this.dimensions - 1 ) { return ; }
				coords[ d ] = mins[ d ] ;
				// Return index back to min
				index += backStrides[ d ] ;
			}
			else {
				coords[ d ] ++ ;
				index += this.strides[ d ] ;
				break ;
			}
		}
	}
} ;



// Generator
// The yielded entry { coords , index , value } should be cloned, as well as entry.coords, if userland want to modify it
NDArray.prototype._eachInArea = function*( mins , maxs ) {
	const backStrides = mins.map( ( min , d ) => ( min - maxs[ d ] ) * this.strides[ d ] ) ;
	const coords = Array.from( mins ) ;
	let index = this._getIndex( coords ) ;
	const entry = { coords , index , value: undefined } ;

	for ( ;; ) {
		entry.value = this.dataStore[ index ] ;
		entry.index = index ;
		yield entry ;

		for ( let i = 0 ; i < this.dimensions ; i ++ ) {
			const d = this.order[ i ] ;

			if ( coords[ d ] >= maxs[ d ] ) {
				if ( i === this.dimensions - 1 ) { return ; }
				coords[ d ] = mins[ d ] ;
				// Return index back to min
				index += backStrides[ d ] ;
			}
			else {
				coords[ d ] ++ ;
				index += this.strides[ d ] ;
				break ;
			}
		}
	}
} ;



NDArray.prototype.map = function( callback ) {
	const newNDArray = this._cloneGeometry() ;
	newNDArray.dataStore = this._newDataStoreOfTheSameKind() ;

	this._forEach( ( value , coords , index ) => {
		newNDArray.dataStore[ index - this.dataStoreStart ] = callback( value , coords , index , this ) ;
	} ) ;

	return newNDArray ;
} ;



/*
	* Without callback: extract an area into a new ND-array, it has a new data store only with the correct size.
	* With callback: works like .map() but with an area, and also produce a reduced data store.

	.extractArea( area )
	.extractArea( mins , maxs )
	.mapArea( area , callback )
	.mapArea( mins , maxs , callback )
*/
NDArray.prototype.extractArea =
NDArray.prototype.mapArea = function( mins , maxs , callback ) {
	if ( ! maxs || typeof maxs === 'function' ) {
		callback = maxs ;
		maxs = mins.map( minmax => minmax[ 1 ] ) ;
		mins = mins.map( minmax => minmax[ 0 ] ) ;
	}

	this._checkArea( mins , maxs ) ;
	const newNDArray = this._resizeGeometry( mins , maxs ) ;
	newNDArray.dataStore = this._newDataStoreOfTheSameKind( newNDArray.size ) ;

	// We will simply walk both ND-array step by step at the same time, since it's the same area,
	// it produces the same coords at each step

	if ( typeof callback === 'function' ) { 
		this._dualStepCallback( newNDArray , mins , maxs , callback ) ;
	}
	else {
		this._dualStepCopy( newNDArray , mins , maxs ) ;
	}

	return newNDArray ;
} ;



NDArray.prototype._dualStepCopy = function( dst , mins , maxs ) {
	const srcGen = this._eachInArea( mins , maxs ) ;
	const dstGen = dst._eachInArea( mins , maxs ) ;

	let srcItem , dstItem ;

	for ( ;; ) {
		srcItem = srcGen.next().value ;
		if ( ! srcItem ) { return ; }
		dstItem = dstGen.next().value ;
		dst.dataStore[ dstItem.index ] = srcItem.value ;
	}
} ;



NDArray.prototype._dualStepCallback = function( dst , mins , maxs , callback ) {
	const srcGen = this._eachInArea( mins , maxs ) ;
	const dstGen = dst._eachInArea( mins , maxs ) ;

	let srcItem , dstItem ;

	for ( ;; ) {
		srcItem = srcGen.next().value ;
		if ( ! srcItem ) { return ; }
		dstItem = dstGen.next().value ;
		dst.dataStore[ dstItem.index ] = callback( srcItem.value , srcItem.coords , srcItem.index , this ) ;
	}
} ;



NDArray.prototype._checkArea = function( mins , maxs ) {
	// Check mins/maxs range errors
	for ( let d = 0 ; d < this.dimensions ; d ++ ) {
		if (
			mins[ d ] > maxs[ d ]
			|| mins[ d ] < this.mins[ d ]
			|| mins[ d ] > this.maxs[ d ]
			|| maxs[ d ] < this.mins[ d ]
			|| maxs[ d ] > this.maxs[ d ]
		) {
			throw new RangeError( "Min-max coordinate [" + mins[ d ] + "," + maxs[ d ] + "] out of bounds for dimension #" + d + " which is [" + this.mins[ d ] + "," + this.maxs[ d ] + "]" ) ;
		}
	}
} ;

