import { engine } from "./engine/engine.js";
import { gameObject } from "./engine/gameObject.js";

class testObject extends gameObject{
  constructor(){
    super();
    
    engine.addObject(this);
  }

  draw(ctx){
    ctx.fillStyle = "blue";
    ctx.fillRect(50,50,200,200);
  }
}

class testObject2 extends gameObject{
  drawMainLayer = "background";

  constructor(){
    super();

    engine.addObject(this);
  }

  draw(ctx){
    ctx.fillStyle = "red";
    ctx.fillRect(100,100,200,200);
  }
}

engine.init("coytactics-canvas");

let testObj = new testObject();
let testObj2 = new testObject2();

engine.draw();