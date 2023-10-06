class CoyEngine {
  canvasElement;
  ctx;  // 2d context of the canvas
  canvasWidth = 800;  // in pixels
  canvasHeight = 600; // in pixels

  idCounter = 0;  // internal counter for game object IDs, each game object gets assigned the next one

  // all known game objects, organized by draw layer
  objects = {
    "none": [], // objects that don't need to be drawn
    "background": [],
    "foreground": [], // this will be the default for objects that have a draw method, but don't explicitly define a layer
    "interface": []
  }; 

  init(canvasId){
    this.canvasElement = document.getElementById(canvasId);
    this.ctx = this.canvasElement.getContext("2d");

    this.canvasElement.width = this.canvasWidth;
    this.canvasElement.height = this.canvasHeight;
  }

  // add an object, engine will start tracking it. register draw and input calls, all that
  addObject(obj){
    obj.id = this.idCounter++;
    
    if(obj.draw){
      let mainLayer = obj.drawMainLayer || "foreground";
      let subLayer = obj.drawSubLayer || 0;

      if(!this.objects[mainLayer][subLayer]) this.objects[mainLayer][subLayer] = [];
      this.objects[mainLayer][subLayer].push(obj);
    }
    else{
      if(!this.objects.none[0]) this.objects.none[0] = [];
      this.objects.none[0].push(obj);
    }
  }

  // remove an object from the engine, clean up handlers, etc
  removeObject(obj){
    
  }

  drawLayer(layer){
    for(const subLayer of this.objects[layer]){
      if(!subLayer) continue;

      for(const obj of subLayer){
        obj.draw(this.ctx);
      }
    }
  }

  // draw every object in order of layer->sublayer->add order
  draw(){
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    this.drawLayer("background");
    this.drawLayer("foreground");
    this.drawLayer("interface");
  }
}

export let engine = new CoyEngine();