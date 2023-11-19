import { engine } from "../../engine/engine";
import { Panel } from "../../engine/ui/panel";
import { Button } from "../../engine/ui/button";

// just a testing/dev/debug thing
export class TestPanel extends Panel{
  constructor(){
    super();

    engine.addObject(this);
  }
}