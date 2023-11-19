import { engine } from "./engine/engine.js";
import { PriorityQueueTests } from "./engine/priorityQueue.js";
import { Battle } from "./game/battle.js";

// debugging
window.coytactics = {
  "engine": engine
};

class Main{
  battle;

  constructor(){
    engine.init("coytactics-canvas");

    this.battle = new Battle();

    engine.draw();
  }
}

let main = new Main();

//PriorityQueueTests.TestAll();
