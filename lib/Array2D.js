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
const CURSOR_FLAG = ArrayND.CURSOR_FLAG ;
const LOGICAL_ORDER = ArrayND.LOGICAL_ORDER ;



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



Array2D.prototype._getIndexAt = function( coords ) {
	return (
		this.offset
		+ ( coords[ 0 ] - this.mins[ 0 ] ) * this.strides[ 0 ]
		+ ( coords[ 1 ] - this.mins[ 1 ] ) * this.strides[ 1 ]
	) ;
} ;

Array2D.prototype.getIndexAt =
Array2D.prototype._getIndexAtCheck = function( coords ) {
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

Array2D.prototype._getIndex = function( x , y ) {
	return (
		this.offset
		+ ( x - this.mins[ 0 ] ) * this.strides[ 0 ]
		+ ( y - this.mins[ 1 ] ) * this.strides[ 1 ]
	) ;
} ;

Array2D.prototype.getIndex =
Array2D.prototype._getIndexCheck = function( x , y ) {
	if (
		x < this.mins[ 0 ] || x > this.maxs[ 0 ]
		|| y < this.mins[ 1 ] || y > this.maxs[ 1 ]
	) {
		throw new RangeError( "Coordinate (" + x + "," + y + ") out of bounds, should be between ([" + this.mins[ 0 ] + "," + this.maxs[ 0 ] + "],[" + this.mins[ 1 ] + "," + this.maxs[ 1 ] + "])" ) ;
	}

	return (
		this.offset
		+ ( x - this.mins[ 0 ] ) * this.strides[ 0 ]
		+ ( y - this.mins[ 1 ] ) * this.strides[ 1 ]
	) ;
} ;



Array2D.prototype._get = function( x , y ) { return this.data[ this._getIndex( x , y ) ] ; } ;
Array2D.prototype.get =
Array2D.prototype._getCheck = function( x , y ) { return this.data[ this._getIndexCheck( x , y ) ] ; } ;

Array2D.prototype._set = function( x , y , value ) { this.data[ this._getIndex( x , y ) ] = value ; } ;
Array2D.prototype.set =
Array2D.prototype._setCheck = function( x , y , value ) { this.data[ this._getIndexCheck( x , y ) ] = value ; } ;



function Cursor( ndarray , mins , maxs , flags = CURSOR_FLAG.NONE ) {
	this.ndarray = ndarray ;

	this.order = flags & CURSOR_FLAG.LOGICAL ? LOGICAL_ORDERS[ ndarray.dimensions ] : ndarray.order ;

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
		this.next = order0 === 0 ? this.backwardXy : this.backwardYx ;
	}
	else {
		this.coords[ order0 ] -- ;
		this.index -= ndarray.strides[ order0 ] ;
		this.next = order0 === 0 ? this.forwardXy : this.forwardYx ;
	}
}

Array2D.prototype.Cursor = Cursor ;



// Super-specialized forward/backward cursor depending on the order, 35% faster than generic forward/backward

Cursor.prototype.forwardXy = function() {
	const ndarray = this.ndarray ;

	if ( this.coords[ 0 ] < this.maxs[ 0 ] ) {
		this.coords[ 0 ] ++ ;
		this.index += ndarray.strides[ 0 ] ;
		this.value = ndarray.data[ this.index ] ;
		return true ;
	}

	this.coords[ 0 ] = this.mins[ 0 ] ;
	// Return index back to min
	this.index += this.backStrides[ 0 ] ;

	if ( this.coords[ 1 ] < this.maxs[ 1 ] ) {
		this.coords[ 1 ] ++ ;
		this.index += ndarray.strides[ 1 ] ;
		this.value = ndarray.data[ this.index ] ;
		return true ;
	}

	this.next = falseFn ;
	return false ;
} ;

Cursor.prototype.forwardYx = function() {
	const ndarray = this.ndarray ;

	if ( this.coords[ 1 ] < this.maxs[ 1 ] ) {
		this.coords[ 1 ] ++ ;
		this.index += ndarray.strides[ 1 ] ;
		this.value = ndarray.data[ this.index ] ;
		return true ;
	}

	this.coords[ 1 ] = this.mins[ 1 ] ;
	// Return index back to min
	this.index += this.backStrides[ 1 ] ;

	if ( this.coords[ 0 ] < this.maxs[ 0 ] ) {
		this.coords[ 0 ] ++ ;
		this.index += ndarray.strides[ 0 ] ;
		this.value = ndarray.data[ this.index ] ;
		return true ;
	}

	this.next = falseFn ;
	return false ;
} ;



Cursor.prototype.backwardXy = function() {
	const ndarray = this.ndarray ;

	if ( this.coords[ 0 ] > this.mins[ 0 ] ) {
		this.coords[ 0 ] -- ;
		this.index -= ndarray.strides[ 0 ] ;
		this.value = ndarray.data[ this.index ] ;
		return true ;
	}

	this.coords[ 0 ] = this.maxs[ 0 ] ;
	// Return index back to min
	this.index -= this.backStrides[ 0 ] ;

	if ( this.coords[ 1 ] > this.mins[ 1 ] ) {
		this.coords[ 1 ] -- ;
		this.index -= ndarray.strides[ 1 ] ;
		this.value = ndarray.data[ this.index ] ;
		return true ;
	}

	this.next = falseFn ;
	return false ;
} ;

Cursor.prototype.backwardYx = function() {
	const ndarray = this.ndarray ;

	if ( this.coords[ 1 ] > this.mins[ 1 ] ) {
		this.coords[ 1 ] -- ;
		this.index -= ndarray.strides[ 1 ] ;
		this.value = ndarray.data[ this.index ] ;
		return true ;
	}

	this.coords[ 1 ] = this.maxs[ 1 ] ;
	// Return index back to min
	this.index -= this.backStrides[ 1 ] ;

	if ( this.coords[ 0 ] > this.mins[ 0 ] ) {
		this.coords[ 0 ] -- ;
		this.index -= ndarray.strides[ 0 ] ;
		this.value = ndarray.data[ this.index ] ;
		return true ;
	}

	this.next = falseFn ;
	return false ;
} ;



// Unused, reference implementation for other dimensions (Array3D)

Cursor.prototype.genericForward = function() {
	const ndarray = this.ndarray ;

	let d = this.order[ 0 ] ;

	if ( this.coords[ d ] < this.maxs[ d ] ) {
		this.coords[ d ] ++ ;
		this.index += ndarray.strides[ d ] ;
		this.value = ndarray.data[ this.index ] ;
		return true ;
	}

	this.coords[ d ] = this.mins[ d ] ;
	// Return index back to min
	this.index += this.backStrides[ d ] ;

	d = this.order[ 1 ] ;

	if ( this.coords[ d ] < this.maxs[ d ] ) {
		this.coords[ d ] ++ ;
		this.index += ndarray.strides[ d ] ;
		this.value = ndarray.data[ this.index ] ;
		return true ;
	}

	this.next = falseFn ;
	return false ;
} ;

Cursor.prototype.genericBackward = function() {
	const ndarray = this.ndarray ;

	let d = this.order[ 0 ] ;

	if ( this.coords[ d ] > this.mins[ d ] ) {
		this.coords[ d ] -- ;
		this.index -= ndarray.strides[ d ] ;
		this.value = ndarray.data[ this.index ] ;
		return true ;
	}

	this.coords[ d ] = this.maxs[ d ] ;
	// Return index back to min
	this.index -= this.backStrides[ d ] ;

	d = this.order[ 1 ] ;

	if ( this.coords[ d ] > this.mins[ d ] ) {
		this.coords[ d ] -- ;
		this.index -= ndarray.strides[ d ] ;
		this.value = ndarray.data[ this.index ] ;
		return true ;
	}

	this.next = falseFn ;
	return false ;
} ;

