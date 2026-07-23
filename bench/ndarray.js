
"use strict" ;

/* global benchmark, competitor */



const ndarrayModule = require( 'ndarray' ) ;
const arrayKit = require( '..' ) ;



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
	const data = arrayKit.range( 10000 ) ;
	const ndarray = arrayKit.ndarray( data , [ 10000 ] ) ;
	const foreignNdarray = ndarrayModule( data , [ 10000 ] ) ;

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
	
	competitor( "ndarray's .get()" , () => {
		let output = 0 ;

		output += ndarray.get( 0 ) ;
		output += ndarray.get( 9999 ) ;
		output += ndarray.get( 1234 ) ;
		output += ndarray.get( 2345 ) ;
		output += ndarray.get( 4567 ) ;
		output += ndarray.get( 6789 ) ;
		output += ndarray.get( 9876 ) ;
		output += ndarray.get( 7654 ) ;
		output += ndarray.get( 5432 ) ;
		output += ndarray.get( 4321 ) ;

		return output ;
	} ) ;

	competitor( "ndarray's ._get()" , () => {
		let output = 0 ;

		output += ndarray._get( 0 ) ;
		output += ndarray._get( 9999 ) ;
		output += ndarray._get( 1234 ) ;
		output += ndarray._get( 2345 ) ;
		output += ndarray._get( 4567 ) ;
		output += ndarray._get( 6789 ) ;
		output += ndarray._get( 9876 ) ;
		output += ndarray._get( 7654 ) ;
		output += ndarray._get( 5432 ) ;
		output += ndarray._get( 4321 ) ;

		return output ;
	} ) ;

	competitor( "ndarray's ._getAt()" , () => {
		let output = 0 ;

		output += ndarray._getAt( [ 0 ] ) ;
		output += ndarray._getAt( [ 9999 ] ) ;
		output += ndarray._getAt( [ 1234 ] ) ;
		output += ndarray._getAt( [ 2345 ] ) ;
		output += ndarray._getAt( [ 4567 ] ) ;
		output += ndarray._getAt( [ 6789 ] ) ;
		output += ndarray._getAt( [ 9876 ] ) ;
		output += ndarray._getAt( [ 7654 ] ) ;
		output += ndarray._getAt( [ 5432 ] ) ;
		output += ndarray._getAt( [ 4321 ] ) ;

		return output ;
	} ) ;

	competitor( "Foreign 'ndarray' module's .get()" , () => {
		let output = 0 ;

		output += foreignNdarray.get( 0 ) ;
		output += foreignNdarray.get( 9999 ) ;
		output += foreignNdarray.get( 1234 ) ;
		output += foreignNdarray.get( 2345 ) ;
		output += foreignNdarray.get( 4567 ) ;
		output += foreignNdarray.get( 6789 ) ;
		output += foreignNdarray.get( 9876 ) ;
		output += foreignNdarray.get( 7654 ) ;
		output += foreignNdarray.get( 5432 ) ;
		output += foreignNdarray.get( 4321 ) ;

		return output ;
	} ) ;
} ) ;



benchmark( "get values 2D" , () => {
	const data = arrayKit.range( 10000 ) ;
	const simplest2d = new Simplest2D( data , 100 , 100 ) ;
	const arrayND = new arrayKit.ArrayND( data , [ 100 , 100 ] ) ;
	const array2D = new arrayKit.Array2D( data , [ 100 , 100 ] ) ;
	const foreignNdarray = ndarrayModule( data , [ 100 , 100 ] ) ;
	
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
	
	competitor( "Array2D (default) 's .get()" , () => {
		let output = 0 ;

		output += array2D.get( 0 , 0 ) ;
		output += array2D.get( 99 , 99 ) ;
		output += array2D.get( 12 , 34 ) ;
		output += array2D.get( 23 , 45 ) ;
		output += array2D.get( 45 , 67 ) ;
		output += array2D.get( 67 , 89 ) ;
		output += array2D.get( 98 , 76 ) ;
		output += array2D.get( 76 , 54 ) ;
		output += array2D.get( 54 , 32 ) ;
		output += array2D.get( 43 , 21 ) ;

		return output ;
	} ) ;
	
	competitor( "Array2D (default) 's ._get()" , () => {
		let output = 0 ;

		output += array2D._get( 0 , 0 ) ;
		output += array2D._get( 99 , 99 ) ;
		output += array2D._get( 12 , 34 ) ;
		output += array2D._get( 23 , 45 ) ;
		output += array2D._get( 45 , 67 ) ;
		output += array2D._get( 67 , 89 ) ;
		output += array2D._get( 98 , 76 ) ;
		output += array2D._get( 76 , 54 ) ;
		output += array2D._get( 54 , 32 ) ;
		output += array2D._get( 43 , 21 ) ;

		return output ;
	} ) ;
	
	competitor( "Array2D (default) 's ._getAt()" , () => {
		let output = 0 ;

		output += array2D._getAt( [ 0 , 0 ] ) ;
		output += array2D._getAt( [ 99 , 99 ] ) ;
		output += array2D._getAt( [ 12 , 34 ] ) ;
		output += array2D._getAt( [ 23 , 45 ] ) ;
		output += array2D._getAt( [ 45 , 67 ] ) ;
		output += array2D._getAt( [ 67 , 89 ] ) ;
		output += array2D._getAt( [ 98 , 76 ] ) ;
		output += array2D._getAt( [ 76 , 54 ] ) ;
		output += array2D._getAt( [ 54 , 32 ] ) ;
		output += array2D._getAt( [ 43 , 21 ] ) ;

		return output ;
	} ) ;

	competitor( "ArrayND's .get()" , () => {
		let output = 0 ;

		output += arrayND.get( 0 , 0 ) ;
		output += arrayND.get( 99 , 99 ) ;
		output += arrayND.get( 12 , 34 ) ;
		output += arrayND.get( 23 , 45 ) ;
		output += arrayND.get( 45 , 67 ) ;
		output += arrayND.get( 67 , 89 ) ;
		output += arrayND.get( 98 , 76 ) ;
		output += arrayND.get( 76 , 54 ) ;
		output += arrayND.get( 54 , 32 ) ;
		output += arrayND.get( 43 , 21 ) ;

		return output ;
	} ) ;
	
	competitor( "ArrayND's ._get()" , () => {
		let output = 0 ;

		output += arrayND._get( 0 , 0 ) ;
		output += arrayND._get( 99 , 99 ) ;
		output += arrayND._get( 12 , 34 ) ;
		output += arrayND._get( 23 , 45 ) ;
		output += arrayND._get( 45 , 67 ) ;
		output += arrayND._get( 67 , 89 ) ;
		output += arrayND._get( 98 , 76 ) ;
		output += arrayND._get( 76 , 54 ) ;
		output += arrayND._get( 54 , 32 ) ;
		output += arrayND._get( 43 , 21 ) ;

		return output ;
	} ) ;
	
	competitor( "ArrayND's ._getAt()" , () => {
		let output = 0 ;

		output += arrayND._getAt( [ 0 , 0 ] ) ;
		output += arrayND._getAt( [ 99 , 99 ] ) ;
		output += arrayND._getAt( [ 12 , 34 ] ) ;
		output += arrayND._getAt( [ 23 , 45 ] ) ;
		output += arrayND._getAt( [ 45 , 67 ] ) ;
		output += arrayND._getAt( [ 67 , 89 ] ) ;
		output += arrayND._getAt( [ 98 , 76 ] ) ;
		output += arrayND._getAt( [ 76 , 54 ] ) ;
		output += arrayND._getAt( [ 54 , 32 ] ) ;
		output += arrayND._getAt( [ 43 , 21 ] ) ;

		return output ;
	} ) ;
	
	competitor( "Foreign 'ndarray' module's .get()" , () => {
		let output = 0 ;

		output += foreignNdarray.get( 0 , 0 ) ;
		output += foreignNdarray.get( 99 , 99 ) ;
		output += foreignNdarray.get( 12 , 34 ) ;
		output += foreignNdarray.get( 23 , 45 ) ;
		output += foreignNdarray.get( 45 , 67 ) ;
		output += foreignNdarray.get( 67 , 89 ) ;
		output += foreignNdarray.get( 98 , 76 ) ;
		output += foreignNdarray.get( 76 , 54 ) ;
		output += foreignNdarray.get( 54 , 32 ) ;
		output += foreignNdarray.get( 43 , 21 ) ;

		return output ;
	} ) ;
} ) ;



benchmark( "iteration 1D" , () => {
	const data = arrayKit.range( 10000 ) ;
	const ndarray = arrayKit.ndarray( data , [ 10000 ] ) ;
	const foreignNdarray = ndarrayModule( data , [ 10000 ] ) ;
	
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
	
	competitor( "ndarray's .forEach()" , () => {
		let output = 0 ;
		ndarray.forEach( v => output += v ) ;
		return output ;
	} ) ;

	competitor( "ndarray's cursor" , () => {
		let output = 0 ;
		let cursor = ndarray.cursor() ;
		while ( cursor.next() ) {
			output += cursor.value ;
		}
		return output ;
	} ) ;

	competitor( "loop and ndarray's .get()" , () => {
		let output = 0 ;
		
		for ( let x = 0 ; x < 10000 ; x ++ ) {
			output += ndarray.get( x ) ;
		}

		return output ;
	} ) ;

	competitor( "loop and ndarray's ._get()" , () => {
		let output = 0 ;
		
		for ( let x = 0 ; x < 10000 ; x ++ ) {
			output += ndarray._get( x ) ;
		}

		return output ;
	} ) ;

	competitor( "loop and 'ndarray' module's .get()" , () => {
		let output = 0 ;
		
		for ( let x = 0 ; x < 10000 ; x ++ ) {
			output += foreignNdarray.get( x ) ;
		}

		return output ;
	} ) ;
} ) ;



benchmark( "iteration 2D" , () => {
	const data = arrayKit.range( 10000 ) ;
	const simplest2d = new Simplest2D( data , 100 , 100 ) ;
	const ndarray = arrayKit.ndarray( data , [ 100 , 100 ] ) ;
	const arrayND = new arrayKit.ArrayND( data , [ 100 , 100 ] ) ;
	const array2D = new arrayKit.Array2D( data , [ 100 , 100 ] ) ;
	const foreignNdarray = ndarrayModule( data , [ 100 , 100 ] ) ;
	
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
	
	competitor( "ndarray's .forEach()" , () => {
		let output = 0 ;
		ndarray.forEach( v => output += v ) ;
		return output ;
	} ) ;

	competitor( "ndarray's cursor" , () => {
		let output = 0 ;
		let cursor = ndarray.cursor() ;
		while ( cursor.next() ) {
			output += cursor.value ;
		}
		return output ;
	} ) ;

	competitor( "double loop and ndarray's .get()" , () => {
		let output = 0 ;
		
		for ( let x = 0 ; x < 100 ; x ++ ) {
			for ( let y = 0 ; y < 100 ; y ++ ) {
				output += ndarray.get( x , y ) ;
			}
		}

		return output ;
	} ) ;

	competitor( "double loop and ndarray's ._get()" , () => {
		let output = 0 ;
		
		for ( let x = 0 ; x < 100 ; x ++ ) {
			for ( let y = 0 ; y < 100 ; y ++ ) {
				output += ndarray._get( x , y ) ;
			}
		}

		return output ;
	} ) ;

	competitor( "double loop and 'ndarray' module's .get()" , () => {
		let output = 0 ;
		
		for ( let x = 0 ; x < 100 ; x ++ ) {
			for ( let y = 0 ; y < 100 ; y ++ ) {
				output += foreignNdarray.get( x , y ) ;
			}
		}

		return output ;
	} ) ;
} ) ;

benchmark( "iteration 4D" , () => {
	const data = arrayKit.range( 10000 ) ;
	const ndarray = arrayKit.ndarray( data , [ 10 , 10 , 10 , 10 ] ) ;
	const foreignNdarray = ndarrayModule( data , [ 10 , 10 , 10 , 10 ] ) ;
	
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
	
	competitor( "ndarray's .forEach()" , () => {
		let output = 0 ;
		ndarray.forEach( v => output += v ) ;
		return output ;
	} ) ;

	competitor( "ndarray's cursor" , () => {
		let output = 0 ;
		let cursor = ndarray.cursor() ;
		while ( cursor.next() ) {
			output += cursor.value ;
		}
		return output ;
	} ) ;

	competitor( "4x loop and ndarray's .get()" , () => {
		let output = 0 ;
		
		for ( let x = 0 ; x < 10 ; x ++ ) {
			for ( let y = 0 ; y < 10 ; y ++ ) {
				for ( let z = 0 ; z < 10 ; z ++ ) {
					for ( let w = 0 ; w < 10 ; w ++ ) {
						output += ndarray.get( x , y , z , w ) ;
					}
				}
			}
		}

		return output ;
	} ) ;

	competitor( "4x loop and ndarray's ._get()" , () => {
		let output = 0 ;
		
		for ( let x = 0 ; x < 10 ; x ++ ) {
			for ( let y = 0 ; y < 10 ; y ++ ) {
				for ( let z = 0 ; z < 10 ; z ++ ) {
					for ( let w = 0 ; w < 10 ; w ++ ) {
						output += ndarray._get( x , y , z , w ) ;
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
						output += foreignNdarray.get( x , y , z , w ) ;
					}
				}
			}
		}

		return output ;
	} ) ;
} ) ;

