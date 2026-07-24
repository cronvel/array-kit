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



const falseFn = () => false ;

// Cursor Flags
ArrayND.CURSOR_FLAG = {
	NONE: 0 ,
	CHECK: 1 ,
	BACKWARD: 2 ,
	LOGICAL: 4
} ;

const CURSOR_FLAG = ArrayND.CURSOR_FLAG ;

ArrayND.LOGICAL_ORDER = [
	[] ,
	[ 0 ] ,
	[ 0 , 1 ] ,
	[ 0 , 1 , 2 ] ,
	[ 0 , 1 , 2 , 3 ] ,
	[ 0 , 1 , 2 , 3 , 4 ] ,
	[ 0 , 1 , 2 , 3 , 4 , 5 ] ,
	[ 0 , 1 , 2 , 3 , 4 , 5 , 6 ] ,
	[ 0 , 1 , 2 , 3 , 4 , 5 , 6 , 7 ] ,
	[ 0 , 1 , 2 , 3 , 4 , 5 , 6 , 7 , 8 ] ,
	[ 0 , 1 , 2 , 3 , 4 , 5 , 6 , 7 , 8 , 9 ]
	[ 0 , 1 , 2 , 3 , 4 , 5 , 6 , 7 , 8 , 9 , 10 ]
] ;

const LOGICAL_ORDER = ArrayND.LOGICAL_ORDER ;



/*
	Use ndarray() to create them, it will switch to the correct specialized class automatically (ArrayND/Array2D/Array3D/whatever).

	ArrayND( dimensions )	Internal, special case where nothing is init, it's the bare minium for cloning
	ArrayND( [ dataStorage | Constructor ] , [ sizes | region ] , [ params ] )

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
function ArrayND( dataOrConstructor , sizes , params ) {
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

	// We check that LOGICAL_ORDERS exist for this number of dimensions
	if ( ! LOGICAL_ORDER[ dimensions ] ) { LOGICAL_ORDER[ dimensions ] = Array.from( { length: dimensions } , ( _ , i ) => i ) ; }

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

module.exports = ArrayND ;



ArrayND.prototype._init = function( dataOrConstructor , sizes , params = {} ) {
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

ArrayND.prototype._initMinsMaxsSizesFromRegion = function( region ) {
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

ArrayND.prototype._initSizesFromMinsMaxs = function( mins , maxs ) {
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

ArrayND.prototype._initMinsMaxsFromSizes = function( sizes ) {
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
ArrayND.prototype._initStridesFromSizes = function( nextStride = 1 ) {
	// It's always contiguous when strides start at 1
	this.isContiguous = nextStride === 1 ;

	for ( const d of this.order ) {
		this.strides[ d ] = nextStride ;
		this.backStrides[ d ] = ( 1 - this.sizes[ d ] ) * nextStride ;
		nextStride *= this.sizes[ d ] ;
	}
} ;

// Strides is not passed as argument, it should already be computed on the instance
ArrayND.prototype._initOrderFromStrides = function() {
	this.order = Array.from( { length: this.strides.length } , ( v , i ) => i ) ;
	this.order.sort( ( a , b ) => this.strides[ a ] - this.strides[ b ] ) ;
} ;

// Offset, sizes and strides are not passed as argument, they should already be computed on the instance
ArrayND.prototype._initOffsetEndFromStartSizesStrides = function() {
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
ArrayND.prototype._initStartEndFromOffsetSizesStrides = function() {
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
ArrayND.prototype._initIsContiguousFromStridesSizes = function() {
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
ArrayND.prototype._createDataFrom = function( data , sliceStart = 0 , sliceEnd = data.length ) {
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
ArrayND.prototype._newStorageOfTheSameKind = function( size = this.dataEnd - this.dataStart ) {
	if ( typeof this.data?.constructor?.allocUnsafe === 'function' ) {
		// Detect Node.js's Buffer referencing it (avoid browser compatibility layer)
		return this.data.constructor.allocUnsafe( size ) ;
	}

	return new this.data.constructor( size ) ;
} ;



// Make the array zero-based, or based on the provided mins vector
ArrayND.prototype.rebase = function( mins ) {
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
ArrayND.prototype.translate = function( translation ) {
	for ( let d = 0 ; d < this.dimensions ; d ++ ) {
		this.mins[ d ] += translation[ d ] ;
		this.maxs[ d ] += translation[ d ] ;
	}

	return this ;
} ;



// Flip coordinates along a dimension, but preserving min and max
ArrayND.prototype.flip = function( dimension ) {
	if ( dimension < 0 || dimension >= this.dimensions ) {
		throw new RangeError( "Bad dimension, should be between [0," + this.dimensions + ") but got: " + dimension ) ;
	}

	this.strides[ dimension ] *= - 1 ;
	this.backStrides[ dimension ] *= - 1 ;
	this._initOffsetEndFromStartSizesStrides() ;

	return this ;
} ;

// Flip coordinates along all dimensions at once, but preserving min and max
ArrayND.prototype.flipAll = function() {
	for ( let d = 0 ; d < this.dimensions ; d ++ ) {
		this.strides[ d ] *= - 1 ;
		this.backStrides[ d ] *= - 1 ;
	}

	this._initOffsetEndFromStartSizesStrides() ;
	return this ;
} ;



// Transpose: swap coordinates orders
ArrayND.prototype.transpose = function( ... dimensionList ) {
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
// /!\ Should be redone, it must return a new view, because altering dimensions is not compatible with specialized class like Array2D
ArrayND.prototype.selectView_todo = function( ... coords ) {
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
ArrayND.prototype.cloneView =
ArrayND.prototype.view = function() {
	const newArrayND = this._cloneLogical( true ) ;
	newArrayND.data = this.data ;
	return newArrayND ;
} ;



// Full clone
ArrayND.prototype.clone = function() {
	const newArrayND = this._cloneLogical() ;
	newArrayND._createDataFrom( this.data , this.dataStart , this.dataEnd ) ;
	return newArrayND ;
} ;



// Create a new clone of the current ArrayND with the same geometry but an empty (but ready) data
// The new data is limited to the used size (dataStart = 0) except if keepDataStart is set to true.
ArrayND.prototype._cloneLogical = function( keepDataStart = false ) {
	const newArrayND = new ArrayND( this.dimensions ) ;

	// Copy geometry
	Object.assign( newArrayND.order , this.order ) ;
	Object.assign( newArrayND.sizes , this.sizes ) ;
	newArrayND.size = this.size ;
	Object.assign( newArrayND.mins , this.mins ) ;
	Object.assign( newArrayND.maxs , this.maxs ) ;
	Object.assign( newArrayND.strides , this.strides ) ;
	Object.assign( newArrayND.backStrides , this.backStrides ) ;

	if ( keepDataStart ) {
		newArrayND.dataStart = this.dataStart ;
		newArrayND.dataEnd = this.dataEnd ;
		newArrayND.offset = this.offset ;
	}
	else {
		// Start at index=0 in the physical storage
		newArrayND.offset = this.offset - this.dataStart ;
		newArrayND.dataEnd = this.dataEnd - this.dataStart ;
	}

	return newArrayND ;
} ;



// Clone with a modified geometry
ArrayND.prototype._resizeLogical = function( mins , maxs ) {
	const newArrayND = new ArrayND( this.dimensions ) ;

	Object.assign( newArrayND.order , this.order ) ;
	newArrayND._initSizesFromMinsMaxs( mins , maxs ) ;
	newArrayND._initStridesFromSizes() ;
	newArrayND._initOffsetEndFromStartSizesStrides() ;

	return newArrayND ;
} ;



// Internal version without any unnessessary test
// Classic strided array access is:
// index = coords[ 0 ] * strides[ 0 ] + coords[ 1 ] * strides[ 1 ] + ... + coords[ n ] * strides[ n ]
ArrayND.prototype.getIndexAt =
ArrayND.prototype._getIndexAt = function( coords ) {
	let index = this.offset ;
	for ( let d = 0 ; d < this.dimensions ; d ++ ) { index += ( coords[ d ] - this.mins[ d ] ) * this.strides[ d ] ; }
	return index ;
} ;

ArrayND.prototype.getIndexAt =
ArrayND.prototype._getIndexAtCheck = function( coords ) {
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

ArrayND.prototype.getIndex = function( ... coords ) { return this._getIndexAtCheck( coords ) ; } ;



ArrayND.prototype._getCoords = function( index , coords = new Array( this.dimensions ) ) {
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

ArrayND.prototype.getCoords =
ArrayND.prototype._getCoordsCheck = function( index , coords ) {
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



ArrayND.prototype._getAt = function( coords ) { return this.data[ this._getIndexAt( coords ) ] ; } ;
ArrayND.prototype.getAt =
ArrayND.prototype._getAtCheck = function( coords ) { return this.data[ this._getIndexAtCheck( coords ) ] ; } ;
ArrayND.prototype._get = function( ... coords ) { return this.data[ this._getIndexAt( coords ) ] ; } ;
ArrayND.prototype.get =
ArrayND.prototype._getCheck = function( ... coords ) { return this.data[ this._getIndexAtCheck( coords ) ] ; } ;



ArrayND.prototype._setAt = function( coords , value ) { this.data[ this._getIndexAt( coords ) ] = value ; } ;
ArrayND.prototype.setAt =
ArrayND.prototype._setAtCheck = function( coords , value ) { this.data[ this._getIndexAtCheck( coords ) ] = value ; } ;
ArrayND.prototype._set = function( ... args ) {
	// We don't care for the extra element in ._getIndexAtCheck()
	this.data[ this._getIndexAt( args ) ] = args[ args.length - 1 ] ;
} ;
ArrayND.prototype.set =
ArrayND.prototype._setCheck = function( ... args ) {
	// We don't care for the extra element in ._getIndexAtCheck()
	this.data[ this._getIndexAtCheck( args ) ] = args[ args.length - 1 ] ;
} ;



ArrayND.prototype._getVectorAt = function( coords ) {
	const [ strideStartCoords , vectorDimension ] = this._getStrideStartAndVectorDimension( coords ) ;
	const index = this._getIndexAt( strideStartCoords ) ;
	return this._getVectorAtIndex( index , vectorDimension ) ;
} ;

ArrayND.prototype._getVectorAtCheck =
ArrayND.prototype.getVectorAt = function( coords ) {
	const [ strideStartCoords , vectorDimension ] = this._getStrideStartAndVectorDimension( coords ) ;
	const index = this._getIndexAtCheck( strideStartCoords ) ;
	return this._getVectorAtIndex( index , vectorDimension ) ;
} ;

ArrayND.prototype.getVector = function( ... coords ) {
	const [ strideStartCoords , vectorDimension ] = this._getStrideStartAndVectorDimension( coords ) ;
	const index = this._getIndexAtCheck( strideStartCoords ) ;
	return this._getVectorAtIndex( index , vectorDimension ) ;
} ;



ArrayND.prototype._getVectorAtIndex = function( index , vectorDimension , vector = new Array( this.sizes[ vectorDimension ] ) ) {
	const iMax = this.sizes[ vectorDimension ] ;
	const stride = this.strides[ vectorDimension ] ;

	for ( let i = 0 ; i < iMax ; i ++ , index += stride ) {
		vector[ i ] = this.data[ index ] ;
	}

	return vector ;
} ;



ArrayND.prototype._setVectorAt = function( strideStartCoords , vectorDimension , vector ) {
	const index = this._getIndexAt( strideStartCoords ) ;
	this._setVectorAtIndex( index , vectorDimension , vector ) ;
} ;

ArrayND.prototype._setVectorAtCheck =
ArrayND.prototype.setVectorAt = function( coords , vector ) {
	const [ strideStartCoords , vectorDimension ] = this._getStrideStartAndVectorDimension( coords ) ;
	const index = this._getIndexAtCheck( strideStartCoords ) ;
	this._setVectorAtIndex( index , vectorDimension , vector ) ;
} ;

ArrayND.prototype.setVector = function( ... args ) {
	// We don't care for the extra element in ._getStrideStartAndVectorDimension()
	const [ strideStartCoords , vectorDimension ] = this._getStrideStartAndVectorDimension( args ) ;
	const vector = args[ args.length - 1 ] ;
	const index = this._getIndexAtCheck( strideStartCoords ) ;
	this._setVectorAtIndex( index , vectorDimension , vector ) ;
} ;



ArrayND.prototype._setVectorAtIndex = function( index , vectorDimension , vector ) {
	const iMax = this.sizes[ vectorDimension ] ;
	const stride = this.strides[ vectorDimension ] ;

	for ( let i = 0 ; i < iMax ; i ++ , index += stride ) {
		this.data[ index ] = vector[ i ] ;
	}
} ;



ArrayND.prototype._getStrideStartAndVectorDimension = function( coords ) {
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
	/!\ Cursor's methods are the backbone of the lib.
	Other high-level methods like .forEach*(), .map*(), .copyTo*(), etc, all use cursors
*/



function Cursor( ndarray , mins , maxs , flags = CURSOR_FLAG.NONE ) {
	this.ndarray = ndarray ;

	this.order = flags & CURSOR_FLAG.LOGICAL ? LOGICAL_ORDER[ ndarray.dimensions ] : ndarray.order ;

	if ( ! mins ) {
		this.mins = ndarray.mins ;
		this.maxs = ndarray.maxs ;
		this.backStrides = ndarray.backStrides ;
		this.coords = Array.from( flags & CURSOR_FLAG.BACKWARD ? this.maxs : this.mins ) ;
		this.index = ndarray.offset ;
	}
	else {
		if ( ! maxs ) {
			this.mins = mins.map( minmax => minmax[ 0 ] ) ;
			this.maxs = mins.map( minmax => minmax[ 1 ] ) ;
		}
		else {
			this.mins = mins ;
			this.maxs = maxs ;
		}

		this.backStrides = this.mins.map( ( min , d ) => ( min - this.maxs[ d ] ) * ndarray.strides[ d ] ) ;
		this.coords = Array.from( flags & CURSOR_FLAG.BACKWARD ? this.maxs : this.mins ) ;
		this.index = ndarray._getIndexAt( this.coords ) ;
	}

	// For some reasons, it seems that it's a bit fast to init it to a real value rather than null, probably related to type inference
	this.value = ndarray.data[ this.index ] ;

	if ( flags & CURSOR_FLAG.CHECK ) {
		ndarray._checkRegion( this.mins , this.maxs ) ;
	}


	// Revert the first, so the next() function doesn't have to check if it's the first call
	const order0 = this.order[ 0 ] ;

	if ( flags & CURSOR_FLAG.BACKWARD ) {
		this.coords[ order0 ] ++ ;
		this.index += ndarray.strides[ order0 ] ;
		this.next = this.backward ;
	}
	else {
		this.coords[ order0 ] -- ;
		this.index -= ndarray.strides[ order0 ] ;
		this.next = this.forward ;
	}
}

ArrayND.prototype.Cursor = Cursor ;

Cursor.prototype.forward = function() {
	const ndarray = this.ndarray ;

	let i = 0 ;

	for ( ;; ) {
		const d = this.order[ i ] ;

		if ( this.coords[ d ] < this.maxs[ d ] ) {
			this.coords[ d ] ++ ;
			this.index += ndarray.strides[ d ] ;
			this.value = ndarray.data[ this.index ] ;
			return true ;
		}

		if ( i === ndarray.dimensions - 1 ) {
			this.next = falseFn ;
			return false ;
		}

		this.coords[ d ] = this.mins[ d ] ;
		// Return index back to min
		this.index += this.backStrides[ d ] ;
		i ++ ;
	}
} ;

Cursor.prototype.backward = function() {
	const ndarray = this.ndarray ;

	let i = 0 ;

	for ( ;; ) {
		const d = this.order[ i ] ;

		if ( this.coords[ d ] > this.mins[ d ] ) {
			this.coords[ d ] -- ;
			this.index -= ndarray.strides[ d ] ;
			this.value = ndarray.data[ this.index ] ;
			return true ;
		}

		if ( i === ndarray.dimensions - 1 ) {
			this.next = falseFn ;
			return false ;
		}

		this.coords[ d ] = this.maxs[ d ] ;
		// Return index back to max
		this.index -= this.backStrides[ d ] ;
		i ++ ;
	}
} ;

// .cursor()
// .cursor( region , [flags] )
// .cursor( mins , maxs , [flags] )
ArrayND.prototype.cursor = function( mins , maxs , flags = CURSOR_FLAG.CHECK ) {
	return new this.Cursor( this , mins , maxs , flags ) ;
} ;

ArrayND.prototype._cursorCheck = function( mins , maxs , flags = CURSOR_FLAG.CHECK ) {
	return new this.Cursor( this , mins , maxs , flags | CURSOR_FLAG.CHECK) ;
} ;

ArrayND.prototype._cursor = function( mins , maxs , flags = CURSOR_FLAG.NONE ) {
	return new this.Cursor( this , mins , maxs , flags ) ;
} ;

// .backwardCursor()
// .backwardCursor( region , [flags] )
// .backwardCursor( mins , maxs , [flags] )
ArrayND.prototype._backwardCursorCheck = function( mins , maxs , flags = CURSOR_FLAG.CHECK | CURSOR_FLAG.BACKWARD ) {
	return new this.Cursor( this , mins , maxs , flags | CURSOR_FLAG.CHECK | CURSOR_FLAG.BACKWARD ) ;
} ;

ArrayND.prototype._backwardCursor = function( mins , maxs , flags = CURSOR_FLAG.BACKWARD ) {
	return new this.Cursor( this , mins , maxs , flags | CURSOR_FLAG.BACKWARD ) ;
} ;



function VectorCursor( ndarray , mins , maxs , flags = CURSOR_FLAG.NONE , vectorDimension = null ) {
	this.ndarray = ndarray ;

	this.order = flags & CURSOR_FLAG.LOGICAL ? LOGICAL_ORDER[ ndarray.dimensions ] : ndarray.order ;

	if ( vectorDimension === null ) {
		if ( ! maxs ) {
			this.mins = mins.map( minmax => minmax?.[ 0 ] ?? null ) ;
			this.maxs = mins.map( minmax => minmax?.[ 1 ] ?? null ) ;
		}
		else {
			this.mins = mins ;
			this.maxs = maxs ;
		}

		[ this.strideStartCoords , this.vectorDimension ] = ndarray._getStrideStartAndVectorDimension( this.mins ) ;
	}
	else {
		// If vectorDimension is set, mins and maxs are set too and are stride start/end
		this.mins = mins ;
		this.maxs = maxs ;
		this.strideStartCoords = mins ;
		this.vectorDimension = vectorDimension ;
	}

	this.backStrides = this.strideStartCoords.map( ( min , d ) => ( min - this.maxs[ d ] ) * ndarray.strides[ d ] ) ;

	if ( flags & CURSOR_FLAG.BACKWARD ) {
		this.coords = Array.from( this.maxs ) ;
		this.coords[ this.vectorDimension ] = this.strideStartCoords[ this.vectorDimension ] ;
	}
	else {
		this.coords = Array.from( this.strideStartCoords ) ;
	}

	this.index = ndarray._getIndexAt( this.coords ) ;
	this.value = new Array( ndarray.sizes[ this.vectorDimension ] ) ;

	if ( flags & CURSOR_FLAG.CHECK ) {
		ndarray._checkRegion( this.strideStartCoords , this.maxs , this.vectorDimension ) ;
	}


	// Revert the first, so the next() function doesn't have to check if it's the first call
	const order0 = this.vectorDimension === this.order[ 0 ] ? this.order[ 1 ] : this.order[ 0 ] ;

	if ( flags & CURSOR_FLAG.BACKWARD ) {
		this.coords[ order0 ] ++ ;
		this.index += ndarray.strides[ order0 ] ;
		this.next = this.backward ;
	}
	else {
		this.coords[ order0 ] -- ;
		this.index -= ndarray.strides[ order0 ] ;
		this.next = this.forward ;
	}
}

ArrayND.prototype.VectorCursor = VectorCursor ;

VectorCursor.prototype.forward = function() {
	const ndarray = this.ndarray ;

	let i = 0 ;

	for ( ;; ) {
		const d = this.order[ i ] ;

		if ( d === this.vectorDimension ) {
			if ( i === ndarray.dimensions - 1 ) {
				this.next = falseFn ;
				return false ;
			}
			// Just skip it without doing anything
			i ++ ;
			continue ;
		}

		if ( this.coords[ d ] < this.maxs[ d ] ) {
			this.coords[ d ] ++ ;
			this.index += ndarray.strides[ d ] ;
			ndarray._getVectorAtIndex( this.index , this.vectorDimension , this.value ) ;
			return true ;
		}

		if ( i === ndarray.dimensions - 1 ) {
			this.next = falseFn ;
			return false ;
		}

		this.coords[ d ] = this.strideStartCoords[ d ] ;
		// Return index back to min
		this.index += this.backStrides[ d ] ;
		i ++ ;
	}
} ;

VectorCursor.prototype.backward = function() {
	const ndarray = this.ndarray ;

	let i = 0 ;

	for ( ;; ) {
		const d = this.order[ i ] ;

		if ( d === this.vectorDimension ) {
			if ( i === ndarray.dimensions - 1 ) { return false ; }
			// Just skip it without doing anything
			i ++ ;
			continue ;
		}

		if ( this.coords[ d ] > this.strideStartCoords[ d ] ) {
			this.coords[ d ] -- ;
			this.index -= ndarray.strides[ d ] ;
			ndarray._getVectorAtIndex( this.index , this.vectorDimension , this.value ) ;
			return true ;
		}

		if ( i === ndarray.dimensions - 1 ) {
			this.next = falseFn ;
			return false ;
		}

		this.coords[ d ] = this.maxs[ d ] ;
		// Return index back to max
		this.index -= this.backStrides[ d ] ;
		i ++ ;
	}
} ;



// .vectorCursor( region , [flags] )
// .vectorCursor( mins , maxs , [flags] )
ArrayND.prototype.vectorCursor = function( mins , maxs , flags = CURSOR_FLAG.CHECK ) {
	return new this.VectorCursor( this , mins , maxs , flags ) ;
} ;

// ._vectorCursorCheck( region , [flags] )
// ._vectorCursorCheck( mins , maxs , [flags] )
ArrayND.prototype._vectorCursorCheck = function( mins , maxs , flags = CURSOR_FLAG.CHECK , vectorDimension = null ) {
	return new this.VectorCursor( this , mins , maxs , flags | CURSOR_FLAG.CHECK , vectorDimension ) ;
} ;

// ._vectorCursor( region , [flags] )
// ._vectorCursor( mins , maxs , [flags] )
// ._vectorCursor( strideStartCoords , strideEndCoords , vectorDimension , [flags] )
ArrayND.prototype._vectorCursor = function( mins , maxs , flags = CURSOR_FLAG.NONE , vectorDimension = null ) {
	return new this.VectorCursor( this , mins , maxs , flags , vectorDimension ) ;
} ;

// ._backwardVectorCursorCheck( region , [flags] )
// ._backwardVectorCursorCheck( mins , maxs , [flags] )
ArrayND.prototype._backwardVectorCursorCheck = function( mins , maxs , flags = CURSOR_FLAG.CHECK | CURSOR_FLAG.BACKWARD , vectorDimension = null ) {
	return new this.VectorCursor( this , mins , maxs , flags | CURSOR_FLAG.CHECK | CURSOR_FLAG.BACKWARD , vectorDimension ) ;
} ;

// ._backwardVectorCursor( region , [flags] )
// ._backwardVectorCursor( mins , maxs , [flags] )
// ._backwardVectorCursor( strideStartCoords , strideEndCoords , flags , vectorDimension )
ArrayND.prototype._backwardVectorCursor = function( mins , maxs , flags = CURSOR_FLAG.BACKWARD , vectorDimension = null ) {
	return new this.VectorCursor( this , mins , maxs , flags | CURSOR_FLAG.BACKWARD , vectorDimension ) ;
} ;



ArrayND.prototype.fill = function( value ) {
	if ( this.isContiguous ) {
		// Fast path: iterate directly on the physical data
		for ( let i = this.dataStart ; i < this.dataEnd ; i ++ ) {
			this.data[ i ] = value ;
		}
	}
	else {
		const cursor = this._cursor() ;

		while ( cursor.next() ) {
			this.data[ cursor.index ] = value ;
		}
	}

	return this ;
} ;

ArrayND.prototype.fillInRegion = function( mins , maxs , value ) {
	if ( Array.isArray( mins[ 0 ] ) ) {
		value = maxs ;
		maxs = mins.map( minmax => minmax[ 1 ] ) ;
		mins = mins.map( minmax => minmax[ 0 ] ) ;
	}

	const cursor = this._cursorCheck( mins , maxs ) ;

	while ( cursor.next() ) {
		this.data[ cursor.index ] = value ;
	}

	return this ;
} ;

ArrayND.prototype.fillVectorInRegion = function( mins , maxs , vector ) {
	if ( Array.isArray( mins[ 0 ] ) ) {
		vector = maxs ;
		maxs = mins.map( minmax => minmax?.[ 1 ] ?? null ) ;
		mins = mins.map( minmax => minmax?.[ 0 ] ?? null ) ;
	}

	const cursor = this._vectorCursorCheck( mins , maxs ) ;

	while ( cursor.next() ) {
		this._setVectorAtIndex( cursor.index , cursor.vectorDimension , vector ) ;
	}

	return this ;
} ;



/*
	The classic .forEach(), iterating all the ND-Array.
*/
ArrayND.prototype.forEach = function( callback ) {
	const cursor = this._cursor() ;

	while ( cursor.next() ) {
		callback( cursor.value , cursor.coords , cursor.index , this ) ;
	}
} ;

/*
	Works like .forEach() but with a region.

	.forEachInRegion( region , callback )
	.forEachInRegion( mins , maxs , callback )
*/
ArrayND.prototype.forEachInRegion = function( mins , maxs , callback ) {
	if ( typeof maxs === 'function' ) {
		callback = maxs ;
		maxs = undefined ;
	}

	const cursor = this._cursorCheck( mins , maxs ) ;

	while ( cursor.next() ) {
		callback( cursor.value , cursor.coords , cursor.index , this ) ;
	}
} ;

/*
	Works like .forEachInRegion() but with vectors.

	.forEachVectorInRegion( region , callback )
	.forEachVectorInRegion( mins , maxs , callback )
*/
ArrayND.prototype.forEachVectorInRegion = function( mins , maxs , callback ) {
	if ( typeof maxs === 'function' ) {
		callback = maxs ;
		maxs = undefined ;
	}

	const cursor = this._vectorCursorCheck( mins , maxs ) ;

	while ( cursor.next() ) {
		callback( cursor.value , cursor.coords , cursor.index , this ) ;
	}
} ;



/*
	The classic .map(), returning a new ND-Array with its own data storage.
*/
ArrayND.prototype.map = function( callback ) {
	const newArrayND = this._cloneLogical() ;
	newArrayND.data = this._newStorageOfTheSameKind() ;

	const cursor = this._cursor() ;

	while ( cursor.next() ) {
		newArrayND.data[ cursor.index - this.dataStart ] = callback( cursor.value , cursor.coords , cursor.index , this ) ;
	}

	return newArrayND ;
} ;

/*
	Works like .map() but with a region, and also produce a reduced store.

	.mapInRegion( region , callback )
	.mapInRegion( mins , maxs , callback )
*/
ArrayND.prototype.mapInRegion = function( mins , maxs , callback ) {
	if ( typeof maxs === 'function' ) {
		callback = maxs ;
		maxs = mins.map( minmax => minmax[ 1 ] ) ;
		mins = mins.map( minmax => minmax[ 0 ] ) ;
	}

	this._checkRegion( mins , maxs ) ;
	const newArrayND = this._resizeLogical( mins , maxs ) ;
	newArrayND.data = this._newStorageOfTheSameKind( newArrayND.dataEnd ) ;

	this._dualStepCallback( newArrayND , mins , maxs , mins , maxs , callback ) ;

	return newArrayND ;
} ;

/*
	Works like .mapInRegion() but with vectors.

	.mapVectorInRegion( region , callback )
	.mapVectorInRegion( mins , maxs , callback )
*/
ArrayND.prototype.mapVectorInRegion = function( mins , maxs , callback ) {
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
	const newArrayND = this._resizeLogical( strideStartCoords , strideEndCoords ) ;
	newArrayND.data = this._newStorageOfTheSameKind( newArrayND.dataEnd ) ;

	this._dualStepVectorCallback( newArrayND , strideStartCoords , strideEndCoords , strideStartCoords , strideEndCoords , vectorDimension , callback ) ;

	return newArrayND ;
} ;



/*
	Similar to .map(), but modify in-place.
*/
ArrayND.prototype.update = function( callback ) {
	const cursor = this._cursor() ;

	while ( cursor.next() ) {
		this.data[ cursor.index ] = callback( cursor.value , cursor.coords , cursor.index , this ) ;
	}

	return this ;
} ;

/*
	Modify a region in-place.

	.updateInRegion( region , callback )
	.updateInRegion( mins , maxs , callback )
*/
ArrayND.prototype.updateInRegion = function( mins , maxs , callback ) {
	if ( typeof maxs === 'function' ) {
		callback = maxs ;
		maxs = mins.map( minmax => minmax[ 1 ] ) ;
		mins = mins.map( minmax => minmax[ 0 ] ) ;
	}

	const cursor = this._cursorCheck( mins , maxs ) ;

	while ( cursor.next() ) {
		this.data[ cursor.index ] = callback( cursor.value , cursor.coords , cursor.index , this ) ;
	}

	return this ;
} ;

/*
	Works like .updateInRegion() but with vectors.

	.updateVectorInRegion( region , callback )
	.updateVectorInRegion( mins , maxs , callback )
*/
ArrayND.prototype.updateVectorInRegion = function( mins , maxs , callback ) {
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

	const cursor = this._vectorCursorCheck( strideStartCoords , strideEndCoords , undefined , vectorDimension ) ;

	while ( cursor.next() ) {
		this._setVectorAtIndex( cursor.index , cursor.vectorDimension , callback( cursor.value , cursor.coords , cursor.index , this ) ) ;
	}

	return this ;
} ;



/*
	Extract an region into a new ND-array, it has a new data store only with the correct size.

	.extractRegion( region )
	.extractRegion( mins , maxs )
*/
ArrayND.prototype.extractRegion = function( mins , maxs ) {
	if ( ! maxs ) {
		maxs = mins.map( minmax => minmax[ 1 ] ) ;
		mins = mins.map( minmax => minmax[ 0 ] ) ;
	}

	this._checkRegion( mins , maxs ) ;
	const newArrayND = this._resizeLogical( mins , maxs ) ;
	newArrayND.data = this._newStorageOfTheSameKind( newArrayND.dataEnd ) ;

	this._dualStepCopy( newArrayND , mins , maxs , mins , maxs ) ;

	return newArrayND ;
} ;



/*
	Copy to another ND-array.

	.copyTo( toArrayND )
	.copyTo( toArrayND , at )
	.copyTo( toArrayND , at , region )
	.copyTo( toArrayND , at , mins , maxs )

	toArrayND: the destination ND-Array to copy into
	at: array vector, the position in the destination where to start copying (the mins of the copy region in the destination)
		if omitted: copy at the minimum (e.g. top-left for image, etc...)
	region: the region of the source to copy from, if omitted: the whole region
	mins: the mins of the region to copy from
	maxs: the maxs of the region to copy from
*/
ArrayND.prototype.copyTo = function( toArrayND , at , mins , maxs ) {
	if ( this.dimensions !== toArrayND.dimensions ) {
		throw new Error( ".copyTo(): uncompatible ND-arrays, the should have the same dimension (" + this.dimensions + "≠" + toArrayND.dimensions + ")" ) ;
	}

	if ( ! at ) {
		at = Array.from( toArrayND.mins ) ;
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

	this._copyTo( toArrayND , at , mins , maxs ) ;
} ;

ArrayND.prototype._copyTo = function( toArrayND , at , mins , maxs ) {
	const shift = at.map( ( atCoord , d ) => atCoord - mins[ d ] ) ;
	const dstMins = Array.from( at ) ;
	const dstMaxs = maxs.map( ( max , d ) => max + shift[ d ] ) ;

	this._clipRegion( mins , maxs ) ;
	toArrayND._clipRegion( dstMins , dstMaxs ) ;

	if ( ! this._mutualClipRegion( mins , maxs , dstMins , dstMaxs , shift ) ) {
		// Nothing to do, everything was clipped away
		return ;
	}

	let backward = false ;

	if ( this.data === toArrayND.data ) {
		// This is a case of explicit or implicit copy-within
		// We can copy behind but not copy ahead with the regular ._dualStepCopy()
		const srcIndex = this._getIndexAt( mins ) ;
		const dstIndex = toArrayND._getIndexAt( dstMins ) ;

		if ( srcIndex < dstIndex ) {
			backward = true ;
		}
	}

	this._dualStepCopy( toArrayND , mins , maxs , dstMins , dstMaxs , backward ) ;
} ;

/*
	Copy a part of the ND-array into itself

	.copyWithin( at )
	.copyWithin( at , region )
	.copyWithin( at , mins , maxs )

	See .copyTo() for details.
*/
ArrayND.prototype.copyWithin = function( at , mins , maxs ) { return this.copyTo( this , at , mins , maxs ) ; } ;



/*
	Combine into another ND-array.
	Like .copyTo() with a callback.

	.combineInto( toArrayND , callback )
	.combineInto( toArrayND , at , callback )
	.combineInto( toArrayND , at , region , callback )
	.combineInto( toArrayND , at , mins , maxs , callback )

	toArrayND: the destination ND-Array to copy into
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
ArrayND.prototype.combineInto = function( toArrayND , at , mins , maxs , callback ) {
	if ( this.dimensions !== toArrayND.dimensions ) {
		throw new Error( ".combineInto(): uncompatible ND-arrays, the should have the same dimension (" + this.dimensions + "≠" + toArrayND.dimensions + ")" ) ;
	}

	// mins and maxs should be copied, because that are later modified by ._clipRegion()
	if ( typeof at === 'function' ) {
		callback = at ;
		at = Array.from( toArrayND.mins ) ;
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

	this._combineInto( toArrayND , at , mins , maxs , callback ) ;
} ;

ArrayND.prototype._combineInto = function( toArrayND , at , mins , maxs , callback ) {
	const shift = at.map( ( atCoord , d ) => atCoord - mins[ d ] ) ;
	const dstMins = Array.from( at ) ;
	const dstMaxs = maxs.map( ( max , d ) => max + shift[ d ] ) ;

	this._clipRegion( mins , maxs ) ;
	toArrayND._clipRegion( dstMins , dstMaxs ) ;

	if ( ! this._mutualClipRegion( mins , maxs , dstMins , dstMaxs , shift ) ) {
		// Nothing to do, everything was clipped away
		return ;
	}

	let backward = false ;

	if ( this.data === toArrayND.data ) {
		// This is a case of explicit or implicit copy-within
		// We can copy behind but not copy ahead with the regular ._dualStepCopy()
		const srcIndex = this._getIndexAt( mins ) ;
		const dstIndex = toArrayND._getIndexAt( dstMins ) ;

		if ( srcIndex < dstIndex ) {
			backward = true ;
		}
	}

	this._dualStepCallbackWithDst( toArrayND , mins , maxs , dstMins , dstMaxs , callback , backward ) ;
} ;

/*
	Combine a part of the ND-array with itself

	.combineWithin( at , callback )
	.combineWithin( at , region , callback )
	.combineWithin( at , mins , maxs , callback )

	See .combineInto() for details.
*/
ArrayND.prototype.combineWithin = function( at , mins , maxs , callback ) { return this.combineInto( this , at , mins , maxs , callback ) ; } ;



/*
	Combine vectors into another ND-array.
	Like .combineInto() but the callback receive a vector as the value.

	.combineVectorInto( toArrayND , vectorDimension , callback )
	.combineVectorInto( toArrayND , at , vectorDimension , callback )
	.combineVectorInto( toArrayND , at , region , callback )
	.combineVectorInto( toArrayND , at , mins , maxs , callback )

	toArrayND: the destination ND-Array to copy into
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
ArrayND.prototype.combineVectorInto = function( toArrayND , at , mins , maxs , callback ) {
	if ( this.dimensions !== toArrayND.dimensions ) {
		throw new Error( ".combineVectorInto(): uncompatible ND-arrays, they should have the same dimension (" + this.dimensions + "≠" + toArrayND.dimensions + ")" ) ;
	}

	let strideStartCoords , strideEndCoords , vectorDimension ;

	// at, mins and maxs should be copied, because that are later modified by ._clipRegion()
	if ( typeof mins === 'function' ) {
		// .combineVectorInto( toArrayND , vectorDimension , callback )
		callback = mins ;
		vectorDimension = at ;
		at = Array.from( toArrayND.mins ) ;
		strideStartCoords = mins = Array.from( this.mins ) ;
		strideEndCoords = maxs = Array.from( this.maxs ) ;
	}
	else if ( typeof maxs === 'function' ) {
		if ( typeof mins === 'number' ) {
			// .combineVectorInto( toArrayND , at , vectorDimension , callback )
			callback = maxs ;
			vectorDimension = mins ;
			at = Array.from( at ) ;
			strideStartCoords = mins = Array.from( this.mins ) ;
			strideEndCoords = maxs = Array.from( this.maxs ) ;
		}
		else {
			// .combineVectorInto( toArrayND , at , region , callback )
			callback = maxs ;
			at = Array.from( at ) ;
			strideEndCoords = maxs = mins.map( minmax => minmax?.[ 1 ] ?? null ) ;
			mins = mins.map( minmax => minmax?.[ 0 ] ?? null ) ;
			[ strideStartCoords , vectorDimension ] = this._getStrideStartAndVectorDimension( mins ) ;
		}
	}
	else {
		// .combineVectorInto( toArrayND , at , mins , maxs , callback )
		at = Array.from( at ) ;
		[ strideStartCoords , vectorDimension ] = this._getStrideStartAndVectorDimension( mins ) ;
		strideEndCoords = Array.from( maxs ) ;
	}

	at[ vectorDimension ] = this.mins[ vectorDimension ] ;
	strideEndCoords[ vectorDimension ] = this.maxs[ vectorDimension ] ;

	if ( this.sizes[ vectorDimension ] !== toArrayND.sizes[ vectorDimension ] ) {
		throw new Error( ".combineVectorInto(): uncompatible ND-arrays, they should have the same size along the vector's dimension (" + vectorDimension + ", but" + this.sizes[ vectorDimension ] + "≠" + toArrayND.sizes[ vectorDimension ] + ")" ) ;
	}

	this._combineVectorInto( toArrayND , at , strideStartCoords , strideEndCoords , vectorDimension , callback ) ;
} ;

ArrayND.prototype._combineVectorInto = function( toArrayND , at , strideStartCoords , strideEndCoords , vectorDimension , callback ) {
	const shift = at.map( ( atCoord , d ) => atCoord - strideStartCoords[ d ] ) ;
	const dstStrideStartCoords = Array.from( at ) ;
	const dstStrideEndCoords = strideEndCoords.map( ( max , d ) => max + shift[ d ] ) ;

	this._clipRegion( strideStartCoords , strideEndCoords , vectorDimension ) ;
	toArrayND._clipRegion( dstStrideStartCoords , dstStrideEndCoords , vectorDimension ) ;

	if ( ! this._mutualClipRegion( strideStartCoords , strideEndCoords , dstStrideStartCoords , dstStrideEndCoords , shift , vectorDimension ) ) {
		// Nothing to do, everything was clipped away
		return ;
	}

	let backward = false ;

	if ( this.data === toArrayND.data ) {
		// This is a case of explicit or implicit copy-within
		// We can copy behind but not copy ahead with the regular ._dualStepCopy()
		const srcIndex = this._getIndexAt( strideStartCoords ) ;
		const dstIndex = toArrayND._getIndexAt( dstStrideStartCoords ) ;

		if ( srcIndex < dstIndex ) {
			backward = true ;
		}
	}

	this._dualStepVectorCallbackWithDst(
		toArrayND ,
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
ArrayND.prototype.combineVectorWithin = function( at , mins , maxs , callback ) { return this.combineVectorInto( this , at , mins , maxs , callback ) ; } ;



// /!\ WARNING /!\ All _dualStep*() methods are for INTERNAL USAGE ONLY /!\
// It only works if both src and dst minmax have the same size!

ArrayND.prototype._dualStepCopy = function( dst , mins , maxs , dstMins , dstMaxs , backward = false ) {
	let srcCursor , dstCursor ;

	if ( backward ) {
		srcCursor = this._backwardCursor( mins , maxs ) ;
		dstCursor = dst._backwardCursor( dstMins , dstMaxs ) ;
	}
	else {
		srcCursor = this._cursor( mins , maxs ) ;
		dstCursor = dst._cursor( dstMins , dstMaxs ) ;
	}

	while ( srcCursor.next() && dstCursor.next() ) {
		dst.data[ dstCursor.index ] = srcCursor.value ;
	}
} ;

ArrayND.prototype._dualStepCallback = function( dst , mins , maxs , dstMins , dstMaxs , callback , backward = false ) {
	let srcCursor , dstCursor ;

	if ( backward ) {
		srcCursor = this._backwardCursor( mins , maxs ) ;
		dstCursor = dst._backwardCursor( dstMins , dstMaxs ) ;
	}
	else {
		srcCursor = this._cursor( mins , maxs ) ;
		dstCursor = dst._cursor( dstMins , dstMaxs ) ;
	}

	while ( srcCursor.next() && dstCursor.next() ) {
		dst.data[ dstCursor.index ] = callback( srcCursor.value , srcCursor.coords , srcCursor.index , this ) ;
	}
} ;

ArrayND.prototype._dualStepCallbackWithDst = function( dst , mins , maxs , dstMins , dstMaxs , callback , backward = false ) {
	let srcCursor , dstCursor ;

	if ( backward ) {
		srcCursor = this._backwardCursor( mins , maxs ) ;
		dstCursor = dst._backwardCursor( dstMins , dstMaxs ) ;
	}
	else {
		srcCursor = this._cursor( mins , maxs ) ;
		dstCursor = dst._cursor( dstMins , dstMaxs ) ;
	}

	while ( srcCursor.next() && dstCursor.next() ) {
		dst.data[ dstCursor.index ] = callback( srcCursor , dstCursor , this ) ;
	}
} ;

ArrayND.prototype._dualStepVectorCallback = function(
	dst ,
	strideStartCoords , strideEndCoords ,
	dstStrideStartCoords , dstStrideEndCoords ,
	vectorDimension ,
	callback ,
	backward = false
) {
	let srcCursor , dstCursor ;

	if ( backward ) {
		srcCursor = this._backwardVectorCursor( strideStartCoords , strideEndCoords , undefined , vectorDimension ) ;
		dstCursor = dst._backwardVectorCursor( dstStrideStartCoords , dstStrideEndCoords , undefined , vectorDimension ) ;
	}
	else {
		srcCursor = this._vectorCursor( strideStartCoords , strideEndCoords , undefined , vectorDimension ) ;
		dstCursor = dst._vectorCursor( dstStrideStartCoords , dstStrideEndCoords , undefined , vectorDimension ) ;
	}

	while ( srcCursor.next() && dstCursor.next() ) {
		dst._setVectorAtIndex( dstCursor.index , dstCursor.vectorDimension , callback( srcCursor.value , srcCursor.coords , srcCursor.index , this ) ) ;
	}
} ;

ArrayND.prototype._dualStepVectorCallbackWithDst = function(
	dst ,
	strideStartCoords , strideEndCoords ,
	dstStrideStartCoords , dstStrideEndCoords ,
	vectorDimension ,
	callback ,
	backward = false
) {
	let srcCursor , dstCursor ;

	if ( backward ) {
		srcCursor = this._backwardVectorCursor( strideStartCoords , strideEndCoords , undefined , vectorDimension ) ;
		dstCursor = dst._backwardVectorCursor( dstStrideStartCoords , dstStrideEndCoords , undefined , vectorDimension ) ;
	}
	else {
		srcCursor = this._vectorCursor( strideStartCoords , strideEndCoords , undefined , vectorDimension ) ;
		dstCursor = dst._vectorCursor( dstStrideStartCoords , dstStrideEndCoords , undefined , vectorDimension ) ;
	}

	while ( srcCursor.next() && dstCursor.next() ) {
		dst._setVectorAtIndex( dstCursor.index , dstCursor.vectorDimension , callback( srcCursor , dstCursor , this ) ) ;
	}
} ;



ArrayND.prototype._checkRegion = function( mins , maxs , skipD = null ) {
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



ArrayND.prototype._clipRegion = function( mins , maxs , vectorDimension = null ) {
	for ( let d = 0 ; d < this.dimensions ; d ++ ) {
		if ( d !== vectorDimension ) {
			mins[ d ] = Math.max( this.mins[ d ] , Math.min( this.maxs[ d ] , maxs[ d ] , mins[ d ] ) ) ;
			maxs[ d ] = Math.max( this.mins[ d ] , Math.min( this.maxs[ d ] , maxs[ d ] ) ) ;
		}
	}
} ;



// Return true if there is still a non-zero region, false otherwise
ArrayND.prototype._mutualClipRegion = function( mins , maxs , dstMins , dstMaxs , shift , vectorDimension = null ) {
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

