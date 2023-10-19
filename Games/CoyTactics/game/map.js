import { engine } from "../engine/engine.js";
import { gameObject } from "../engine/gameObject.js";
import { HexLayout, Hex, Point, Offset} from "../engine/hexGrid.js";

// this class will have all of the properties held on a particular hex in the game. type of terrain, pointer to a unit, etc
export class Tile {
  hex;  // the hex this tile should represent

  type;
  isBlocked = false;

  constructor(hex){
    this.hex = hex;

    this.type = 0;
  }
}

// this will have the hashmap of all the tiles in the map. likely also terrain generation methods too
export class Map extends gameObject{
  hexLayout;

  // input-related variables
  zoom = 50;  // used as the size value
  zoomMin = 30;
  zoomMax = 80;
  zoomStep = 10; // amount the layout size changes with each zoom
  isDragging = false; // set/unset by right click events
  originalDragPoint;  // Point where dragging started, used to tell if a right click release can be handled as a click
  dragPoint;  // Point of the last mouse move event, used to track the amount of change with each event for updating the layout offset

  // store all the tiles that are part of the map. Each is keyed by "q,r", the value is a Tile
  tiles = {};

  constructor(){
    super();

    this.hexLayout = new HexLayout(HexLayout.flat, new Point(this.zoom, this.zoom), new Point(engine.canvasWidth / 2, engine.canvasHeight / 2));

    let center = new Hex(0,0);    
    let hexes = center.range(8);
    for(var hex of hexes){
      this.add(new Tile(hex));
    }

    engine.addObject(this);
  }

  // add a tile into the map, using the tile's hex. if there is already a tile at that hex an error will be logged and the new tile will NOT be added
  add(tile){
    if(this.tiles[tile.hex.key]){
      console.error(`There is already a tile at hex ${tile.hex.logString}`);
    }
    else{
      this.tiles[tile.hex.key] = tile;
    }
  }

  // add a tile into the map, using the tile's hex. if there is already a tile at that hex it will be replaced
  addOrUpdate(tile){
    this.tiles[tile.hex.key] = tile;
  }

  // remove the tile at the given hex from the map. the removed tile will be returned (if there is one)
  remove(hex){
    let tile = this.tiles[hex.key];

    if(tile){
      delete this.tiles[hex.key];
    }

    return tile;
  }

  // return all hexes within range of startHex, but not going through blocked tiles
  floodRange(startHex, range){
    let visited = {}; // set of hexes, by key
    visited[startHex.key] = startHex;
    let fringes = [];
    fringes.push([startHex]);

    for(var k = 1; k <= range; k++){
      fringes.push([]);
      
      for(var hex of fringes[k-1]){
        for(var neighbor of hex.neighbors()){
          // not already visited, and it's on the map, and it's not blocked
          if(!visited[neighbor.key] && this.tiles[neighbor.key] && !this.tiles[neighbor.key].isBlocked){
            visited[neighbor.key] = neighbor;
            fringes[k].push(neighbor);
          }
        }
      }
    }

    return Object.values(visited);
  }

  onInput_leftClick(x, y, isButtonDown){
    if(isButtonDown) return false;

    let targetHex = this.hexLayout.pixelToHex(new Point(x, y)).round();
    let targetTile = this.tiles[targetHex.key];

    if(targetTile){
      targetTile.isBlocked = !targetTile.isBlocked;
      this.updateState();

      return true;
    }    
  }

  onInput_rightClick(x, y, isButtonDown){
    this.isDragging = isButtonDown;
    this.dragPoint = new Point(x, y);

    if(isButtonDown){
      this.originalDragPoint = new Point(x, y);
    }
    else{
      // if didn't drag more than 5 pixels, can treat this as a click event
      if(Math.max(Math.abs(this.dragPoint.x - this.originalDragPoint.x), Math.abs(this.dragPoint.y - this.originalDragPoint.y)) < 5){
        let targetHex = this.hexLayout.pixelToHex(new Point(x, y)).round();
        if(!this.tiles[targetHex.key].isBlocked) this.updateState(targetHex);

        return true;
      }
    }
  }

  // todo potentially throttle? seems plenty fast enough with simple tests but idk as things get more complicated
  // todo possible to bound the mouse to the canvas while dragging? - maybe not needed anymore with a bigger canvas size
  // todo bound the pan area so you can't go too far off the map
  onInput_mousemove(x, y){    
    if(!this.isDragging) return false;

    let current = new Point(x, y);
    let delta = current.subtract(this.dragPoint);

    this.hexLayout.origin = this.hexLayout.origin.add(delta);

    this.dragPoint = current;
    return true;
  }
  
  onInput_wheel(x, y, isScrollUp){    
    let changed = false;

    if(isScrollUp && this.zoom < this.zoomMax){
      this.zoom += this.zoomStep;
      changed = true;
    }
    else if(!isScrollUp && this.zoom > this.zoomMin){
      this.zoom -= this.zoomStep;
      changed = true;
    }

    if(changed){
      // get the current world location of the mouse
      let screenLocation = new Point(x, y);
      let targetWorldLocation = this.hexLayout.pixelToHex(screenLocation);

      // change the layout size (the zoom)
      this.hexLayout.size = new Point(this.zoom, this.zoom);

      // get the new screen location for the world location that was being targetted
      let newScreenLocation = this.hexLayout.hexToPixel(targetWorldLocation);
      let delta = screenLocation.subtract(newScreenLocation); // calculate how far away this new screen location is from the original

      this.hexLayout.origin = this.hexLayout.origin.add(delta); // shift the origin by that amount to keep the new screen location exactly where the old one was
    }

    return changed;
  }

  // based on the current size and offset, return the tiles that are actually even visible on the canvas. only these need to be drawn
  *getVisibleTiles(){
    // get the hex location of the top left and bottom right of the canvas, NOT ROUNDED, converted to offset which results in a fractional offset
    let topLeftOffset = this.hexLayout.hexToOffset(this.hexLayout.pixelToHex(new Point(0, 0)));
    let bottomRightOffset = this.hexLayout.hexToOffset(this.hexLayout.pixelToHex(new Point(engine.canvasWidth, engine.canvasHeight)));
    
    // floor the start and ceiling the end should guarantee no gaps around the edge of the draw area
    // does technically overdraw a little depending on exact location and orientation but should be good enough
    let startCol = Math.floor(topLeftOffset.col);
    let endCol = Math.ceil(bottomRightOffset.col);
    let startRow = Math.floor(topLeftOffset.row);
    let endRow = Math.ceil(bottomRightOffset.row);
    
    // now just a simple loop through the offset coordinates to get the hexes that are in the draw area, yield back each one that's actually part of the map
    for(let row = startRow; row <= endRow; row++){
      for(let col = startCol; col <= endCol; col++){
        let hex = this.hexLayout.offsetToHex(new Offset(col, row));
        let tile = this.tiles[hex.key];

        if(tile) yield tile;
      }
    }
  }

  updateState(centerHex){
    // reset everything. everything marked (type 1) becomes unmarked (type 0)
    // if centerHex is given, also unset the center (type 2), then set it to the passed centerHex
    for(var tile of Object.values(this.tiles)){
      if(tile.type == 1 || (centerHex && tile.type == 2)){
        tile.type = 0;
      }
    }
    if(centerHex){
      this.tiles[centerHex.key].type = 2;
    }

    // then compute and set whatever thing i want to draw
    let center = centerHex;

    if(!center){
      let centerTile = Object.values(this.tiles).find(t => t.type == 2);
      if(centerTile) center = centerTile.hex;
    }

    if(center){
      for(var hex of this.floodRange(center, 4)){
        if(!hex.equals(center)) this.tiles[hex.key].type = 1;
      }
    }
  }

  async draw(ctx){
    ctx.lineWidth = 3;
    ctx.strokeStyle = "black";    
    
    for(var tile of this.getVisibleTiles()){
      ctx.beginPath();
      
      if(tile.isBlocked){
        ctx.fillStyle = "red";
      }
      else{
        if(tile.type == 0){
          ctx.fillStyle = "blue";
        }
        else if(tile.type == 1){
          ctx.fillStyle = "green";
        }
        else if(tile.type == 2){
          ctx.fillStyle = "grey";
        }
        else{
          ctx.fillStyle = "black";
        }
      }

      let corners = this.hexLayout.hexCorners(tile.hex);
      ctx.moveTo(corners[5].x, corners[5].y);

      for(let i = 0; i < corners.length; i++){
        ctx.lineTo(corners[i].x, corners[i].y);
      }

      ctx.fill();
      ctx.stroke();   
    }
  }
}