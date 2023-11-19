import { GameObject } from "../gameObject";

export class Button extends GameObject{
  constructor(){
    super();

    engine.addObject(this);
  }
}