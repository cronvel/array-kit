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

