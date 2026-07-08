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

		it( "basic .get() / .set()" , function() {
			let ndarray = new NDArray( arrayKit.range( 15 ) , [ 3 , 5 ] ) ;
			expect( ndarray.get( 1 , 3 ) ).to.be( 10 ) ;
			expect( ndarray.get( [ 1 , 3 ] ) ).to.be( 10 ) ;

			ndarray.set( 1 , 3 , 42 ) ;
			expect( ndarray.get( 1 , 3 ) ).to.be( 42 ) ;
			expect( ndarray.get( [ 1 , 3 ] ) ).to.be( 42 ) ;

			ndarray.set( [ 2 , 4 ] , 72 ) ;
			expect( ndarray.get( 2 , 4 ) ).to.be( 72 ) ;
			expect( ndarray.get( [ 2 , 4 ] ) ).to.be( 72 ) ;

			ndarray.set( 0 , 0 , 22 ) ;
			expect( ndarray.get( 0 , 0 ) ).to.be( 22 ) ;
			expect( ndarray.get( [ 0 , 0 ] ) ).to.be( 22 ) ;

			expect( () => ndarray.set( -1 , 0 , 101 ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.set( [ 2 , -4 ] , 101 ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.set( 12 , 3 , 101 ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.set( 1 , 5 , 101 ) ).to.throw.a( RangeError ) ;

			expect( () => ndarray.get( -1 , 0 ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.get( [ 2 , -4 ] ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.get( 12 , 3 ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.get( 1 , 5 ) ).to.throw.a( RangeError ) ;

			expect( ndarray.storage ).to.equal( [22,1,2,3,4,5,6,7,8,9,42,11,12,13,72] ) ;
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

		it( "basic .forEachInRegion()" , function() {
			let callArgs ;
			let ndarray = new NDArray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;

			// Iterate the whole array
			callArgs = [] ;
			ndarray.forEachInRegion( [ [ 0 , 3 ] , [ 0 , 4 ] ] , ( value , coords , index ) => callArgs.push( [ value , Array.from( coords ) , index ] ) ) ;
			expect( callArgs ).to.equal( [
				[ 0 , [ 0 , 0 ] , 0 ] ,
				[ 1 , [ 1 , 0 ] , 1 ] ,
				[ 2 , [ 2 , 0 ] , 2 ] ,
				[ 3 , [ 3 , 0 ] , 3 ] ,
				[ 4 , [ 0 , 1 ] , 4 ] ,
				[ 5 , [ 1 , 1 ] , 5 ] ,
				[ 6 , [ 2 , 1 ] , 6 ] ,
				[ 7 , [ 3 , 1 ] , 7 ] ,
				[ 8 , [ 0 , 2 ] , 8 ] ,
				[ 9 , [ 1 , 2 ] , 9 ] ,
				[ 10 , [ 2 , 2 ] , 10 ] ,
				[ 11 , [ 3 , 2 ] , 11 ] ,
				[ 12 , [ 0 , 3 ] , 12 ] ,
				[ 13 , [ 1 , 3 ] , 13 ] ,
				[ 14 , [ 2 , 3 ] , 14 ] ,
				[ 15 , [ 3 , 3 ] , 15 ] ,
				[ 16 , [ 0 , 4 ] , 16 ] ,
				[ 17 , [ 1 , 4 ] , 17 ] ,
				[ 18 , [ 2 , 4 ] , 18 ] ,
				[ 19 , [ 3 , 4 ] , 19 ] ,
			] ) ;


			// Iterate partially on x
			callArgs = [] ;
			ndarray.forEachInRegion( [ [ 1 , 2 ] , [ 0 , 4 ] ] , ( value , coords , index ) => callArgs.push( [ value , Array.from( coords ) , index ] ) ) ;
			//console.log( callArgs ) ; return ;
			expect( callArgs ).to.equal( [
				[ 1 , [ 1 , 0 ] , 1 ] ,
				[ 2 , [ 2 , 0 ] , 2 ] ,
				[ 5 , [ 1 , 1 ] , 5 ] ,
				[ 6 , [ 2 , 1 ] , 6 ] ,
				[ 9 , [ 1 , 2 ] , 9 ] ,
				[ 10 , [ 2 , 2 ] , 10 ] ,
				[ 13 , [ 1 , 3 ] , 13 ] ,
				[ 14 , [ 2 , 3 ] , 14 ] ,
				[ 17 , [ 1 , 4 ] , 17 ] ,
				[ 18 , [ 2 , 4 ] , 18 ] ,
			] ) ;


			// Iterate partially on y
			callArgs = [] ;
			ndarray.forEachInRegion( [ [ 0 , 3 ] , [ 1 , 3 ] ] , ( value , coords , index ) => callArgs.push( [ value , Array.from( coords ) , index ] ) ) ;
			expect( callArgs ).to.equal( [
				[ 4 , [ 0 , 1 ] , 4 ] ,
				[ 5 , [ 1 , 1 ] , 5 ] ,
				[ 6 , [ 2 , 1 ] , 6 ] ,
				[ 7 , [ 3 , 1 ] , 7 ] ,
				[ 8 , [ 0 , 2 ] , 8 ] ,
				[ 9 , [ 1 , 2 ] , 9 ] ,
				[ 10 , [ 2 , 2 ] , 10 ] ,
				[ 11 , [ 3 , 2 ] , 11 ] ,
				[ 12 , [ 0 , 3 ] , 12 ] ,
				[ 13 , [ 1 , 3 ] , 13 ] ,
				[ 14 , [ 2 , 3 ] , 14 ] ,
				[ 15 , [ 3 , 3 ] , 15 ] ,
			] ) ;


			// Iterate partially on x and y
			callArgs = [] ;
			ndarray.forEachInRegion( [ [ 1 , 2 ] , [ 1 , 3 ] ] , ( value , coords , index ) => callArgs.push( [ value , Array.from( coords ) , index ] ) ) ;
			expect( callArgs ).to.equal( [
				[ 5 , [ 1 , 1 ] , 5 ] ,
				[ 6 , [ 2 , 1 ] , 6 ] ,
				[ 9 , [ 1 , 2 ] , 9 ] ,
				[ 10 , [ 2 , 2 ] , 10 ] ,
				[ 13 , [ 1 , 3 ] , 13 ] ,
				[ 14 , [ 2 , 3 ] , 14 ] ,
			] ) ;

			// Iterate partially on x and y, using the .forEachInRegion( mins , maxs , callback ) syntax
			callArgs = [] ;
			ndarray.forEachInRegion( [ 1 , 1 ] , [ 2 , 3 ] , ( value , coords , index ) => callArgs.push( [ value , Array.from( coords ) , index ] ) ) ;
			expect( callArgs ).to.equal( [
				[ 5 , [ 1 , 1 ] , 5 ] ,
				[ 6 , [ 2 , 1 ] , 6 ] ,
				[ 9 , [ 1 , 2 ] , 9 ] ,
				[ 10 , [ 2 , 2 ] , 10 ] ,
				[ 13 , [ 1 , 3 ] , 13 ] ,
				[ 14 , [ 2 , 3 ] , 14 ] ,
			] ) ;
			
			// Range errors
			expect( () => ndarray.forEachInRegion( [ 1 , 1 ] , [ 4 , 3 ] , () => null ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.forEachInRegion( [ [ 1 , 3 ] , [ 3 , 5 ] ] , () => null ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.forEachInRegion( [ [ 1 , 3 ] , [ 3 , 2 ] ] , () => null ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.forEachInRegion( [ [ 1 , 0 ] , [ 1 , 2 ] ] , () => null ) ).to.throw.a( RangeError ) ;
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

		it( ".get() / .get() / .set() / .set() on ND-array with changed order" , function() {
			let ndarray = new NDArray( arrayKit.range( 24 ) , [ 2 , 3 , 4 ] , { order: [ 2 , 0 , 1 ] } ) ;
			expect( ndarray.get( 1 , 1 , 2 ) ).to.be( 14 ) ;
			expect( ndarray.get( [ 0 , 2 , 3 ] ) ).to.be( 19 ) ;

			ndarray.set( 1 , 1 , 2 , 111 ) ;
			expect( ndarray.get( 1 , 1 , 2 ) ).to.be( 111 ) ;
			expect( ndarray.get( [ 1 , 1 , 2 ] ) ).to.be( 111 ) ;

			ndarray.set( 0 , 2 , 3 , 777 ) ;
			expect( ndarray.get( 0 , 2 , 3 ) ).to.be( 777 ) ;
			expect( ndarray.get( [ 0 , 2 , 3 ] ) ).to.be( 777 ) ;

			expect( () => ndarray.set( -1 , 0 , 1 , "value" ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.set( [ 2 , -4 , 3 ] , "value" ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.set( 1 , 2 , 12 , "value" ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.set( 1 , 5 , 2 , "value" ) ).to.throw.a( RangeError ) ;

			expect( () => ndarray.get( -1 , 0 , 1 ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.get( [ 2 , -4 , 3 ] ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.get( 1 , 2 , 12 ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.get( 1 , 5 , 2 ) ).to.throw.a( RangeError ) ;

			expect( ndarray.storage ).to.equal( [0,1,2,3,4,5,6,7,8,9,10,11,12,13,111,15,16,17,18,777,20,21,22,23] ) ;
		} ) ;

		it( ".forEach() on ND-array with changed order" , function() {
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

		it( ".getIndex() on non-zero-based ND-array" , function() {
			let ndarray = new NDArray( [] , [ [ -3 , 3 ] , [ -5 , 5 ] ] ) ;
			expect( ndarray.getIndex( -3 , -5 ) ).to.be( 0 ) ;
			expect( ndarray.getIndex( 3 , 5 ) ).to.be( 76 ) ;
			expect( ndarray.getIndex( 0 , 0 ) ).to.be( 38 ) ;
			expect( ndarray.getIndex( -2 , 3 ) ).to.be( 57 ) ;
			expect( ndarray.getIndex( 2 , -2 ) ).to.be( 26 ) ;
			expect( () => ndarray.getIndex( -4 , 2 ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.getIndex( 4 , 2 ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.getIndex( -2 , 6 ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.getIndex( 3 , -6 ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.getIndex( -4 , -6 ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.getIndex( 4 , 6 ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.getIndex( -4 , 6 ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.getIndex( 4 , -6 ) ).to.throw.a( RangeError ) ;

			// 3D test
			ndarray = new NDArray( [] , [ [ -3 , 3 ] , [ -5 , 5 ] , [ 3 , 6 ] ] ) ;
			expect( ndarray.getIndex( -3 , -5 , 3 ) ).to.be( 0 ) ;
			expect( ndarray.getIndex( 3 , 5 , 6 ) ).to.be( 307 ) ;
			expect( ndarray.getIndex( 1 , -2 , 4 ) ).to.be( 102 ) ;
			expect( ndarray.getIndex( -3 , 4 , 6 ) ).to.be( 294 ) ;
			expect( () => ndarray.getIndex( 2 , 3 , 2 ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.getIndex( 2 , 3 , 7 ) ).to.throw.a( RangeError ) ;
		} ) ;

		it( ".getCoords() on non-zero-based ND-array" , function() {
			let ndarray = new NDArray( [] , [ [ -3 , 3 ] , [ -5 , 5 ] ] ) ;
			expect( ndarray.getCoords( 0 ) ).to.equal( [ -3 , -5 ] ) ;
			expect( ndarray.getCoords( 76 ) ).to.equal( [ 3 , 5 ] ) ;
			expect( ndarray.getCoords( 38 ) ).to.equal( [ 0 , 0 ] ) ;
			expect( ndarray.getCoords( 57 ) ).to.equal( [ -2 , 3 ] ) ;
			expect( ndarray.getCoords( 26 ) ).to.equal( [ 2 , -2 ] ) ;

			// 3D test
			ndarray = new NDArray( [] , [ [ -3 , 3 ] , [ -5 , 5 ] , [ 3 , 6 ] ] ) ;
			expect( ndarray.getCoords( 0 ) ).to.equal( [ -3 , -5 , 3 ] ) ;
			expect( ndarray.getCoords( 307 ) ).to.equal( [ 3 , 5 , 6 ] ) ;
			expect( ndarray.getCoords( 102 ) ).to.equal( [ 1 , -2 , 4 ] ) ;
			expect( ndarray.getCoords( 294 ) ).to.equal( [ -3 , 4 , 6 ] ) ;
		} ) ;

		it( ".get() / .get() / .set() / .set() on non-zero-based ND-array" , function() {
			let ndarray = new NDArray( arrayKit.range( 15 ) , [ [ -2 , 2 ] , [ -1 , 1 ] ] ) ;
			expect( ndarray.get( 1 , 1 ) ).to.be( 13 ) ;
			expect( ndarray.get( -2 , 0 ) ).to.be( 5 ) ;
			expect( ndarray.get( [ 2 , -1 ] ) ).to.be( 4 ) ;

			ndarray.set( 1 , 1 , 42 ) ;
			expect( ndarray.get( 1 , 1 ) ).to.be( 42 ) ;
			expect( ndarray.get( [ 1 , 1 ] ) ).to.be( 42 ) ;

			ndarray.set( [ 2 , -1 ] , 72 ) ;
			expect( ndarray.get( 2 , -1 ) ).to.be( 72 ) ;
			expect( ndarray.get( [ 2 , -1 ] ) ).to.be( 72 ) ;

			ndarray.set( -2 , -1 , 22 ) ;
			expect( ndarray.get( -2 , -1 ) ).to.be( 22 ) ;
			expect( ndarray.get( [ -2 , -1 ] ) ).to.be( 22 ) ;

			expect( () => ndarray.set( -3 , 0 , 101 ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.set( [ 2 , -4 ] , 101 ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.set( 12 , 3 , 101 ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.set( 1 , 5 , 101 ) ).to.throw.a( RangeError ) ;

			expect( () => ndarray.get( -3 , 0 ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.get( [ 2 , -4 ] ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.get( 12 , 3 ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.get( 1 , 5 ) ).to.throw.a( RangeError ) ;

			expect( ndarray.storage ).to.equal( [22,1,2,3,72,5,6,7,8,9,10,11,12,42,14] ) ;
		} ) ;

		it( ".forEach() on non-zero-based ND-array" , function() {
			let ndarray = new NDArray( arrayKit.range( 15 ) , [ [ -2 , 2 ] , [ -1 , 1 ] ] ) ;
			let callArgs = [] ;

			ndarray.forEach( ( value , coords , index ) => callArgs.push( [ value , Array.from( coords ) , index ] ) ) ;
			expect( callArgs ).to.equal( [
				[ 0 , [ -2 , -1 ] , 0 ] ,
				[ 1 , [ -1 , -1 ] , 1 ] ,
				[ 2 , [ 0 , -1 ] , 2 ] ,
				[ 3 , [ 1 , -1 ] , 3 ] ,
				[ 4 , [ 2 , -1 ] , 4 ] ,
				[ 5 , [ -2 , 0 ] , 5 ] ,
				[ 6 , [ -1 , 0 ] , 6 ] ,
				[ 7 , [ 0 , 0 ] , 7 ] ,
				[ 8 , [ 1 , 0 ] , 8 ] ,
				[ 9 , [ 2 , 0 ] , 9 ] ,
				[ 10 , [ -2 , 1 ] , 10 ] ,
				[ 11 , [ -1 , 1 ] , 11 ] ,
				[ 12 , [ 0 , 1 ] , 12 ] ,
				[ 13 , [ 1 , 1 ] , 13 ] ,
				[ 14 , [ 2 , 1 ] , 14 ] ,
			] ) ;
		} ) ;
	} ) ;

	describe( ".map()" , function() {
		it( "basic .map() should return a new NDArray with its own storage, mapping values with the callback" , function() {
			let ndarray , mapped ;

			ndarray = new NDArray( arrayKit.range( 15 ) , [ 3 , 5 ] ) ;

			mapped = ndarray.map( value => 2 * value ) ;
			expect( mapped.storage ).not.to.be( ndarray.storage ) ;
			expect( mapped.storage ).to.equal( [0,2,4,6,8,10,12,14,16,18,20,22,24,26,28] ) ;

			mapped = ndarray.map( ( value , coords ) => coords[ 0 ] + coords[ 1 ] ) ;
			expect( mapped.storage ).to.equal( [ 0, 1, 2, 1, 2, 3, 2, 3, 4, 3, 4, 5, 4, 5, 6 ] ) ;

			ndarray = new NDArray( arrayKit.range( 20 ) , [ 3 , 5 ] , { storageOffset: 3 } ) ;
			mapped = ndarray.map( value => 2 * value ) ;
			//console.log( "mapped:" , mapped.storage.length , mapped ) ;
			expect( mapped.storage ).to.equal( [6,8,10,12,14,16,18,20,22,24,26,28,30,32,34] ) ;
		} ) ;
	} ) ;

	describe( ".extractRegion()" , function() {
		it( "basic .extractRegion()" , function() {
			let ndarray , extracted ;

			ndarray = new NDArray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;
			extracted = ndarray.extractRegion( [ [ 1 , 2 ] , [ 1 , 3 ] ] ) ;
			//console.log( "extracted:" , extracted.storage.length , extracted ) ;
			expect( extracted.dimensions ).to.be( 2 ) ;
			expect( extracted.size ).to.be( 6 ) ;
			expect( extracted.sizes ).to.equal( [ 2 , 3 ] ) ;
			expect( extracted.mins ).to.equal( [ 1 , 1 ] ) ;
			expect( extracted.maxs ).to.equal( [ 2 , 3 ] ) ;
			expect( extracted.order ).to.equal( [ 0 , 1 ] ) ;
			expect( extracted.strides ).to.equal( [ 1 , 2 ] ) ;
			expect( extracted.storageOffset ).to.be( 0 ) ;
			expect( extracted.storage ).to.equal( [ 5, 6, 9, 10, 13, 14 ] ) ;

			expect( extracted.get( 1 , 1 ) ).to.be( 5 ) ;
			expect( () => extracted.get( 0 , 1 ) ).to.throw.a( RangeError ) ;
			expect( () => extracted.get( 1 , 0 ) ).to.throw.a( RangeError ) ;
			expect( () => extracted.get( 3 , 1 ) ).to.throw.a( RangeError ) ;
			expect( () => extracted.get( 1 , 4 ) ).to.throw.a( RangeError ) ;

			extracted.rebase() ;
			expect( extracted.get( 0 , 0 ) ).to.be( 5 ) ;
			expect( extracted.get( 1 , 1 ) ).to.be( 10 ) ;
		} ) ;
	} ) ;

	describe( ".mapRegion()" , function() {
		it( "basic .mapRegion()" , function() {
			let ndarray , mapped ;

			ndarray = new NDArray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;
			mapped = ndarray.mapRegion( [ [ 1 , 2 ] , [ 1 , 3 ] ] , value => 2 * value ) ;
			//console.log( "mapped:" , mapped.storage.length , mapped ) ;
			expect( mapped.dimensions ).to.be( 2 ) ;
			expect( mapped.size ).to.be( 6 ) ;
			expect( mapped.sizes ).to.equal( [ 2 , 3 ] ) ;
			expect( mapped.mins ).to.equal( [ 1 , 1 ] ) ;
			expect( mapped.maxs ).to.equal( [ 2 , 3 ] ) ;
			expect( mapped.order ).to.equal( [ 0 , 1 ] ) ;
			expect( mapped.strides ).to.equal( [ 1 , 2 ] ) ;
			expect( mapped.storageOffset ).to.be( 0 ) ;
			expect( mapped.storage ).to.equal( [ 10, 12, 18, 20, 26, 28 ] ) ;

			expect( mapped.get( 1 , 1 ) ).to.be( 10 ) ;
			expect( () => mapped.get( 0 , 1 ) ).to.throw.a( RangeError ) ;
			expect( () => mapped.get( 1 , 0 ) ).to.throw.a( RangeError ) ;
			expect( () => mapped.get( 3 , 1 ) ).to.throw.a( RangeError ) ;
			expect( () => mapped.get( 1 , 4 ) ).to.throw.a( RangeError ) ;
		} ) ;

		it( "basic .mapVectorRegion()" , function() {
			let ndarray , mapped ;

			ndarray = new NDArray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;
			mapped = ndarray.mapVectorRegion( [ [ 1 , 2 ] , null ] , ( vector , coords , index ) => {
				for ( let d = 0 ; d < vector.length ; d ++ ) {
					vector[ d ] += 100 * ( d + 1 ) ;
				}
				return vector ;
			} ) ;
			expect( mapped.dimensions ).to.be( 2 ) ;
			expect( mapped.size ).to.be( 10 ) ;
			expect( mapped.sizes ).to.equal( [ 2 , 5 ] ) ;
			expect( mapped.mins ).to.equal( [ 1 , 0 ] ) ;
			expect( mapped.maxs ).to.equal( [ 2 , 4 ] ) ;
			expect( mapped.order ).to.equal( [ 0 , 1 ] ) ;
			expect( mapped.strides ).to.equal( [ 1 , 2 ] ) ;
			expect( mapped.storageOffset ).to.be( 0 ) ;
			expect( mapped.storage ).to.equal( [
				101, 102,
				205, 206,
				309, 310,
				413, 414,
				517, 518
			] ) ;
			expect( mapped.get( 1 , 1 ) ).to.be( 205 ) ;

			mapped = ndarray.mapVectorRegion( [ null , [ 1 , 3 ] ] , ( vector , coords , index ) => {
				for ( let d = 0 ; d < vector.length ; d ++ ) {
					vector[ d ] += 100 * ( d + 1 ) ;
				}
				return vector ;
			} ) ;
			expect( mapped.dimensions ).to.be( 2 ) ;
			expect( mapped.size ).to.be( 12 ) ;
			expect( mapped.sizes ).to.equal( [ 4 , 3 ] ) ;
			expect( mapped.mins ).to.equal( [ 0 , 1 ] ) ;
			expect( mapped.maxs ).to.equal( [ 3 , 3 ] ) ;
			expect( mapped.order ).to.equal( [ 0 , 1 ] ) ;
			expect( mapped.strides ).to.equal( [ 1 , 4 ] ) ;
			expect( mapped.storageOffset ).to.be( 0 ) ;
			expect( mapped.storage ).to.equal( [
			    104, 205, 306, 407,
			    108, 209, 310, 411,
			    112, 213, 314, 415
			] ) ;
			expect( mapped.get( 1 , 1 ) ).to.be( 205 ) ;
		} ) ;
	} ) ;

	describe( ".copyTo()" , function() {
		it( "basic .copyTo()" , function() {
			let ndarray , dstNdarray , mapped ;

			ndarray = new NDArray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;
			dstNdarray = new NDArray( new Array( 20 ).fill( null ) , [ 4 , 5 ] ) ;

			ndarray.copyTo( dstNdarray , [ 1 , 2 ] ) ;
			//console.log( "dst:" , dstNdarray ) ;
			expect( dstNdarray.storage ).to.equal( [
				null, null, null, null,
				null, null, null, null,
				null, 0,    1,    2,
				null, 4,    5,    6,
				null, 8,    9,    10
			] ) ;
		} ) ;
	} ) ;

	describe( ".combineInto()" , function() {
		it( "basic .combineInto()" , function() {
			let ndarray , dstNdarray , mapped ;

			ndarray = new NDArray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;
			dstNdarray = new NDArray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;

			ndarray.combineInto( dstNdarray , [ 1 , 2 ] , ( src , dst ) => src.value * dst.value ) ;
			//console.log( "dst:" , dstNdarray ) ;
			expect( dstNdarray.storage ).to.equal( [
				0,    1,    2,    3,
				4,    5,    6,    7,
				8,    0,    10,   22,
				12,   52,   70,   90,
				16,   136,  162,  190
			] ) ;
		} ) ;
	} ) ;

	describe( "Getting vectors" , function() {

		it( ".getVector() / .setVector()" , function() {
			let ndarray ;

			ndarray = new NDArray( arrayKit.range( 15 ) , [ 3 , 5 ] ) ;
			expect( ndarray.getVector( [ null , 1 ] ) ).to.equal( [3,4,5] ) ;
			expect( ndarray.getVector( 2 , null ) ).to.equal( [2,5,8,11,14] ) ;
			ndarray.setVector( [ null , 1 ] , [101,102,103] ) ;
			expect( ndarray.getVector( [ null , 1 ] ) ).to.equal( [101,102,103] ) ;
			ndarray.setVector( 2 , null , [201,202,203,204,205] ) ;
			expect( ndarray.getVector( 2 , null ) ).to.equal( [201,202,203,204,205] ) ;
			expect( ndarray.storage ).to.equal( [
				0,   1,   201,
				101, 102, 202,
				6,   7,   203,
				9,   10,  204,
				12,  13,  205
			] ) ;

			ndarray = new NDArray( arrayKit.range( 15 ) , [ [ -1 , 1 ] , [ -2 , 2 ] ] ) ;
			expect( ndarray.getVector( null , 1 ) ).to.equal( [9,10,11] ) ;
			expect( ndarray.getVector( [ 0 , null ] ) ).to.equal( [1,4,7,10,13] ) ;
			ndarray.setVector( [ null , 1 ] , [101,102,103] ) ;
			expect( ndarray.getVector( [ null , 1 ] ) ).to.equal( [101,102,103] ) ;
			ndarray.setVector( 0 , null , [201,202,203,204,205] ) ;
			expect( ndarray.getVector( 0 , null ) ).to.equal( [201,202,203,204,205] ) ;
			expect( ndarray.storage ).to.equal( [
				0,   201, 2,
				3,   202, 5,
				6,   203, 8,
				101, 204, 103,
				12,  205, 14
			] ) ;
		} ) ;

		it( ".forEachVectorInRegion()" , function() {
			let callArgs ;
			let ndarray = new NDArray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;

			// Iterate partially on x
			callArgs = [] ;
			ndarray.forEachVectorInRegion( [ [ 1 , 2 ] , null ] , ( vector , coords , index ) => callArgs.push( [ Array.from( vector ) , Array.from( coords ) , index ] ) ) ;
			expect( callArgs ).to.equal( [
				[ [ 1, 5, 9, 13, 17 ], [ 1, 0 ], 1 ],
				[ [ 2, 6, 10, 14, 18 ], [ 2, 0 ], 2 ]
			] ) ;

			// Iterate partially on y
			callArgs = [] ;
			ndarray.forEachVectorInRegion( [ null , [ 1 , 3 ] ] , ( vector , coords , index ) => callArgs.push( [ Array.from( vector ) , Array.from( coords ) , index ] ) ) ;
			expect( callArgs ).to.equal( [
				[ [ 4, 5, 6, 7 ], [ 0, 1 ], 4 ],
				[ [ 8, 9, 10, 11 ], [ 0, 2 ], 8 ],
				[ [ 12, 13, 14, 15 ], [ 0, 3 ], 12 ]
			] ) ;
		} ) ;
	} ) ;

	describe( "Misc" , function() {

		it( ".fill()" , function() {
			ndarray = new NDArray( arrayKit.range( 15 ) , [ 3 , 5 ] ) ;
			expect( ndarray.storage ).to.equal( [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14] ) ;
			ndarray.fill( null ) ;
			expect( ndarray.storage ).to.equal( [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null] ) ;
			ndarray.fill( 0 ) ;
			expect( ndarray.storage ).to.equal( [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] ) ;
			ndarray.fill( 18 ) ;
			expect( ndarray.storage ).to.equal( [18,18,18,18,18,18,18,18,18,18,18,18,18,18,18] ) ;
			ndarray.fill( "bob" ) ;
			expect( ndarray.storage ).to.equal( ["bob","bob","bob","bob","bob","bob","bob","bob","bob","bob","bob","bob","bob","bob","bob"] ) ;
		} ) ;

		it( ".fillRegion()" , function() {
			ndarray = new NDArray( arrayKit.range( 15 ) , [ 3 , 5 ] ) ;
			expect( ndarray.storage ).to.equal( [
				0,    1,    2,
				3,    4,    5,
				6,    7,    8,
				9,    10,   11,
				12,   13,   14
			] ) ;
			ndarray.fillRegion( [ [1,2],[1,3] ] , null ) ;
			expect( ndarray.storage ).to.equal( [
				0,    1,    2,
				3,    null, null,
				6,    null, null,
				9,    null, null,
				12,   13,   14
			] ) ;
		} ) ;
	} ) ;
	
	describe( "Missing tests" , function() {
		it( ".rebase()" ) ;
	} ) ;
} ) ;

