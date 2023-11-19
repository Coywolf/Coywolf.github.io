import { engine } from "../engine/engine.js";
import { Map } from "./map.js";
import { Interface } from "./ui/interface.js";

export class Battle{
  map;
  interface;

  constructor(){
    this.map = new Map();
    this.interface = new Interface(engine.canvasWidth - this.map.width);
  }
}