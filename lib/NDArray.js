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
	NDArray( [ dataStorage | Constructor ] , [ sizes | region ] , [ params ] )

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
function NDArray( dataOrConstructor , sizes , params ) {
	let dimensions , noInit = false ;

	if ( typeof dataOrConstructor === 'number' ) {
		dimensions = dataOrConstructor ;
		noInit = true ;	// Fast mode, for cloning and similar things
	}
	else {
		dimensions = sizes.length ;
	}

	// The number of dimension of the ND-array, e.g. 2D, 3D, ...
	this.dimensions = dimensions ;

	// Define the size in each axis
	this.sizes = new Array( dimensions ) ;

	// The full logical size of the ND-array, each axis-size multiplied
	// /!\ IT'S NOT THE PHYSICAL SIZE /!\
	// See .dataStart and .dataEnd for that.
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

	// Use to speed up the whole array iteration
	this.backStrides = new Array( dimensions ) ;

	// This is the index of the first logical element in the physical data storage
	this.offset = 0 ;

	// True if the physical backend is contiguous, that can speed up some operation like .fill()
	this.isContiguous = true ;

	// This is physical start and end of the ND-array in the data storage
	this.dataStart = 0 ;
	this.dataEnd = 0 ;

	// The underlying physical data store backend.
	// Can be: Array, TypedArray, Buffer... anything that is indexed.
	this.data = null ;

	if ( ! noInit ) {
		this._init( dataOrConstructor , sizes , params ) ;
	}
}

module.exports = NDArray ;



NDArray.prototype._init = function( dataOrConstructor , sizes , params = {} ) {
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
	this._initStridesFromSizes( params.stride ) ;

	// The index where the ND-array region starts
	this.dataStart = params.dataStart || 0 ;

	// Compute data store start and end
	//this._initStartEndFromOffsetSizesStrides() ;
	this._initOffsetEndFromStartSizesStrides() ;

	// Set or create a new data store
	if ( typeof dataOrConstructor === 'function' ) {
		if ( typeof dataOrConstructor.allocUnsafe === 'function' ) {
			// Detect Node.js's Buffer without referencing it (avoid browser compatibility layer)
			this.data = dataOrConstructor.allocUnsafe( this.dataEnd ) ;
		}
		else {
			this.data = new dataOrConstructor( this.dataEnd ) ;
		}
	}
	else {
		/*
		// Not sure it's good to check the length, since Array is extensible and only rarer TypedArray is fixed
		if ( dataOrConstructor.length < this.dataEnd ) {
			throw new RangeError( "Provided data store is too small (expecting at least " + this.dataEnd + " but got " + dataOrConstructor.length ) ;
		}
		*/
		this.data = dataOrConstructor ;
	}
} ;

// Fragmented init, because it can be re-use by various cloning things

NDArray.prototype._initMinsMaxsSizesFromRegion = function( region ) {
	this.size = 1 ;

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
NDArray.prototype._initStridesFromSizes = function( nextStride = 1 ) {
	// It's always contiguous when strides start at 1
	this.isContiguous = nextStride === 1 ;

	for ( const d of this.order ) {
		this.strides[ d ] = nextStride ;
		this.backStrides[ d ] = ( 1 - this.sizes[ d ] ) * nextStride ;
		nextStride *= this.sizes[ d ] ;
	}
} ;

// Strides is not passed as argument, it should already be computed on the instance
NDArray.prototype._initOrderFromStrides = function() {
	this.order = Array.from( { length: this.strides.length } , ( v , i ) => i ) ;
	this.order.sort( ( a , b ) => this.strides[ a ] - this.strides[ b ] ) ;
} ;

// Offset, sizes and strides are not passed as argument, they should already be computed on the instance
NDArray.prototype._initOffsetEndFromStartSizesStrides = function() {
	this.dataEnd = this.dataStart + 1 ;
	this.offset = this.dataStart ;

	for ( let d = 0 ; d < this.dimensions ; d ++ ) {
		const shift = this.strides[ d ] * ( this.sizes[ d ] - 1 ) ;

		if ( shift >= 0 ) {
			this.dataEnd += shift ;
		}
		else {
			this.dataEnd -= shift ;
			this.offset -= shift ;
		}
	}
} ;

// Offset, sizes and strides are not passed as argument, they should already be computed on the instance
NDArray.prototype._initStartEndFromOffsetSizesStrides = function() {
	this.dataStart = this.offset ;
	this.dataEnd = this.offset + 1 ;

	for ( const d of this.order ) {
		if ( this.strides[ d ] >= 0 ) {
			this.dataEnd += this.strides[ d ] * ( this.sizes[ d ] - 1 ) ;
		}
		else {
			this.dataStart += this.strides[ d ] * ( this.sizes[ d ] - 1 ) ;
		}
	}
} ;

// Init .isContiguous based on strides and sizes.
// Usually only called for views, because if ._initStridesFromSizes() is called it already set it to the right value.
NDArray.prototype._initIsContiguousFromStridesSizes = function() {
	let nextStride = 1 ;

	for ( const d of this.order ) {
		const absStride = Math.abs( this.strides[ d ] ) ;

		if ( absStride !== nextStride ) {
			this.isContiguous = false ;
			return ;
		}

		nextStride *= absStride ;
	}

	this.isContiguous = true ;
} ;



// Create a new data back-end from another one
// sliceStart and sliceEnd are optional
NDArray.prototype._createDataFrom = function( data , sliceStart = 0 , sliceEnd = data.length ) {
	if ( Array.isArray( data ) ) {
		this.data = data.slice( sliceStart , sliceEnd ) ;
	}
	else if ( typeof data.constructor.allocUnsafe === 'function' ) {
		// Detect Node.js's Buffer without referencing it (avoid browser compatibility layer)
		this.data = data.constructor.allocUnsafe( sliceEnd - sliceStart ) ;
		data.copy( this.data , 0 , sliceStart , sliceEnd ) ;
	}
	else if ( typeof data.slice === 'function' ) {
		this.data = data.slice( sliceStart , sliceEnd ) ;
	}
	else {
		this.data = new data.constructor( data.length ) ;

		for ( let src = sliceStart , dst = 0 ; src < sliceEnd ; src ++ , dst ++ ) {
			this.data[ dst ] = data[ src ] ;
		}
	}
} ;



// Create a new data store of the same type
NDArray.prototype._newStorageOfTheSameKind = function( size = this.dataEnd - this.dataStart ) {
	if ( typeof this.data?.constructor?.allocUnsafe === 'function' ) {
		// Detect Node.js's Buffer referencing it (avoid browser compatibility layer)
		return this.data.constructor.allocUnsafe( size ) ;
	}

	return new this.data.constructor( size ) ;
} ;



// Make the array zero-based, or based on the provided mins vector
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

	return this ;
} ;



// Translate, moving the coordinates of each value
NDArray.prototype.translate = function( translation ) {
	for ( let d = 0 ; d < this.dimensions ; d ++ ) {
		this.mins[ d ] += translation[ d ] ;
		this.maxs[ d ] += translation[ d ] ;
	}

	return this ;
} ;



// Flip coordinates along a dimension, but preserving min and max
NDArray.prototype.flip = function( dimension ) {
	if ( dimension < 0 || dimension >= this.dimensions ) {
		throw new RangeError( "Bad dimension, should be between [0," + this.dimensions + ") but got: " + dimension ) ;
	}

	this.strides[ dimension ] *= - 1 ;
	this.backStrides[ dimension ] *= - 1 ;
	this._initOffsetEndFromStartSizesStrides() ;

	return this ;
} ;

// Flip coordinates along all dimensions at once, but preserving min and max
NDArray.prototype.flipAll = function() {
	for ( let d = 0 ; d < this.dimensions ; d ++ ) {
		this.strides[ d ] *= - 1 ;
		this.backStrides[ d ] *= - 1 ;
	}

	this._initOffsetEndFromStartSizesStrides() ;
	return this ;
} ;



// Transpose: swap coordinates orders
NDArray.prototype.transpose = function( ... dimensionList ) {
	// It's not possible to swap because each dimension look up for the source at its original place
	const dMax = Math.min( dimensionList.length , this.dimensions ) ,
		sizes = new Array( this.dimensions ) ,
		mins = new Array( this.dimensions ) ,
		maxs = new Array( this.dimensions ) ,
		order = new Array( this.dimensions ) ,
		strides = new Array( this.dimensions ) ,
		backStrides = new Array( this.dimensions ) ;

	for ( let d = 0 ; d < dMax ; d ++ ) {
		const fromD = dimensionList[ d ] ;
		sizes[ d ] = this.sizes[ fromD ] ;
		mins[ d ] = this.mins[ fromD ] ;
		maxs[ d ] = this.maxs[ fromD ] ;
		order[ d ] = this.order[ fromD ] ;
		strides[ d ] = this.strides[ fromD ] ;
		backStrides[ d ] = this.backStrides[ fromD ] ;
	}

	this.sizes = sizes ;
	this.mins = mins ;
	this.maxs = maxs ;
	this.order = order ;
	this.strides = strides ;
	this.backStrides = backStrides ;

	return this ;
} ;



/*
	Fix some axis and reduce the number of dimensions.
	Like .pick() in the "ndarray" package.

	Examples:
		.select( null , 3 , null )		fix the second coordinate to 3, the ND-array will now have 2 dimensions instead of 3
		.select( 1 , 3 , null )			fix the first and second coordinates respectively to 1 and 3, the ND-array will now have 1 dimensions instead of 3
*/
NDArray.prototype.select = function( ... coords ) {
	this.size = 1 ;

	// dimensions should be cached because it's modified along the way
	for ( let d = 0 , newD = 0 , dimensions = this.dimensions ; d < dimensions ; d ++ ) {
		const coord = coords[ d ] ;

		if ( coord === null || coord === undefined ) {
			this.size *= this.sizes[ newD ] ;
			newD ++ ;
		}
		else {
			this.offset += ( coord - this.mins[ newD ] ) * this.strides[ newD ] ;
			this.sizes.splice( newD , 1 ) ;
			this.mins.splice( newD , 1 ) ;
			this.maxs.splice( newD , 1 ) ;
			this.strides.splice( newD , 1 ) ;
			this.backStrides.splice( newD , 1 ) ;
			this.dimensions -- ;
		}
	}

	this._initOrderFromStrides() ;
	this._initStartEndFromOffsetSizesStrides() ;
	this._initIsContiguousFromStridesSizes() ;

	return this ;
} ;



// Clone only the view, the data storage is the same
NDArray.prototype.cloneView =
NDArray.prototype.view = function() {
	const newNDArray = this._cloneLogical( true ) ;
	newNDArray.data = this.data ;
	return newNDArray ;
} ;



// Full clone
NDArray.prototype.clone = function() {
	const newNDArray = this._cloneLogical() ;
	newNDArray._createDataFrom( this.data , this.dataStart , this.dataEnd ) ;
	return newNDArray ;
} ;



// Create a new clone of the current NDArray with the same geometry but an empty (but ready) data
// The new data is limited to the used size (dataStart = 0) except if keepDataStart is set to true.
NDArray.prototype._cloneLogical = function( keepDataStart = false ) {
	const newNDArray = new NDArray( this.dimensions ) ;

	// Copy geometry
	Object.assign( newNDArray.order , this.order ) ;
	Object.assign( newNDArray.sizes , this.sizes ) ;
	newNDArray.size = this.size ;
	Object.assign( newNDArray.mins , this.mins ) ;
	Object.assign( newNDArray.maxs , this.maxs ) ;
	Object.assign( newNDArray.strides , this.strides ) ;
	Object.assign( newNDArray.backStrides , this.backStrides ) ;

	if ( keepDataStart ) {
		newNDArray.dataStart = this.dataStart ;
		newNDArray.dataEnd = this.dataEnd ;
		newNDArray.offset = this.offset ;
	}
	else {
		// Start at index=0 in the physical storage
		newNDArray.offset = this.offset - this.dataStart ;
		newNDArray.dataEnd = this.dataEnd - this.dataStart ;
	}

	return newNDArray ;
} ;



// Clone with a modified geometry
NDArray.prototype._resizeLogical = function( mins , maxs ) {
	const newNDArray = new NDArray( this.dimensions ) ;

	Object.assign( newNDArray.order , this.order ) ;
	newNDArray._initSizesFromMinsMaxs( mins , maxs ) ;
	newNDArray._initStridesFromSizes() ;
	newNDArray._initOffsetEndFromStartSizesStrides() ;

	return newNDArray ;
} ;



// Internal version without any unnessessary test
// Classic strided array access is:
// index = coords[ 0 ] * strides[ 0 ] + coords[ 1 ] * strides[ 1 ] + ... + coords[ n ] * strides[ n ]
NDArray.prototype._getIndex = function( coords ) {
	let index = this.offset ;
	for ( let d = 0 ; d < this.dimensions ; d ++ ) { index += ( coords[ d ] - this.mins[ d ] ) * this.strides[ d ] ; }
	return index ;
} ;

NDArray.prototype._getIndexCheck = function( coords ) {
	let index = this.offset ;

	for ( let d = 0 ; d < this.dimensions ; d ++ ) {
		const c = coords[ d ] ;

		if ( c < this.mins[ d ] || c > this.maxs[ d ] ) {
			throw new RangeError( "Coordinate " + c + " out of bounds for dimension #" + d + " which is [" + this.mins[ d ] + "," + this.maxs[ d ] + "]" ) ;
		}

		index += ( c - this.mins[ d ] ) * this.strides[ d ] ;
	}

	return index ;
} ;

NDArray.prototype.getIndex = function( ... coords ) {
	if ( Array.isArray( coords[ 0 ] ) ) { coords = coords[ 0 ] ; }
	return this._getIndexCheck( coords ) ;
} ;



NDArray.prototype._getCoords = function( index , coords = new Array( this.dimensions ) ) {
	// Rebase the index
	index -= this.offset ;

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
	if ( index < this.dataStart || index >= this.dataEnd ) {
		throw new RangeError( "Index " + index + " out of bounds, which is [" + this.dataStart + "," + this.dataEnd + ")" ) ;
	}

	coords = coords ?? new Array( this.dimensions ) ;

	// Rebase the index
	index -= this.offset ;

	// Because of the division and modulo, this have to be done in the reverse order, from the biggest stride to the smallest.
	for ( let i = this.dimensions - 1 ; i >= 0 ; i -- ) {
		const d = this.order[ i ] ;
		coords[ d ] = Math.floor( index / this.strides[ d ] ) + this.mins[ d ] ;
		index = index % this.strides[ d ] ;
	}

	return coords ;
} ;



NDArray.prototype._get = function( coords ) { return this.data[ this._getIndex( coords ) ] ; } ;
NDArray.prototype._getCheck = function( coords ) { return this.data[ this._getIndexCheck( coords ) ] ; } ;
NDArray.prototype.get = function( ... coords ) {
	if ( Array.isArray( coords[ 0 ] ) ) { coords = coords[ 0 ] ; }
	return this.data[ this._getIndexCheck( coords ) ] ;
} ;



NDArray.prototype._set = function( coords , value ) { this.data[ this._getIndex( coords ) ] = value ; } ;
NDArray.prototype._setCheck = function( coords , value ) { this.data[ this._getIndexCheck( coords ) ] = value ; } ;
NDArray.prototype.set = function( ... args ) {
	if ( Array.isArray( args[ 0 ] ) ) {
		this.data[ this._getIndexCheck( args[ 0 ] ) ] = args[ 1 ] ;
	}
	else {
		// We don't care for the extra element in ._getIndexCheck()
		this.data[ this._getIndexCheck( args ) ] = args[ args.length - 1 ] ;
	}
} ;



NDArray.prototype.getVector = function( ... coords ) {
	if ( Array.isArray( coords[ 0 ] ) ) { coords = coords[ 0 ] ; }
	const [ strideStartCoords , vectorDimension ] = this._getStrideStartAndVectorDimension( coords ) ;
	const index = this._getIndexCheck( strideStartCoords ) ;
	return this._getVectorAtIndex( index , vectorDimension ) ;
} ;

NDArray.prototype._getVector = function( strideStartCoords , vectorDimension ) {
	const index = this._getIndex( strideStartCoords ) ;
	return this._getVectorAtIndex( index , vectorDimension ) ;
} ;

NDArray.prototype._getVectorAtIndex = function( index , vectorDimension , vector = new Array( this.sizes[ vectorDimension ] ) ) {
	const iMax = this.sizes[ vectorDimension ] ;
	const stride = this.strides[ vectorDimension ] ;

	for ( let i = 0 ; i < iMax ; i ++ , index += stride ) {
		vector[ i ] = this.data[ index ] ;
	}

	return vector ;
} ;



NDArray.prototype.setVector = function( ... args ) {
	let strideStartCoords , vectorDimension , vector ;

	if ( Array.isArray( args[ 0 ] ) ) {
		[ strideStartCoords , vectorDimension ] = this._getStrideStartAndVectorDimension( args[ 0 ] ) ;
		vector = args[ 1 ] ;
	}
	else {
		// We don't care for the extra element in ._getStrideStartAndVectorDimension()
		[ strideStartCoords , vectorDimension ] = this._getStrideStartAndVectorDimension( args ) ;
		vector = args[ args.length - 1 ] ;
	}

	const index = this._getIndexCheck( strideStartCoords ) ;
	this._setVectorAtIndex( index , vectorDimension , vector ) ;
} ;

NDArray.prototype._setVector = function( strideStartCoords , vectorDimension , vector ) {
	const index = this._getIndex( strideStartCoords ) ;
	this._setVectorAtIndex( index , vectorDimension , vector ) ;
} ;

NDArray.prototype._setVectorAtIndex = function( index , vectorDimension , vector ) {
	const iMax = this.sizes[ vectorDimension ] ;
	const stride = this.strides[ vectorDimension ] ;

	for ( let i = 0 ; i < iMax ; i ++ , index += stride ) {
		this.data[ index ] = vector[ i ] ;
	}
} ;


NDArray.prototype._getStrideStartAndVectorDimension = function( coords ) {
	let vectorDimension = null ;
	const strideStartCoords = new Array( this.dimensions ) ;

	for ( let d = 0 ; d < this.dimensions ; d ++ ) {
		const coord = coords[ d ] ;
		if ( coord === null ) {
			if ( vectorDimension !== null ) {
				throw new Error( "*Vector*() methods require exactly one coord to be null" ) ;
			}

			vectorDimension = d ;
			strideStartCoords[ d ] = this.mins[ d ] ;
		}
		else {
			strideStartCoords[ d ] = coord ;
		}
	}

	if ( vectorDimension === null ) {
		throw new Error( "*Vector*() methods require exactly one coord to be null" ) ;
	}

	return [ strideStartCoords , vectorDimension ] ;
} ;



/*
	/!\ .forEach*() and .each*() methods are the backbone of the lib.
	Other high-level methods like .map*(), .copyTo*(), etc, all use .forEach*() or .each*().
*/

/*
	Iterate the whole ND-array over index (and convert to coords).

	BE CAREFUL! The callback receive a coords array that is not cloned, because it would slowdown iteration
	and would put a lot of work for the Garbage Collector for large ndarrays.
*/
NDArray.prototype.forEach =
NDArray.prototype._forEach = function( callback ) {
	return this._forEachInRegion( this.mins , this.maxs , callback , true ) ;
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

// wholeArray=true when coming from ._forEach()
NDArray.prototype._forEachInRegion = function( mins , maxs , callback , wholeArray = false ) {
	let backStrides , index ;
	const coords = Array.from( mins ) ;

	if ( wholeArray ) {
		backStrides = this.backStrides ;
		index = this.offset ;
	}
	else {
		backStrides = mins.map( ( min , d ) => ( min - maxs[ d ] ) * this.strides[ d ] ) ;
		index = this._getIndex( coords ) ;
	}

	for ( ;; ) {
		callback( this.data[ index ] , coords , index , this ) ;

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



NDArray.prototype.forEachVectorInRegion = function( mins , maxs , callback ) {
	if ( typeof maxs === 'function' ) {
		callback = maxs ;
		maxs = mins.map( minmax => minmax?.[ 1 ] ?? null ) ;
		mins = mins.map( minmax => minmax?.[ 0 ] ?? null ) ;
	}

	const [ strideStartCoords , vectorDimension ] = this._getStrideStartAndVectorDimension( mins ) ;
	this._forEachVectorInRegionCheck( strideStartCoords , maxs , vectorDimension , callback ) ;
} ;

NDArray.prototype._forEachVectorInRegionCheck = function( strideStartCoords , maxs , vectorDimension , callback ) {
	this._checkRegion( strideStartCoords , maxs , vectorDimension ) ;
	this._forEachVectorInRegion( strideStartCoords , maxs , vectorDimension , callback ) ;
} ;

NDArray.prototype._forEachVectorInRegion = function( strideStartCoords , maxs , vectorDimension , callback ) {
	const backStrides = strideStartCoords.map( ( min , d ) => ( min - maxs[ d ] ) * this.strides[ d ] ) ;
	const coords = Array.from( strideStartCoords ) ;
	const vector = new Array( this.sizes[ vectorDimension ] ) ;
	let index = this._getIndex( coords ) ;

	for ( ;; ) {
		this._getVectorAtIndex( index , vectorDimension , vector ) ;
		callback( vector , coords , index , this ) ;

		for ( let i = 0 ; i < this.dimensions ; i ++ ) {
			const d = this.order[ i ] ;

			if ( d === vectorDimension ) {
				if ( i === this.dimensions - 1 ) { return ; }
				// Just skip it without doing anything
				continue ;
			}

			if ( coords[ d ] >= maxs[ d ] ) {
				if ( i === this.dimensions - 1 ) { return ; }
				coords[ d ] = strideStartCoords[ d ] ;
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
// .each()
NDArray.prototype.each =
NDArray.prototype._each = function() {
	return this._eachInRegion( this.mins , this.maxs , true ) ;
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
// wholeArray=true when coming from ._each()
NDArray.prototype._eachInRegion = function*( mins , maxs , wholeArray = false ) {
	let backStrides , index ;
	const coords = Array.from( mins ) ;

	if ( wholeArray ) {
		backStrides = this.backStrides ;
		index = this.offset ;
	}
	else {
		backStrides = mins.map( ( min , d ) => ( min - maxs[ d ] ) * this.strides[ d ] ) ;
		index = this._getIndex( coords ) ;
	}

	const entry = { coords , index , value: undefined } ;

	for ( ;; ) {
		entry.value = this.data[ index ] ;
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

NDArray.prototype._eachInRegionBackward = function*( mins , maxs ) {
	const backStrides = mins.map( ( min , d ) => ( min - maxs[ d ] ) * this.strides[ d ] ) ;
	const coords = Array.from( maxs ) ;
	let index = this._getIndex( coords ) ;
	const entry = { coords , index , value: undefined } ;

	for ( ;; ) {
		entry.value = this.data[ index ] ;
		entry.index = index ;
		yield entry ;

		for ( let i = 0 ; i < this.dimensions ; i ++ ) {
			const d = this.order[ i ] ;

			if ( coords[ d ] <= mins[ d ] ) {
				if ( i === this.dimensions - 1 ) { return ; }
				coords[ d ] = maxs[ d ] ;
				// Return index back to min
				index -= backStrides[ d ] ;
			}
			else {
				coords[ d ] -- ;
				index -= this.strides[ d ] ;
				break ;
			}
		}
	}
} ;



// Return a Generator
// .eachInRegion( region )
// .eachInRegion( mins , maxs )
NDArray.prototype.eachVectorInRegion = function( mins , maxs ) {
	if ( ! maxs ) {
		maxs = mins.map( minmax => minmax?.[ 1 ] ?? null ) ;
		mins = mins.map( minmax => minmax?.[ 0 ] ?? null ) ;
	}

	const [ strideStartCoords , vectorDimension ] = this._getStrideStartAndVectorDimension( mins ) ;
	return this._eachVectorInRegionCheck( strideStartCoords , maxs , vectorDimension ) ;
} ;

NDArray.prototype._eachVectorInRegionCheck = function( strideStartCoords , maxs , vectorDimension ) {
	this._checkRegion( strideStartCoords , maxs , vectorDimension ) ;
	return this._eachVectorInRegion( strideStartCoords , maxs , vectorDimension ) ;
} ;

// Generator
// The yielded entry { coords , index , value } should be cloned, as well as entry.coords and entry.value if userland want to modify it
NDArray.prototype._eachVectorInRegion = function*( strideStartCoords , maxs , vectorDimension ) {
	const backStrides = strideStartCoords.map( ( min , d ) => ( min - maxs[ d ] ) * this.strides[ d ] ) ;
	const coords = Array.from( strideStartCoords ) ;
	const vector = new Array( this.sizes[ vectorDimension ] ) ;
	let index = this._getIndex( coords ) ;
	const entry = { coords , index , value: vector } ;

	for ( ;; ) {
		this._getVectorAtIndex( index , vectorDimension , vector ) ;
		entry.index = index ;
		yield entry ;

		for ( let i = 0 ; i < this.dimensions ; i ++ ) {
			const d = this.order[ i ] ;

			if ( d === vectorDimension ) {
				if ( i === this.dimensions - 1 ) { return ; }
				// Just skip it without doing anything
				continue ;
			}

			if ( coords[ d ] >= maxs[ d ] ) {
				if ( i === this.dimensions - 1 ) { return ; }
				coords[ d ] = strideStartCoords[ d ] ;
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
// The yielded entry { coords , index , value } should be cloned, as well as entry.coords and entry.value if userland want to modify it
NDArray.prototype._eachVectorInRegionBackward = function*( strideStartCoords , maxs , vectorDimension ) {
	const backStrides = strideStartCoords.map( ( min , d ) => ( min - maxs[ d ] ) * this.strides[ d ] ) ;
	const coords = Array.from( maxs ) ;
	coords[ vectorDimension ] = strideStartCoords[ vectorDimension ] ;
	const vector = new Array( this.sizes[ vectorDimension ] ) ;
	let index = this._getIndex( coords ) ;
	const entry = { coords , index , value: vector } ;

	for ( ;; ) {
		this._getVectorAtIndex( index , vectorDimension , vector ) ;
		entry.index = index ;
		yield entry ;

		for ( let i = 0 ; i < this.dimensions ; i ++ ) {
			const d = this.order[ i ] ;

			if ( d === vectorDimension ) {
				if ( i === this.dimensions - 1 ) { return ; }
				// Just skip it without doing anything
				continue ;
			}

			if ( coords[ d ] <= strideStartCoords[ d ] ) {
				if ( i === this.dimensions - 1 ) { return ; }
				coords[ d ] = maxs[ d ] ;
				// Return index back to min
				index -= backStrides[ d ] ;
			}
			else {
				coords[ d ] -- ;
				index -= this.strides[ d ] ;
				break ;
			}
		}
	}
} ;

// Generator
// Same than ._eachVectorInRegion() except the callback does not receive of vector, just the coords and index.
// Just a bit faster when you don't need the vector (e.g. dualStepVectorCallback()), since it's not created.
// The yielded entry { coords , index } should be cloned, as well as entry.coords if userland want to modify it
NDArray.prototype._eachVectorIndexInRegion = function*( strideStartCoords , maxs , vectorDimension ) {
	const backStrides = strideStartCoords.map( ( min , d ) => ( min - maxs[ d ] ) * this.strides[ d ] ) ;
	const coords = Array.from( strideStartCoords ) ;
	let index = this._getIndex( coords ) ;
	const entry = { coords , index } ;

	for ( ;; ) {
		entry.index = index ;
		yield entry ;

		for ( let i = 0 ; i < this.dimensions ; i ++ ) {
			const d = this.order[ i ] ;

			if ( d === vectorDimension ) {
				if ( i === this.dimensions - 1 ) { return ; }
				// Just skip it without doing anything
				continue ;
			}

			if ( coords[ d ] >= maxs[ d ] ) {
				if ( i === this.dimensions - 1 ) { return ; }
				coords[ d ] = strideStartCoords[ d ] ;
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
// Same than ._eachVectorInRegion() except the callback does not receive of vector, just the coords and index.
// Just a bit faster when you don't need the vector (e.g. dualStepVectorCallback()), since it's not created.
// The yielded entry { coords , index } should be cloned, as well as entry.coords if userland want to modify it
NDArray.prototype._eachVectorIndexInRegionBackward = function*( strideStartCoords , maxs , vectorDimension ) {
	const backStrides = strideStartCoords.map( ( min , d ) => ( min - maxs[ d ] ) * this.strides[ d ] ) ;
	const coords = Array.from( maxs ) ;
	coords[ vectorDimension ] = strideStartCoords[ vectorDimension ] ;
	let index = this._getIndex( coords ) ;
	const entry = { coords , index } ;

	for ( ;; ) {
		entry.index = index ;
		yield entry ;

		for ( let i = 0 ; i < this.dimensions ; i ++ ) {
			const d = this.order[ i ] ;

			if ( d === vectorDimension ) {
				if ( i === this.dimensions - 1 ) { return ; }
				// Just skip it without doing anything
				continue ;
			}

			if ( coords[ d ] <= strideStartCoords[ d ] ) {
				if ( i === this.dimensions - 1 ) { return ; }
				coords[ d ] = maxs[ d ] ;
				// Return index back to min
				index -= backStrides[ d ] ;
			}
			else {
				coords[ d ] -- ;
				index -= this.strides[ d ] ;
				break ;
			}
		}
	}
} ;



NDArray.prototype.cursor = function( mins , maxs ) {
	return new Cursor( this , mins , maxs ) ;
} ;



const falseFn = () => false ;

function Cursor( ndarray , mins , maxs ) {
	this.ndarray = ndarray ;

	if ( ! mins ) {
		this.mins = ndarray.mins ;
		this.maxs = ndarray.maxs ;
		this.backStrides = ndarray.backStrides ;
		this.coords = Array.from( this.mins ) ;
		this.index = ndarray.offset ;
	}
	else {
		if ( ! maxs ) {
			this.maxs = mins.map( minmax => minmax[ 1 ] ) ;
			this.mins = mins.map( minmax => minmax[ 0 ] ) ;
		}
		else {
			this.mins = mins ;
			this.maxs = maxs ;
		}

		this.backStrides = this.mins.map( ( min , d ) => ( min - this.maxs[ d ] ) * ndarray.strides[ d ] ) ;
		this.coords = Array.from( this.mins ) ;
		this.index = ndarray._getIndex( this.coords ) ;
	}

	this.value = ndarray.data[ this.index ] ;
	this.first = true ;
}

Cursor.prototype.next = function() {
	const ndarray = this.ndarray ;

	if ( this.first ) {
		this.first = false ;
		return true ;
	}

	for ( let i = 0 ; i < ndarray.dimensions ; i ++ ) {
		const d = ndarray.order[ i ] ;

		if ( this.coords[ d ] >= this.maxs[ d ] ) {
			if ( i === ndarray.dimensions - 1 ) {
				this.next = falseFn ;
				return false ;
			}

			this.coords[ d ] = this.mins[ d ] ;
			// Return index back to min
			this.index += this.backStrides[ d ] ;
		}
		else {
			this.coords[ d ] ++ ;
			this.index += ndarray.strides[ d ] ;
			break ;
		}
	}

	this.value = ndarray.data[ this.index ] ;
	return true ;
} ;



NDArray.prototype.fill = function( value ) {
	if ( this.isContiguous ) {
		// Fast path: iterate directly on the physical data
		for ( let i = this.dataStart ; i < this.dataEnd ; i ++ ) {
			this.data[ i ] = value ;
		}
	}
	else {
		for ( const { index } of this._each() ) {
			this.data[ index ] = value ;
		}
	}

	return this ;
} ;

NDArray.prototype.fillInRegion = function( mins , maxs , value ) {
	if ( Array.isArray( mins[ 0 ] ) ) {
		value = maxs ;
		maxs = mins.map( minmax => minmax[ 1 ] ) ;
		mins = mins.map( minmax => minmax[ 0 ] ) ;
	}

	for ( const { index } of this._eachInRegionCheck( mins , maxs ) ) {
		this.data[ index ] = value ;
	}

	return this ;
} ;

NDArray.prototype.fillVectorInRegion = function( mins , maxs , vector ) {
	if ( Array.isArray( mins[ 0 ] ) ) {
		vector = maxs ;
		maxs = mins.map( minmax => minmax?.[ 1 ] ?? null ) ;
		mins = mins.map( minmax => minmax?.[ 0 ] ?? null ) ;
	}

	const [ strideStartCoords , vectorDimension ] = this._getStrideStartAndVectorDimension( mins ) ;

	for ( const { index } of this._eachVectorInRegionCheck( strideStartCoords , maxs , vectorDimension ) ) {
		this._setVectorAtIndex( index , vectorDimension , vector ) ;
	}

	return this ;
} ;



/*
	The classic .map(), returning a new ND-Array with its own data storage.
*/
NDArray.prototype.map = function( callback ) {
	const newNDArray = this._cloneLogical() ;
	newNDArray.data = this._newStorageOfTheSameKind() ;

	this._forEach( ( value , coords , index ) => {
		newNDArray.data[ index - this.dataStart ] = callback( value , coords , index , this ) ;
	} ) ;

	return newNDArray ;
} ;

/*
	Works like .map() but with a region, and also produce a reduced store.

	.mapInRegion( region , callback )
	.mapInRegion( mins , maxs , callback )
*/
NDArray.prototype.mapInRegion = function( mins , maxs , callback ) {
	if ( typeof maxs === 'function' ) {
		callback = maxs ;
		maxs = mins.map( minmax => minmax[ 1 ] ) ;
		mins = mins.map( minmax => minmax[ 0 ] ) ;
	}

	this._checkRegion( mins , maxs ) ;
	const newNDArray = this._resizeLogical( mins , maxs ) ;
	newNDArray.data = this._newStorageOfTheSameKind( newNDArray.dataEnd ) ;

	this._dualStepCallback( newNDArray , mins , maxs , mins , maxs , callback ) ;

	return newNDArray ;
} ;

/*
	Works like .mapInRegion() but with vectors.

	.mapVectorInRegion( region , callback )
	.mapVectorInRegion( mins , maxs , callback )
*/
NDArray.prototype.mapVectorInRegion = function( mins , maxs , callback ) {
	let strideStartCoords , strideEndCoords , vectorDimension ;

	if ( typeof maxs === 'function' ) {
		callback = maxs ;
		strideEndCoords = maxs = mins.map( minmax => minmax?.[ 1 ] ?? null ) ;
		mins = mins.map( minmax => minmax?.[ 0 ] ?? null ) ;
		[ strideStartCoords , vectorDimension ] = this._getStrideStartAndVectorDimension( mins ) ;
	}
	else {
		[ strideStartCoords , vectorDimension ] = this._getStrideStartAndVectorDimension( mins ) ;
		strideEndCoords = Array.from( maxs ) ;
	}

	strideEndCoords[ vectorDimension ] = this.maxs[ vectorDimension ] ;

	this._checkRegion( strideStartCoords , strideEndCoords , vectorDimension ) ;
	const newNDArray = this._resizeLogical( strideStartCoords , strideEndCoords ) ;
	newNDArray.data = this._newStorageOfTheSameKind( newNDArray.dataEnd ) ;

	this._dualStepVectorCallback( newNDArray , strideStartCoords , strideEndCoords , strideStartCoords , strideEndCoords , vectorDimension , callback ) ;

	return newNDArray ;
} ;



/*
	Similar to .map(), but modify in-place.
*/
NDArray.prototype.update = function( callback ) {
	this._forEach( ( value , coords , index ) => {
		this.data[ index ] = callback( value , coords , index , this ) ;
	} ) ;

	return this ;
} ;

/*
	Modify a region in-place.

	.updateInRegion( region , callback )
	.updateInRegion( mins , maxs , callback )
*/
NDArray.prototype.updateInRegion = function( mins , maxs , callback ) {
	if ( typeof maxs === 'function' ) {
		callback = maxs ;
		maxs = mins.map( minmax => minmax[ 1 ] ) ;
		mins = mins.map( minmax => minmax[ 0 ] ) ;
	}

	this._forEachInRegionCheck( mins , maxs , ( value , coords , index ) => {
		this.data[ index ] = callback( value , coords , index , this ) ;
	} ) ;

	return this ;
} ;

/*
	Works like .updateInRegion() but with vectors.

	.updateVectorInRegion( region , callback )
	.updateVectorInRegion( mins , maxs , callback )
*/
NDArray.prototype.updateVectorInRegion = function( mins , maxs , callback ) {
	let strideStartCoords , strideEndCoords , vectorDimension ;

	if ( typeof maxs === 'function' ) {
		callback = maxs ;
		strideEndCoords = maxs = mins.map( minmax => minmax?.[ 1 ] ?? null ) ;
		mins = mins.map( minmax => minmax?.[ 0 ] ?? null ) ;
		[ strideStartCoords , vectorDimension ] = this._getStrideStartAndVectorDimension( mins ) ;
	}
	else {
		[ strideStartCoords , vectorDimension ] = this._getStrideStartAndVectorDimension( mins ) ;
		strideEndCoords = Array.from( maxs ) ;
	}

	strideEndCoords[ vectorDimension ] = this.maxs[ vectorDimension ] ;

	this._forEachVectorInRegionCheck( strideStartCoords , strideEndCoords , vectorDimension , ( value , coords , index ) => {
		this._setVectorAtIndex( index , vectorDimension , callback( value , coords , index , this ) ) ;
	} ) ;

	return this ;
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
	const newNDArray = this._resizeLogical( mins , maxs ) ;
	newNDArray.data = this._newStorageOfTheSameKind( newNDArray.dataEnd ) ;

	this._dualStepCopy( newNDArray , mins , maxs , mins , maxs ) ;

	return newNDArray ;
} ;



/*
	Copy to another ND-array.

	.copyTo( toNDArray )
	.copyTo( toNDArray , at )
	.copyTo( toNDArray , at , region )
	.copyTo( toNDArray , at , mins , maxs )

	toNDArray: the destination ND-Array to copy into
	at: array vector, the position in the destination where to start copying (the mins of the copy region in the destination)
		if omitted: copy at the minimum (e.g. top-left for image, etc...)
	region: the region of the source to copy from, if omitted: the whole region
	mins: the mins of the region to copy from
	maxs: the maxs of the region to copy from
*/
NDArray.prototype.copyTo = function( toNDArray , at , mins , maxs ) {
	if ( this.dimensions !== toNDArray.dimensions ) {
		throw new Error( ".copyTo(): uncompatible ND-arrays, the should have the same dimension (" + this.dimensions + "≠" + toNDArray.dimensions + ")" ) ;
	}

	if ( ! at ) {
		at = Array.from( toNDArray.mins ) ;
	}

	// mins and maxs should be copied, because that are later modified by ._clipRegion()
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

	this._copyTo( toNDArray , at , mins , maxs ) ;
} ;

NDArray.prototype._copyTo = function( toNDArray , at , mins , maxs ) {
	const shift = at.map( ( atCoord , d ) => atCoord - mins[ d ] ) ;
	const dstMins = Array.from( at ) ;
	const dstMaxs = maxs.map( ( max , d ) => max + shift[ d ] ) ;

	this._clipRegion( mins , maxs ) ;
	toNDArray._clipRegion( dstMins , dstMaxs ) ;

	if ( ! this._mutualClipRegion( mins , maxs , dstMins , dstMaxs , shift ) ) {
		// Nothing to do, everything was clipped away
		return ;
	}

	let backward = false ;

	if ( this.data === toNDArray.data ) {
		// This is a case of explicit or implicit copy-within
		// We can copy behind but not copy ahead with the regular ._dualStepCopy()
		const srcIndex = this._getIndex( mins ) ;
		const dstIndex = toNDArray._getIndex( dstMins ) ;

		if ( srcIndex < dstIndex ) {
			backward = true ;
		}
	}

	this._dualStepCopy( toNDArray , mins , maxs , dstMins , dstMaxs , backward ) ;
} ;

/*
	Copy a part of the ND-array into itself

	.copyWithin( at )
	.copyWithin( at , region )
	.copyWithin( at , mins , maxs )

	See .copyTo() for details.
*/
NDArray.prototype.copyWithin = function( at , mins , maxs ) { return this.copyTo( this , at , mins , maxs ) ; } ;



/*
	Combine into another ND-array.
	Like .copyTo() with a callback.

	.combineInto( toNDArray , callback )
	.combineInto( toNDArray , at , callback )
	.combineInto( toNDArray , at , region , callback )
	.combineInto( toNDArray , at , mins , maxs , callback )

	toNDArray: the destination ND-Array to copy into
	at: array vector, the position in the destination where to start copying (the mins of the copy region in the destination)
	  if omitted: copy at the minimum (e.g. top-left for image, etc...)
	region: the region of the source to copy from, if omitted: the whole region
	mins: the mins of the region to copy from
	maxs: the maxs of the region to copy from
	callback( srcItem , dstItem ): the function to call, that should return the value for an element, where:
		srcItem: an object describing the source element of the current iteration, where:
			value: the current element value
			coords: the current element coords
			index: the current element index in the data storage
		dstItem: an object describing the destination element of the current iteration, same properties than srcItem.
*/
NDArray.prototype.combineInto = function( toNDArray , at , mins , maxs , callback ) {
	if ( this.dimensions !== toNDArray.dimensions ) {
		throw new Error( ".combineInto(): uncompatible ND-arrays, the should have the same dimension (" + this.dimensions + "≠" + toNDArray.dimensions + ")" ) ;
	}

	// mins and maxs should be copied, because that are later modified by ._clipRegion()
	if ( typeof at === 'function' ) {
		callback = at ;
		at = Array.from( toNDArray.mins ) ;
		mins = Array.from( this.mins ) ;
		maxs = Array.from( this.maxs ) ;
	}
	else if ( typeof mins === 'function' ) {
		callback = mins ;
		mins = Array.from( this.mins ) ;
		maxs = Array.from( this.maxs ) ;
	}
	else if ( typeof maxs === 'function' ) {
		callback = maxs ;
		maxs = mins.map( minmax => minmax[ 1 ] ) ;
		mins = mins.map( minmax => minmax[ 0 ] ) ;
	}
	else {
		mins = Array.from( mins ) ;
		maxs = Array.from( maxs ) ;
	}

	this._combineInto( toNDArray , at , mins , maxs , callback ) ;
} ;

NDArray.prototype._combineInto = function( toNDArray , at , mins , maxs , callback ) {
	const shift = at.map( ( atCoord , d ) => atCoord - mins[ d ] ) ;
	const dstMins = Array.from( at ) ;
	const dstMaxs = maxs.map( ( max , d ) => max + shift[ d ] ) ;

	this._clipRegion( mins , maxs ) ;
	toNDArray._clipRegion( dstMins , dstMaxs ) ;

	if ( ! this._mutualClipRegion( mins , maxs , dstMins , dstMaxs , shift ) ) {
		// Nothing to do, everything was clipped away
		return ;
	}

	let backward = false ;

	if ( this.data === toNDArray.data ) {
		// This is a case of explicit or implicit copy-within
		// We can copy behind but not copy ahead with the regular ._dualStepCopy()
		const srcIndex = this._getIndex( mins ) ;
		const dstIndex = toNDArray._getIndex( dstMins ) ;

		if ( srcIndex < dstIndex ) {
			backward = true ;
		}
	}

	this._dualStepCallbackWithDst( toNDArray , mins , maxs , dstMins , dstMaxs , callback , backward ) ;
} ;

/*
	Combine a part of the ND-array with itself

	.combineWithin( at , callback )
	.combineWithin( at , region , callback )
	.combineWithin( at , mins , maxs , callback )

	See .combineInto() for details.
*/
NDArray.prototype.combineWithin = function( at , mins , maxs , callback ) { return this.combineInto( this , at , mins , maxs , callback ) ; } ;



/*
	Combine vectors into another ND-array.
	Like .combineInto() but the callback receive a vector as the value.

	.combineVectorInto( toNDArray , vectorDimension , callback )
	.combineVectorInto( toNDArray , at , vectorDimension , callback )
	.combineVectorInto( toNDArray , at , region , callback )
	.combineVectorInto( toNDArray , at , mins , maxs , callback )

	toNDArray: the destination ND-Array to copy into
	vectorDimension : the dimension along which the vector lie
	at: array vector, the position in the destination where to start copying (the mins of the copy region in the destination)
	  if omitted: copy at the minimum (e.g. top-left for image, etc...)
	region: the region of the source to copy from, if omitted: the whole region
	mins: the mins of the region to copy from
	maxs: the maxs of the region to copy from
	callback( srcItem , dstItem ): the function to call, that should return the value for an element, where:
		srcItem: an object describing the source element of the current iteration, where:
			value: the current element vector
			coords: the current element coords
			index: the current element index in the data storage
		dstItem: an object describing the destination element of the current iteration, same properties than srcItem.
*/
NDArray.prototype.combineVectorInto = function( toNDArray , at , mins , maxs , callback ) {
	if ( this.dimensions !== toNDArray.dimensions ) {
		throw new Error( ".combineVectorInto(): uncompatible ND-arrays, they should have the same dimension (" + this.dimensions + "≠" + toNDArray.dimensions + ")" ) ;
	}

	let strideStartCoords , strideEndCoords , vectorDimension ;

	// at, mins and maxs should be copied, because that are later modified by ._clipRegion()
	if ( typeof mins === 'function' ) {
		// .combineVectorInto( toNDArray , vectorDimension , callback )
		callback = mins ;
		vectorDimension = at ;
		at = Array.from( toNDArray.mins ) ;
		strideStartCoords = mins = Array.from( this.mins ) ;
		strideEndCoords = maxs = Array.from( this.maxs ) ;
	}
	else if ( typeof maxs === 'function' ) {
		if ( typeof mins === 'number' ) {
			// .combineVectorInto( toNDArray , at , vectorDimension , callback )
			callback = maxs ;
			vectorDimension = mins ;
			at = Array.from( at ) ;
			strideStartCoords = mins = Array.from( this.mins ) ;
			strideEndCoords = maxs = Array.from( this.maxs ) ;
		}
		else {
			// .combineVectorInto( toNDArray , at , region , callback )
			callback = maxs ;
			at = Array.from( at ) ;
			strideEndCoords = maxs = mins.map( minmax => minmax?.[ 1 ] ?? null ) ;
			mins = mins.map( minmax => minmax?.[ 0 ] ?? null ) ;
			[ strideStartCoords , vectorDimension ] = this._getStrideStartAndVectorDimension( mins ) ;
		}
	}
	else {
		// .combineVectorInto( toNDArray , at , mins , maxs , callback )
		at = Array.from( at ) ;
		[ strideStartCoords , vectorDimension ] = this._getStrideStartAndVectorDimension( mins ) ;
		strideEndCoords = Array.from( maxs ) ;
	}

	at[ vectorDimension ] = this.mins[ vectorDimension ] ;
	strideEndCoords[ vectorDimension ] = this.maxs[ vectorDimension ] ;

	if ( this.sizes[ vectorDimension ] !== toNDArray.sizes[ vectorDimension ] ) {
		throw new Error( ".combineVectorInto(): uncompatible ND-arrays, they should have the same size along the vector's dimension (" + vectorDimension + ", but" + this.sizes[ vectorDimension ] + "≠" + toNDArray.sizes[ vectorDimension ] + ")" ) ;
	}

	this._combineVectorInto( toNDArray , at , strideStartCoords , strideEndCoords , vectorDimension , callback ) ;
} ;

NDArray.prototype._combineVectorInto = function( toNDArray , at , strideStartCoords , strideEndCoords , vectorDimension , callback ) {
	const shift = at.map( ( atCoord , d ) => atCoord - strideStartCoords[ d ] ) ;
	const dstStrideStartCoords = Array.from( at ) ;
	const dstStrideEndCoords = strideEndCoords.map( ( max , d ) => max + shift[ d ] ) ;

	this._clipRegion( strideStartCoords , strideEndCoords , vectorDimension ) ;
	toNDArray._clipRegion( dstStrideStartCoords , dstStrideEndCoords , vectorDimension ) ;

	if ( ! this._mutualClipRegion( strideStartCoords , strideEndCoords , dstStrideStartCoords , dstStrideEndCoords , shift , vectorDimension ) ) {
		// Nothing to do, everything was clipped away
		return ;
	}

	let backward = false ;

	if ( this.data === toNDArray.data ) {
		// This is a case of explicit or implicit copy-within
		// We can copy behind but not copy ahead with the regular ._dualStepCopy()
		const srcIndex = this._getIndex( strideStartCoords ) ;
		const dstIndex = toNDArray._getIndex( dstStrideStartCoords ) ;

		if ( srcIndex < dstIndex ) {
			backward = true ;
		}
	}

	this._dualStepVectorCallbackWithDst(
		toNDArray ,
		strideStartCoords , strideEndCoords ,
		dstStrideStartCoords , dstStrideEndCoords ,
		vectorDimension ,
		callback ,
		backward
	) ;
} ;

/*
	Combine a part of the ND-array with itself, vector by vector.

	.combineVectorWithin( at , callback )
	.combineVectorWithin( at , region , callback )
	.combineVectorWithin( at , mins , maxs , callback )

	See .combineVectorInto() for details.
*/
NDArray.prototype.combineVectorWithin = function( at , mins , maxs , callback ) { return this.combineVectorInto( this , at , mins , maxs , callback ) ; } ;



// /!\ WARNING /!\ All _dualStep*() methods are for INTERNAL USAGE ONLY /!\
// It only works if both src and dst minmax have the same size!

NDArray.prototype._dualStepCopy = function( dst , mins , maxs , dstMins , dstMaxs , backward = false ) {
	let srcGen , dstGen , srcItem , dstItem ;

	if ( backward ) {
		srcGen = this._eachInRegionBackward( mins , maxs ) ;
		dstGen = dst._eachInRegionBackward( dstMins , dstMaxs ) ;
	}
	else {
		srcGen = this._eachInRegion( mins , maxs ) ;
		dstGen = dst._eachInRegion( dstMins , dstMaxs ) ;
	}

	for ( ;; ) {
		srcItem = srcGen.next().value ;
		if ( ! srcItem ) { return ; }
		dstItem = dstGen.next().value ;
		dst.data[ dstItem.index ] = srcItem.value ;
	}
} ;

NDArray.prototype._dualStepCallback = function( dst , mins , maxs , dstMins , dstMaxs , callback , backward = false ) {
	let srcGen , dstGen , srcItem , dstItem ;

	if ( backward ) {
		srcGen = this._eachInRegionBackward( mins , maxs ) ;
		dstGen = dst._eachInRegionBackward( dstMins , dstMaxs ) ;
	}
	else {
		srcGen = this._eachInRegion( mins , maxs ) ;
		dstGen = dst._eachInRegion( dstMins , dstMaxs ) ;
	}

	for ( ;; ) {
		srcItem = srcGen.next().value ;
		if ( ! srcItem ) { return ; }
		dstItem = dstGen.next().value ;
		dst.data[ dstItem.index ] = callback( srcItem.value , srcItem.coords , srcItem.index , this ) ;
	}
} ;

NDArray.prototype._dualStepCallbackWithDst = function( dst , mins , maxs , dstMins , dstMaxs , callback , backward = false ) {
	let srcGen , dstGen , srcItem , dstItem ;

	if ( backward ) {
		srcGen = this._eachInRegionBackward( mins , maxs ) ;
		dstGen = dst._eachInRegionBackward( dstMins , dstMaxs ) ;
	}
	else {
		srcGen = this._eachInRegion( mins , maxs ) ;
		dstGen = dst._eachInRegion( dstMins , dstMaxs ) ;
	}

	for ( ;; ) {
		srcItem = srcGen.next().value ;
		if ( ! srcItem ) { return ; }
		dstItem = dstGen.next().value ;
		dst.data[ dstItem.index ] = callback( srcItem , dstItem , this ) ;
	}
} ;

NDArray.prototype._dualStepVectorCallback = function(
	dst ,
	strideStartCoords , strideEndCoords ,
	dstStrideStartCoords , dstStrideEndCoords ,
	vectorDimension ,
	callback ,
	backward = false
) {
	let srcGen , dstGen , srcItem , dstItem ;

	if ( backward ) {
		srcGen = this._eachVectorInRegionBackward( strideStartCoords , strideEndCoords , vectorDimension ) ;
		dstGen = dst._eachVectorIndexInRegionBackward( dstStrideStartCoords , dstStrideEndCoords , vectorDimension ) ;
	}
	else {
		srcGen = this._eachVectorInRegion( strideStartCoords , strideEndCoords , vectorDimension ) ;
		dstGen = dst._eachVectorIndexInRegion( dstStrideStartCoords , dstStrideEndCoords , vectorDimension ) ;
	}

	for ( ;; ) {
		srcItem = srcGen.next().value ;
		if ( ! srcItem ) { return ; }
		dstItem = dstGen.next().value ;
		dst._setVectorAtIndex( dstItem.index , vectorDimension , callback( srcItem.value , srcItem.coords , srcItem.index , this ) ) ;
	}
} ;

NDArray.prototype._dualStepVectorCallbackWithDst = function(
	dst ,
	strideStartCoords , strideEndCoords ,
	dstStrideStartCoords , dstStrideEndCoords ,
	vectorDimension ,
	callback ,
	backward = false
) {
	let srcGen , dstGen , srcItem , dstItem ;

	if ( backward ) {
		srcGen = this._eachVectorInRegionBackward( strideStartCoords , strideEndCoords , vectorDimension ) ;
		dstGen = dst._eachVectorInRegionBackward( dstStrideStartCoords , dstStrideEndCoords , vectorDimension ) ;
	}
	else {
		srcGen = this._eachVectorInRegion( strideStartCoords , strideEndCoords , vectorDimension ) ;
		dstGen = dst._eachVectorInRegion( dstStrideStartCoords , dstStrideEndCoords , vectorDimension ) ;
	}

	for ( ;; ) {
		srcItem = srcGen.next().value ;
		if ( ! srcItem ) { return ; }
		dstItem = dstGen.next().value ;
		dst._setVectorAtIndex( dstItem.index , vectorDimension , callback( srcItem , dstItem , this ) ) ;
	}
} ;



NDArray.prototype._checkRegion = function( mins , maxs , skipD = null ) {
	// Check mins/maxs range errors
	for ( let d = 0 ; d < this.dimensions ; d ++ ) {
		if (
			d !== skipD
			&& (
				mins[ d ] > maxs[ d ]
				|| mins[ d ] < this.mins[ d ]
				|| mins[ d ] > this.maxs[ d ]
				|| maxs[ d ] < this.mins[ d ]
				|| maxs[ d ] > this.maxs[ d ]
			)
		) {
			throw new RangeError( "Min-max coordinate [" + mins[ d ] + "," + maxs[ d ] + "] out of bounds for dimension #" + d + " which is [" + this.mins[ d ] + "," + this.maxs[ d ] + "]" ) ;
		}
	}
} ;



NDArray.prototype._clipRegion = function( mins , maxs , vectorDimension = null ) {
	for ( let d = 0 ; d < this.dimensions ; d ++ ) {
		if ( d !== vectorDimension ) {
			mins[ d ] = Math.max( this.mins[ d ] , Math.min( this.maxs[ d ] , maxs[ d ] , mins[ d ] ) ) ;
			maxs[ d ] = Math.max( this.mins[ d ] , Math.min( this.maxs[ d ] , maxs[ d ] ) ) ;
		}
	}
} ;



// Return true if there is still a non-zero region, false otherwise
NDArray.prototype._mutualClipRegion = function( mins , maxs , dstMins , dstMaxs , shift , vectorDimension = null ) {
	for ( let d = 0 ; d < this.dimensions ; d ++ ) {
		// Check if they have the same size
		if ( d !== vectorDimension && maxs[ d ] - mins[ d ] !== dstMaxs[ d ] - dstMins[ d ] ) {
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

