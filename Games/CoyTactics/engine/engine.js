class CoyEngine {
  canvasElement;
  ctx;  // 2d context of the canvas
  canvasWidth = window.innerWidth * 0.8;  // in pixels. 80% of window width
  canvasHeight = this.canvasWidth * 0.5625; // in pixels. 16:9 aspect ratio

  idCounter = 0;  // internal counter for game object IDs, each game object gets assigned the next one

  // all known game objects, with their capabilities
  // capabilities are an object with keys of the things to check and remove, either "draw" or any of the input handler keys
  objects = {};

  // all drawable game objects
  drawObjects = {
    "background": [],
    "foreground": [], // this will be the default for objects that have a draw method, but don't explicitly define a layer
    "interface": []
  }; 

  // all objects with an input handler
  inputObjects = {
    "leftClick": [],
    "rightClick": [],
    "wheel": [],
    "mousemove": []
  }

  // all loaded images, keyed by their path
  images = {};

  async #drawLayer(layer){
    for(const subLayer of this.drawObjects[layer]){
      if(!subLayer) continue;

      for(const obj of subLayer){
        try{
          if(obj.isDisabled) continue;

          await obj.draw(this.ctx);
        }
        catch(e){
          console.error("Could not find draw method", e);
        }
      }
    }
  }

  #getDrawList(obj){
    let mainLayer = obj.drawMainLayer || "foreground";
    let subLayer = obj.drawSubLayer || 0;

    let mainLayerList = this.drawObjects[mainLayer];

    if(mainLayerList){
      if(!mainLayerList[subLayer]) mainLayerList[subLayer] = [];
      return mainLayerList[subLayer];
    }
    else{
      console.error(`Unknown main layer ${mainLayer}`);
    }
  }

  // returns true if successfully added to a draw list
  #registerDraw(obj){
    if(obj.draw){
      let drawList = this.#getDrawList(obj);

      if(drawList){
        drawList.push(obj);
        return true;
      }
      else{
        console.error("Failed to find a draw list for object");
      }
    }  
  }

  #unregisterDraw(obj){
    let drawList = this.#getDrawList(obj);

    if(drawList){
      let index = drawList.findIndex(i => i.id == obj.id);

      if(index >= 0){
        drawList.splice(index, 1);
      }
      else{
        console.error(`Could not find object ${obj.id} in its draw list`);
      }
    }
    else{
      console.error(`Could not find draw list to remove object ${obj.id}`);
    }
  }

  #registerInput(obj){
    let handlers = [];

    for(const handler of Object.keys(this.inputObjects)){
      if(obj["onInput_" + handler]){
        handlers.push(handler);
        this.inputObjects[handler].push(obj);
      }
    }

    if(handlers.length > 0) return handlers;
  }

  #unregisterInput(obj, handler){
    let index = this.inputObjects[handler].findIndex(i => i.id == obj.id);

    if(index >= 0){
      this.inputObjects[handler].splice(index, 1);
    }
    else{
      console.error(`Could not find entry in ${handler} handler list for ${obj.id}`);
    }
  }

  #handleInput_click(evt, isMouseDown){
    let x = evt.offsetX;
    let y = evt.offsetY;

    let redraw = false;

    if(evt.button == 0){
      for(const obj of this.inputObjects["leftClick"]){
        if(obj.isDisabled) continue;

        redraw = obj["onInput_leftClick"](x, y, isMouseDown) || redraw;
      }
    }
    else if(evt.button == 2){
      for(const obj of this.inputObjects["rightClick"]){
        if(obj.isDisabled) continue;

        redraw = obj["onInput_rightClick"](x, y, isMouseDown) || redraw;
      }
    }

    if(redraw){
      this.draw();
    }

    evt.preventDefault();
    evt.stopPropagation();
  }

  #handleInput_wheel(evt){
    let x = evt.offsetX;
    let y = evt.offsetY;
    let isScrollUp = evt.deltaY < 0;

    let redraw = false;

    for(const obj of this.inputObjects["wheel"]){
      if(obj.isDisabled) continue;

      redraw = obj["onInput_wheel"](x, y, isScrollUp) || redraw;
    }

    if(redraw){
      this.draw();
    }

    evt.preventDefault();
    evt.stopPropagation();
  }

  #handleInput_mousemove(evt){
    let x = evt.offsetX;
    let y = evt.offsetY;

    let redraw = false;

    for(const obj of this.inputObjects["mousemove"]){
      if(obj.isDisabled) continue;
      
      redraw = obj["onInput_mousemove"](x, y) || redraw;
    }

    if(redraw){
      this.draw();
    }
  }

  // returns a promise to load the image
  #loadImage(path){
    return new Promise((resolve, reject)=> {
      let img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = path
    });
  }

  init(canvasId){
    this.canvasElement = document.getElementById(canvasId);
    this.ctx = this.canvasElement.getContext("2d");

    this.canvasElement.width = this.canvasWidth;
    this.canvasElement.height = this.canvasHeight;

    // input events
    this.canvasElement.addEventListener('mousedown', (evt) => { this.#handleInput_click(evt, true) });
    this.canvasElement.addEventListener('mouseup', (evt) => { this.#handleInput_click(evt, false) });
    this.canvasElement.addEventListener('mousemove', (evt) => { this.#handleInput_mousemove(evt) });
    this.canvasElement.addEventListener('wheel', (evt) => { this.#handleInput_wheel(evt) });

    // this is required to stop the context menu on firefox. other browsers might be different
    document.addEventListener('contextmenu', (evt) => { evt.preventDefault(); });
  }

  // add an object, engine will start tracking it. register draw and input calls, all that
  addObject(obj){
    obj.id = this.idCounter++;
    let capabilities = {};

    if(this.#registerDraw(obj)) capabilities["draw"] = true;

    let handlers = this.#registerInput(obj);
    if(handlers){
      for(const handler of handlers){
        capabilities[handler] = true;
      }
    }

    this.objects[obj.id] = capabilities;
  }

  // remove an object from the engine, clean up handlers, etc
  removeObject(obj){
    let capabilities = this.objects[obj.id];

    if(capabilities){
      if(capabilities["draw"]) this.#unregisterDraw(obj);
    }
    else{
      console.warn(`Attempt to remove unknown object ${obj.id}`);
    }

    let handlers = Object.keys(capabilities).filter(k => Object.keys(this.inputObjects).includes(k));
    for(const handler of handlers){
      this.#unregisterInput(obj, handler);
    }
    
    delete this.objects[obj.id];
  }

  // if necessary, load an image. image cache will be used so the load only happens once. then return the full image object
  // if image is a grid of sprites, just use loadSpriteGrid instead
  // this method is if the whole image is needed or image contains custom sized and placed sprites
  async loadImage(path){
    let img = this.images[path];
    if(!img){
      img = await this.#loadImage(path);
      this.images[path] = img;
    }

    return img;
  }

  // call loadImage
  // then cut the image into sprites of width x [height] (assumed to be square if no height given)
  // will only include a sprite if it's the full width x [height], so if the image is improperly sized the last row/column could be excluded
  // returns the list of bitmaps, in order from left to right, top to bottom
  // options are those passed into the createImageBitmap function
  async loadSpriteGrid(path, width, height, options){
    let img = await this.loadImage(path);
    let spriteHeight = height || width;

    let bitmaps = [];

    for(var y = 0; y < Math.trunc(img.height / spriteHeight); y++){
      for(var x = 0; x < Math.trunc(img.width / width); x++){
        bitmaps.push(await createImageBitmap(img, x * width, y * spriteHeight, width, spriteHeight, options));
      }
    }

    return bitmaps;
  }

  // draw every object in order of layer->sublayer->add order
  draw(){
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    this.#drawLayer("background")
    .then(() => this.#drawLayer("foreground"))
    .then(() => this.#drawLayer("interface"));
  }
}

export let engine = new CoyEngine();