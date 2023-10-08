import { engine } from "./engine/engine.js";
import { gameObject } from "./engine/gameObject.js";

// debugging
window.coytactics = {
  "engine": engine
};

class testObject extends gameObject{
  mouseDown = false;
  rightClick = false;

  constructor(){
    super();
    
    engine.addObject(this);
  }

  draw(ctx){
    if(this.rightClick){
      if(this.mouseDown){
        ctx.fillStyle = "#450852";
      }
      else{
        ctx.fillStyle = "#c410e8";
      }
    }
    else{
      if(this.mouseDown){
        ctx.fillStyle = "#0c451b";
      }
      else{
        ctx.fillStyle = "#1fdb51";
      }
    }

    ctx.fillRect(50,50,200,200);
  }

  onInput_leftClick(x, y, isMouseDown){
    this.mouseDown = isMouseDown;
    this.rightClick = false;

    return true;
  }

  onInput_rightClick(x, y, isMouseDown){
    this.mouseDown = isMouseDown;
    this.rightClick = true;

    engine.removeObject(this);

    return true;
  }
}

engine.init("coytactics-canvas");

let testObj = new testObject();

engine.draw();