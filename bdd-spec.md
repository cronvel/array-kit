# TOC
   - [.removeItems()](#removeitems)
   - [.delete()](#delete)
   - [.inPlaceConcat()](#inplaceconcat)
<a name=""></a>
 
<a name="removeitems"></a>
# .removeItems()
should produce a new array without any element matching the second array.

```js
var input , copy ;

expect( arrayKit.removeItems( [ 1,2,3,4,5,4,3,2,1 ] , [ 2,4 ] ) ).to.eql( [ 1,3,5,3,1 ] ) ;
expect( arrayKit.removeItems( [ 1,2,3,4,5,4,3,2,1 ] , [ 2,4,6 ] ) ).to.eql( [ 1,3,5,3,1 ] ) ;
expect( arrayKit.removeItems( [ 1,2,3,4,5,4,3,2,1 ] , [] ) ).to.eql( [ 1,2,3,4,5,4,3,2,1 ] ) ;
expect( arrayKit.removeItems( [] , [ 2,4 ] ) ).to.eql( [] ) ;

var a = { a: 'a' } ;
var b = { b: 'b' } ;
var c = { c: 'c' } ;

// Check if the src/input array was left untouched
input = [ a , a , b , a ] ;
copy = input ;
expect( arrayKit.removeItems( input , [ a ] ) ).to.eql( [ b ] ) ;
expect( input ).to.eql( [ a , a , b , a ] ) ;
expect( input ).to.be( copy ) ;

expect( arrayKit.removeItems( [ a , a , a ] , [ a ] ) ).to.eql( [] ) ;
expect( arrayKit.removeItems( [ a , a , b , a ] , [ a ] ) ).to.eql( [ b ] ) ;
expect( arrayKit.removeItems( [ a , a , b , a ] , [ c ] ) ).to.eql( [ a , a , b , a ] ) ;
expect( arrayKit.removeItems( [ a , a , b , a ] , [ a , c ] ) ).to.eql( [ b ] ) ;

expect( arrayKit.removeItems( [ a , b , null , c ] , [ b ] ) ).to.eql( [ a , null , c ] ) ;
expect( arrayKit.removeItems( [ a , b , c ] , [ b , null ] ) ).to.eql( [ a , c ] ) ;
expect( arrayKit.removeItems( [ a , null , b , c ] , [ b , null ] ) ).to.eql( [ a , c ] ) ;

expect( arrayKit.removeItems( [ a , b , undefined , c ] , [ b ] ) ).to.eql( [ a , undefined , c ] ) ;
expect( arrayKit.removeItems( [ a , b , c ] , [ b , undefined ] ) ).to.eql( [ a , c ] ) ;
expect( arrayKit.removeItems( [ a , undefined , b , c ] , [ b , undefined ] ) ).to.eql( [ a , c ] ) ;

expect( arrayKit.removeItems( [ null , a , b , undefined , c ] , [ b ] ) ).to.eql( [ null , a , undefined , c ] ) ;
expect( arrayKit.removeItems( [ null , a , b , undefined , c ] , [ null , b ] ) ).to.eql( [ a , undefined , c ] ) ;
expect( arrayKit.removeItems( [ null , a , b , undefined , c ] , [ b , undefined ] ) ).to.eql( [ null , a , c ] ) ;
expect( arrayKit.removeItems( [ null , a , b , undefined , c ] , [ undefined , null , b ] ) ).to.eql( [ a , c ] ) ;
```

<a name="delete"></a>
# .delete()
should delete one index in-place.

```js
var array ;

array = [ 1,2,3,4,5 ] ;
arrayKit.delete( array , 7 ) ;
expect( array ).to.eql( [ 1,2,3,4,5 ] ) ;
arrayKit.delete( array , 6 ) ;
expect( array ).to.eql( [ 1,2,3,4,5 ] ) ;
arrayKit.delete( array , 5 ) ;
expect( array ).to.eql( [ 1,2,3,4,5 ] ) ;

array = [ 1,2,3,4,5 ] ;
arrayKit.delete( array , 0 ) ;
expect( array ).to.eql( [ 2,3,4,5 ] ) ;

array = [ 1,2,3,4,5 ] ;
arrayKit.delete( array , 1 ) ;
expect( array ).to.eql( [ 1,3,4,5 ] ) ;

array = [ 1,2,3,4,5 ] ;
arrayKit.delete( array , 2 ) ;
expect( array ).to.eql( [ 1,2,4,5 ] ) ;

array = [ 1,2,3,4,5 ] ;
arrayKit.delete( array , 3 ) ;
expect( array ).to.eql( [ 1,2,3,5 ] ) ;

array = [ 1,2,3,4,5 ] ;
arrayKit.delete( array , 4 ) ;
expect( array ).to.eql( [ 1,2,3,4 ] ) ;
```

<a name="inplaceconcat"></a>
# .inPlaceConcat()
should concat in-place.

```js
var array ;

array = [ 1,2,3,4,5 ] ;
arrayKit.inPlaceConcat( array , [] ) ;
expect( array ).to.eql( [ 1,2,3,4,5 ] ) ;

array = [ 1,2,3,4,5 ] ;
arrayKit.inPlaceConcat( array , [ 6 ] ) ;
expect( array ).to.eql( [ 1,2,3,4,5,6 ] ) ;

array = [ 1,2,3,4,5 ] ;
arrayKit.inPlaceConcat( array , [ 6,7 ] ) ;
expect( array ).to.eql( [ 1,2,3,4,5,6,7 ] ) ;

array = [] ;
arrayKit.inPlaceConcat( array , [] ) ;
expect( array ).to.eql( [] ) ;

array = [] ;
arrayKit.inPlaceConcat( array , [ 6 ] ) ;
expect( array ).to.eql( [ 6 ] ) ;

array = [] ;
arrayKit.inPlaceConcat( array , [ 6,7 ] ) ;
expect( array ).to.eql( [ 6,7 ] ) ;
```

