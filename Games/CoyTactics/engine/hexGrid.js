// represents a 2d coordinate
export class Point{
  x;
  y;

  constructor(x, y){
    this.x = x;
    this.y = y;
  }

  // return true if the given point equals this point
  equals(point){
    return this.x == point.x && this.y == point.y;
  }

  static equals(pointA, pointB){
    return pointA.equals(pointB);
  }

  // return a new point by adding the given point to this point
  add(point){
    return new Point(this.x + point.x, this.y + point.y);
  }

  // static version of add
  static add(pointA, pointB){
    return pointA.add(pointB);
  }

  // return a new point by subtracting the given point from this point
  subtract(point){
    return new Point(this.x - point.x, this.y - point.y);
  }

  // static version of subtract. returns A - B
  static subtract(pointA, pointB){
    return pointA.subtract(pointB);
  }
}

// represents a cube/axial hex coordinate
// also includes helper functions for traversing hexes
export class Hex{
  static directions = [new Hex(1, 0, -1), new Hex(1, -1, 0), new Hex(0, -1, 1), new Hex(-1, 0, 1), new Hex(-1, 1, 0), new Hex(0, 1, -1)];
  static diagonals = [new Hex(2, -1, -1), new Hex(1, -2, 1), new Hex(-1, -1, 2), new Hex(-2, 1, 1), new Hex(-1, 2, -1), new Hex(1, 1, -2)];

  q;
  r;
  s;  

  get key(){
    return this.q + "," + this.r;
  }

  // construct a hex given two coordinates. s is optional and will be computed if not provided
  constructor(q, r, s){
    this.q = q;
    this.r = r;
    
    if(s === undefined) this.s = -q - r;
    else this.s = s;

    console.assert(this.q + this.r + this.s == 0, "Invalid hex coordinate", this);
  }

  //#region Operators

  // returns if this hex is equal to the passed hex
  equals(hex){
    return this.q == hex.q && this.r == hex.r && this.s == hex.s;
  }

  // static version of equals
  static equals(hexA, hexB){
    return hexA.equals(hexB);
  }

  // add passed hex to this hex. returns a new hex
  add(hex){
    return new Hex(this.q + hex.q, this.r + hex.r, this.s + hex.s);
  }

  // static version of add
  static add(hexA, hexB){
    return hexA.add(hexB);
  }

  // subtract passed hex from this hex. returns a new hex
  subtract(hex){
    return new Hex(this.q - hex.q, this.r - hex.r, this.s - hex.s);
  }

  // static version of subtract. returns A - B
  static subtract(hexA, hexB){
    return hexA.subtract(hexB);
  }

  // multiply this hex by the passed int. returns a new hex
  multiply(i){
    return new Hex(this.q * i, this.r * i, this.s * i);
  }

  // static version of multiply
  static multiply(hex, i){
    return hex.multiply(i);
  }

  //#endregion

  //#region Utility

  // return the length of this hex, treating it as a vector
  length(){
    return Math.max(Math.abs(this.q), Math.abs(this.r), Math.abs(this.s));
  }

  // static version of length
  static length(hexVector){
    return hexVector.length();
  }

  // return the distance from this hex to the target hex
  distance(hexTarget){
    return this.subtract(hexTarget).length();
  }

  // static version of distance
  static distance(hexSource, hexTarget){
    return hexSource.distance(hexTarget);
  }

  // return a hex vector representing the given direction
  // direction is modded. 0 is straight right for pointed top, or down right for flat top, goes CCW around
  static direction_vec(direction){
    return Hex.directions[(6 + (direction % 6)) % 6];
  }

  // non static version of direction_vec
  direction_vec(direction){
    return Hex.direction_vec(direction);
  }

  // return a new hex that is the neighbor of this hex, in the given direction
  neighbor(direction){
    return this.add(Hex.direction_vec(direction));
  }

  // static version of neighbor
  static neighbor(hex, direction){
    return hex.neighbor(direction);
  }

  // return a hex vector representing the given diagonal direction
  // direction is modded. 0 is straight right for flat top, or top right for pointed top, goes CCW around
  static diagonal_vec(direction){
    return Hex.diagonals[(6 + (direction % 6)) % 6];
  }

  // non static version of diagonal_vec
  diagonal_vec(direction){
    return Hex.diagonal_vec(direction);
  }

  // return a new hex that is the diagonal of this hex, in the given direction
  diagonal(direction){
    return this.add(Hex.diagonal_vec(direction));
  }

  // static version of diagonal
  static diagonal(hex, direction){
    return hex.diagonal(direction);
  }
  
  // round this hex to the nearest integer coordinates, returning a new hex
  round(){
    let q = Math.round(this.q);
    let r = Math.round(this.r);
    let s = Math.round(this.s);

    let dq = Math.abs(q - this.q);
    let dr = Math.abs(r - this.r);
    let ds = Math.abs(s - this.s);

    if(dq > dr && dq > ds){
      q = -r-s;
    }
    else if(dr > ds){
      r = -q-s;
    }
    else{
      s = -q-r;
    }

    return new Hex(q, r, s);
  }

  // static version of round
  static round(hex){
    return hex.round();
  }

  //#endregion
  
  //#region Shapes

  // return all of the hexes within n distance of this hex (including this hex). so a filled in hexagon of n size centered on this hex
  range(n){
    let hexes = [];

    for(let q = -n; q <= n; q++){
      for(let r = Math.max(-n, -q-n); r <= Math.min(n, -q+n); r++){
        hexes.push(new Hex(q, r));
      }
    }

    return hexes;
  }

  // static version of range
  static range(hex, n){
    return hex.range(n);
  }
  //#endregion
}

// represents an offset coordinate, plus methods for converting to and from offset coords
// more useful for labeling and traversal for drawing
// methods support both orientations, but always doing the odd layouts
export class Offset{
  col;
  row;  

  constructor(col, row){
    this.col = col;
    this.row = row;    
  }

  // return if this offset equals the given offset
  equals(offset){
    return this.row == offset.row && this.col == offset.col;
  }

  // static version of equals
  static equals(offsetA, offsetB){
    return offsetA.equals(offsetB);
  }

  // construct a new Offset from the given hex
  // uses odd-q algorithm
  static fromHex_flat(hex){
    let col = hex.q;    
    let row = hex.r + (hex.q - (hex.q&1)) / 2;    
    return new Offset(col, row);
  }

  // construct a new Offset from the given hex
  // uses odd-r algorithm
  static fromHex_pointy(hex){
    let col = hex.q + (hex.r - (hex.r&1)) / 2;
    let row = hex.r;    
    return new Offset(col, row);
  }

  // construct a new Hex from the given offset
  // uses odd-q algorithm
  static toHex_flat(offset){
    let q = offset.col;
    let r = offset.row - (offset.col - (offset.col&1)) / 2;
    return new Hex(q, r);
  }

  // construct a new Hex from the given offset
  // uses odd-r algorithm
  static toHex_pointy(offset){
    let q = offset.col - (offset.row - (offset.row&1)) / 2;
    let r = offset.row;
    return new Hex(q, r);
  }

  // non-static version of toHex_flat
  toHex_flat(){
    return Offset.toHex_flat(this);
  }

  // non-static version of toHex_pointy
  toHex_pointy(){
    return Offset.toHex_pointy(this);
  }
}

// holds all the matrix values for converting between hex and pixels, as well as the start angle for computing corners
class Orientation {
  f0; f1; f2; f3;
  b0; b1; b2; b3;
  start_angle;  // in units of 60 degrees. so ".5" is 30 degrees
  
  constructor(f0, f1, f2, f3, b0, b1, b2, b3, start_angle){
    this.f0 = f0;
    this.f1 = f1;
    this.f2 = f2;
    this.f3 = f3;

    this.b0 = b0;
    this.b1 = b1;
    this.b2 = b2;
    this.b3 = b3;

    this.start_angle = start_angle;
  }
}

// contains the functions used for drawing hexes on the screen, as well as mapping screen coordinates back to hexes
// instantiated with the orientation and hex size, either of which could be changed
export class HexLayout{
  static flat = 
    new Orientation(3.0 / 2.0, 0.0, Math.sqrt(3.0) / 2.0, Math.sqrt(3.0),
    2.0 / 3.0, 0.0, -1.0 / 3.0, Math.sqrt(3.0) / 3.0,
    0.0);
  static pointy = 
    new Orientation(Math.sqrt(3.0), Math.sqrt(3.0) / 2.0, 0.0, 3.0 / 2.0,
    Math.sqrt(3.0) / 3.0, -1.0 / 3.0, 0.0, 2.0 / 3.0,
    0.5);

  #orientation;  // one of the two above static variables, determines if using pointy top or flat top
  #size; // #size of the hexes, should be a Point
  #origin; // where in pixels is the center of 0, 0, 0, should be a Point

  #corners; // precomputed relative corner positions. updated whenever the orientation or size changes

  //#region Getters and Setters

  get orientation(){
    return this.#orientation;
  }

  set orientation(val){
    this.#orientation = val;
    this.#computeCorners();
  }

  get size(){
    return this.#size;
  }

  set size(val){
    this.#size = val;
    this.#computeCorners();
  }

  get origin(){
    return this.#origin;
  }

  set origin(val){
    this.#origin = val;
  }

  //#endregion

  constructor(orientation, size, origin){
    this.#orientation = orientation;
    this.#size = size;
    this.#origin = origin;

    this.#computeCorners();
  }

  // calculate the pixel location of hex corners relative to the center of a hex, using this layout's properties
  #computeCorners(){
    this.#corners = [];

    for(let i = 0; i < 6; i++){
      let angle = 2 * Math.PI * (this.#orientation.start_angle + i) / 6;  // radians
      this.#corners.push(new Point(this.#size.x * Math.cos(angle), this.#size.y * Math.sin(angle)));
    }
  }

  // return the pixel coordinates of the center of the given hex, using this layout's #size and #origin values
  // first matrix multiply the hex q,r, then scale with #size, then offset with #origin
  hexToPixel(hex){
    let x = ((this.#orientation.f0 * hex.q) + (this.#orientation.f1 * hex.r)) * this.#size.x;
    let y = ((this.#orientation.f2 * hex.q) + (this.#orientation.f3 * hex.r)) * this.#size.y;
    return new Point(x + this.#origin.x, y + this.#origin.y);
  }

  // return the hex that contains the given pixel, using this layout's #size and #origin values
  // this will be a hex with fractional coordinates. use .Round() to round to the nearest integer coordinates
  // do the opposite of hexToPixel, first offset with #origin, then scale (divide) by #size, then matrix multiply using the #orientation's inverse matrix
  pixelToHex(pixel){
    let x = (pixel.x - this.#origin.x) / this.#size.x;
    let y = (pixel.y - this.#origin.y) / this.#size.y;

    let q = ((this.#orientation.b0 * x) + (this.#orientation.b1 * y));
    let r = ((this.#orientation.b2 * x) + (this.#orientation.b3 * y));

    return new Hex(q, r);
  }

  // calculate the pixel locations of all 6 corners of the given hex, using this layout's properties
  // returns an array of Points
  hexCorners(hex){
    let hexCenter = this.hexToPixel(hex);
    return this.#corners.map(c => hexCenter.add(c));
  }

  // convert the given hex to an offset coordinate, based on this layout's orientation
  // recommended to use this instead of the Offset methods direction so calling code doesn't need to worry about calling the right conversion method
  hexToOffset(hex){
    if(this.orientation.start_angle == 0){
      return Offset.fromHex_flat(hex);
    }
    else{
      return Offset.fromHex_pointy(hex);
    }
  }

  // convert the given offset to a hex coordinate, based on this layout's orientation
  // recommended to use this instead of the Offset methods direction so calling code doesn't need to worry about calling the right conversion method
  offsetToHex(offset){
    if(this.orientation.start_angle == 0){
      return Offset.toHex_flat(offset);
    }
    else{
      return Offset.toHex_pointy(offset);
    }
  }
}

export class HexTests {
  static Equals(){
    let hexA = new Hex(1, 2, -3);
    let hexB = new Hex(1, 2, -3);

    console.assert(hexA.equals(hexB), "Equals");
    console.assert(Hex.equals(hexA, hexB), "Equals (static)");

    let hexC = new Hex(1, 2, -3);
    let hexD = new Hex(2, 3, -5);

    console.assert(!hexC.equals(hexD), "Equals (not)");
    console.assert(!Hex.equals(hexC, hexD), "Equals (static not)");
  }
   
  static Add(){
    let hexA = new Hex(1, 2, -3);
    let hexB = new Hex(2, 3, -5);
    let hexCorrect = new Hex(3, 5, -8);

    console.assert(hexA.add(hexB).equals(hexCorrect), "Add");
    console.assert(Hex.add(hexA, hexB).equals(hexCorrect), "Add (static)");
  }

  static Subtract(){
    let hexA = new Hex(2, 3, -5);
    let hexB = new Hex(1, 2, -3);
    let hexCorrect = new Hex(1, 1, -2);

    console.assert(hexA.subtract(hexB).equals(hexCorrect), "Subtract");
    console.assert(Hex.subtract(hexA, hexB).equals(hexCorrect), "Subtract (static)");
  }

  static Multiply(){
    let hexA = new Hex(2, 3, -5);
    let factor = 2;
    let hexCorrect = new Hex(4, 6, -10);

    console.assert(hexA.multiply(factor).equals(hexCorrect), "Multiply");
    console.assert(Hex.multiply(hexA, factor).equals(hexCorrect), "Multiply (static)");
  }

  static Length(){
    let vec = new Hex(-1, 2, -1);

    console.assert(vec.length() == 2, "Length");
    console.assert(Hex.length(vec) == 2, "Length (static)");
  }

  static Distance(){
    let hexA = new Hex(-2, 2, 0);
    let hexB = new Hex(-1, 4, -3);

    console.assert(hexA.distance(hexB) == 3, "Distance");
    console.assert(Hex.distance(hexA, hexB) == 3, "Distance (static)");
  }

  static Direction(){
    let correct = new Hex(0, -1, 1);

    console.assert(Hex.direction_vec(2).equals(correct), "Direction");
    console.assert(Hex.direction_vec(8).equals(correct), "Direction (positive mod)");
    console.assert(Hex.direction_vec(-4).equals(correct), "Direction (negative mod)");
  }

  static Neighbor(){
    let hex = new Hex(1, -2, 1);
    let correct = new Hex(1, -1, 0);

    console.assert(hex.neighbor(5).equals(correct), "Neighbor");
    console.assert(hex.neighbor(11).equals(correct), "Neighbor (positive mod)");
    console.assert(hex.neighbor(-1).equals(correct), "Neighbor (negative mod)");

    console.assert(Hex.neighbor(hex, 5).equals(correct), "Neighbor (static)");
    console.assert(Hex.neighbor(hex, 11).equals(correct), "Neighbor (static positive mod)");
    console.assert(Hex.neighbor(hex, -1).equals(correct), "Neighbor (static negative mod)");
  }

  static Diagonal_vec(){
    let correct = new Hex(1, -2, 1);

    console.assert(Hex.diagonal_vec(1).equals(correct), "Diagonal_vec");
    console.assert(Hex.diagonal_vec(7).equals(correct), "Diagonal_vec (positive mod)");
    console.assert(Hex.diagonal_vec(-5).equals(correct), "Diagonal_vec (negative mod)");
  }

  static Diagonal(){
    let hex = new Hex(2, -2, 0);
    let correct = new Hex(1, 0, -1);

    console.assert(hex.diagonal(4).equals(correct), "Diagonal");
    console.assert(hex.diagonal(10).equals(correct), "Diagonal (positive mod)");
    console.assert(hex.diagonal(-2).equals(correct), "Diagonal (negative mod)");

    console.assert(Hex.diagonal(hex, 4).equals(correct), "Diagonal (static)");
    console.assert(Hex.diagonal(hex, 10).equals(correct), "Diagonal (static positive mod)");
    console.assert(Hex.diagonal(hex, -2).equals(correct), "Diagonal (static negative mod)");
  }

  static Round(){
    let frac = new Hex(.8, -1.3);
    let correct = new Hex(1, -1);

    console.assert(frac.round().equals(correct), "Round");
    console.assert(Hex.round(frac).equals(correct), "Round (static)");
  }

  static HexToPixelToHex(){
    let layoutFlat = new HexLayout(HexLayout.flat, new Point(10, 10), new Point(0, 0));
    let layoutPointy = new HexLayout(HexLayout.pointy, new Point(10, 15), new Point(5, 12));
    let hex = new Hex(6, -2, -4);

    console.assert(layoutFlat.pixelToHex(layoutFlat.hexToPixel(hex)).round().equals(hex), "HexToPixelToHex (flat)");
    console.assert(layoutPointy.pixelToHex(layoutPointy.hexToPixel(hex)).round().equals(hex), "HexToPixelToHex (pointy)");
  }

  static PointEquals(){
    let pointA = new Point(1, 2);
    let pointB = new Point(1, 2);

    console.assert(pointA.equals(pointB), "PointEquals");
    console.assert(Point.equals(pointA, pointB), "PointEquals (static)");

    let pointC = new Point(1, 2);
    let pointD = new Point(2, 3);

    console.assert(!pointC.equals(pointD), "PointEquals (not)");
    console.assert(!Point.equals(pointC, pointD), "PointEquals (static not)");
  }

  static PointAdd(){
    let pointA = new Point(5, -12);
    let pointB = new Point(-2, 4);
    let correct = new Point(3, -8);

    console.assert(pointA.add(pointB).equals(correct), "PointAdd");
    console.assert(Point.add(pointA, pointB).equals(correct), "PointAdd (static)");
  }

  static PointSubtract(){
    let pointA = new Point(10, -3);
    let pointB = new Point(2, 3);
    let correct = new Point(8, -6);

    console.assert(pointA.subtract(pointB).equals(correct), "PointSubtract");
    console.assert(Point.subtract(pointA, pointB).equals(correct), "PointSubtract (static)");
  }

  static OffsetEquals(){
    let offsetA = new Offset(3, 1);
    let offsetB = new Offset(3, 1);

    console.assert(offsetA.equals(offsetB), "OffsetEquals");
    console.assert(Offset.equals(offsetA, offsetB), "OffsetEquals (static)");

    let offsetC = new Offset(5, -2);
    let offsetD = new Offset(2, 3);

    console.assert(!offsetC.equals(offsetD), "OffsetEquals (not)");
    console.assert(!Offset.equals(offsetC, offsetD), "OffsetEquals (static not)");
  }

  static OffsetFromHex(){
    let hex = new Hex(2, -1);

    let flatLayout = new HexLayout(HexLayout.flat, new Point(10, 10), new Point(0, 0));
    let flatCorrect = new Offset(2, 0);

    let pointyLayout = new HexLayout(HexLayout.pointy, new Point(10, 10), new Point(0, 0));
    let pointyCorrect = new Offset(1, -1);

    console.assert(flatLayout.hexToOffset(hex).equals(flatCorrect), "OffsetFromHex (flat)");
    console.assert(pointyLayout.hexToOffset(hex).equals(pointyCorrect), "OffsetFromHex (pointy)");
  }

  static OffsetToHex(){
    let offset = new Offset(2, -2);

    let flatLayout = new HexLayout(HexLayout.flat, new Point(10, 10), new Point(0, 0));
    let flatCorrect = new Hex(2, -3);

    let pointyLayout = new HexLayout(HexLayout.pointy, new Point(10, 10), new Point(0, 0));
    let pointyCorrect = new Hex(3, -2);

    console.assert(flatLayout.offsetToHex(offset).equals(flatCorrect), "OffsetToHex (flat)");
    console.assert(pointyLayout.offsetToHex(offset).equals(pointyCorrect), "OffsetToHex (pointy)");
  }

  static TestAll(){
    console.log("Running tests, fails are:");

    HexTests.Equals();
    HexTests.Add();
    HexTests.Subtract();
    HexTests.Multiply();
    HexTests.Length();
    HexTests.Distance();
    HexTests.Direction();
    HexTests.Neighbor();
    HexTests.Diagonal_vec();
    HexTests.Diagonal();
    HexTests.Round();
    HexTests.HexToPixelToHex();

    HexTests.PointEquals();
    HexTests.PointAdd();
    HexTests.PointSubtract();

    HexTests.OffsetEquals();
    HexTests.OffsetFromHex();
    HexTests.OffsetToHex();

    console.log("End of tests");
  }
}