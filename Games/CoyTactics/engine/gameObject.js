import {engine} from "./engine.js";

export class gameObject {
  id; // unique identifier, it's assigned by the engine in addObject
  drawMainLayer = ""; // set this to "none" to not draw. Other options are "background", "foreground" (the default), "interface"
  drawSubLayer = 0; // finer control over the draw order, objects within a main layer are then ordered by sub layer, ascending

  // draw(ctx) {}

  constructor(){    
    
  }
}