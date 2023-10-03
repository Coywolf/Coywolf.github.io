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
		
		self.LeftClick = function(){
			if(self.IsMarked){
        self.IsMarked = false;
      }
      else if(!self.IsCrossed){
        self.IsMarked = true;
      }
		}
		
		self.RightClick = function(){
			if(self.IsCrossed){
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
  
  function drawCell(cell, skipDividers){
    var sx = 0;
    if(cell.IsCrossed) sx = 1;
    else if(cell.IsMarked) sx = 2;

    ctx.drawImage(imageObj, sx*spriteChunkSize, 0, spriteChunkSize, spriteChunkSize, cell.X*cellSize + cellsStartX, cell.Y*cellSize + cellsStartY, cellSize, cellSize);

    // have to redraw the dividers each time a cell is drawn, since the new image might have just overlapped a line. skipped on the initial draw
    if(!skipDividers) drawDividers(); 
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
  
  // initialize inputs
  var widthInputElement = document.getElementById("in_width");
  widthInputElement.value = width;

  var heightInputElement = document.getElementById("in_height");
  heightInputElement.value = height;

  var densityInputElement = document.getElementById("in_density");
  densityInputElement.value = density;
		
	imageObj.onload = function(){
		newGame();
		
		canvas.addEventListener('mouseup', function(evt){
			if(isGameOver) return;
			
			var rect = canvas.getBoundingClientRect();
			var mouseX = Math.floor((evt.clientX - rect.left - cellsStartX) / cellSize);
      var mouseY = Math.floor((evt.clientY - rect.top - cellsStartY) / cellSize);
      
      if(mouseX < 0 || mouseY < 0) return;
			
			var targetCell = cells[mouseX][mouseY];			
			if(evt.button == 0){
				targetCell.LeftClick(ctx, imageObj, cells);
				
				if(checkWin()){
					endGame(true);
				}
			}
			else if(evt.button == 2){
				targetCell.RightClick(ctx, imageObj, cells);
      }
      
      drawCell(targetCell);
		});
	};
	imageObj.src = "Games/Nonogram/n_sprite.png"
	
	document.getElementById("newgame").addEventListener('click', newGame);
})();