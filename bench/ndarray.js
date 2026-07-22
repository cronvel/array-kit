
"use strict" ;

/* global benchmark, competitor */



const NDArray = require( '../lib/NDArray.js' ) ;
const range = require( '../lib/range.js' ) ;



function Simplest2D( data , sizeX , sizeY ) {
	this.data = data ;
	this.sizeX = sizeX ;
	this.sizeY = sizeY ;
}

Simplest2D.prototype.get = function( x , y ) {
	return this.data[ y * this.sizeX + x ] ;
} ;

Simplest2D.prototype.set = function( x , y , v ) {
	this.data[ y * this.sizeX + x ] = v ;
} ;

Simplest2D.prototype.forEach = function( callback ) {
	for ( let x = 0 ; x < this.sizeX ; x ++ ) {
		for ( let y = 0 ; y < this.sizeY ; y ++ ) {
			callback( this.data[ y * this.sizeX + x ] , x , y ) ;
		}
	}
} ;



benchmark( "get values 1D" , () => {
	const data = range( 10000 ) ;
	const ndarray1d = new NDArray( data , [ 10000 ] ) ;
	
	competitor( "Array index" , () => {
		let output = 0 ;
		
		output += data[ 0 ] ;
		output += data[ 9999 ] ;
		output += data[ 1234 ] ;
		output += data[ 2345 ] ;
		output += data[ 4567 ] ;
		output += data[ 6789 ] ;
		output += data[ 9876 ] ;
		output += data[ 7654 ] ;
		output += data[ 5432 ] ;
		output += data[ 4321 ] ;

		return output ;
	} ) ;
	
	competitor( "1D NDArray" , () => {
		let output = 0 ;

		output += ndarray1d.get( 0 ) ;
		output += ndarray1d.get( 9999 ) ;
		output += ndarray1d.get( 1234 ) ;
		output += ndarray1d.get( 2345 ) ;
		output += ndarray1d.get( 4567 ) ;
		output += ndarray1d.get( 6789 ) ;
		output += ndarray1d.get( 9876 ) ;
		output += ndarray1d.get( 7654 ) ;
		output += ndarray1d.get( 5432 ) ;
		output += ndarray1d.get( 4321 ) ;

		return output ;
	} ) ;
} ) ;



benchmark( "get values 2D" , () => {
	const data = range( 10000 ) ;
	const simplest2d = new Simplest2D( data , 100 , 100 ) ;
	const ndarray2d = new NDArray( data , [ 100 , 100 ] ) ;
	
	competitor( "Simplest 2D interpretation of Array" , () => {
		let output = 0 ;

		output += simplest2d.get( 0 , 0 ) ;
		output += simplest2d.get( 99 , 99 ) ;
		output += simplest2d.get( 12 , 34 ) ;
		output += simplest2d.get( 23 , 45 ) ;
		output += simplest2d.get( 45 , 67 ) ;
		output += simplest2d.get( 67 , 89 ) ;
		output += simplest2d.get( 98 , 76 ) ;
		output += simplest2d.get( 76 , 54 ) ;
		output += simplest2d.get( 54 , 32 ) ;
		output += simplest2d.get( 43 , 21 ) ;

		return output ;
	} ) ;
	
	competitor( "2D NDArray" , () => {
		let output = 0 ;

		output += ndarray2d.get( 0 ) ;
		output += ndarray2d.get( 99 , 99 ) ;
		output += ndarray2d.get( 12 , 34 ) ;
		output += ndarray2d.get( 23 , 45 ) ;
		output += ndarray2d.get( 45 , 67 ) ;
		output += ndarray2d.get( 67 , 89 ) ;
		output += ndarray2d.get( 98 , 76 ) ;
		output += ndarray2d.get( 76 , 54 ) ;
		output += ndarray2d.get( 54 , 32 ) ;
		output += ndarray2d.get( 43 , 21 ) ;

		return output ;
	} ) ;
} ) ;



benchmark( "iteration 1D" , () => {
	const data = range( 10000 ) ;
	const ndarray1d = new NDArray( data , [ 10000 ] ) ;
	
	competitor( "Array for loop" , () => {
		let output = 0 ;
		
		for ( let i = 0 ; i < data.length ; i ++ ) {
			output += data[ i ] ;
		}

		return output ;
	} ) ;
	
	competitor( "Array's .forEach()" , () => {
		let output = 0 ;
		data.forEach( v => output += v ) ;
		return output ;
	} ) ;
	
	competitor( "1D NDArray's .forEach()" , () => {
		let output = 0 ;
		ndarray1d.forEach( v => output += v ) ;
		return output ;
	} ) ;

	competitor( "1D NDArray's .each() generator" , () => {
		let output = 0 ;
		for ( let { value } of ndarray1d.each() ) {
			output += value ;
		}
		return output ;
	} ) ;

	competitor( "1D NDArray's cursor" , () => {
		let output = 0 ;
		let cursor = ndarray1d.getCursor() ;
		let entry ;
		while ( ( entry = cursor.next() ) ) {
			output += entry.value ;
		}
		return output ;
	} ) ;
} ) ;



benchmark( "iteration 2D" , () => {
	const data = range( 10000 ) ;
	const simplest2d = new Simplest2D( data , 100 , 100 ) ;
	const ndarray2d = new NDArray( data , [ 100 , 100 ] ) ;
	
	competitor( "Array's manual double for loop" , () => {
		let output = 0 ;
		
		for ( let x = 0 ; x < 100 ; x ++ ) {
			for ( let y = 0 ; y < 100 ; y ++ ) {
				output += data[ y * 100 + x ] ;
			}
		}

		return output ;
	} ) ;
	
	competitor( "Simplest 2D interpretation of Array's .forEach()" , () => {
		let output = 0 ;
		simplest2d.forEach( v => output += v ) ;
		return output ;
	} ) ;
	
	competitor( "2D NDArray's .forEach()" , () => {
		let output = 0 ;
		ndarray2d.forEach( v => output += v ) ;
		return output ;
	} ) ;

	competitor( "2D NDArray's .each() generator" , () => {
		let output = 0 ;
		for ( let { value } of ndarray2d.each() ) {
			output += value ;
		}
		return output ;
	} ) ;

	competitor( "2D NDArray's cursor" , () => {
		let output = 0 ;
		let cursor = ndarray2d.getCursor() ;
		let entry ;
		while ( ( entry = cursor.next() ) ) {
			output += entry.value ;
		}
		return output ;
	} ) ;
} ) ;

