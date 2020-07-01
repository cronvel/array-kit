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



describe( ".inPlaceFilter()" , function() {
	
	it( "should filter in place" , function() {
		var array , result ;
		
		array = [ 1,2,3,4,5 ] ;
		result = arrayKit.inPlaceFilter( array , e => e % 2 ) ;
		expect( result ).to.be( array ) ;
		expect( array ).to.equal( [ 1,3,5 ] ) ;
		expect( array ).to.have.length( 3 ) ;
	} ) ;

	it( "forced key" , function() {
		var array , result ;

		array = [ 1,2,3,4,5 ] ;
		result = arrayKit.inPlaceFilter(
			array ,
			( element , key ) => {
				expect( key ).to.be( 'key' ) ;
				return element % 2 ;
			} ,
			undefined ,
			'key'
		) ;

		expect( result ).to.be( array ) ;
		expect( array ).to.equal( [ 1,3,5 ] ) ;
		expect( array ).to.have.length( 3 ) ;
	} ) ;
} ) ;



describe( ".delete()" , function() {
	
	it( "should delete one index in-place" , function() {
		var array ;
		
		array = [ 1,2,3,4,5 ] ;
		arrayKit.delete( array , 7 ) ;
		expect( array ).to.equal( [ 1,2,3,4,5 ] ) ;
		arrayKit.delete( array , 6 ) ;
		expect( array ).to.equal( [ 1,2,3,4,5 ] ) ;
		arrayKit.delete( array , 5 ) ;
		expect( array ).to.equal( [ 1,2,3,4,5 ] ) ;
		
		array = [ 1,2,3,4,5 ] ;
		arrayKit.delete( array , 0 ) ;
		expect( array ).to.equal( [ 2,3,4,5 ] ) ;
		
		array = [ 1,2,3,4,5 ] ;
		arrayKit.delete( array , 1 ) ;
		expect( array ).to.equal( [ 1,3,4,5 ] ) ;
		
		array = [ 1,2,3,4,5 ] ;
		arrayKit.delete( array , 2 ) ;
		expect( array ).to.equal( [ 1,2,4,5 ] ) ;
		
		array = [ 1,2,3,4,5 ] ;
		arrayKit.delete( array , 3 ) ;
		expect( array ).to.equal( [ 1,2,3,5 ] ) ;
		
		array = [ 1,2,3,4,5 ] ;
		arrayKit.delete( array , 4 ) ;
		expect( array ).to.equal( [ 1,2,3,4 ] ) ;
	} ) ;
} ) ;



describe( ".deleteValue()" , function() {
	
	it( "should delete values in-place" , function() {
		var array , count ;
		
		array = [ 0,1,2,3,4,5 ] ;
		count = arrayKit.deleteValue( array , 7 ) ;
		expect( array ).to.equal( [ 0,1,2,3,4,5 ] ) ;
		expect( count ).to.be( 0 ) ;

		count = arrayKit.deleteValue( array , 3 ) ;
		expect( array ).to.equal( [ 0,1,2,4,5 ] ) ;
		expect( count ).to.be( 1 ) ;
	
		count = arrayKit.deleteValue( array , false ) ;
		expect( array ).to.equal( [ 0,1,2,4,5 ] ) ;
		expect( count ).to.be( 0 ) ;
	
		count = arrayKit.deleteValue( array , null ) ;
		expect( array ).to.equal( [ 0,1,2,4,5 ] ) ;
		expect( count ).to.be( 0 ) ;
	
		count = arrayKit.deleteValue( array , NaN ) ;
		expect( array ).to.equal( [ 0,1,2,4,5 ] ) ;
		expect( count ).to.be( 0 ) ;
	
		count = arrayKit.deleteValue( array , 0 ) ;
		expect( array ).to.equal( [ 1,2,4,5 ] ) ;
		expect( count ).to.be( 1 ) ;
	
		
		array = [ 0,1,NaN,2,3,4,5 ] ;
		count = arrayKit.deleteValue( array , 7 ) ;
		expect( array ).to.equal( [ 0,1,NaN,2,3,4,5 ] ) ;
		expect( count ).to.be( 0 ) ;
	
		count = arrayKit.deleteValue( array , 0 ) ;
		expect( array ).to.equal( [ 1,NaN,2,3,4,5 ] ) ;
		expect( count ).to.be( 1 ) ;
	
		count = arrayKit.deleteValue( array , null ) ;
		expect( array ).to.equal( [ 1,NaN,2,3,4,5 ] ) ;
		expect( count ).to.be( 0 ) ;
	
		count = arrayKit.deleteValue( array , NaN ) ;
		expect( array ).to.equal( [ 1,2,3,4,5 ] ) ;
		expect( count ).to.be( 1 ) ;
	
		
		array = [ 0,1,2,3,2,2,4,5 ] ;
		count = arrayKit.deleteValue( array , 7 ) ;
		expect( array ).to.equal( [ 0,1,2,3,2,2,4,5 ] ) ;
		expect( count ).to.be( 0 ) ;
	
		count = arrayKit.deleteValue( array , 2 ) ;
		expect( array ).to.equal( [ 0,1,3,4,5 ] ) ;
		expect( count ).to.be( 3 ) ;
	
		
		array = [ 2,0,1,2,3,2,2,4,5,2 ] ;
		count = arrayKit.deleteValue( array , 2 ) ;
		expect( array ).to.equal( [ 0,1,3,4,5 ] ) ;
		expect( count ).to.be( 5 ) ;
	
	} ) ;
} ) ;



describe( ".range()" , function() {
	
	it( "should create an array from a range" , function() {
		expect( arrayKit.range( 4 ) ).to.equal( [ 0,1,2,3 ] ) ;
		expect( arrayKit.range( 1 , 4 ) ).to.equal( [ 1,2,3 ] ) ;
		expect( arrayKit.range( 3 , 0 ) ).to.equal( [ 3,2,1 ] ) ;
		expect( arrayKit.range( 1 , 10 , 2 ) ).to.equal( [ 1,3,5,7,9 ] ) ;
		expect( arrayKit.range( 9 , 0 , -2 ) ).to.equal( [ 9,7,5,3,1 ] ) ;
	} ) ;
} ) ;

