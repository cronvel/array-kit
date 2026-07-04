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
	
	describe( "Coords to index" , function() {

		it( "basic .getIndex()" , function() {
			let ndarray = new NDArray( [] , [ 3 , 5 ] ) ;
			expect( ndarray.getIndex( 0 , 0 ) ).to.be( 0 ) ;
			expect( ndarray.getIndex( 2 , 0 ) ).to.be( 2 ) ;
			expect( ndarray.getIndex( 0 , 2 ) ).to.be( 6 ) ;
			expect( ndarray.getIndex( 2 , 2 ) ).to.be( 8 ) ;
			expect( ndarray.getIndex( 2 , 4 ) ).to.be( 14 ) ;

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
		} ) ;
	} ) ;

	describe( "Index to coords" , function() {

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
	} ) ;
} ) ;

