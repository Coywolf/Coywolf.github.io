import { engine } from "../engine";
import { GameObject } from "../gameObject";

export class Panel extends GameObject{
  constructor(){
    if(this.constructor == Panel){
      throw new Error("Class 'Panel' cannot be instantiated.");
    }
    super();

    // panels aren't likely to need input themselves, but will need to be able to draw for like background and borders and such
    // not registering as a game object in this class because Panel isn't intended to be used directly
  }
}