/* todo
click and drag for both clicks
save settings
*/

(function() {
	var CellModel = function(xInd, yInd){
		var self = this;
		
		self.X = xInd;
    self.Y = yInd;
    self.IsSolution = false;  // is this cell part of the solution?

    self.IsCrossed = false;
    self.IsMarked = false;
		
		self.LeftClick = function(isDragging){
			if(self.IsMarked && !isDragging){
        self.IsMarked = false;
      }
      else if(!self.IsCrossed){
        self.IsMarked = true;
      }
		}
		
		self.RightClick = function(isDragging){
			if(self.IsCrossed && !isDragging){
        self.IsCrossed = false;
      }
      else if(!self.IsMarked){
        self.IsCrossed = true;
      }
		}
	};

	function shuffle(a) {
		var j, x, i;
		for (i = a.length - 1; i > 0; i--) {
			j = Math.floor(Math.random() * (i + 1));
			x = a[i];
			a[i] = a[j];
			a[j] = x;
		}
	}
		
  var canvas = document.getElementById("nonogram-canvas");
	canvas.oncontextmenu = function (e) {
		e.preventDefault();
  };
  
  var canvasWidth = window.innerWidth * .85;
  var canvasHeight = window.innerHeight * .8;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  var ctx = canvas.getContext("2d");
  var imageObj = new Image();
  var spriteChunkSize = 64; // how big is each of the images on the sprite
  
  var numberSize = 48;  // size in pixels of each number, always square
  var cellSize = 0; // the size of each cell on the canvas, always square. calculated by drawBoard
  var cellsStartX = 0;  // the starting x coordinate of the cells on the canvas. calculated by drawBoard
  var cellsStartY = 0;  // the starting y coordinate of the cells on the canvas. calculated by drawBoard
  var minNumberHeight = 0;  // the minimum amount of height the vertical numbers need. calculated by drawBoard, used for drawDividers
  var minNumberWidth = 0; // the minimum amount of width the horizontal numbers need. calculated by drawBoard, used for drawDividers

  var width = 20;
	var height = 10;
	var density = .5;
	
  var cells = []; // two dimensional, [x][y]
  var hints = []; // list of lists. first width records are the x-dimension hints, drawn across the top, left to right. next height records are the y-dimension hints, drawn along the left, top to bottom
  var isGameOver = false;

  var buttonDown = -1;  // -1 is no button, 0 is left click, 2 is right click
  // start and end cell coordinates of the mouse, relative to the actual cell area
  var mouseStartX = null;
  var mouseStartY = null;
  var lastDelta;  // the deltas from the last mousemove event. used to determine if the drag line needs to be redrawn
  var dragLineWidth = .6; // percentage of cell size

  function drawDividers(){
    ctx.strokeStyle = "#6c94eb";
    ctx.lineWidth = 2;
    var vertLineCount = Math.trunc(width / 5) - 1;
    var horzLineCount = Math.trunc(height / 5) - 1;

    ctx.beginPath();

    for(var i = 0; i < vertLineCount; i++){
      ctx.moveTo(cellsStartX + (cellSize * 5 * (i+1)), cellsStartY - minNumberHeight);
      ctx.lineTo(cellsStartX + (cellSize * 5 * (i+1)), canvasHeight);
    }

    for(var i = 0; i < horzLineCount; i++){
      ctx.moveTo(cellsStartX - minNumberWidth, cellsStartY + (cellSize * 5 * (i+1)));
      ctx.lineTo(canvasWidth, cellsStartY + (cellSize * 5 * (i+1)));
    }

    ctx.stroke();
  }
  
  function drawCell(cell){
    var sx = 0;
    if(cell.IsCrossed) sx = 1;
    else if(cell.IsMarked) sx = 2;

    ctx.drawImage(imageObj, sx*spriteChunkSize, 0, spriteChunkSize, spriteChunkSize, cell.X*cellSize + cellsStartX, cell.Y*cellSize + cellsStartY, cellSize, cellSize);
  }

  function generateCells(){
    cells = [];		
    hints = [];

    // initialize cells
		for(var x = 0; x < width; x++){
			var column = [];
			for(var y = 0; y < height; y++){
				var cell = new CellModel(x, y);
				column.push(cell);
				drawCell(cell, true);
			}
			cells.push(column);
		}

    // copy a reference of each cell into a temp array
		var tempCells = [];		
		for(var x = 0; x < width; x++){
			for(var y = 0; y < height; y++){
				tempCells.push(cells[x][y]);
			}
		}
    
    // shuffle the temp array
		shuffle(tempCells);
    
    // mark the first (cell count * density) cells as part of the solution
    var solutionCount = Math.trunc(width * height * density);
		for(var i = 0; i < solutionCount; i++){
			tempCells[i].IsSolution = true;
    }
    
    // solution has been set, so build out the hint lists. columns first, then rows
    for(var x = 0; x < width; x++){
      var hintList = [];

      var hint = 0;
      for(var y = 0; y < height; y++){
        var cell = cells[x][y];
        if(cell.IsSolution){
          hint++;
        }
        else if(hint > 0){
          hintList.push(hint);
          hint = 0;
        }
      }

      if(hint > 0) hintList.push(hint);
      hints.push(hintList);
    }

    for(var y = 0; y < height; y++){
      var hintList = [];

      var hint = 0;
      for(var x = 0; x < width; x++){
        var cell = cells[x][y];
        if(cell.IsSolution){
          hint++;
        }
        else if(hint > 0){
          hintList.push(hint);
          hint = 0;
        }
      }

      if(hint > 0) hintList.push(hint);
      hints.push(hintList);
    }
  }

  function drawBoard(){
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    minNumberHeight = 0;
    minNumberWidth = 0;

    // figure out the minimum width/height of the number sections. they might be taller/wider than this but it's the starting point for figuring out the cell size
    for(var i = 0; i < width; i++){
      var hintSize = hints[i].length * numberSize;
      if(hintSize > minNumberHeight) minNumberHeight = hintSize;
    }
    for(var i = width; i < hints.length; i++){
      var hintSize = hints[i].length * numberSize;
      if(hintSize > minNumberWidth) minNumberWidth = hintSize;
    }

    // divide the remaining width/height by the cells in that dimension. The lesser of these will be the cell size
    var hCandidate = Math.trunc((canvasWidth - minNumberWidth) / width);
    var vCandidate = Math.trunc((canvasHeight - minNumberHeight) / height);
    cellSize = Math.min(hCandidate, vCandidate);

    // now work backwards, the cells will be square at this determined size, so the true number width/height is what's left
    cellsStartY = canvasHeight - (cellSize * height);
    cellsStartX = canvasWidth - (cellSize * width);
    
    // draw all the cells to initialize
    for(var x = 0; x < width; x++){
			for(var y = 0; y < height; y++){
				drawCell(cells[x][y]);
			}
    }
    
    // draw all the numbers. columns first, then the rows
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold " + Math.trunc(numberSize * .75) + "px sans-serif";
    
    for(var i = 0; i < width; i++){
      var hintRow = hints[i];      
      for(var n = 0; n < hintRow.length; n++){
        var hint = hintRow[hintRow.length - n - 1]; // the row will be in order from the outside in, so step through it in reverse
        ctx.fillText(hint, i * cellSize + cellsStartX + (cellSize / 2), cellsStartY - (n * numberSize) - (numberSize / 2));
      }
    }
    for(var i = width; i < hints.length; i++){
      var hintRow = hints[i];      
      for(var n = 0; n < hintRow.length; n++){
        var hint = hintRow[hintRow.length - n - 1]; // the row will be in order from the outside in, so step through it in reverse
        ctx.fillText(hint, cellsStartX - (n * numberSize) - (numberSize / 2), (i-width) * cellSize + cellsStartY + (cellSize / 2));
      }
    }

    // draw the dividers
    drawDividers();
  }
	
	function newGame(){		
    var widthInputElement = document.getElementById("in_width");
    width = widthInputElement.value;

    var heightInputElement = document.getElementById("in_height");
    height = heightInputElement.value;

    var densityInputElement = document.getElementById("in_density");
    density = densityInputElement.value;

		var endGameElement = document.getElementById("endgame");
    endGameElement.innerText = "";

    numberSize = 48 - ((48-24) * ((width * height) / (widthInputElement.max * heightInputElement.max)));
        
    generateCells();
    drawBoard();

    isGameOver = false;
	}			
	
	function endGame(){
		isGameOver = true;
		var endGameElement = document.getElementById("endgame");
		endGameElement.innerText = "Congratulations, you won!";
	}
	
	function checkWin(){
		for(var x = 0; x < width; x++){
			for(var y = 0; y < height; y++){
				var curCell = cells[x][y];
				if(curCell.IsSolution && !curCell.IsMarked){
					return false;
				}
			}
		}
		
		return true;
  }

  function clamp(number, min, max){
    return Math.min(Math.max(number, min), max);
  }

  function getCellCoordsFromMouse(x, y){
    var rect = canvas.getBoundingClientRect();
    var mouseX = Math.floor((x - rect.left - cellsStartX) / cellSize);
    var mouseY = Math.floor((y - rect.top - cellsStartY) / cellSize);

    return {
      x: mouseX,
      y: mouseY
    };
  }

  // get the change in x and y, for click and drag
  function getDeltaCoords(x, y){
    var cellCoords = getCellCoordsFromMouse(x, y);
    var deltaX = clamp(cellCoords.x, 0, width) - mouseStartX;
    var deltaY = clamp(cellCoords.y, 0, height) - mouseStartY;

    // determine which direction we're dragging. only orthogonal
    if(Math.abs(deltaX) >= Math.abs(deltaY)) deltaY = 0;
    else deltaX = 0;

    return {deltaX, deltaY};
  }
  
  // initialize inputs
  var widthInputElement = document.getElementById("in_width");
  widthInputElement.value = width;

  var heightInputElement = document.getElementById("in_height");
  heightInputElement.value = height;

  var densityInputElement = document.getElementById("in_density");
  densityInputElement.value = density;
		
	imageObj.onload = function(){
		newGame();

    canvas.addEventListener('mousedown', function(evt){
      if(isGameOver) return;
      if(evt.button != 0 && evt.button != 2) return;  // ignore anything but left and right click
      if(buttonDown >= 0) return; // if we're holding a button already, ignore any other mouse button

      var cellCoords = getCellCoordsFromMouse(evt.clientX, evt.clientY);
      if(cellCoords.x < 0 || cellCoords.y < 0) return;

      buttonDown = evt.button;
      mouseStartX = cellCoords.x;
      mouseStartY = cellCoords.y;
    });
		
		canvas.addEventListener('mouseup', function(evt){
			if(isGameOver) return;
      if(buttonDown != evt.button) return;  // if we're holding a button already, ignore any other mouse button
      buttonDown = -1;
      lastDelta = null;
			
			var delta = getDeltaCoords(evt.clientX, evt.clientY);
      var dirX = delta.deltaX < 0 ? -1 : 1;
      var dirY = delta.deltaY < 0 ? -1 : 1;

      var isDragging = delta.deltaX != 0 || delta.deltaY != 0;

      for(var dx = 0; dx <= Math.abs(delta.deltaX); dx++){
        for(var dy = 0; dy <= Math.abs(delta.deltaY); dy++){
          var targetCell = cells[mouseStartX + (dx * dirX)][mouseStartY + (dy * dirY)];

          if(evt.button == 0) targetCell.LeftClick(isDragging);
          else targetCell.RightClick(isDragging);
        }
      }

      drawBoard();

      if(evt.button == 0){
        if(checkWin()){
          endGame(true);
        }
      }
		});

    
    canvas.addEventListener('mousemove', function(evt){
      if(isGameOver) return;
      if(buttonDown == -1) return;  // only drawing the drag line if we're holding a button

      var delta = getDeltaCoords(evt.clientX, evt.clientY);
      if(lastDelta && lastDelta.deltaX == delta.deltaX && lastDelta.deltaY == delta.deltaY) return; // the delta hasn't changed, so no need to redraw the line
      lastDelta = delta;

      drawBoard();

      if(delta.deltaX == 0 && delta.deltaY == 0) return;  // delta is 0 both ways, no need to draw a line

      ctx.strokeStyle = buttonDown == 2 ? "#a16868" : "#607491";
      ctx.lineWidth = cellSize * dragLineWidth;

      ctx.beginPath();
      var startX = (mouseStartX * cellSize) + cellsStartX;
      var startY = (mouseStartY * cellSize) + cellsStartY;
      var endX = ((mouseStartX + delta.deltaX) * cellSize) + cellsStartX;
      var endY = ((mouseStartY + delta.deltaY) * cellSize) + cellsStartY;
      var textX, textY;

      dragLineOffset = dragLineWidth + (dragLineWidth / 3);

      if(delta.deltaX != 0){
        startY += cellSize / 2;
        endY += cellSize / 2;

        if(delta.deltaX > 0){
          startX += cellSize * (1-dragLineOffset);
          endX += cellSize * dragLineOffset;
        }
        else{
          startX += cellSize * dragLineOffset;
          endX += cellSize * (1-dragLineOffset);
        }

        textX = startX + ((endX - startX) / 2);
        textY = startY;
      }
      else{
        startX += cellSize / 2;
        endX += cellSize / 2;

        if(delta.deltaY > 0){
          startY += cellSize * (1-dragLineOffset);
          endY += cellSize * dragLineOffset;
        }
        else{
          startY += cellSize * dragLineOffset;
          endY += cellSize * (1-dragLineOffset);
        }

        textX = startX;
        textY = startY + ((endY - startY) / 2);
      }

      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold " + Math.trunc(cellSize * .4) + "px sans-serif";
      ctx.fillText(Math.max(Math.abs(delta.deltaX), Math.abs(delta.deltaY)) + 1, textX, textY);
    });

    canvas.addEventListener('mouseleave', function(evt){
      buttonDown = -1;
    });
	};
	imageObj.src = "Games/Nonogram/n_sprite.png"
	
	document.getElementById("newgame").addEventListener('click', newGame);
})();