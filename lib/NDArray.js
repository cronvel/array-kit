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
	NDArray( [ storage | Constructor ] , [ sizes | region ] , [ params ] )

	Arguments:
		storage: an array-like (Array, TypedArray, Buffer, or any indexable object) that will be used as the storage backend
		Constructor: constructor to create the storage backend with the appropriate size.
		sizes: array of sizes, whose length is also used as the number of dimensions for the NDArray
		region: an array of [ min , max ] (max being INCLUDED), for creating a non-zero-based ND-array
		params: an object of optional parameters, where:
			order: array of coord order stored in the storage, by default [ 0 , 1 , 2 , ..., N ], for 2D it's row-first,
				if you want column-first, use [ 1 , 0 ], or params.reverse = true
			reverse: syntactic sugar, like params.order = [ N , ... , 2 , 1 , 0 ]
			storageOffset: the offset if the ND-array does not start at the begining of the storage (e.g. create a view of a Buffer)
*/
function NDArray( storageOrConstructor , sizes , params ) {
	let dimensions , noInit = false ;

	if ( typeof storageOrConstructor === 'number' ) {
		dimensions = storageOrConstructor ;
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

	// Define the coordinate order (e.g. row-first, column-first), the fastest moving dimensions in the memory first,
	// so it will order strides starting from the smallest one first...
	this.order = new Array( dimensions ) ;

	// Define the layout of the array in memory, strides are products of all faster dimensions
	this.strides = new Array( dimensions ) ;

	// When the store is only partially used, this is the offset in the store natural index
	this.storageOffset = 0 ;

	// The underlying data store: Array, TypedArray, Buffer... anything that is indexed
	this.storage = null ;

	if ( ! noInit ) {
		this._init( storageOrConstructor , sizes , params ) ;
	}
}

module.exports = NDArray ;



NDArray.prototype._init = function( storageOrConstructor , sizes , params = {} ) {
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
		// This is the region variant
		this._initMinsMaxsSizesFromRegion( sizes ) ;
	}
	else {
		// This is a zero-based array
		this._initMinsMaxsFromSizes( sizes ) ;
	}

	// Compute the stride
	this._initStridesUsingSizes() ;

	// Data store start and end
	this.storageOffset = params.storageOffset || 0 ;

	// Set or create a new data store
	if ( typeof storageOrConstructor === 'function' ) {
		if ( typeof storageOrConstructor.allocUnsafe === 'function' ) {
			// Detect Node.js's Buffer referencing it (avoid browser compatibility layer)
			this.storage = storageOrConstructor.allocUnsafe( this.storageOffset + this.size ) ;
		}
		else {
			this.storage = new storageOrConstructor( this.storageOffset + this.size ) ;
		}
	}
	else {
		/*
		// Not sure it's good to check the length, since Array is extensible and only rarer TypedArray is fixed
		if ( storageOrConstructor.length < this.storageOffset + this.size ) {
			throw new RangeError( "Provided data store is too small (expecting at least " + ( this.storageOffset + this.size ) + " but got " + storageOrConstructor.length ) ;
		}
		*/
		this.storage = storageOrConstructor ;
	}
} ;

// Fragmented init, because it can be re-use by various cloning things

NDArray.prototype._initMinsMaxsSizesFromRegion = function( region ) {
	for ( let d = 0 ; d < this.dimensions ; d ++ ) {
		this.mins[ d ] = region[ d ][ 0 ] ;
		this.maxs[ d ] = region[ d ][ 1 ] ;
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



// Make the array zero-based, or based to the provided mins vector
NDArray.prototype.rebase = function( mins ) {
	if ( mins ) {
		for ( let d = 0 ; d < this.dimensions ; d ++ ) {
			this.mins[ d ] = mins[ d ] ;
			this.maxs[ d ] = mins[ d ] + this.sizes[ d ] - 1 ;
		}
	}
	else {
		for ( let d = 0 ; d < this.dimensions ; d ++ ) {
			this.mins[ d ] = 0 ;
			this.maxs[ d ] = this.sizes[ d ] - 1 ;
		}
	}
} ;



// Create a new clone of the current NDArray with the same geometry but an empty (but ready) storage
// The new storage is limited to the used size (storageOffset = 0).
NDArray.prototype._cloneGeometry = function() {
	const newNDArray = new NDArray( this.dimensions ) ;

	// Copy geometry
	Object.assign( newNDArray.order , this.order ) ;
	Object.assign( newNDArray.sizes , this.sizes ) ;
	newNDArray.size = this.size ;
	Object.assign( newNDArray.mins , this.mins ) ;
	Object.assign( newNDArray.maxs , this.maxs ) ;
	Object.assign( newNDArray.strides , this.strides ) ;

	return newNDArray ;
} ;



// Clone with a modified geometry
NDArray.prototype._resizeGeometry = function( mins , maxs ) {
	const newNDArray = new NDArray( this.dimensions ) ;

	Object.assign( newNDArray.order , this.order ) ;
	newNDArray._initSizesFromMinsMaxs( mins , maxs ) ;
	newNDArray._initStridesUsingSizes() ;

	return newNDArray ;
} ;



// Create a new data store of the same type
NDArray.prototype._newStorageOfTheSameKind = function( size = this.size ) {
	if ( typeof this.storage?.constructor?.allocUnsafe === 'function' ) {
		// Detect Node.js's Buffer referencing it (avoid browser compatibility layer)
		return this.storage.constructor.allocUnsafe( size ) ;
	}

	return new this.storage.constructor( size ) ;
} ;



// Internal version without any unnessessary test
// Classic strided array access is:
// index = coords[ 0 ] * strides[ 0 ] + coords[ 1 ] * strides[ 1 ] + ... + coords[ n ] * strides[ n ]
NDArray.prototype._getIndex = function( coords ) {
	let index = this.storageOffset ;
	//for ( const d of this.order ) { index += ( coords[ d ] - this.mins[ d ] ) * this.strides[ d ] ; }
	for ( let d = 0 ; d < this.dimensions ; d ++ ) { index += ( coords[ d ] - this.mins[ d ] ) * this.strides[ d ] ; }
	return index ;
} ;

NDArray.prototype._getIndexCheck =
NDArray.prototype.getIndexA = function( coords ) {
	let index = this.storageOffset ;

	//for ( const d of this.order ) {
	for ( let d = 0 ; d < this.dimensions ; d ++ ) {
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
	index -= this.storageOffset ;

	// Because of the division and modulo, this have to be done in the reverse order, from the biggest stride to the smallest.
	for ( let i = this.dimensions - 1 ; i >= 0 ; i -- ) {
		const d = this.order[ i ] ;
		coords[ d ] = Math.floor( index / this.strides[ d ] ) + this.mins[ d ] ;
		index = index % this.strides[ d ] ;
	}

	return coords ;
} ;

NDArray.prototype._getCoordsCheck =
NDArray.prototype.getCoords = function( index , coords ) {
	if ( index < this.storageOffset || index >= this.storageOffset + this.size ) {
		throw new RangeError( "Index " + index + " out of bounds, which is [" + this.storageOffset + "," + ( this.storageOffset + this.size ) + ")" ) ;
	}

	coords = coords ?? new Array( this.dimensions ) ;

	// Rebase the index
	index -= this.storageOffset ;

	// Because of the division and modulo, this have to be done in the reverse order, from the biggest stride to the smallest.
	for ( let i = this.dimensions - 1 ; i >= 0 ; i -- ) {
		const d = this.order[ i ] ;
		coords[ d ] = Math.floor( index / this.strides[ d ] ) + this.mins[ d ] ;
		index = index % this.strides[ d ] ;
	}

	return coords ;
} ;



NDArray.prototype._get = function( coords ) { return this.storage[ this._getIndex( coords ) ] ; } ;
NDArray.prototype._getCheck = NDArray.prototype.getA = function( coords ) { return this.storage[ this._getIndexCheck( coords ) ] ; } ;
NDArray.prototype.get = function( ... coords ) { return this.storage[ this._getIndexCheck( coords ) ] ; } ;



NDArray.prototype._set = function( coords , value ) { this.storage[ this._getIndex( coords ) ] = value ; } ;
NDArray.prototype._setCheck = NDArray.prototype.setA = function( coords , value ) { this.storage[ this._getIndexCheck( coords ) ] = value ; } ;
NDArray.prototype.set = function( ... args ) {
	// We don't care for the extra element in ._getIndexCheck()
	this.storage[ this._getIndexCheck( args ) ] = args[ args.length - 1 ] ;
} ;



NDArray.prototype.fill = function( value ) {
	for ( let i = this.storageOffset , end = this.storageOffset + this.size ; i < end ; i ++ ) {
		this.storage[ i ] = value ;
	}
} ;



NDArray.prototype.fillRegion = function( mins , maxs , value ) {
	if ( Array.isArray( mins[ 0 ] ) ) {
		value = maxs ;
		maxs = mins.map( minmax => minmax[ 1 ] ) ;
		mins = mins.map( minmax => minmax[ 0 ] ) ;
	}

	for ( const { index } of this._eachInRegionCheck( mins , maxs ) ) {
		this.storage[ index ] = value ;
	}
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
	const storageEnd = this.storageOffset + this.size ;
	let index = this.storageOffset ;

	for ( ;; ) {
		callback( this.storage[ index ] , coords , index , this ) ;

		index += stride0 ;
		if ( index >= storageEnd ) { return ; }

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
	Like foreach, but scan only an region.
	So it does not iterate over index (and convert to coords), but over coords (and convert to index).

	BE CAREFUL! The callback receive a coords array that is not cloned, because it would slowdown iteration
	and would put a lot of work for the Garbage Collector for large ndarrays.

	.forEachInRegion( region , callback )
	.forEachInRegion( mins , maxs , callback )

	Arguments:
		mins: an array of min coords
		maxs: an array of max coords (they are INCLUDED)
		region: an array of [ min , max ] for each coord (max is INCLUDED)
		callback: the iterator callback
*/
NDArray.prototype.forEachInRegion = function( mins , maxs , callback ) {
	if ( typeof maxs === 'function' ) {
		callback = maxs ;
		maxs = mins.map( minmax => minmax[ 1 ] ) ;
		mins = mins.map( minmax => minmax[ 0 ] ) ;
	}

	this._forEachInRegionCheck( mins , maxs , callback ) ;
} ;

NDArray.prototype._forEachInRegionCheck = function( mins , maxs , callback ) {
	this._checkRegion( mins , maxs ) ;
	this._forEachInRegion( mins , maxs , callback ) ;
} ;

NDArray.prototype._forEachInRegion = function( mins , maxs , callback ) {
	const backStrides = mins.map( ( min , d ) => ( min - maxs[ d ] ) * this.strides[ d ] ) ;
	const coords = Array.from( mins ) ;
	let index = this._getIndex( coords ) ;

	for ( ;; ) {
		callback( this.storage[ index ] , coords , index , this ) ;

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



// Return a Generator
// .eachInRegion( region )
// .eachInRegion( mins , maxs )
NDArray.prototype.eachInRegion = function( mins , maxs ) {
	if ( ! maxs ) {
		maxs = mins.map( minmax => minmax[ 1 ] ) ;
		mins = mins.map( minmax => minmax[ 0 ] ) ;
	}

	return this._eachInRegionCheck( mins , maxs ) ;
} ;

NDArray.prototype._eachInRegionCheck = function( mins , maxs ) {
	this._checkRegion( mins , maxs ) ;
	return this._eachInRegion( mins , maxs ) ;
} ;

// Generator
// The yielded entry { coords , index , value } should be cloned, as well as entry.coords, if userland want to modify it
NDArray.prototype._eachInRegion = function*( mins , maxs ) {
	const backStrides = mins.map( ( min , d ) => ( min - maxs[ d ] ) * this.strides[ d ] ) ;
	const coords = Array.from( mins ) ;
	let index = this._getIndex( coords ) ;
	const entry = { coords , index , value: undefined } ;

	for ( ;; ) {
		entry.value = this.storage[ index ] ;
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
	newNDArray.storage = this._newStorageOfTheSameKind() ;

	this._forEach( ( value , coords , index ) => {
		newNDArray.storage[ index - this.storageOffset ] = callback( value , coords , index , this ) ;
	} ) ;

	return newNDArray ;
} ;



/*
	Works like .map() but with an region, and also produce a reduced data store.

	.mapRegion( region , callback )
	.mapRegion( mins , maxs , callback )
*/
NDArray.prototype.mapRegion = function( mins , maxs , callback ) {
	if ( typeof maxs === 'function' ) {
		callback = maxs ;
		maxs = mins.map( minmax => minmax[ 1 ] ) ;
		mins = mins.map( minmax => minmax[ 0 ] ) ;
	}

	this._checkRegion( mins , maxs ) ;
	const newNDArray = this._resizeGeometry( mins , maxs ) ;
	newNDArray.storage = this._newStorageOfTheSameKind( newNDArray.size ) ;

	this._dualStepCallback( newNDArray , mins , maxs , mins , maxs , callback ) ;

	return newNDArray ;
} ;



/*
	Extract an region into a new ND-array, it has a new data store only with the correct size.

	.extractRegion( region )
	.extractRegion( mins , maxs )
*/
NDArray.prototype.extractRegion = function( mins , maxs ) {
	if ( ! maxs ) {
		maxs = mins.map( minmax => minmax[ 1 ] ) ;
		mins = mins.map( minmax => minmax[ 0 ] ) ;
	}

	this._checkRegion( mins , maxs ) ;
	const newNDArray = this._resizeGeometry( mins , maxs ) ;
	newNDArray.storage = this._newStorageOfTheSameKind( newNDArray.size ) ;

	this._dualStepCopy( newNDArray , mins , maxs , mins , maxs ) ;

	return newNDArray ;
} ;



/*
	Copy to another ND-array

	.copy( toNDArray )
	.copy( toNDArray , at )
	.copy( toNDArray , at , region )
	.copy( toNDArray , at , mins , maxs )
*/
NDArray.prototype.copy = function( toNDArray , at , mins , maxs ) {
	if ( ! at ) {
		at = new Array( this.dimensions ).fill( 0 ) ;
	}

	if ( ! mins ) {
		mins = Array.from( this.mins ) ;
		maxs = Array.from( this.maxs ) ;
	}
	else if ( ! maxs ) {
		maxs = mins.map( minmax => minmax[ 1 ] ) ;
		mins = mins.map( minmax => minmax[ 0 ] ) ;
	}
	else {
		mins = Array.from( mins ) ;
		maxs = Array.from( maxs ) ;
	}

	const shift = at.map( ( atCoord , d ) => atCoord - mins[ d ] ) ;
	const dstMins = Array.from( at ) ;
	const dstMaxs = maxs.map( ( max , d ) => max + shift[ d ] ) ;

	this._clipRegion( mins , maxs ) ;
	toNDArray._clipRegion( dstMins , dstMaxs ) ;

	if ( ! this._mutualClipRegion( mins , maxs , dstMins , dstMaxs , shift ) ) {
		// Nothing to do, everything was clipped away
		return ;
	}

	this._dualStepCopy( toNDArray , mins , maxs , dstMins , dstMaxs ) ;
} ;



// /!\ WARNING /!\ INTERNAL USAGE /!\ Only work if both src and dst minmax have the same size!
NDArray.prototype._dualStepCopy = function( dst , mins , maxs , dstMins , dstMaxs ) {
	const srcGen = this._eachInRegion( mins , maxs ) ;
	const dstGen = dst._eachInRegion( dstMins , dstMaxs ) ;

	let srcItem , dstItem ;

	for ( ;; ) {
		srcItem = srcGen.next().value ;
		if ( ! srcItem ) { return ; }
		dstItem = dstGen.next().value ;
		dst.storage[ dstItem.index ] = srcItem.value ;
	}
} ;



// /!\ WARNING /!\ INTERNAL USAGE /!\ Only work if both src and dst minmax have the same size!
NDArray.prototype._dualStepCallback = function( dst , mins , maxs , dstMins , dstMaxs , callback ) {
	const srcGen = this._eachInRegion( mins , maxs ) ;
	const dstGen = dst._eachInRegion( dstMins , dstMaxs ) ;

	let srcItem , dstItem ;

	for ( ;; ) {
		srcItem = srcGen.next().value ;
		if ( ! srcItem ) { return ; }
		dstItem = dstGen.next().value ;
		dst.storage[ dstItem.index ] = callback( srcItem.value , srcItem.coords , srcItem.index , this ) ;
	}
} ;



NDArray.prototype._checkRegion = function( mins , maxs ) {
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



NDArray.prototype._clipRegion = function( mins , maxs ) {
	for ( let d = 0 ; d < this.dimensions ; d ++ ) {
		mins[ d ] = Math.max( this.mins[ d ] , Math.min( this.maxs[ d ] , maxs[ d ] , mins[ d ] ) ) ;
		maxs[ d ] = Math.max( this.mins[ d ] , Math.min( this.maxs[ d ] , maxs[ d ] ) ) ;
	}
} ;



// Return true if there is still a non-zero region, false otherwise
NDArray.prototype._mutualClipRegion = function( mins , maxs , dstMins , dstMaxs , shift ) {
	for ( let d = 0 ; d < this.dimensions ; d ++ ) {
		// Check if they have the same size
		if ( maxs[ d ] - mins[ d ] !== dstMaxs[ d ] - dstMins[ d ] ) {
			// Need clipping!

			// unshift dst minmax
			let uDstMin = dstMins[ d ] - shift[ d ] ;
			let uDstMax = dstMaxs[ d ] - shift[ d ] ;
			uDstMin = mins[ d ] = Math.max( uDstMin , mins[ d ] ) ;
			uDstMax = maxs[ d ] = Math.min( uDstMax , maxs[ d ] ) ;

			// Check if the mutual region still exist or has been entirely clipped away
			if ( uDstMin > uDstMax ) { return false ; }

			// shift again dst minmax
			dstMins[ d ] = uDstMin + shift[ d ] ;
			dstMaxs[ d ] = uDstMax + shift[ d ] ;
		}
	}

	return true ;
} ;

