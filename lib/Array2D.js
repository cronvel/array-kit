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
const falseFn = () => false ;



/*
	Use ndarray() to create them, it will switch to the correct specialized class automatically (ArrayND/Array2D/Array3D/whatever).

	ArrayND()	Internal, special case where nothing is init, it's the bare minium for cloning
	ArrayND( [ dataStorage | Constructor ] , [ sizes | region ] , [ params ] )

	See ArrayND for arguments.
*/
function Array2D( dataOrConstructor , sizes , params ) {
	// Fast mode, for cloning and similar things
	const noInit = dataOrConstructor === undefined ;

	this.dimensions = 2 ;	// fixed, but required for compatibility with ArrayND
	this.sizes = new Array( 2 ) ;
	this.size = 1 ;
	this.mins = new Array( 2 ) ;
	this.maxs = new Array( 2 ) ;
	this.order = new Array( 2 ) ;
	this.strides = new Array( 2 ) ;
	this.backStrides = new Array( 2 ) ;
	this.offset = 0 ;
	this.isContiguous = true ;
	this.dataStart = 0 ;
	this.dataEnd = 0 ;
	this.data = null ;

	if ( noInit ) { console.log( "NO INIT MAN!" ) ; }
	if ( ! noInit ) {
		this._init( dataOrConstructor , sizes , params ) ;
	}
}

Array2D.prototype = Object.create( ArrayND.prototype ) ;
Array2D.prototype.constructor = Array2D ;

module.exports = Array2D ;



// Clone only the view, the data storage is the same
Array2D.prototype.cloneView =
Array2D.prototype.view = function() {
	const newArray2D = this._cloneLogical( true ) ;
	newArray2D.data = this.data ;
	return newArray2D ;
} ;



// Full clone
Array2D.prototype.clone = function() {
	const newArray2D = this._cloneLogical() ;
	newArray2D._createDataFrom( this.data , this.dataStart , this.dataEnd ) ;
	return newArray2D ;
} ;



// Create a new clone of the current Array2D with the same geometry but an empty (but ready) data
// The new data is limited to the used size (dataStart = 0) except if keepDataStart is set to true.
Array2D.prototype._cloneLogical = function( keepDataStart = false ) {
	const newArray2D = new Array2D() ;

	// Copy geometry
	Object.assign( newArray2D.order , this.order ) ;
	Object.assign( newArray2D.sizes , this.sizes ) ;
	newArray2D.size = this.size ;
	Object.assign( newArray2D.mins , this.mins ) ;
	Object.assign( newArray2D.maxs , this.maxs ) ;
	Object.assign( newArray2D.strides , this.strides ) ;
	Object.assign( newArray2D.backStrides , this.backStrides ) ;

	if ( keepDataStart ) {
		newArray2D.dataStart = this.dataStart ;
		newArray2D.dataEnd = this.dataEnd ;
		newArray2D.offset = this.offset ;
	}
	else {
		// Start at index=0 in the physical storage
		newArray2D.offset = this.offset - this.dataStart ;
		newArray2D.dataEnd = this.dataEnd - this.dataStart ;
	}

	return newArray2D ;
} ;



// Clone with a modified geometry
Array2D.prototype._resizeLogical = function( mins , maxs ) {
	const newArray2D = new Array2D() ;

	Object.assign( newArray2D.order , this.order ) ;
	newArray2D._initSizesFromMinsMaxs( mins , maxs ) ;
	newArray2D._initStridesFromSizes() ;
	newArray2D._initOffsetEndFromStartSizesStrides() ;

	return newArray2D ;
} ;



Array2D.prototype._getIndex = function( coords ) {
	return (
		this.offset
		+ ( coords[ 0 ] - this.mins[ 0 ] ) * this.strides[ 0 ]
		+ ( coords[ 1 ] - this.mins[ 1 ] ) * this.strides[ 1 ]
	) ;
} ;

// [TMP]
Array2D.prototype._getxyIndex = function( x , y ) {
	return (
		this.offset
		+ ( x - this.mins[ 0 ] ) * this.strides[ 0 ]
		+ ( y - this.mins[ 1 ] ) * this.strides[ 1 ]
	) ;
} ;

Array2D.prototype._getIndexCheck = function( coords ) {
	if (
		coords[ 0 ] < this.mins[ 0 ] || coords[ 0 ] > this.maxs[ 0 ]
		|| coords[ 1 ] < this.mins[ 1 ] || coords[ 1 ] > this.maxs[ 1 ]
	) {
		throw new RangeError( "Coordinate (" + coords.join( ',' ) + ") out of bounds, should be between ([" + this.mins[ 0 ] + "," + this.maxs[ 0 ] + "],[" + this.mins[ 1 ] + "," + this.maxs[ 1 ] + "])" ) ;
	}

	return (
		this.offset
		+ ( coords[ 0 ] - this.mins[ 0 ] ) * this.strides[ 0 ]
		+ ( coords[ 1 ] - this.mins[ 1 ] ) * this.strides[ 1 ]
	) ;
} ;

Array2D.prototype.getIndex = function( ... coords ) {
	if ( Array.isArray( coords[ 0 ] ) ) { coords = coords[ 0 ] ; }
	return this._getIndexCheck( coords ) ;
} ;


/*
Array2D.prototype._getCoords = function( index , coords = new Array( this.dimensions ) ) {
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

Array2D.prototype._getCoordsCheck =
Array2D.prototype.getCoords = function( index , coords ) {
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
*/


Array2D.prototype._get = function( coords ) { return this.data[ this._getIndex( coords ) ] ; } ;
Array2D.prototype._getCheck = function( coords ) { return this.data[ this._getIndexCheck( coords ) ] ; } ;
Array2D.prototype.get = function( ... coords ) {
	if ( Array.isArray( coords[ 0 ] ) ) { coords = coords[ 0 ] ; }
	return this.data[ this._getIndexCheck( coords ) ] ;
} ;

// [TMP]
Array2D.prototype.getxy = function( x , y ) {
	return this.data[ this._getxyIndex( x , y ) ] ;
} ;


/*
Array2D.prototype._set = function( coords , value ) { this.data[ this._getIndex( coords ) ] = value ; } ;
Array2D.prototype._setCheck = function( coords , value ) { this.data[ this._getIndexCheck( coords ) ] = value ; } ;
Array2D.prototype.set = function( ... args ) {
	if ( Array.isArray( args[ 0 ] ) ) {
		this.data[ this._getIndexCheck( args[ 0 ] ) ] = args[ 1 ] ;
	}
	else {
		// We don't care for the extra element in ._getIndexCheck()
		this.data[ this._getIndexCheck( args ) ] = args[ args.length - 1 ] ;
	}
} ;



Array2D.prototype.getVector = function( ... coords ) {
	if ( Array.isArray( coords[ 0 ] ) ) { coords = coords[ 0 ] ; }
	const [ strideStartCoords , vectorDimension ] = this._getStrideStartAndVectorDimension( coords ) ;
	const index = this._getIndexCheck( strideStartCoords ) ;
	return this._getVectorAtIndex( index , vectorDimension ) ;
} ;

Array2D.prototype._getVector = function( strideStartCoords , vectorDimension ) {
	const index = this._getIndex( strideStartCoords ) ;
	return this._getVectorAtIndex( index , vectorDimension ) ;
} ;

Array2D.prototype._getVectorAtIndex = function( index , vectorDimension , vector = new Array( this.sizes[ vectorDimension ] ) ) {
	const iMax = this.sizes[ vectorDimension ] ;
	const stride = this.strides[ vectorDimension ] ;

	for ( let i = 0 ; i < iMax ; i ++ , index += stride ) {
		vector[ i ] = this.data[ index ] ;
	}

	return vector ;
} ;



Array2D.prototype.setVector = function( ... args ) {
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

Array2D.prototype._setVector = function( strideStartCoords , vectorDimension , vector ) {
	const index = this._getIndex( strideStartCoords ) ;
	this._setVectorAtIndex( index , vectorDimension , vector ) ;
} ;

Array2D.prototype._setVectorAtIndex = function( index , vectorDimension , vector ) {
	const iMax = this.sizes[ vectorDimension ] ;
	const stride = this.strides[ vectorDimension ] ;

	for ( let i = 0 ; i < iMax ; i ++ , index += stride ) {
		this.data[ index ] = vector[ i ] ;
	}
} ;

*/
