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



describe( ".range()" , function() {
	
	it( "should create an array from a range" , function() {
		expect( arrayKit.range( 4 ) ).to.equal( [ 0,1,2,3 ] ) ;
		expect( arrayKit.range( 1 , 4 ) ).to.equal( [ 1,2,3 ] ) ;
		expect( arrayKit.range( 3 , 0 ) ).to.equal( [ 3,2,1 ] ) ;
		expect( arrayKit.range( 1 , 10 , 2 ) ).to.equal( [ 1,3,5,7,9 ] ) ;
		expect( arrayKit.range( 1 , 11 , 2 ) ).to.equal( [ 1,3,5,7,9 ] ) ;
		expect( arrayKit.range( 9 , 0 , -2 ) ).to.equal( [ 9,7,5,3,1 ] ) ;
		expect( arrayKit.range( 9 , -1 , -2 ) ).to.equal( [ 9,7,5,3,1 ] ) ;
	} ) ;

	it( "should create an array from a range with inclusive end" , function() {
		expect( arrayKit.range.inclusive( 1 , 4 ) ).to.equal( [ 1,2,3,4 ] ) ;
		expect( arrayKit.range.inclusive( 3 , 0 ) ).to.equal( [ 3,2,1,0 ] ) ;
		expect( arrayKit.range.inclusive( 1 , 10 , 2 ) ).to.equal( [ 1,3,5,7,9 ] ) ;
		expect( arrayKit.range.inclusive( 1 , 11 , 2 ) ).to.equal( [ 1,3,5,7,9,11 ] ) ;
		expect( arrayKit.range.inclusive( 9 , 0 , -2 ) ).to.equal( [ 9,7,5,3,1 ] ) ;
		expect( arrayKit.range.inclusive( 9 , -1 , -2 ) ).to.equal( [ 9,7,5,3,1,-1 ] ) ;
	} ) ;

	it( "should create an array from a float range" , function() {
		expect( arrayKit.range( 1.2 , 3.2 ) ).to.equal( [ 1.2 , 2.2 ] ) ;
		expect( arrayKit.range( 1.2 , 3.3 ) ).to.equal( [ 1.2 , 2.2 , 3.2 ] ) ;

		expect( arrayKit.range( 1.2 , 2 , 0.1 ) ).to.equal( [ 1.2 , 1.3 , 1.4 , 1.5 , 1.6 , 1.7 , 1.8 , 1.9 ] ) ;
	} ) ;

	it( "should create an array from a float range with inclusive end" , function() {
		expect( arrayKit.range.inclusive( 1.2 , 3.3 ) ).to.equal( [ 1.2 , 2.2 , 3.2 ] ) ;
		expect( arrayKit.range.inclusive( 1.2 , 2 , 0.1 ) ).to.equal( [ 1.2 , 1.3 , 1.4 , 1.5 , 1.6 , 1.7 , 1.8 , 1.9 , 2 ] ) ;
	} ) ;
} ) ;



describe( ".inPlaceFilter()" , function() {
	
	it( "should filter in place" , function() {
		var array , result ;
		
		array = [ 1,2,3,4,5 ] ;
		result = arrayKit.inPlaceFilter( array , e => e % 2 ) ;
		expect( result ).to.be( array ) ;
		expect( array ).to.equal( [ 1,3,5 ] ) ;
		expect( array ).to.have.length( 3 ) ;
	} ) ;

	it( "should filter in place using indexes" , function() {
		var array , result ;
		
		array = "abcdef".split( '' ) ;
		result = arrayKit.inPlaceFilter( array , ( e , i ) => i % 2 ) ;
		expect( result ).to.be( array ) ;
		expect( array ).to.equal( [ 'b','d','f' ] ) ;
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



describe( "Sum and mean" , function() {
	
	const gaussFormula = ( firstTerm , lastTerm , numberOfTerms ) => ( firstTerm + lastTerm ) * numberOfTerms / 2 ;

	it( "should compute the sum of an array" , function() {
		let array , expectedSum ;

		array = arrayKit.range.inclusive( 1 , 100 ) ;
		expectedSum = gaussFormula( 1 , 100 , 100  ) ;

		expect( arrayKit.sum( array ) ).to.be( expectedSum ) ;
		expect( arrayKit.floatSum( array ) ).to.be( expectedSum ) ;
		expect( arrayKit.chunkedFloatSum( array ) ).to.be( expectedSum ) ;
		expect( arrayKit.chunkedFloatSum( array , 10 ) ).to.be( expectedSum ) ;
		expect( arrayKit.chunkedFloatSum( array , 9 ) ).to.be( expectedSum ) ;
		expect( arrayKit.chunkedFloatSum( array , 11 ) ).to.be( expectedSum ) ;

		array = arrayKit.range.inclusive( 0 , 100 , 0.1 ) ;
		expectedSum = gaussFormula( 0 , 100 , 1001  ) ;

		expect( arrayKit.sum( array ) ).to.be( expectedSum ) ;
		expect( arrayKit.floatSum( array ) ).to.be( expectedSum ) ;
		expect( arrayKit.chunkedFloatSum( array , 10 ) ).to.be( expectedSum ) ;
	} ) ;

	it( "should compute the partial sum of an array" , function() {
		let array , expectedSum ;

		array = arrayKit.range.inclusive( 1 , 100 ) ;
		expectedSum = gaussFormula( 10 , 90 , 81  ) ;

		expect( arrayKit.sum( array , 9 , 90 ) ).to.be( expectedSum ) ;
		expect( arrayKit.floatSum( array , 9 , 90 ) ).to.be( expectedSum ) ;
		expect( arrayKit.chunkedFloatSum( array , 10 , 9 , 90 ) ).to.be( expectedSum ) ;
		expect( arrayKit.chunkedFloatSum( array , 9 , 9 , 90 ) ).to.be( expectedSum ) ;
		expect( arrayKit.chunkedFloatSum( array , 11 , 9 , 90 ) ).to.be( expectedSum ) ;

		array = arrayKit.range.inclusive( 0 , 100 , 0.1 ) ;
		expectedSum = gaussFormula( 10 , 90 , 801  ) ;

		expect( arrayKit.sum( array , 100 , 901 ) ).to.be( expectedSum ) ;
		expect( arrayKit.floatSum( array , 100 , 901 ) ).to.be( expectedSum ) ;
		expect( arrayKit.chunkedFloatSum( array , 10 , 100 , 901 ) ).to.be( expectedSum ) ;
		expect( arrayKit.chunkedFloatSum( array , 4 , 100 , 901 ) ).to.be( expectedSum ) ;
	} ) ;

	it( "should compute the sum avoiding floating point loss of precision when using .sum.floatSum()" , function() {
		let array , expectedSum ;

		array = arrayKit.range.inclusive( 0 , 10 , 0.000001 ) ;
		expectedSum = gaussFormula( 0 , 10 , 10_000_001  ) ;

		// The basic sum does not avoid loss of precision when adding small values to bigger one
		expect( arrayKit.sum( array ) ).not.to.be( expectedSum ) ;

		// This one compensate small errors
		expect( arrayKit.floatSum( array ) ).to.be( expectedSum ) ;
	} ) ;

	it( "should compute the sum avoiding floating point loss of precision when using .sum.chunkedFloatSum()" , function() {
		let array , expectedSum ;

		array = arrayKit.range.inclusive( 0 , 10 , 0.000001 ) ;
		expectedSum = gaussFormula( 0 , 10 , 10_000_001  ) ;

		// The basic sum does not avoid loss of precision when adding small values to bigger one
		expect( arrayKit.sum( array ) ).not.to.be( expectedSum ) ;

		// This one compensate small errors, it should be better than .sum.floatSum(), but it's hard to test it
		expect( arrayKit.chunkedFloatSum( array , 10 ) ).to.be( expectedSum ) ;
	} ) ;

	it( "should compute the mean of an array" , function() {
		let array , expectedSum , expectedMean ;

		array = arrayKit.range.inclusive( 1 , 100 ) ;
		expectedSum = gaussFormula( 1 , 100 , 100  ) ;
		expectedMean = expectedSum / array.length ;

		expect( arrayKit.mean( array ) ).to.be( expectedMean ) ;
		expect( arrayKit.floatMean( array ) ).to.be( expectedMean ) ;
	} ) ;

	it( "should compute the partial mean of an array" , function() {
		let array , expectedSum , expectedMean ;

		array = arrayKit.range.inclusive( 1 , 100 ) ;
		expectedSum = gaussFormula( 10 , 90 , 81  ) ;
		expectedMean = expectedSum / 81 ;

		expect( arrayKit.mean( array , 9 , 90 ) ).to.be( expectedMean ) ;
		expect( arrayKit.floatMean( array , 9 , 90 ) ).to.be( expectedMean ) ;
	} ) ;
} ) ;

