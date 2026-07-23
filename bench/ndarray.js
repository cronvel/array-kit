
"use strict" ;

/* global benchmark, competitor */



const ndarrayModule = require( 'ndarray' ) ;
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
	const foreignNdarray1d = ndarrayModule( data , [ 10000 ] ) ;

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
	
	competitor( "NDArray's .get()" , () => {
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

	competitor( "NDArray's ._get()" , () => {
		let output = 0 ;

		output += ndarray1d._get( [ 0 ] ) ;
		output += ndarray1d._get( [ 9999 ] ) ;
		output += ndarray1d._get( [ 1234 ] ) ;
		output += ndarray1d._get( [ 2345 ] ) ;
		output += ndarray1d._get( [ 4567 ] ) ;
		output += ndarray1d._get( [ 6789 ] ) ;
		output += ndarray1d._get( [ 9876 ] ) ;
		output += ndarray1d._get( [ 7654 ] ) ;
		output += ndarray1d._get( [ 5432 ] ) ;
		output += ndarray1d._get( [ 4321 ] ) ;

		return output ;
	} ) ;

	competitor( "Foreign 'ndarray' module's .get()" , () => {
		let output = 0 ;

		output += foreignNdarray1d.get( 0 ) ;
		output += foreignNdarray1d.get( 9999 ) ;
		output += foreignNdarray1d.get( 1234 ) ;
		output += foreignNdarray1d.get( 2345 ) ;
		output += foreignNdarray1d.get( 4567 ) ;
		output += foreignNdarray1d.get( 6789 ) ;
		output += foreignNdarray1d.get( 9876 ) ;
		output += foreignNdarray1d.get( 7654 ) ;
		output += foreignNdarray1d.get( 5432 ) ;
		output += foreignNdarray1d.get( 4321 ) ;

		return output ;
	} ) ;
} ) ;



benchmark( "get values 2D" , () => {
	const data = range( 10000 ) ;
	const simplest2d = new Simplest2D( data , 100 , 100 ) ;
	const ndarray2d = new NDArray( data , [ 100 , 100 ] ) ;
	const foreignNdarray2d = ndarrayModule( data , [ 100 , 100 ] ) ;
	
	competitor( "Simplest 2D interpretation of Array's .get()" , () => {
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
	
	competitor( "NDArray's .get()" , () => {
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
	
	competitor( "NDArray's ._get()" , () => {
		let output = 0 ;

		output += ndarray2d._get( [ 0 ] ) ;
		output += ndarray2d._get( [ 99 , 99 ] ) ;
		output += ndarray2d._get( [ 12 , 34 ] ) ;
		output += ndarray2d._get( [ 23 , 45 ] ) ;
		output += ndarray2d._get( [ 45 , 67 ] ) ;
		output += ndarray2d._get( [ 67 , 89 ] ) ;
		output += ndarray2d._get( [ 98 , 76 ] ) ;
		output += ndarray2d._get( [ 76 , 54 ] ) ;
		output += ndarray2d._get( [ 54 , 32 ] ) ;
		output += ndarray2d._get( [ 43 , 21 ] ) ;

		return output ;
	} ) ;
	
	competitor( "Foreign 'ndarray' module's .get()" , () => {
		let output = 0 ;

		output += foreignNdarray2d.get( 0 ) ;
		output += foreignNdarray2d.get( 99 , 99 ) ;
		output += foreignNdarray2d.get( 12 , 34 ) ;
		output += foreignNdarray2d.get( 23 , 45 ) ;
		output += foreignNdarray2d.get( 45 , 67 ) ;
		output += foreignNdarray2d.get( 67 , 89 ) ;
		output += foreignNdarray2d.get( 98 , 76 ) ;
		output += foreignNdarray2d.get( 76 , 54 ) ;
		output += foreignNdarray2d.get( 54 , 32 ) ;
		output += foreignNdarray2d.get( 43 , 21 ) ;

		return output ;
	} ) ;
} ) ;



benchmark( "iteration 1D" , () => {
	const data = range( 10000 ) ;
	const ndarray1d = new NDArray( data , [ 10000 ] ) ;
	const foreignNdarray1d = ndarrayModule( data , [ 10000 ] ) ;
	
	competitor( "loop and Array index" , () => {
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
	
	competitor( "NDArray's .forEach()" , () => {
		let output = 0 ;
		ndarray1d.forEach( v => output += v ) ;
		return output ;
	} ) ;

	competitor( "NDArray's cursor" , () => {
		let output = 0 ;
		let cursor = ndarray1d.cursor() ;
		while ( cursor.next() ) {
			output += cursor.value ;
		}
		return output ;
	} ) ;

	competitor( "loop and NDArray's .get()" , () => {
		let output = 0 ;
		
		for ( let x = 0 ; x < 10000 ; x ++ ) {
			output += ndarray1d.get( x ) ;
		}

		return output ;
	} ) ;

	competitor( "loop and NDArray's ._get()" , () => {
		let output = 0 ;
		
		for ( let x = 0 ; x < 10000 ; x ++ ) {
			output += ndarray1d._get( [ x ] ) ;
		}

		return output ;
	} ) ;

	competitor( "loop and 'ndarray' module's .get()" , () => {
		let output = 0 ;
		
		for ( let x = 0 ; x < 10000 ; x ++ ) {
			output += foreignNdarray1d.get( x ) ;
		}

		return output ;
	} ) ;
} ) ;



benchmark( "iteration 2D" , () => {
	const data = range( 10000 ) ;
	const simplest2d = new Simplest2D( data , 100 , 100 ) ;
	const ndarray2d = new NDArray( data , [ 100 , 100 ] ) ;
	const foreignNdarray2d = ndarrayModule( data , [ 100 , 100 ] ) ;
	
	competitor( "double loop and Array index" , () => {
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

	competitor( "double loop and Simplest 2D interpretation of Array's .get()" , () => {
		let output = 0 ;
		
		for ( let x = 0 ; x < 100 ; x ++ ) {
			for ( let y = 0 ; y < 100 ; y ++ ) {
				output += simplest2d.get( x , y ) ;
			}
		}

		return output ;
	} ) ;
	
	competitor( "NDArray's .forEach()" , () => {
		let output = 0 ;
		ndarray2d.forEach( v => output += v ) ;
		return output ;
	} ) ;

	competitor( "NDArray's cursor" , () => {
		let output = 0 ;
		let cursor = ndarray2d.cursor() ;
		while ( cursor.next() ) {
			output += cursor.value ;
		}
		return output ;
	} ) ;

	competitor( "double loop and NDArray's .get()" , () => {
		let output = 0 ;
		
		for ( let x = 0 ; x < 100 ; x ++ ) {
			for ( let y = 0 ; y < 100 ; y ++ ) {
				output += ndarray2d.get( x , y ) ;
			}
		}

		return output ;
	} ) ;

	competitor( "double loop and NDArray's ._get()" , () => {
		let output = 0 ;
		
		for ( let x = 0 ; x < 100 ; x ++ ) {
			for ( let y = 0 ; y < 100 ; y ++ ) {
				output += ndarray2d._get( [ x , y ] ) ;
			}
		}

		return output ;
	} ) ;

	competitor( "double loop and 'ndarray' module's .get()" , () => {
		let output = 0 ;
		
		for ( let x = 0 ; x < 100 ; x ++ ) {
			for ( let y = 0 ; y < 100 ; y ++ ) {
				output += foreignNdarray2d.get( x , y ) ;
			}
		}

		return output ;
	} ) ;
} ) ;

benchmark( "iteration 4D" , () => {
	const data = range( 10000 ) ;
	const ndarray4d = new NDArray( data , [ 10 , 10 , 10 , 10 ] ) ;
	const foreignNdarray4d = ndarrayModule( data , [ 10 , 10 , 10 , 10 ] ) ;
	
	competitor( "4x loop and Array index" , () => {
		let output = 0 ;
		
		for ( let x = 0 ; x < 10 ; x ++ ) {
			for ( let y = 0 ; y < 10 ; y ++ ) {
				for ( let z = 0 ; z < 10 ; z ++ ) {
					for ( let w = 0 ; w < 10 ; w ++ ) {
						output += data[ w * 1000 + z * 100 + y * 10 + x ] ;
					}
				}
			}
		}

		return output ;
	} ) ;
	
	competitor( "NDArray's .forEach()" , () => {
		let output = 0 ;
		ndarray4d.forEach( v => output += v ) ;
		return output ;
	} ) ;

	competitor( "NDArray's cursor" , () => {
		let output = 0 ;
		let cursor = ndarray4d.cursor() ;
		while ( cursor.next() ) {
			output += cursor.value ;
		}
		return output ;
	} ) ;

	competitor( "4x loop and NDArray's .get()" , () => {
		let output = 0 ;
		
		for ( let x = 0 ; x < 10 ; x ++ ) {
			for ( let y = 0 ; y < 10 ; y ++ ) {
				for ( let z = 0 ; z < 10 ; z ++ ) {
					for ( let w = 0 ; w < 10 ; w ++ ) {
						output += ndarray4d.get( x , y , z , w ) ;
					}
				}
			}
		}

		return output ;
	} ) ;

	competitor( "4x loop and NDArray's ._get()" , () => {
		let output = 0 ;
		
		for ( let x = 0 ; x < 10 ; x ++ ) {
			for ( let y = 0 ; y < 10 ; y ++ ) {
				for ( let z = 0 ; z < 10 ; z ++ ) {
					for ( let w = 0 ; w < 10 ; w ++ ) {
						output += ndarray4d._get( [ x , y , z , w ] ) ;
					}
				}
			}
		}

		return output ;
	} ) ;

	competitor( "4x loop and 'ndarray' module's .get()" , () => {
		let output = 0 ;
		
		for ( let x = 0 ; x < 10 ; x ++ ) {
			for ( let y = 0 ; y < 10 ; y ++ ) {
				for ( let z = 0 ; z < 10 ; z ++ ) {
					for ( let w = 0 ; w < 10 ; w ++ ) {
						output += foreignNdarray4d.get( x , y , z , w ) ;
					}
				}
			}
		}

		return output ;
	} ) ;
} ) ;

