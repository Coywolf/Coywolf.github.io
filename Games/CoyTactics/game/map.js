import { engine } from "../engine/engine.js";
import { gameObject } from "../engine/gameObject.js";
import { HexLayout, Hex, Point, Offset} from "../engine/hexGrid.js";

// still kinda undecided on if this actually extends hex or just has a hex. not sure it matters much
// but this class will have all of the properties held on a particular hex in the game. type of terain, pointer to a unit, etc
export class Tile {
  hex;  // the hex this tile should represent

  type;

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
  dragPoint;  // Point of the last mouse move event, used to track the amount of change with each event for updating the layout offset

  // store all the tiles that are part of the map. Each is keyed by "q,r", the value is a Tile
  tiles = {};

  constructor(){
    super();

    this.hexLayout = new HexLayout(HexLayout.pointy, new Point(this.zoom, this.zoom), new Point(400, 300));

    let center = new Hex(0,0);
    this.tiles[center.key] = new Tile(center);
    
    let hexes = center.range(8);
    for(var hex of hexes){
      this.tiles[hex.key] = new Tile(hex);
    }

    engine.addObject(this);
  }

  onInput_leftClick(x, y, isButtonDown){
    if(isButtonDown) return false;

    let targetHex = this.hexLayout.pixelToHex(new Point(x, y)).round();
    let targetTile = this.tiles[targetHex.key];

    if(targetTile){
      targetTile.type = (targetTile.type + 1) % 3;

      return true;
    }    
  }

  onInput_rightClick(x, y, isButtonDown){
    this.isDragging = isButtonDown;
    this.dragPoint = new Point(x, y);
  }

  // todo potentially throttle? seems plenty fast enough with simple tests but idk as things get more complicated
  // todo possible to bound the mouse to the canvas while dragging?
  // todo bound the pan area so you can't go too far off the map
  onInput_mousemove(x, y){    
    if(!this.isDragging) return false;

    let current = new Point(x, y);
    let delta = current.subtract(this.dragPoint);

    this.hexLayout.origin = this.hexLayout.origin.add(delta);

    this.dragPoint = current;
    return true;
  }

  // todo offset should shift based on the x,y of the event, to make it feel like you're zooming in to/out of that spot
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
      this.hexLayout.size = new Point(this.zoom, this.zoom);
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

  async draw(ctx){
    ctx.lineWidth = 3;
    ctx.strokeStyle = "black";    
    
    for(var tile of this.getVisibleTiles()){
      ctx.beginPath();
      
      if(tile.type == 0){
        ctx.fillStyle = "blue";
      }
      else if(tile.type == 1){
        ctx.fillStyle = "green";
      }
      else{
        ctx.fillStyle = "red";
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