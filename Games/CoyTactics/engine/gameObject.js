import {engine} from "./engine.js";

export class GameObject {
  id; // unique identifier, it's assigned by the engine in addObject
  drawMainLayer = ""; // set this to "none" to not draw. Other options are "background", "foreground" (the default), "interface"
  drawSubLayer = 0; // finer control over the draw order, objects within a main layer are then ordered by sub layer, ascending
  isDisabled = false; // if set to true, this object will be skipped over for both draw and input calls

  // basic position and size properties. should use these when applicable as common utility functions will make use of them
  x = 0;
  y = 0;
  width = 0;
  height = 0;

  // image loading should happen in draw, being async
  // async draw(ctx) {}

  // input events should return true if state has changed and so a redraw is required
  // onInput_leftClick(x, y, isButtonDown)
  // onInput_rightClick(x, y, isButtonDown)
  // onInput_wheel(x, y, isScrollUp)
  // onInput_mousemove(x, y)

  constructor(){    
    
  }

  // returns true if the given x,y coordinate is within the bounds of this object, as defined by the object's x, y, width, height
  checkBounds(x, y){
    if(x < this.x
      || x > (this.x + this.width)
      || y < this.y
      || y > (this.y + this.width) )
    {
        return false;
    }
    return true;
  }
}