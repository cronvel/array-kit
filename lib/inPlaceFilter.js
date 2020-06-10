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
	Like array#filter(), but modify the array in-place.

	* src `Array` the source array
	* fn `Function( element , [index] , [array] )`, the condition function used on all element of the array, where:
		* element the current element
		* index the index of the current element
		* the array
	* thisArg: what is used as `this` inside the callback function
	* forceKey: for that key instead of the index of the current element (useful for other libs)
*/
module.exports = ( src , fn , thisArg , forceKey ) => {
	var hasForcedKey = arguments.length >= 4 ,
		value ,
		i = 0 ,
		j = 0 ;

	while ( i < src.length ) {
		value = src[ i ] ;

		if ( fn.call( thisArg , value , hasForcedKey ? forceKey : i , src ) ) {
			src[ j ] = value ;
			j ++ ;
		}

		i ++ ;
	}

	src.length = j ;

	return src ;
} ;

