import { engine } from "./engine/engine.js";
import { gameObject } from "./engine/gameObject.js";
import { PriorityQueueTests } from "./engine/priorityQueue.js";
import { Map } from "./game/map.js";

// debugging
window.coytactics = {
  "engine": engine
};

class testObject extends gameObject{
  bitmaps;
  offset = 0;

  constructor(){
    super();
    
    engine.addObject(this);
  }

  async draw(ctx){
    if(!this.bitmaps){
      this.bitmaps = await engine.loadSpriteGrid("Games/Minesweeper/MS_Sprite.png", 32);
    }

    for(var i = 0; i < this.bitmaps.length; i++){
      ctx.drawImage(this.bitmaps[i], i*32, this.offset);
    }
  }

  onInput_leftClick(x, y, isMouseDown){
    this.offset += 32;

    return true;
  }
}

engine.init("coytactics-canvas");

//let testObj = new testObject();
let map = new Map();

engine.draw();

//PriorityQueueTests.TestAll();
