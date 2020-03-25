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



/*
	.sample( array , count , inPlace ): Return a new array with random element from the first one.

	* array: the source array
	* count: the number of element to keep
	* inPlace: boolean, true if the array should be shuffled in-place
*/
module.exports = ( array , count = Infinity , inPlace = false ) => {
	var currentIndex , randomIndex , temp ,
		sample = inPlace ? array : [ ... array ] ;

	count = Math.max( Math.min( count , array.length ) , 0 ) ;

	for ( currentIndex = 0 ; currentIndex < count ; currentIndex ++ ) {
		randomIndex = currentIndex + Math.floor( ( sample.length - currentIndex ) * Math.random() ) ;
		temp = sample[ currentIndex ] ;
		sample[ currentIndex ] = sample[ randomIndex ] ;
		sample[ randomIndex ] = temp ;
	}

	sample.length = count ;

	return sample ;
} ;

