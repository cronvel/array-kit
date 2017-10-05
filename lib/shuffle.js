/*
	Array Kit
	
	Copyright (c) 2014 - 2017 Cédric Ronvel
	
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
	.shuffle( array ): Shuffle an array in-place.
	
	Derivated from: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
*/
module.exports = function shuffle( array )
{
	var currentIndex = array.length , randomIndex , temp ;
	
	// While there remains elements to shuffle...
	while ( currentIndex )
	{
		// Pick a remaining element...
		randomIndex = Math.floor( Math.random() * currentIndex ) ;
		currentIndex -= 1 ;

		// And swap it with the current element.
		temp = array[ currentIndex ] ;
		array[ currentIndex ] = array[ randomIndex ] ;
		array[ randomIndex ] = temp ;
	}
	
	return array ;
} ;


