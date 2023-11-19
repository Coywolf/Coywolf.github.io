import { engine } from "../../engine/engine";
import { GameObject } from "../../engine/gameObject";

export class MessageBox extends GameObject{
  constructor(){
    super();

    engine.addObject(this);
  }
}