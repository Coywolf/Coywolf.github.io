import { engine } from "../../engine/engine";
import { Panel } from "../../engine/ui/panel";
import { Button } from "../../engine/ui/button";

export class UnitPanel extends Panel{
  constructor(){
    super();

    engine.addObject(this);
  }
}