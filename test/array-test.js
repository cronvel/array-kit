/*
	The Cedric's Swiss Knife (CSK) - CSK array toolbox test suite

	Copyright (c) 2014-2016 Cédric Ronvel 
	
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

/* jshint unused:false */
/* global describe, it, before, after */


var array = require( '../lib/array.js' ) ;
var expect = require( 'expect.js' ) ;





			/* Tests */



describe( ".removeItems()" , function() {
	
	it( "should produce a new array without any element matching the second array" , function() {
		var input , copy ;
		
		expect( array.removeItems( [ 1,2,3,4,5,4,3,2,1 ] , [ 2,4 ] ) ).to.eql( [ 1,3,5,3,1 ] ) ;
		expect( array.removeItems( [ 1,2,3,4,5,4,3,2,1 ] , [ 2,4,6 ] ) ).to.eql( [ 1,3,5,3,1 ] ) ;
		expect( array.removeItems( [ 1,2,3,4,5,4,3,2,1 ] , [] ) ).to.eql( [ 1,2,3,4,5,4,3,2,1 ] ) ;
		expect( array.removeItems( [] , [ 2,4 ] ) ).to.eql( [] ) ;
		
		var a = { a: 'a' } ;
		var b = { b: 'b' } ;
		var c = { c: 'c' } ;
		
		// Check if the src/input array was left untouched
		input = [ a , a , b , a ] ;
		copy = input ;
		expect( array.removeItems( input , [ a ] ) ).to.eql( [ b ] ) ;
		expect( input ).to.eql( [ a , a , b , a ] ) ;
		expect( input ).to.be( copy ) ;
		
		expect( array.removeItems( [ a , a , a ] , [ a ] ) ).to.eql( [] ) ;
		expect( array.removeItems( [ a , a , b , a ] , [ a ] ) ).to.eql( [ b ] ) ;
		expect( array.removeItems( [ a , a , b , a ] , [ c ] ) ).to.eql( [ a , a , b , a ] ) ;
		expect( array.removeItems( [ a , a , b , a ] , [ a , c ] ) ).to.eql( [ b ] ) ;
		
		expect( array.removeItems( [ a , b , null , c ] , [ b ] ) ).to.eql( [ a , null , c ] ) ;
		expect( array.removeItems( [ a , b , c ] , [ b , null ] ) ).to.eql( [ a , c ] ) ;
		expect( array.removeItems( [ a , null , b , c ] , [ b , null ] ) ).to.eql( [ a , c ] ) ;
		
		expect( array.removeItems( [ a , b , undefined , c ] , [ b ] ) ).to.eql( [ a , undefined , c ] ) ;
		expect( array.removeItems( [ a , b , c ] , [ b , undefined ] ) ).to.eql( [ a , c ] ) ;
		expect( array.removeItems( [ a , undefined , b , c ] , [ b , undefined ] ) ).to.eql( [ a , c ] ) ;
		
		expect( array.removeItems( [ null , a , b , undefined , c ] , [ b ] ) ).to.eql( [ null , a , undefined , c ] ) ;
		expect( array.removeItems( [ null , a , b , undefined , c ] , [ null , b ] ) ).to.eql( [ a , undefined , c ] ) ;
		expect( array.removeItems( [ null , a , b , undefined , c ] , [ b , undefined ] ) ).to.eql( [ null , a , c ] ) ;
		expect( array.removeItems( [ null , a , b , undefined , c ] , [ undefined , null , b ] ) ).to.eql( [ a , c ] ) ;
	} ) ;
	
} ) ;





