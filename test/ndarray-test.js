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

/* global describe, it, before, after */


const arrayKit = require( '..' ) ;



// Utilities

const util = require( 'util' ) ;

function logDataStorage( data , perLine = 8 ) {
	const items = [] ;
	let padding = 4 ;

	for ( let i = 0 ; i < data.length ; i ++ ) {
		const item = util.inspect( data[ i ] ) + ', ' ;
		if ( item.length > padding ) { padding = item.length ; }
		items[ i ] = item ;
	}

	if ( padding % 2 ) { padding ++ ; }	// Ensure even padding

	let str = '' ;

	for ( let i = 0 ; i < data.length ; i += perLine ) {
		let line = '\t' ;
		for ( let j = i , jMax = Math.min( i + perLine , data.length ) ; j < jMax ; j ++ ) {
			let item = items[ j ] ;
			if ( item.length < padding ) { item += ' '.repeat( padding - item.length ) ; }
			line += item ;
		}
		line = line.trimEnd() ;
		line += '\n' ;
		str += line ;
	}

	str = str.slice( 0 , -2 ) ;
	str = '[\n' + str + '\n]' ;

	console.log( str ) ;
}



describe( "ND-Arrays" , function() {
	
	describe( "Basics" , function() {

		it( "Internal properties (offset, sizes, strides, dataStart, dataEnd)" , function() {
			let ndarray ;

			ndarray = arrayKit.ndarray( [] , [ 3 , 5 ] ) ;
			expect( ndarray.offset ).to.be( 0 ) ;
			expect( ndarray.sizes ).to.equal( [ 3 , 5 ] ) ;
			expect( ndarray.strides ).to.equal( [ 1 , 3 ] ) ;
			expect( ndarray.dataStart ).to.be( 0 ) ;
			expect( ndarray.dataEnd ).to.be( 15 ) ;

			ndarray = arrayKit.ndarray( [] , [ 3 , 5 , 6 ] ) ;
			expect( ndarray.offset ).to.be( 0 ) ;
			expect( ndarray.sizes ).to.equal( [ 3 , 5 , 6 ] ) ;
			expect( ndarray.strides ).to.equal( [ 1 , 3 , 15 ] ) ;
			expect( ndarray.dataStart ).to.be( 0 ) ;
			expect( ndarray.dataEnd ).to.be( 90 ) ;

			ndarray = arrayKit.ndarray( [] , [ 3 , 5 , 6 ] , { dataStart: 12 } ) ;
			expect( ndarray.offset ).to.be( 12 ) ;
			expect( ndarray.sizes ).to.equal( [ 3 , 5 , 6 ] ) ;
			expect( ndarray.strides ).to.equal( [ 1 , 3 , 15 ] ) ;
			expect( ndarray.dataStart ).to.be( 12 ) ;
			expect( ndarray.dataEnd ).to.be( 102 ) ;
		} ) ;

		it( "basic .getIndex()" , function() {
			let ndarray = arrayKit.ndarray( [] , [ 3 , 5 ] ) ;
			expect( ndarray.getIndex( 0 , 0 ) ).to.be( 0 ) ;
			expect( ndarray.getIndex( 2 , 0 ) ).to.be( 2 ) ;
			expect( ndarray.getIndex( 0 , 2 ) ).to.be( 6 ) ;
			expect( ndarray.getIndex( 2 , 2 ) ).to.be( 8 ) ;
			expect( ndarray.getIndex( 2 , 4 ) ).to.be( 14 ) ;
			expect( () => ndarray.getIndex( 3 , 2 ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.getIndex( 2 , 6 ) ).to.throw.a( RangeError ) ;

			// 3D test
			ndarray = arrayKit.ndarray( [] , [ 3 , 5 , 7 ] ) ;
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
			let ndarray = arrayKit.ndarray( [] , [ 3 , 5 ] ) ;
			expect( ndarray.getCoords( 0 ) ).to.equal( [ 0 , 0 ] ) ;
			expect( ndarray.getCoords( 2 ) ).to.equal( [ 2 , 0 ] ) ;
			expect( ndarray.getCoords( 6 ) ).to.equal( [ 0 , 2 ] ) ;
			expect( ndarray.getCoords( 8 ) ).to.equal( [ 2 , 2 ] ) ;
			expect( ndarray.getCoords( 14 ) ).to.equal( [ 2 , 4 ] ) ;

			// 3D test
			ndarray = arrayKit.ndarray( [] , [ 3 , 5 , 7 ] ) ;
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
			let ndarray = arrayKit.ndarray( arrayKit.range( 15 ) , [ 3 , 5 ] ) ;
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

			expect( ndarray.data ).to.equal( [22,1,2,3,4,5,6,7,8,9,42,11,12,13,72] ) ;
		} ) ;

		it( "basic .forEach()" , function() {
			let ndarray = arrayKit.ndarray( arrayKit.range( 15 ) , [ 3 , 5 ] ) ;
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
			let ndarray = arrayKit.ndarray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;

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

		it( "basic cursor" , function() {
			let callArgs , cursor ;
			let ndarray = arrayKit.ndarray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;

			// Iterate the whole array
			callArgs = [] ;
			cursor = ndarray.cursor() ;
			while ( cursor.next() ) {
				callArgs.push( [ cursor.value , Array.from( cursor.coords ) , cursor.index ] ) ;
			}
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
			// Check that subsequent call to next() returns false
			expect( cursor.next() ).to.be( false ) ;
			expect( cursor.next() ).to.be( false ) ;


			// Iterate the whole array, with minmax
			callArgs = [] ;
			cursor = ndarray.cursor( [ [ 0 , 3 ] , [ 0 , 4 ] ] ) ;
			while ( cursor.next() ) {
				callArgs.push( [ cursor.value , Array.from( cursor.coords ) , cursor.index ] ) ;
			}
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
			cursor = ndarray.cursor( [ [ 1 , 2 ] , [ 0 , 4 ] ] ) ;
			while ( cursor.next() ) {
				callArgs.push( [ cursor.value , Array.from( cursor.coords ) , cursor.index ] ) ;
			}
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
			cursor = ndarray.cursor( [ [ 0 , 3 ] , [ 1 , 3 ] ] ) ;
			while ( cursor.next() ) {
				callArgs.push( [ cursor.value , Array.from( cursor.coords ) , cursor.index ] ) ;
			}
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
			cursor = ndarray.cursor( [ [ 1 , 2 ] , [ 1 , 3 ] ] ) ;
			while ( cursor.next() ) {
				callArgs.push( [ cursor.value , Array.from( cursor.coords ) , cursor.index ] ) ;
			}
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
			cursor = ndarray.cursor( [ 1 , 1 ] , [ 2 , 3 ] ) ;
			while ( cursor.next() ) {
				callArgs.push( [ cursor.value , Array.from( cursor.coords ) , cursor.index ] ) ;
			}
			expect( callArgs ).to.equal( [
				[ 5 , [ 1 , 1 ] , 5 ] ,
				[ 6 , [ 2 , 1 ] , 6 ] ,
				[ 9 , [ 1 , 2 ] , 9 ] ,
				[ 10 , [ 2 , 2 ] , 10 ] ,
				[ 13 , [ 1 , 3 ] , 13 ] ,
				[ 14 , [ 2 , 3 ] , 14 ] ,
			] ) ;
			return ;
			// Range errors
			expect( () => ndarray.forEachInRegion( [ 1 , 1 ] , [ 4 , 3 ] , () => null ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.forEachInRegion( [ [ 1 , 3 ] , [ 3 , 5 ] ] , () => null ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.forEachInRegion( [ [ 1 , 3 ] , [ 3 , 2 ] ] , () => null ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.forEachInRegion( [ [ 1 , 0 ] , [ 1 , 2 ] ] , () => null ) ).to.throw.a( RangeError ) ;
		} ) ;
	} ) ;

	describe( "ND-arrays with changed order" , function() {

		it( ".getIndex() on ND-array with changed order" , function() {
			let ndarray = arrayKit.ndarray( [] , [ 3 , 5 ] , { order: [ 1 , 0 ] } ) ;
			expect( ndarray.getIndex( 0 , 0 ) ).to.be( 0 ) ;
			expect( ndarray.getIndex( 2 , 0 ) ).to.be( 10 ) ;
			expect( ndarray.getIndex( 0 , 2 ) ).to.be( 2 ) ;
			expect( () => ndarray.getIndex( 3 , 2 ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.getIndex( 2 , 5 ) ).to.throw.a( RangeError ) ;

			ndarray = arrayKit.ndarray( [] , [ 3 , 5 , 7 ] , { reverse: true } ) ;
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
			let ndarray = arrayKit.ndarray( [] , [ 3 , 5 ] , { reverse: true } ) ;
			expect( ndarray.getCoords( 0 ) ).to.equal( [ 0 , 0 ] ) ;
			expect( ndarray.getCoords( 2 ) ).to.equal( [ 0 , 2 ] ) ;
			expect( ndarray.getCoords( 10 ) ).to.equal( [ 2 , 0 ] ) ;
			expect( ndarray.getCoords( 12 ) ).to.equal( [ 2 , 2 ] ) ;
			expect( ndarray.getCoords( 14 ) ).to.equal( [ 2 , 4 ] ) ;

			// 3D test
			ndarray = arrayKit.ndarray( [] , [ 3 , 5 , 7 ] , { order: [ 2 , 0 , 1 ] } ) ;
			expect( ndarray.getCoords( 0 ) ).to.equal( [ 0 , 0 , 0 ] ) ;
			expect( ndarray.getCoords( 104 ) ).to.equal( [ 2 , 4 , 6 ] ) ;
			expect( ndarray.getCoords( 14 ) ).to.equal( [ 2 , 0 , 0 ] ) ;
			expect( ndarray.getCoords( 42 ) ).to.equal( [ 0 , 2 , 0 ] ) ;
			expect( ndarray.getCoords( 2 ) ).to.equal( [ 0 , 0 , 2 ] ) ;
			expect( ndarray.getCoords( 56 ) ).to.equal( [ 2 , 2 , 0 ] ) ;
			expect( ndarray.getCoords( 16 ) ).to.equal( [ 2 , 0 , 2 ] ) ;
			expect( ndarray.getCoords( 58 ) ).to.equal( [ 2 , 2 , 2 ] ) ;
		} ) ;

		it( ".get() / .set() on ND-array with changed order" , function() {
			let ndarray = arrayKit.ndarray( arrayKit.range( 24 ) , [ 2 , 3 , 4 ] , { order: [ 2 , 0 , 1 ] } ) ;
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

			expect( ndarray.data ).to.equal( [0,1,2,3,4,5,6,7,8,9,10,11,12,13,111,15,16,17,18,777,20,21,22,23] ) ;
		} ) ;

		it( ".forEach() on ND-array with changed order" , function() {
			let ndarray = arrayKit.ndarray( arrayKit.range( 15 ) , [ 3 , 5 ] , { reverse: true } ) ;
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

		it( "Internal properties (offset, sizes, strides, dataStart, dataEnd)" , function() {
			let ndarray ;

			ndarray = arrayKit.ndarray( [] , [ [ -3 , 3 ] , [ -5 , 5 ] ] ) ;
			expect( ndarray.offset ).to.be( 0 ) ;
			expect( ndarray.sizes ).to.equal( [ 7 , 11 ] ) ;
			expect( ndarray.strides ).to.equal( [ 1 , 7 ] ) ;
			expect( ndarray.dataStart ).to.be( 0 ) ;
			expect( ndarray.dataEnd ).to.be( 77 ) ;

			ndarray = arrayKit.ndarray( [] , [ [ -3 , 3 ] , [ -5 , 5 ] , [ 3 , 6 ] ] ) ;
			expect( ndarray.offset ).to.be( 0 ) ;
			expect( ndarray.sizes ).to.equal( [ 7 , 11 , 4 ] ) ;
			expect( ndarray.strides ).to.equal( [ 1 , 7 , 77 ] ) ;
			expect( ndarray.dataStart ).to.be( 0 ) ;
			expect( ndarray.dataEnd ).to.be( 308 ) ;

			ndarray = arrayKit.ndarray( [] , [ [ -3 , 3 ] , [ -5 , 5 ] , [ 3 , 6 ] ] , { dataStart: 15 } ) ;
			expect( ndarray.offset ).to.be( 15 ) ;
			expect( ndarray.sizes ).to.equal( [ 7 , 11 , 4 ] ) ;
			expect( ndarray.strides ).to.equal( [ 1 , 7 , 77 ] ) ;
			expect( ndarray.dataStart ).to.be( 15 ) ;
			expect( ndarray.dataEnd ).to.be( 323 ) ;
		} ) ;

		it( ".getIndex() on non-zero-based ND-array" , function() {
			let ndarray = arrayKit.ndarray( [] , [ [ -3 , 3 ] , [ -5 , 5 ] ] ) ;
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
			ndarray = arrayKit.ndarray( [] , [ [ -3 , 3 ] , [ -5 , 5 ] , [ 3 , 6 ] ] ) ;
			expect( ndarray.getIndex( -3 , -5 , 3 ) ).to.be( 0 ) ;
			expect( ndarray.getIndex( 3 , 5 , 6 ) ).to.be( 307 ) ;
			expect( ndarray.getIndex( 1 , -2 , 4 ) ).to.be( 102 ) ;
			expect( ndarray.getIndex( -3 , 4 , 6 ) ).to.be( 294 ) ;
			expect( () => ndarray.getIndex( 2 , 3 , 2 ) ).to.throw.a( RangeError ) ;
			expect( () => ndarray.getIndex( 2 , 3 , 7 ) ).to.throw.a( RangeError ) ;
		} ) ;

		it( ".getCoords() on non-zero-based ND-array" , function() {
			let ndarray = arrayKit.ndarray( [] , [ [ -3 , 3 ] , [ -5 , 5 ] ] ) ;
			expect( ndarray.getCoords( 0 ) ).to.equal( [ -3 , -5 ] ) ;
			expect( ndarray.getCoords( 76 ) ).to.equal( [ 3 , 5 ] ) ;
			expect( ndarray.getCoords( 38 ) ).to.equal( [ 0 , 0 ] ) ;
			expect( ndarray.getCoords( 57 ) ).to.equal( [ -2 , 3 ] ) ;
			expect( ndarray.getCoords( 26 ) ).to.equal( [ 2 , -2 ] ) ;

			// 3D test
			ndarray = arrayKit.ndarray( [] , [ [ -3 , 3 ] , [ -5 , 5 ] , [ 3 , 6 ] ] ) ;
			expect( ndarray.getCoords( 0 ) ).to.equal( [ -3 , -5 , 3 ] ) ;
			expect( ndarray.getCoords( 307 ) ).to.equal( [ 3 , 5 , 6 ] ) ;
			expect( ndarray.getCoords( 102 ) ).to.equal( [ 1 , -2 , 4 ] ) ;
			expect( ndarray.getCoords( 294 ) ).to.equal( [ -3 , 4 , 6 ] ) ;
		} ) ;

		it( ".get() / .set() on non-zero-based ND-array" , function() {
			let ndarray = arrayKit.ndarray( arrayKit.range( 15 ) , [ [ -2 , 2 ] , [ -1 , 1 ] ] ) ;
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

			expect( ndarray.data ).to.equal( [22,1,2,3,72,5,6,7,8,9,10,11,12,42,14] ) ;
		} ) ;

		it( ".forEach() on non-zero-based ND-array" , function() {
			let ndarray = arrayKit.ndarray( arrayKit.range( 15 ) , [ [ -2 , 2 ] , [ -1 , 1 ] ] ) ;
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

	describe( "Backward strides / flipping the ND-arrays" , function() {

		it( "Flipping an axis with .flip()" , function() {
			let ndarray ;

			ndarray = arrayKit.ndarray( arrayKit.range( 24 ) , [ [ -1 , 2 ] , [ -2 , 3 ] ] ) ;
			expect( ndarray.offset ).to.be( 0 ) ;
			expect( ndarray.sizes ).to.equal( [ 4 , 6 ] ) ;
			expect( ndarray.strides ).to.equal( [ 1 , 4 ] ) ;
			expect( ndarray.dataStart ).to.be( 0 ) ;
			expect( ndarray.dataEnd ).to.be( 24 ) ;
			//logDataStorage( ndarray.data , 4 ) ;
			expect( ndarray.data ).to.equal( [
				0,  1,  2,  3,
				4,  5,  6,  7,
				8,  9,  10, 11,
				12, 13, 14, 15,
				16, 17, 18, 19,
				20, 21, 22, 23
			] ) ;
			expect( ndarray.get( 0 , -1 ) ).to.be( 5 ) ;
			expect( ndarray.get( 1 , 1 ) ).to.be( 14 ) ;
			expect( ndarray.get( 2 , 2 ) ).to.be( 19 ) ;

			ndarray.flip( 1 ) ;
			expect( ndarray.offset ).to.be( 20 ) ;
			expect( ndarray.sizes ).to.equal( [ 4 , 6 ] ) ;
			expect( ndarray.strides ).to.equal( [ 1 , -4 ] ) ;
			expect( ndarray.dataStart ).to.be( 0 ) ;
			expect( ndarray.dataEnd ).to.be( 24 ) ;
			
			// The backend data has not changed
			expect( ndarray.data ).to.equal( [
				0,  1,  2,  3,
				4,  5,  6,  7,
				8,  9,  10, 11,
				12, 13, 14, 15,
				16, 17, 18, 19,
				20, 21, 22, 23
			] ) ;
			expect( ndarray.get( 0 , -1 ) ).to.be( 17 ) ;
			expect( ndarray.get( 1 , 1 ) ).to.be( 10 ) ;
			expect( ndarray.get( 2 , 2 ) ).to.be( 7 ) ;

			ndarray.flip( 0 ) ;
			expect( ndarray.offset ).to.be( 23 ) ;
			expect( ndarray.sizes ).to.equal( [ 4 , 6 ] ) ;
			expect( ndarray.strides ).to.equal( [ -1 , -4 ] ) ;
			expect( ndarray.dataStart ).to.be( 0 ) ;
			expect( ndarray.dataEnd ).to.be( 24 ) ;
			
			// The backend data has not changed
			expect( ndarray.data ).to.equal( [
				0,  1,  2,  3,
				4,  5,  6,  7,
				8,  9,  10, 11,
				12, 13, 14, 15,
				16, 17, 18, 19,
				20, 21, 22, 23
			] ) ;
			expect( ndarray.get( 0 , -1 ) ).to.be( 18 ) ;
			expect( ndarray.get( 1 , 1 ) ).to.be( 9 ) ;
			expect( ndarray.get( 2 , 2 ) ).to.be( 4 ) ;

			// Back to normal
			ndarray.flip( 0 ).flip( 1 ) ;
			expect( ndarray.offset ).to.be( 0 ) ;
			expect( ndarray.sizes ).to.equal( [ 4 , 6 ] ) ;
			expect( ndarray.strides ).to.equal( [ 1 , 4 ] ) ;
			expect( ndarray.dataStart ).to.be( 0 ) ;
			expect( ndarray.dataEnd ).to.be( 24 ) ;
			//logDataStorage( ndarray.data , 4 ) ;
			expect( ndarray.data ).to.equal( [
				0,  1,  2,  3,
				4,  5,  6,  7,
				8,  9,  10, 11,
				12, 13, 14, 15,
				16, 17, 18, 19,
				20, 21, 22, 23
			] ) ;
			expect( ndarray.get( 0 , -1 ) ).to.be( 5 ) ;
			expect( ndarray.get( 1 , 1 ) ).to.be( 14 ) ;
			expect( ndarray.get( 2 , 2 ) ).to.be( 19 ) ;
		} ) ;

		it( "Flipping all axis at once with .flipAll()" , function() {
			let ndarray ;

			ndarray = arrayKit.ndarray( arrayKit.range( 24 ) , [ [ -1 , 2 ] , [ -2 , 3 ] ] ) ;
			expect( ndarray.offset ).to.be( 0 ) ;
			expect( ndarray.sizes ).to.equal( [ 4 , 6 ] ) ;
			expect( ndarray.strides ).to.equal( [ 1 , 4 ] ) ;
			expect( ndarray.dataStart ).to.be( 0 ) ;
			expect( ndarray.dataEnd ).to.be( 24 ) ;
			//logDataStorage( ndarray.data , 4 ) ;
			expect( ndarray.data ).to.equal( [
				0,  1,  2,  3,
				4,  5,  6,  7,
				8,  9,  10, 11,
				12, 13, 14, 15,
				16, 17, 18, 19,
				20, 21, 22, 23
			] ) ;
			expect( ndarray.get( 0 , -1 ) ).to.be( 5 ) ;
			expect( ndarray.get( 1 , 1 ) ).to.be( 14 ) ;
			expect( ndarray.get( 2 , 2 ) ).to.be( 19 ) ;

			ndarray.flipAll() ;
			expect( ndarray.offset ).to.be( 23 ) ;
			expect( ndarray.sizes ).to.equal( [ 4 , 6 ] ) ;
			expect( ndarray.strides ).to.equal( [ -1 , -4 ] ) ;
			expect( ndarray.dataStart ).to.be( 0 ) ;
			expect( ndarray.dataEnd ).to.be( 24 ) ;
			
			// The backend data has not changed
			expect( ndarray.data ).to.equal( [
				0,  1,  2,  3,
				4,  5,  6,  7,
				8,  9,  10, 11,
				12, 13, 14, 15,
				16, 17, 18, 19,
				20, 21, 22, 23
			] ) ;
			expect( ndarray.get( 0 , -1 ) ).to.be( 18 ) ;
			expect( ndarray.get( 1 , 1 ) ).to.be( 9 ) ;
			expect( ndarray.get( 2 , 2 ) ).to.be( 4 ) ;

			// Back to normal
			ndarray.flipAll() ;
			expect( ndarray.offset ).to.be( 0 ) ;
			expect( ndarray.sizes ).to.equal( [ 4 , 6 ] ) ;
			expect( ndarray.strides ).to.equal( [ 1 , 4 ] ) ;
			expect( ndarray.dataStart ).to.be( 0 ) ;
			expect( ndarray.dataEnd ).to.be( 24 ) ;
			//logDataStorage( ndarray.data , 4 ) ;
			expect( ndarray.data ).to.equal( [
				0,  1,  2,  3,
				4,  5,  6,  7,
				8,  9,  10, 11,
				12, 13, 14, 15,
				16, 17, 18, 19,
				20, 21, 22, 23
			] ) ;
			expect( ndarray.get( 0 , -1 ) ).to.be( 5 ) ;
			expect( ndarray.get( 1 , 1 ) ).to.be( 14 ) ;
			expect( ndarray.get( 2 , 2 ) ).to.be( 19 ) ;
		} ) ;

		it( ".forEach() order" , function() {
			let ndarray , callArgs ;

			ndarray = arrayKit.ndarray( arrayKit.range( 15 ) , [ 3 , 5 ] ) ;

			callArgs = [] ;
			ndarray.forEach( ( value , coords , index ) => callArgs.push( [ value , Array.from( coords ) , index ] ) ) ;
			//console.log( "callArgs" , callArgs ) ;
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

			ndarray.flip( 1 ) ;
			callArgs = [] ;
			ndarray.forEach( ( value , coords , index ) => callArgs.push( [ value , Array.from( coords ) , index ] ) ) ;
			//console.log( "callArgs" , callArgs ) ;
			expect( callArgs ).to.equal( [
				[ 12, [ 0, 0 ], 12 ],
				[ 13, [ 1, 0 ], 13 ],
				[ 14, [ 2, 0 ], 14 ],
				[ 9, [ 0, 1 ], 9 ],
				[ 10, [ 1, 1 ], 10 ],
				[ 11, [ 2, 1 ], 11 ],
				[ 6, [ 0, 2 ], 6 ],
				[ 7, [ 1, 2 ], 7 ],
				[ 8, [ 2, 2 ], 8 ],
				[ 3, [ 0, 3 ], 3 ],
				[ 4, [ 1, 3 ], 4 ],
				[ 5, [ 2, 3 ], 5 ],
				[ 0, [ 0, 4 ], 0 ],
				[ 1, [ 1, 4 ], 1 ],
				[ 2, [ 2, 4 ], 2 ]
			] ) ;
		} ) ;

		it( ".forEachInRegion()" , function() {
			let ndarray , callArgs ;

			ndarray = arrayKit.ndarray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;
			ndarray.flip( 1 ) ;

			// Iterate the whole array
			callArgs = [] ;
			ndarray.forEachInRegion( [ [ 0 , 3 ] , [ 0 , 4 ] ] , ( value , coords , index ) => callArgs.push( [ value , Array.from( coords ) , index ] ) ) ;
			expect( callArgs ).to.equal( [
				[ 16, [ 0, 0 ], 16 ],
				[ 17, [ 1, 0 ], 17 ],
				[ 18, [ 2, 0 ], 18 ],
				[ 19, [ 3, 0 ], 19 ],
				[ 12, [ 0, 1 ], 12 ],
				[ 13, [ 1, 1 ], 13 ],
				[ 14, [ 2, 1 ], 14 ],
				[ 15, [ 3, 1 ], 15 ],
				[ 8, [ 0, 2 ], 8 ],
				[ 9, [ 1, 2 ], 9 ],
				[ 10, [ 2, 2 ], 10 ],
				[ 11, [ 3, 2 ], 11 ],
				[ 4, [ 0, 3 ], 4 ],
				[ 5, [ 1, 3 ], 5 ],
				[ 6, [ 2, 3 ], 6 ],
				[ 7, [ 3, 3 ], 7 ],
				[ 0, [ 0, 4 ], 0 ],
				[ 1, [ 1, 4 ], 1 ],
				[ 2, [ 2, 4 ], 2 ],
				[ 3, [ 3, 4 ], 3 ]
			] ) ;

			// Iterate partially on x and y
			callArgs = [] ;
			ndarray.forEachInRegion( [ [ 1 , 2 ] , [ 1 , 3 ] ] , ( value , coords , index ) => callArgs.push( [ value , Array.from( coords ) , index ] ) ) ;
			expect( callArgs ).to.equal( [
				[ 13, [ 1, 1 ], 13 ],
				[ 14, [ 2, 1 ], 14 ],
				[ 9, [ 1, 2 ], 9 ],
				[ 10, [ 2, 2 ], 10 ],
				[ 5, [ 1, 3 ], 5 ],
				[ 6, [ 2, 3 ], 6 ]
			] ) ;
		} ) ;

		it( "test .map()" ) ;
		it( "test .mapInRegion()" ) ;
	} ) ;

	describe( "Transposition" , function() {

		it( "Transpose 2D Array with .transpose()" , function() {
			let ndarray ;

			ndarray = arrayKit.ndarray( arrayKit.range( 24 ) , [ [ -1 , 2 ] , [ -2 , 3 ] ] ) ;
			expect( ndarray.offset ).to.be( 0 ) ;
			expect( ndarray.sizes ).to.equal( [ 4 , 6 ] ) ;
			expect( ndarray.mins ).to.equal( [ -1 , -2 ] ) ;
			expect( ndarray.maxs ).to.equal( [ 2 , 3 ] ) ;
			expect( ndarray.strides ).to.equal( [ 1 , 4 ] ) ;
			expect( ndarray.order ).to.equal( [ 0 , 1 ] ) ;
			expect( ndarray.dataStart ).to.be( 0 ) ;
			expect( ndarray.dataEnd ).to.be( 24 ) ;
			//logDataStorage( ndarray.data , 4 ) ;
			expect( ndarray.data ).to.equal( [
				0,  1,  2,  3,
				4,  5,  6,  7,
				8,  9,  10, 11,
				12, 13, 14, 15,
				16, 17, 18, 19,
				20, 21, 22, 23
			] ) ;
			expect( ndarray.get( 0 , -1 ) ).to.be( 5 ) ;
			expect( ndarray.get( -1 , 0 ) ).to.be( 8 ) ;
			expect( ndarray.get( 0 , 2 ) ).to.be( 17 ) ;
			expect( ndarray.get( 2 , 0 ) ).to.be( 11 ) ;
			expect( ndarray.get( 1 , 1 ) ).to.be( 14 ) ;
			expect( ndarray.get( 2 , 2 ) ).to.be( 19 ) ;

			ndarray.transpose( 1 , 0 ) ;
			expect( ndarray.offset ).to.be( 0 ) ;
			expect( ndarray.sizes ).to.equal( [ 6 , 4 ] ) ;
			expect( ndarray.mins ).to.equal( [ -2 , -1 ] ) ;
			expect( ndarray.maxs ).to.equal( [ 3 , 2 ] ) ;
			expect( ndarray.strides ).to.equal( [ 4 , 1 ] ) ;
			expect( ndarray.order ).to.equal( [ 1 , 0 ] ) ;
			expect( ndarray.dataStart ).to.be( 0 ) ;
			expect( ndarray.dataEnd ).to.be( 24 ) ;
			
			// The backend data has not changed
			expect( ndarray.data ).to.equal( [
				0,  1,  2,  3,
				4,  5,  6,  7,
				8,  9,  10, 11,
				12, 13, 14, 15,
				16, 17, 18, 19,
				20, 21, 22, 23
			] ) ;
			expect( ndarray.get( 0 , -1 ) ).to.be( 8 ) ;
			expect( ndarray.get( -1 , 0 ) ).to.be( 5 ) ;
			expect( ndarray.get( 0 , 2 ) ).to.be( 11 ) ;
			expect( ndarray.get( 2 , 0 ) ).to.be( 17 ) ;
			expect( ndarray.get( 1 , 1 ) ).to.be( 14 ) ;
			expect( ndarray.get( 2 , 2 ) ).to.be( 19 ) ;
		} ) ;

		it( "Transpose 3D Array with .transpose()" , function() {
			let ndarray ;

			ndarray = arrayKit.ndarray( arrayKit.range( 60 ) , [ 3 , 4 , 5 ] ) ;
			expect( ndarray.offset ).to.be( 0 ) ;
			expect( ndarray.sizes ).to.equal( [ 3 , 4 , 5 ] ) ;
			expect( ndarray.mins ).to.equal( [ 0 , 0 , 0 ] ) ;
			expect( ndarray.maxs ).to.equal( [ 2 , 3 , 4 ] ) ;
			expect( ndarray.strides ).to.equal( [ 1 , 3 , 12 ] ) ;
			expect( ndarray.order ).to.equal( [ 0 , 1 , 2 ] ) ;
			expect( ndarray.dataStart ).to.be( 0 ) ;
			expect( ndarray.dataEnd ).to.be( 60 ) ;

			expect( ndarray.get( 0 , 2 , 1 ) ).to.be( 18 ) ;
			expect( ndarray.get( 2 , 2 , 1 ) ).to.be( 20 ) ;

			ndarray.transpose( 2 , 0 , 1 ) ;
			expect( ndarray.offset ).to.be( 0 ) ;
			expect( ndarray.sizes ).to.equal( [ 5 , 3 , 4 ] ) ;
			expect( ndarray.mins ).to.equal( [ 0 , 0 , 0 ] ) ;
			expect( ndarray.maxs ).to.equal( [ 4 , 2 , 3 ] ) ;
			expect( ndarray.strides ).to.equal( [ 12 , 1 , 3 ] ) ;
			expect( ndarray.order ).to.equal( [ 2 , 0 , 1 ] ) ;
			expect( ndarray.dataStart ).to.be( 0 ) ;
			expect( ndarray.dataEnd ).to.be( 60 ) ;
			
			expect( ndarray.get( 1 , 0 , 2 ) ).to.be( 18 ) ;
			expect( ndarray.get( 1 , 2 , 2 ) ).to.be( 20 ) ;
		} ) ;
	} ) ;

	describe( "Reducing dimensions by fixing an axis" , function() {

		it.next( "basic .select()" , function() {
			let ndarray ;

			ndarray = arrayKit.ndarray( arrayKit.range( 24 ) , [ [ -1 , 2 ] , [ -2 , 3 ] ] ) ;
			expect( ndarray.size ).to.be( 24 ) ;
			expect( ndarray.isContiguous ).to.be( true ) ;
			ndarray.select( 1 , null ) ;
			//console.log( ndarray ) ;
			expect( ndarray.dimensions ).to.be( 1 ) ;
			expect( ndarray.offset ).to.be( 2 ) ;
			expect( ndarray.size ).to.be( 6 ) ;
			expect( ndarray.sizes ).to.equal( [ 6 ] ) ;
			expect( ndarray.strides ).to.equal( [ 4 ] ) ;
			expect( ndarray.order ).to.equal( [ 0 ] ) ;
			expect( ndarray.dataStart ).to.be( 2 ) ;
			expect( ndarray.dataEnd ).to.be( 23 ) ;
			expect( ndarray.isContiguous ).to.be( false ) ;
			//logDataStorage( ndarray.data , 4 ) ;
			expect( ndarray.data ).to.equal( [
				0,  1,  2,  3,
				4,  5,  6,  7,
				8,  9,  10, 11,
				12, 13, 14, 15,
				16, 17, 18, 19,
				20, 21, 22, 23
			] ) ;
			expect( ndarray.get( -2 ) ).to.be( 2 ) ;
			expect( ndarray.get( -1 ) ).to.be( 6 ) ;
			expect( ndarray.get( 0 ) ).to.be( 10 ) ;
			expect( ndarray.get( 1 ) ).to.be( 14 ) ;
			expect( ndarray.get( 2 ) ).to.be( 18 ) ;
			expect( ndarray.get( 3 ) ).to.be( 22 ) ;

			ndarray = arrayKit.ndarray( arrayKit.range( 24 ) , [ [ -1 , 2 ] , [ -2 , 3 ] ] ) ;
			expect( ndarray.size ).to.be( 24 ) ;
			expect( ndarray.isContiguous ).to.be( true ) ;
			ndarray.select( null , 1 ) ;
			//console.log( ndarray ) ;
			expect( ndarray.dimensions ).to.be( 1 ) ;
			expect( ndarray.offset ).to.be( 12 ) ;
			expect( ndarray.size ).to.be( 4 ) ;
			expect( ndarray.sizes ).to.equal( [ 4 ] ) ;
			expect( ndarray.strides ).to.equal( [ 1 ] ) ;
			expect( ndarray.order ).to.equal( [ 0 ] ) ;
			expect( ndarray.dataStart ).to.be( 12 ) ;
			expect( ndarray.dataEnd ).to.be( 16 ) ;
			expect( ndarray.isContiguous ).to.be( true ) ;
			//logDataStorage( ndarray.data , 4 ) ;
			expect( ndarray.data ).to.equal( [
				0,  1,  2,  3,
				4,  5,  6,  7,
				8,  9,  10, 11,
				12, 13, 14, 15,
				16, 17, 18, 19,
				20, 21, 22, 23
			] ) ;
			expect( ndarray.get( -1 ) ).to.be( 12 ) ;
			expect( ndarray.get( 0 ) ).to.be( 13 ) ;
			expect( ndarray.get( 1 ) ).to.be( 14 ) ;
			expect( ndarray.get( 2 ) ).to.be( 15 ) ;
		} ) ;

		it.next( "Using .fill() after .select()" , function() {
			let ndarray ;

			ndarray = arrayKit.ndarray( arrayKit.range( 24 ) , [ [ -1 , 2 ] , [ -2 , 3 ] ] ) ;
			ndarray.select( 1 , null ) ;
			ndarray.fill( 100 ) ;
			//logDataStorage( ndarray.data , 4 ) ;
			expect( ndarray.data ).to.equal( [
				0,    1,    100,  3,
				4,    5,    100,  7,
				8,    9,    100,  11,
				12,   13,   100,  15,
				16,   17,   100,  19,
				20,   21,   100,  23
			] ) ;

			ndarray = arrayKit.ndarray( arrayKit.range( 24 ) , [ [ -1 , 2 ] , [ -2 , 3 ] ] ) ;
			ndarray.select( null , 1 ) ;
			ndarray.fill( 100 ) ;
			//logDataStorage( ndarray.data , 4 ) ;
			expect( ndarray.data ).to.equal( [
				0,    1,    2,    3,
				4,    5,    6,    7,
				8,    9,    10,   11,
				100,  100,  100,  100,
				16,   17,   18,   19,
				20,   21,   22,   23
			] ) ;
		} ) ;
	} ) ;

	describe( "Getting vectors" , function() {

		it( ".getVector() / .setVector()" , function() {
			let ndarray ;

			ndarray = arrayKit.ndarray( arrayKit.range( 15 ) , [ 3 , 5 ] ) ;
			expect( ndarray.getVector( [ null , 1 ] ) ).to.equal( [3,4,5] ) ;
			expect( ndarray.getVector( 2 , null ) ).to.equal( [2,5,8,11,14] ) ;
			ndarray.setVector( [ null , 1 ] , [101,102,103] ) ;
			expect( ndarray.getVector( [ null , 1 ] ) ).to.equal( [101,102,103] ) ;
			ndarray.setVector( 2 , null , [201,202,203,204,205] ) ;
			expect( ndarray.getVector( 2 , null ) ).to.equal( [201,202,203,204,205] ) ;
			expect( ndarray.data ).to.equal( [
				0,   1,   201,
				101, 102, 202,
				6,   7,   203,
				9,   10,  204,
				12,  13,  205
			] ) ;

			ndarray = arrayKit.ndarray( arrayKit.range( 15 ) , [ [ -1 , 1 ] , [ -2 , 2 ] ] ) ;
			expect( ndarray.getVector( null , 1 ) ).to.equal( [9,10,11] ) ;
			expect( ndarray.getVector( [ 0 , null ] ) ).to.equal( [1,4,7,10,13] ) ;
			ndarray.setVector( [ null , 1 ] , [101,102,103] ) ;
			expect( ndarray.getVector( [ null , 1 ] ) ).to.equal( [101,102,103] ) ;
			ndarray.setVector( 0 , null , [201,202,203,204,205] ) ;
			expect( ndarray.getVector( 0 , null ) ).to.equal( [201,202,203,204,205] ) ;
			expect( ndarray.data ).to.equal( [
				0,   201, 2,
				3,   202, 5,
				6,   203, 8,
				101, 204, 103,
				12,  205, 14
			] ) ;
		} ) ;

		it( ".forEachVectorInRegion()" , function() {
			let callArgs ;
			let ndarray = arrayKit.ndarray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;

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

	describe( "Filling a ND-Array: .fill() / .fillInRegion() / .fillVectorInRegion()" , function() {

		it( ".fill()" , function() {
			let ndarray = arrayKit.ndarray( arrayKit.range( 15 ) , [ 3 , 5 ] ) ;
			expect( ndarray.data ).to.equal( [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14] ) ;
			ndarray.fill( null ) ;
			expect( ndarray.data ).to.equal( [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null] ) ;
			ndarray.fill( 0 ) ;
			expect( ndarray.data ).to.equal( [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] ) ;
			ndarray.fill( 18 ) ;
			expect( ndarray.data ).to.equal( [18,18,18,18,18,18,18,18,18,18,18,18,18,18,18] ) ;
			ndarray.fill( "bob" ) ;
			expect( ndarray.data ).to.equal( ["bob","bob","bob","bob","bob","bob","bob","bob","bob","bob","bob","bob","bob","bob","bob"] ) ;
		} ) ;

		it( ".fillInRegion()" , function() {
			let ndarray = arrayKit.ndarray( arrayKit.range( 15 ) , [ 3 , 5 ] ) ;
			expect( ndarray.data ).to.equal( [
				0,    1,    2,
				3,    4,    5,
				6,    7,    8,
				9,    10,   11,
				12,   13,   14
			] ) ;
			ndarray.fillInRegion( [ [1,2],[1,3] ] , null ) ;
			expect( ndarray.data ).to.equal( [
				0,    1,    2,
				3,    null, null,
				6,    null, null,
				9,    null, null,
				12,   13,   14
			] ) ;
		} ) ;

		it( ".fillVectorInRegion()" , function() {
			// Create a sort of RGBA pixel-buffer
			let ndarray = arrayKit.ndarray( new Uint8Array( 6 * 5 * 4 ) , [ 6 , 5 , 4 ] , { order: [ 2 , 0 , 1 ] } ) ;
			ndarray.fillVectorInRegion( [ [2,5] , [1,3] , null ] , [200,160,120,255] ) ;
			//logDataStorage( ndarray.data , 24 ) ;
			expect( [ ... ndarray.data ] ).to.equal( [
				0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,
				0,    0,    0,    0,    0,    0,    0,    0,    200,  160,  120,  255,  200,  160,  120,  255,  200,  160,  120,  255,  200,  160,  120,  255,
				0,    0,    0,    0,    0,    0,    0,    0,    200,  160,  120,  255,  200,  160,  120,  255,  200,  160,  120,  255,  200,  160,  120,  255,
				0,    0,    0,    0,    0,    0,    0,    0,    200,  160,  120,  255,  200,  160,  120,  255,  200,  160,  120,  255,  200,  160,  120,  255,
				0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0
			] ) ;
		} ) ;
	} ) ;
	
	describe( "Updating a ND-Array: .update() / .updateInRegion() / .updateVectorInRegion()" , function() {

		it( ".update()" , function() {
			let ndarray = arrayKit.ndarray( arrayKit.range( 15 ) , [ 3 , 5 ] ) ;
			expect( ndarray.data ).to.equal( [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14] ) ;
			ndarray.update( value => value * 2 ) ;
			expect( ndarray.data ).to.equal( [0,2,4,6,8,10,12,14,16,18,20,22,24,26,28] ) ;

			ndarray.update( ( value , coords ) => coords[ 0 ] + coords[ 1 ] ) ;
			expect( ndarray.data ).to.equal( [ 0, 1, 2, 1, 2, 3, 2, 3, 4, 3, 4, 5, 4, 5, 6 ] ) ;
		} ) ;

		it( ".updateInRegion()" , function() {
			let ndarray = arrayKit.ndarray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;
			ndarray.updateInRegion( [ [ 1 , 2 ] , [ 1 , 3 ] ] , value => 2 * value ) ;
			//logDataStorage( ndarray.data , 4 ) ; return ;
			expect( ndarray.data ).to.equal( [
				0,  1,  2,  3,
				4,  10, 12, 7,
				8,  18, 20, 11,
				12, 26, 28, 15,
				16, 17, 18, 19
			] ) ;
		} ) ;

		it( ".updateVectorInRegion()" , function() {
			let ndarray = arrayKit.ndarray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;
			ndarray.updateVectorInRegion( [ [ 1 , 2 ] , null ] , ( vector , coords , index ) => {
				//console.log( "Received:" , { vector , coords , index } ) ;
				for ( let d = 0 ; d < vector.length ; d ++ ) {
					vector[ d ] += 100 * ( d + 1 ) ;
				}
				return vector ;
			} ) ;
			//logDataStorage( ndarray.data , 4 ) ;
			expect( ndarray.data ).to.equal( [
				0,    101,  102,  3,
				4,    205,  206,  7,
				8,    309,  310,  11,
				12,   413,  414,  15,
				16,   517,  518,  19
			] ) ;

			ndarray = arrayKit.ndarray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;
			ndarray.updateVectorInRegion( [ null , [ 1 , 3 ] ] , ( vector , coords , index ) => {
				//console.log( "Received:" , { vector , coords , index } ) ;
				for ( let d = 0 ; d < vector.length ; d ++ ) {
					vector[ d ] += 100 * ( d + 1 ) ;
				}
				return vector ;
			} ) ;
			//logDataStorage( ndarray.data , 4 ) ;
			expect( ndarray.data ).to.equal( [
				0,    1,    2,    3,
				104,  205,  306,  407,
				108,  209,  310,  411,
				112,  213,  314,  415,
				16,   17,   18,   19
			] ) ;
		} ) ;
	} ) ;
	
	describe( "Mapping a ND-array: .map() / .mapInRegion() / .mapVectorInRegion()" , function() {

		it( "basic .map() should return a arrayKit.ndarray with its own data storage, mapping values with the callback" , function() {
			let ndarray , mapped ;

			ndarray = arrayKit.ndarray( arrayKit.range( 15 ) , [ 3 , 5 ] ) ;

			mapped = ndarray.map( value => 2 * value ) ;
			expect( mapped.data ).not.to.be( ndarray.data ) ;
			expect( mapped.data ).to.equal( [0,2,4,6,8,10,12,14,16,18,20,22,24,26,28] ) ;

			mapped = ndarray.map( ( value , coords ) => coords[ 0 ] + coords[ 1 ] ) ;
			expect( mapped.data ).to.equal( [ 0, 1, 2, 1, 2, 3, 2, 3, 4, 3, 4, 5, 4, 5, 6 ] ) ;

			ndarray = arrayKit.ndarray( arrayKit.range( 20 ) , [ 3 , 5 ] , { dataStart: 3 } ) ;
			mapped = ndarray.map( value => 2 * value ) ;
			//logDataStorage( mapped.data , 3 ) ;
			expect( mapped.data ).to.equal( [6,8,10,12,14,16,18,20,22,24,26,28,30,32,34] ) ;
		} ) ;

		it( "basic .mapInRegion()" , function() {
			let ndarray , mapped ;

			ndarray = arrayKit.ndarray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;
			mapped = ndarray.mapInRegion( [ [ 1 , 2 ] , [ 1 , 3 ] ] , value => 2 * value ) ;
			//console.log( "mapped:" , mapped.data.length , mapped ) ;
			expect( mapped.dimensions ).to.be( 2 ) ;
			expect( mapped.size ).to.be( 6 ) ;
			expect( mapped.sizes ).to.equal( [ 2 , 3 ] ) ;
			expect( mapped.mins ).to.equal( [ 1 , 1 ] ) ;
			expect( mapped.maxs ).to.equal( [ 2 , 3 ] ) ;
			expect( mapped.order ).to.equal( [ 0 , 1 ] ) ;
			expect( mapped.strides ).to.equal( [ 1 , 2 ] ) ;
			expect( mapped.offset ).to.be( 0 ) ;
			expect( mapped.data ).to.equal( [ 10, 12, 18, 20, 26, 28 ] ) ;

			expect( mapped.get( 1 , 1 ) ).to.be( 10 ) ;
			expect( () => mapped.get( 0 , 1 ) ).to.throw.a( RangeError ) ;
			expect( () => mapped.get( 1 , 0 ) ).to.throw.a( RangeError ) ;
			expect( () => mapped.get( 3 , 1 ) ).to.throw.a( RangeError ) ;
			expect( () => mapped.get( 1 , 4 ) ).to.throw.a( RangeError ) ;
		} ) ;

		it( "basic .mapVectorInRegion()" , function() {
			let ndarray , mapped ;

			ndarray = arrayKit.ndarray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;
			mapped = ndarray.mapVectorInRegion( [ [ 1 , 2 ] , null ] , ( vector , coords , index ) => {
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
			expect( mapped.offset ).to.be( 0 ) ;
			expect( mapped.data ).to.equal( [
				101, 102,
				205, 206,
				309, 310,
				413, 414,
				517, 518
			] ) ;
			expect( mapped.get( 1 , 1 ) ).to.be( 205 ) ;

			mapped = ndarray.mapVectorInRegion( [ null , [ 1 , 3 ] ] , ( vector , coords , index ) => {
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
			expect( mapped.offset ).to.be( 0 ) ;
			expect( mapped.data ).to.equal( [
			    104, 205, 306, 407,
			    108, 209, 310, 411,
			    112, 213, 314, 415
			] ) ;
			expect( mapped.get( 1 , 1 ) ).to.be( 205 ) ;
		} ) ;
	} ) ;

	describe( "Extracting a region: .extractRegion()" , function() {

		it( "basic .extractRegion()" , function() {
			let ndarray , extracted ;

			ndarray = arrayKit.ndarray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;
			extracted = ndarray.extractRegion( [ [ 1 , 2 ] , [ 1 , 3 ] ] ) ;
			//console.log( "extracted:" , extracted.data.length , extracted ) ;
			expect( extracted.dimensions ).to.be( 2 ) ;
			expect( extracted.size ).to.be( 6 ) ;
			expect( extracted.sizes ).to.equal( [ 2 , 3 ] ) ;
			expect( extracted.mins ).to.equal( [ 1 , 1 ] ) ;
			expect( extracted.maxs ).to.equal( [ 2 , 3 ] ) ;
			expect( extracted.order ).to.equal( [ 0 , 1 ] ) ;
			expect( extracted.strides ).to.equal( [ 1 , 2 ] ) ;
			expect( extracted.offset ).to.be( 0 ) ;
			expect( extracted.data ).to.equal( [ 5, 6, 9, 10, 13, 14 ] ) ;

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

	describe( "Copying a ND-Array into another one: .copyTo() / .copyWithin()" , function() {

		it( "basic .copyTo()" , function() {
			let ndarray , dstNdarray ;

			ndarray = arrayKit.ndarray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;
			dstNdarray = arrayKit.ndarray( new Array( 20 ).fill( null ) , [ 4 , 5 ] ) ;

			ndarray.copyTo( dstNdarray , [ 1 , 2 ] ) ;
			//console.log( "dst:" , dstNdarray ) ;
			expect( dstNdarray.data ).to.equal( [
				null, null, null, null,
				null, null, null, null,
				null, 0,    1,    2,
				null, 4,    5,    6,
				null, 8,    9,    10
			] ) ;
		} ) ;

		it( "basic .copyWithin() without overlapping region" , function() {
			let ndarray = arrayKit.ndarray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;
			ndarray.copyWithin( [ 2 , 3 ] , [ [ 0 , 2 ] , [ 0 , 2 ] ] ) ;
			//logDataStorage( ndarray.data , 4 ) ;
			expect( ndarray.data ).to.equal( [
				0,  1,  2,  3,
				4,  5,  6,  7,
				8,  9,  10, 11,
				12, 13, 0,  1,
				16, 17, 4,  5
			] ) ;
		} ) ;

		it( ".copyWithin() with overlapping region ahead" , function() {
			let ndarray = arrayKit.ndarray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;
			ndarray.copyWithin( [ 1 , 1 ] , [ [ 0 , 2 ] , [ 0 , 2 ] ] ) ;
			//logDataStorage( ndarray.data , 4 ) ;
			expect( ndarray.data ).to.equal( [
				0,  1,  2,  3,
				4,  0,  1,  2,
				8,  4,  5,  6,
				12, 8,  9,  10,
				16, 17, 18, 19
			] ) ;
		} ) ;

		it( ".copyWithin() with overlapping region behind" , function() {
			let ndarray = arrayKit.ndarray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;
			ndarray.copyWithin( [ 0 , 0 ] , [ [ 1 , 3 ] , [ 2 , 4 ] ] ) ;
			//logDataStorage( ndarray.data , 4 ) ;
			expect( ndarray.data ).to.equal( [
				9,  10, 11, 3,
				13, 14, 15, 7,
				17, 18, 19, 11,
				12, 13, 14, 15,
				16, 17, 18, 19
			] ) ;
		} ) ;
	} ) ;

	describe( "Combining a ND-Array into another one: .combineInto() / .combineVectorInto() / .combineWithin() / .combineVectorWithin()" , function() {
		it( "basic .combineInto()" , function() {
			let ndarray , dstNdarray ;

			ndarray = arrayKit.ndarray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;
			dstNdarray = arrayKit.ndarray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;

			ndarray.combineInto( dstNdarray , [ 1 , 2 ] , ( src , dst ) => src.value * dst.value ) ;
			//console.log( "dst:" , dstNdarray ) ;
			expect( dstNdarray.data ).to.equal( [
				0,    1,    2,    3,
				4,    5,    6,    7,
				8,    0,    10,   22,
				12,   52,   70,   90,
				16,   136,  162,  190
			] ) ;
		} ) ;

		it( "basic .combineVectorInto()" , function() {
			let ndarray , dstNdarray ;

			ndarray = arrayKit.ndarray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;
			dstNdarray = arrayKit.ndarray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;

			ndarray.combineVectorInto( dstNdarray , [ 2 , null ] , [ [ 1 , 2 ] , null ] , ( src , dst ) => {
				//console.log( "callback:" , { src , dst } ) ;
				expect( src.value ).to.be.an( Array ) ;
				expect( src.value ).to.have.length( 5 ) ;
				
				let output = new Array( 5 ) ;
				for ( let d = 0 ; d < src.value.length ; d ++ ) {
					output[ d ] = d * 1000 + src.value[ d ] * dst.value[ d ] ;
				}
				return output ;
			} ) ;
			//console.log( "dst:" , dstNdarray ) ;
			expect( dstNdarray.data ).to.equal( [
				0,    1,    2,    6,
				4,    5,    1030, 1042,
				8,    9,    2090, 2110,
				12,   13,   3182, 3210,
				16,   17,   4306, 4342
			] ) ;


			dstNdarray = arrayKit.ndarray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;
			ndarray.combineVectorInto( dstNdarray , [ null , 3 ] , [ null , [ 1 , 3 ] ] , ( src , dst ) => {
				//console.log( "callback:" , { src , dst } ) ;
				expect( src.value ).to.be.an( Array ) ;
				expect( src.value ).to.have.length( 4 ) ;
				
				let output = new Array( 5 ) ;
				for ( let d = 0 ; d < src.value.length ; d ++ ) {
					output[ d ] = d * 1000 + src.value[ d ] * dst.value[ d ] ;
				}
				return output ;
			} ) ;
			//console.log( "dst:" , dstNdarray ) ;
			expect( dstNdarray.data ).to.equal( [
				0,    1,    2,    3,
				4,    5,    6,    7,
				8,    9,    10,   11,
				48,   1065, 2084, 3105,
				128,  1153, 2180, 3209
			] ) ;
		} ) ;

		it( "basic .combineWithin() without overlapping region" , function() {
			let ndarray = arrayKit.ndarray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;
			ndarray.combineWithin( [ 2 , 3 ] , [ [ 0 , 2 ] , [ 0 , 2 ] ] , ( src , dst ) => src.value * dst.value ) ;
			//logDataStorage( ndarray.data , 4 ) ;
			expect( ndarray.data ).to.equal( [
				0,  1,  2,  3,
				4,  5,  6,  7,
				8,  9,  10, 11,
				12, 13, 0,  15,
				16, 17, 72, 95
			] ) ;
		} ) ;

		it( ".combineWithin() with overlapping region ahead" , function() {
			let ndarray = arrayKit.ndarray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;
			ndarray.combineWithin( [ 1 , 1 ] , [ [ 0 , 2 ] , [ 0 , 2 ] ] , ( src , dst ) => src.value * dst.value ) ;
			//logDataStorage( ndarray.data , 4 ) ;
			expect( ndarray.data ).to.equal( [
				0,    1,    2,    3,
				4,    0,    6,    14,
				8,    36,   50,   66,
				12,   104,  126,  150,
				16,   17,   18,   19
			] ) ;
		} ) ;

		it( ".combineWithin() with overlapping region behind" , function() {
			let ndarray = arrayKit.ndarray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;
			ndarray.combineWithin( [ 0 , 0 ] , [ [ 1 , 3 ] , [ 2 , 4 ] ] , ( src , dst ) => src.value * dst.value ) ;
			//logDataStorage( ndarray.data , 4 ) ;
			expect( ndarray.data ).to.equal( [
				0,    10,   22,   3,
				52,   70,   90,   7,
				136,  162,  190,  11,
				12,   13,   14,   15,
				16,   17,   18,   19
			] ) ;
		} ) ;

		it( "basic .combineVectorWithin() without overlapping region" , function() {
			let ndarray ;

			ndarray = arrayKit.ndarray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;
			ndarray.combineVectorWithin( [ 2 , null ] , [ [ 0 , 1 ] , null ] , ( src , dst ) => {
				//console.log( "callback:" , { src , dst } ) ;
				expect( src.value ).to.be.an( Array ) ;
				expect( src.value ).to.have.length( 5 ) ;
				
				let output = new Array( 5 ) ;
				for ( let d = 0 ; d < src.value.length ; d ++ ) {
					output[ d ] = d * 1000 + src.value[ d ] * dst.value[ d ] ;
				}
				return output ;
			} ) ;
			//logDataStorage( ndarray.data , 4 ) ;
			expect( ndarray.data ).to.equal( [
				0,    1,    0,    3,
				4,    5,    1024, 1035,
				8,    9,    2080, 2099,
				12,   13,   3168, 3195,
				16,   17,   4288, 4323
			] ) ;


			ndarray = arrayKit.ndarray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;
			ndarray.combineVectorWithin( [ null , 3 ] , [ null , [ 0 , 2 ] ] , ( src , dst ) => {
				//console.log( "callback:" , { src , dst } ) ;
				expect( src.value ).to.be.an( Array ) ;
				expect( src.value ).to.have.length( 4 ) ;
				
				let output = new Array( 5 ) ;
				for ( let d = 0 ; d < src.value.length ; d ++ ) {
					output[ d ] = d * 1000 + src.value[ d ] * dst.value[ d ] ;
				}
				return output ;
			} ) ;
			//logDataStorage( ndarray.data , 4 ) ;
			expect( ndarray.data ).to.equal( [
				0,    1,    2,    3,
				4,    5,    6,    7,
				8,    9,    10,   11,
				0,    1013, 2028, 3045,
				64,   1085, 2108, 3133
			] ) ;
		} ) ;

		it( ".combineVectorWithin() with overlapping region ahead" , function() {
			let ndarray ;

			ndarray = arrayKit.ndarray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;
			ndarray.combineVectorWithin( [ 2 , null ] , [ [ 1 , 2 ] , null ] , ( src , dst ) => {
				//console.log( "callback:" , { src , dst } ) ;
				expect( src.value ).to.be.an( Array ) ;
				expect( src.value ).to.have.length( 5 ) ;
				
				let output = new Array( 5 ) ;
				for ( let d = 0 ; d < src.value.length ; d ++ ) {
					output[ d ] = d * 1000 + src.value[ d ] * dst.value[ d ] ;
				}
				return output ;
			} ) ;
			//logDataStorage( ndarray.data , 4 ) ;
			expect( ndarray.data ).to.equal( [
				0,    1,    2,    6,
				4,    5,    1030, 1042,
				8,    9,    2090, 2110,
				12,   13,   3182, 3210,
				16,   17,   4306, 4342
			] ) ;


			ndarray = arrayKit.ndarray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;
			ndarray.combineVectorWithin( [ null , 3 ] , [ null , [ 1 , 3 ] ] , ( src , dst ) => {
				//console.log( "callback:" , { src , dst } ) ;
				expect( src.value ).to.be.an( Array ) ;
				expect( src.value ).to.have.length( 4 ) ;
				
				let output = new Array( 5 ) ;
				for ( let d = 0 ; d < src.value.length ; d ++ ) {
					output[ d ] = d * 1000 + src.value[ d ] * dst.value[ d ] ;
				}
				return output ;
			} ) ;
			//logDataStorage( ndarray.data , 4 ) ;
			expect( ndarray.data ).to.equal( [
				0,    1,    2,    3,
				4,    5,    6,    7,
				8,    9,    10,   11,
				48,   1065, 2084, 3105,
				128,  1153, 2180, 3209
			] ) ;
		} ) ;

		it( ".combineVectorWithin() with overlapping region behind" , function() {
			let ndarray ;

			ndarray = arrayKit.ndarray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;
			ndarray.combineVectorWithin( [ 0 , null ] , [ [ 1 , 2 ] , null ] , ( src , dst ) => {
				//console.log( "callback:" , { src , dst } ) ;
				expect( src.value ).to.be.an( Array ) ;
				expect( src.value ).to.have.length( 5 ) ;
				
				let output = new Array( 5 ) ;
				for ( let d = 0 ; d < src.value.length ; d ++ ) {
					output[ d ] = d * 1000 + src.value[ d ] * dst.value[ d ] ;
				}
				return output ;
			} ) ;
			//logDataStorage( ndarray.data , 4 ) ;
			expect( ndarray.data ).to.equal( [
				0,    2,    2,    3,
				1020, 1030, 6,    7,
				2072, 2090, 10,   11,
				3156, 3182, 14,   15,
				4272, 4306, 18,   19
			] ) ;


			ndarray = arrayKit.ndarray( arrayKit.range( 20 ) , [ 4 , 5 ] ) ;
			ndarray.combineVectorWithin( [ null , 0 ] , [ null , [ 1 , 3 ] ] , ( src , dst ) => {
				//console.log( "callback:" , { src , dst } ) ;
				expect( src.value ).to.be.an( Array ) ;
				expect( src.value ).to.have.length( 4 ) ;
				
				let output = new Array( 5 ) ;
				for ( let d = 0 ; d < src.value.length ; d ++ ) {
					output[ d ] = d * 1000 + src.value[ d ] * dst.value[ d ] ;
				}
				return output ;
			} ) ;
			//logDataStorage( ndarray.data , 4 ) ;
			expect( ndarray.data ).to.equal( [
				0,    1005, 2012, 3021,
				32,   1045, 2060, 3077,
				96,   1117, 2140, 3165,
				12,   13,   14,   15,
				16,   17,   18,   19
			] ) ;
		} ) ;
	} ) ;

	describe( "Cloning" , function() {

		it( "cloning the view" , function() {
			let ndarray , clone ;

			ndarray = arrayKit.ndarray( arrayKit.range( 24 ) , [ [ -1 , 2 ] , [ -2 , 3 ] ] ) ;
			clone = ndarray.view() ;
			expect( clone ).not.to.be( ndarray ) ;
			expect( clone.data ).to.be( ndarray.data ) ;
			expect( clone.offset ).to.be( 0 ) ;
			expect( clone.sizes ).to.equal( [ 4 , 6 ] ) ;
			expect( clone.strides ).to.equal( [ 1 , 4 ] ) ;
			expect( clone.dataStart ).to.be( 0 ) ;
			expect( clone.dataEnd ).to.be( 24 ) ;
			//logDataStorage( clone.data , 4 ) ;
			expect( clone.data ).to.equal( [
				0,  1,  2,  3,
				4,  5,  6,  7,
				8,  9,  10, 11,
				12, 13, 14, 15,
				16, 17, 18, 19,
				20, 21, 22, 23
			] ) ;
		} ) ;

		it( "full independant clone (data: Array)" , function() {
			let ndarray , clone ;

			ndarray = arrayKit.ndarray( arrayKit.range( 24 ) , [ [ -1 , 2 ] , [ -2 , 3 ] ] ) ;
			clone = ndarray.clone() ;
			expect( clone ).not.to.be( ndarray ) ;
			expect( clone.data ).not.to.be( ndarray.data ) ;
			expect( clone.offset ).to.be( 0 ) ;
			expect( clone.sizes ).to.equal( [ 4 , 6 ] ) ;
			expect( clone.strides ).to.equal( [ 1 , 4 ] ) ;
			expect( clone.dataStart ).to.be( 0 ) ;
			expect( clone.dataEnd ).to.be( 24 ) ;
			//logDataStorage( clone.data , 4 ) ;
			expect( clone.data ).to.equal( [
				0,  1,  2,  3,
				4,  5,  6,  7,
				8,  9,  10, 11,
				12, 13, 14, 15,
				16, 17, 18, 19,
				20, 21, 22, 23
			] ) ;

			ndarray = arrayKit.ndarray( arrayKit.range( 24 ) , [ [ -1 , 2 ] , [ -1 , 2 ] ] , { dataStart: 8 } ) ;
			clone = ndarray.clone() ;
			expect( clone ).not.to.be( ndarray ) ;
			expect( clone.data ).not.to.be( ndarray.data ) ;
			expect( clone.offset ).to.be( 0 ) ;
			expect( clone.sizes ).to.equal( [ 4 , 4 ] ) ;
			expect( clone.strides ).to.equal( [ 1 , 4 ] ) ;
			expect( clone.dataStart ).to.be( 0 ) ;
			expect( clone.dataEnd ).to.be( 16 ) ;
			//logDataStorage( clone.data , 4 ) ;
			expect( clone.data ).to.equal( [
				8,  9,  10, 11,
				12, 13, 14, 15,
				16, 17, 18, 19,
				20, 21, 22, 23
			] ) ;
		} ) ;

		it( "full independant clone (data: Uint32Array)" , function() {
			let ndarray , clone ;

			ndarray = arrayKit.ndarray( new Uint32Array( arrayKit.range( 24 ) ) , [ [ -1 , 2 ] , [ -2 , 3 ] ] ) ;
			clone = ndarray.clone() ;
			expect( clone ).not.to.be( ndarray ) ;
			expect( clone.data ).not.to.be( ndarray.data ) ;
			expect( clone.data ).to.be.a( Uint32Array ) ;
			expect( clone.offset ).to.be( 0 ) ;
			expect( clone.sizes ).to.equal( [ 4 , 6 ] ) ;
			expect( clone.strides ).to.equal( [ 1 , 4 ] ) ;
			expect( clone.dataStart ).to.be( 0 ) ;
			expect( clone.dataEnd ).to.be( 24 ) ;
			//logDataStorage( clone.data , 4 ) ;
			expect( [ ... clone.data ] ).to.equal( [
				0,  1,  2,  3,
				4,  5,  6,  7,
				8,  9,  10, 11,
				12, 13, 14, 15,
				16, 17, 18, 19,
				20, 21, 22, 23
			] ) ;

			ndarray = arrayKit.ndarray( new Uint32Array( arrayKit.range( 24 ) ) , [ [ -1 , 2 ] , [ -1 , 2 ] ] , { dataStart: 8 } ) ;
			clone = ndarray.clone() ;
			expect( clone ).not.to.be( ndarray ) ;
			expect( clone.data ).not.to.be( ndarray.data ) ;
			expect( clone.data ).to.be.a( Uint32Array ) ;
			expect( clone.offset ).to.be( 0 ) ;
			expect( clone.sizes ).to.equal( [ 4 , 4 ] ) ;
			expect( clone.strides ).to.equal( [ 1 , 4 ] ) ;
			expect( clone.dataStart ).to.be( 0 ) ;
			expect( clone.dataEnd ).to.be( 16 ) ;
			//logDataStorage( clone.data , 4 ) ;
			expect( [ ... clone.data ] ).to.equal( [
				8,  9,  10, 11,
				12, 13, 14, 15,
				16, 17, 18, 19,
				20, 21, 22, 23
			] ) ;
		} ) ;

		it( "full independant clone (data: Buffer)" , function() {
			let ndarray , clone ;

			ndarray = arrayKit.ndarray( Buffer.from( arrayKit.range( 24 ) ) , [ [ -1 , 2 ] , [ -2 , 3 ] ] ) ;
			clone = ndarray.clone() ;
			expect( clone ).not.to.be( ndarray ) ;
			expect( clone.data ).not.to.be( ndarray.data ) ;
			expect( clone.data ).to.be.a( Buffer ) ;
			expect( clone.offset ).to.be( 0 ) ;
			expect( clone.sizes ).to.equal( [ 4 , 6 ] ) ;
			expect( clone.strides ).to.equal( [ 1 , 4 ] ) ;
			expect( clone.dataStart ).to.be( 0 ) ;
			expect( clone.dataEnd ).to.be( 24 ) ;
			//logDataStorage( clone.data , 4 ) ;
			expect( [ ... clone.data ] ).to.equal( [
				0,  1,  2,  3,
				4,  5,  6,  7,
				8,  9,  10, 11,
				12, 13, 14, 15,
				16, 17, 18, 19,
				20, 21, 22, 23
			] ) ;

			ndarray = arrayKit.ndarray( Buffer.from( arrayKit.range( 24 ) ) , [ [ -1 , 2 ] , [ -1 , 2 ] ] , { dataStart: 8 } ) ;
			clone = ndarray.clone() ;
			expect( clone ).not.to.be( ndarray ) ;
			expect( clone.data ).not.to.be( ndarray.data ) ;
			expect( clone.data ).to.be.a( Buffer ) ;
			expect( clone.offset ).to.be( 0 ) ;
			expect( clone.sizes ).to.equal( [ 4 , 4 ] ) ;
			expect( clone.strides ).to.equal( [ 1 , 4 ] ) ;
			expect( clone.dataStart ).to.be( 0 ) ;
			expect( clone.dataEnd ).to.be( 16 ) ;
			//logDataStorage( clone.data , 4 ) ;
			expect( [ ... clone.data ] ).to.equal( [
				8,  9,  10, 11,
				12, 13, 14, 15,
				16, 17, 18, 19,
				20, 21, 22, 23
			] ) ;
		} ) ;
	} ) ;

	describe( "Missing tests" , function() {
		it( ".rebase()" ) ;
		it( ".translate()" ) ;
		it( ".each*()" ) ;
	} ) ;
} ) ;

