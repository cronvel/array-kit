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

/* global describe, it, before, after */


const arrayKit = require( '..' ) ;
const NDArray = arrayKit.NDArray ;



describe( "NDArray" , function() {
	
	describe( "Basics" , function() {

		it( "basic .getIndex()" , function() {
			let ndarray = new NDArray( [] , [ 3 , 5 ] ) ;
			expect( ndarray.getIndex( 0 , 0 ) ).to.be( 0 ) ;
			expect( ndarray.getIndex( 2 , 0 ) ).to.be( 2 ) ;
			expect( ndarray.getIndex( 0 , 2 ) ).to.be( 6 ) ;
			expect( ndarray.getIndex( 2 , 2 ) ).to.be( 8 ) ;
			expect( ndarray.getIndex( 2 , 4 ) ).to.be( 14 ) ;
			expect( () => ndarray.getIndex( 3 , 2 ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.getIndex( 2 , 6 ) ).to.throw.a( RangeError ) ;

			// 3D test
			ndarray = new NDArray( [] , [ 3 , 5 , 7 ] ) ;
			expect( ndarray.getIndex( 0 , 0 , 0 ) ).to.be( 0 ) ;
			expect( ndarray.getIndex( 2 , 4 , 6 ) ).to.be( 104 ) ;
			expect( ndarray.getIndex( 2 , 0 , 0 ) ).to.be( 2 ) ;
			expect( ndarray.getIndex( 0 , 2 , 0 ) ).to.be( 6 ) ;
			expect( ndarray.getIndex( 0 , 0 , 2 ) ).to.be( 30 ) ;
			expect( ndarray.getIndex( 2 , 2 , 0 ) ).to.be( 8 ) ;
			expect( ndarray.getIndex( 2 , 0 , 2 ) ).to.be( 32 ) ;
			expect( ndarray.getIndex( 0 , 2 , 2 ) ).to.be( 36 ) ;
			expect( ndarray.getIndex( 2 , 2 , 2 ) ).to.be( 38 ) ;
			expect( () => ndarray.getIndex( 2 , 3 , 7 ) ).to.throw.a( RangeError ) ;
		} ) ;

		it( "basic .getCoords()" , function() {
			let ndarray = new NDArray( [] , [ 3 , 5 ] ) ;
			expect( ndarray.getCoords( 0 ) ).to.equal( [ 0 , 0 ] ) ;
			expect( ndarray.getCoords( 2 ) ).to.equal( [ 2 , 0 ] ) ;
			expect( ndarray.getCoords( 6 ) ).to.equal( [ 0 , 2 ] ) ;
			expect( ndarray.getCoords( 8 ) ).to.equal( [ 2 , 2 ] ) ;
			expect( ndarray.getCoords( 14 ) ).to.equal( [ 2 , 4 ] ) ;

			// 3D test
			ndarray = new NDArray( [] , [ 3 , 5 , 7 ] ) ;
			expect( ndarray.getCoords( 0 ) ).to.equal( [ 0 , 0 , 0 ] ) ;
			expect( ndarray.getCoords( 104 ) ).to.equal( [ 2 , 4 , 6 ] ) ;
			expect( ndarray.getCoords( 2 ) ).to.equal( [ 2 , 0 , 0 ] ) ;
			expect( ndarray.getCoords( 6 ) ).to.equal( [ 0 , 2 , 0 ] ) ;
			expect( ndarray.getCoords( 30 ) ).to.equal( [ 0 , 0 , 2 ] ) ;
			expect( ndarray.getCoords( 8 ) ).to.equal( [ 2 , 2 , 0 ] ) ;
			expect( ndarray.getCoords( 32 ) ).to.equal( [ 2 , 0 , 2 ] ) ;
			expect( ndarray.getCoords( 38 ) ).to.equal( [ 2 , 2 , 2 ] ) ;
		} ) ;

		it( "basic .forEach()" , function() {
			let ndarray = new NDArray( arrayKit.range( 15 ) , [ 3 , 5 ] ) ;
			let callArgs = [] ;

			ndarray.forEach( ( value , coords , index ) => callArgs.push( [ value , Array.from( coords ) , index ] ) ) ;
			expect( callArgs ).to.equal( [
				[ 0 , [ 0 , 0 ] , 0 ] ,
				[ 1 , [ 1 , 0 ] , 1 ] ,
				[ 2 , [ 2 , 0 ] , 2 ] ,
				[ 3 , [ 0 , 1 ] , 3 ] ,
				[ 4 , [ 1 , 1 ] , 4 ] ,
				[ 5 , [ 2 , 1 ] , 5 ] ,
				[ 6 , [ 0 , 2 ] , 6 ] ,
				[ 7 , [ 1 , 2 ] , 7 ] ,
				[ 8 , [ 2 , 2 ] , 8 ] ,
				[ 9 , [ 0 , 3 ] , 9 ] ,
				[ 10 , [ 1 , 3 ] , 10 ] ,
				[ 11 , [ 2 , 3 ] , 11 ] ,
				[ 12 , [ 0 , 4 ] , 12 ] ,
				[ 13 , [ 1 , 4 ] , 13 ] ,
				[ 14 , [ 2 , 4 ] , 14 ] ,
			] ) ;
		} ) ;
	} ) ;

	describe( "ND-arrays with changed order" , function() {

		it( ".getIndex() on ND-array with changed order" , function() {
			let ndarray = new NDArray( [] , [ 3 , 5 ] , { order: [ 1 , 0 ] } ) ;
			expect( ndarray.getIndex( 0 , 0 ) ).to.be( 0 ) ;
			expect( ndarray.getIndex( 2 , 0 ) ).to.be( 10 ) ;
			expect( ndarray.getIndex( 0 , 2 ) ).to.be( 2 ) ;
			expect( () => ndarray.getIndex( 3 , 2 ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.getIndex( 2 , 5 ) ).to.throw.a( RangeError ) ;

			ndarray = new NDArray( [] , [ 3 , 5 , 7 ] , { reverse: true } ) ;
			expect( ndarray.getIndex( 0 , 0 , 0 ) ).to.be( 0 ) ;
			expect( ndarray.getIndex( 2 , 4 , 6 ) ).to.be( 104 ) ;
			expect( ndarray.getIndex( 2 , 0 , 0 ) ).to.be( 70 ) ;
			expect( ndarray.getIndex( 0 , 2 , 0 ) ).to.be( 14 ) ;
			expect( ndarray.getIndex( 0 , 0 , 2 ) ).to.be( 2 ) ;
			expect( ndarray.getIndex( 2 , 2 , 0 ) ).to.be( 84 ) ;
			expect( ndarray.getIndex( 2 , 0 , 2 ) ).to.be( 72 ) ;
			expect( ndarray.getIndex( 0 , 2 , 2 ) ).to.be( 16 ) ;
			expect( ndarray.getIndex( 2 , 2 , 2 ) ).to.be( 86 ) ;
			expect( () => ndarray.getIndex( 2 , 3 , 7 ) ).to.throw.a( RangeError ) ;
		} ) ;

		it( ".getCoords() on ND-array with changed order" , function() {
			let ndarray = new NDArray( [] , [ 3 , 5 ] , { reverse: true } ) ;
			expect( ndarray.getCoords( 0 ) ).to.equal( [ 0 , 0 ] ) ;
			expect( ndarray.getCoords( 2 ) ).to.equal( [ 0 , 2 ] ) ;
			expect( ndarray.getCoords( 10 ) ).to.equal( [ 2 , 0 ] ) ;
			expect( ndarray.getCoords( 12 ) ).to.equal( [ 2 , 2 ] ) ;
			expect( ndarray.getCoords( 14 ) ).to.equal( [ 2 , 4 ] ) ;

			// 3D test
			ndarray = new NDArray( [] , [ 3 , 5 , 7 ] , { order: [ 2 , 0 , 1 ] } ) ;
			expect( ndarray.getCoords( 0 ) ).to.equal( [ 0 , 0 , 0 ] ) ;
			expect( ndarray.getCoords( 104 ) ).to.equal( [ 2 , 4 , 6 ] ) ;
			expect( ndarray.getCoords( 14 ) ).to.equal( [ 2 , 0 , 0 ] ) ;
			expect( ndarray.getCoords( 42 ) ).to.equal( [ 0 , 2 , 0 ] ) ;
			expect( ndarray.getCoords( 2 ) ).to.equal( [ 0 , 0 , 2 ] ) ;
			expect( ndarray.getCoords( 56 ) ).to.equal( [ 2 , 2 , 0 ] ) ;
			expect( ndarray.getCoords( 16 ) ).to.equal( [ 2 , 0 , 2 ] ) ;
			expect( ndarray.getCoords( 58 ) ).to.equal( [ 2 , 2 , 2 ] ) ;
		} ) ;

		it( "basic .forEach() on ND-array with changed order" , function() {
			let ndarray = new NDArray( arrayKit.range( 15 ) , [ 3 , 5 ] , { reverse: true } ) ;
			let callArgs = [] ;

			ndarray.forEach( ( value , coords , index ) => callArgs.push( [ value , Array.from( coords ) , index ] ) ) ;
			expect( callArgs ).to.equal( [
				[ 0 , [ 0 , 0 ] , 0 ] ,
				[ 1 , [ 0 , 1 ] , 1 ] ,
				[ 2 , [ 0 , 2 ] , 2 ] ,
				[ 3 , [ 0 , 3 ] , 3 ] ,
				[ 4 , [ 0 , 4 ] , 4 ] ,
				[ 5 , [ 1 , 0 ] , 5 ] ,
				[ 6 , [ 1 , 1 ] , 6 ] ,
				[ 7 , [ 1 , 2 ] , 7 ] ,
				[ 8 , [ 1 , 3 ] , 8 ] ,
				[ 9 , [ 1 , 4 ] , 9 ] ,
				[ 10 , [ 2 , 0 ] , 10 ] ,
				[ 11 , [ 2 , 1 ] , 11 ] ,
				[ 12 , [ 2 , 2 ] , 12 ] ,
				[ 13 , [ 2 , 3 ] , 13 ] ,
				[ 14 , [ 2 , 4 ] , 14 ] ,
			] ) ;
		} ) ;
	} ) ;

	describe( "Non-zero-based ND-arrays" , function() {
		it( "..." ) ;
	} ) ;
} ) ;

