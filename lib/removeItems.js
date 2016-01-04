/*
	The Cedric's Swiss Knife (CSK) - CSK array toolbox

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


/*
	Create a new array without the element to be removed.
	
	* src `Array` the source array
	* toRemove `Array` an array of element to remove
	
	Returns an array without the matching elements.
*/
module.exports = function removeItems( src , toRemove )
{
	var i , iMax , out ;
	
	if ( ! Array.isArray( src ) || ! Array.isArray( toRemove ) ) { throw new TypeError( '.removeItems() needs two array as arguments' ) ; }
	
	// Fast exit case
	if ( ! src.length || ! toRemove.length ) { return src.slice() ; }
	
	out = [] ;
	
	for ( i = 0 , iMax = src.length ; i < iMax ; i ++ )
	{
		if ( toRemove.indexOf( src[ i ] ) === -1 )
		{
			out.push( src[ i ] ) ;
		}
	}
	
	return out ;
} ;


