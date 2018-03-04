(function() {
	var CellModel = function(xInd, yInd){
		var self = this;
		
		self.X = xInd;
		self.Y = yInd;
		self.IsMine = false;
		self.IsFlagged = false;
		self.IsFlipped = false;
		self.AdjacentMineCount = 0;
		
		self.Draw = function(ctx, img){
			var cellSize = 32;
			var sx = 0;
			var sy = 0;
			
			if(self.IsFlagged){
				sx = 0;
				sy = 1;
			}
			else if(self.IsFlipped){
				if(self.IsMine){
					sx = 0;
					sy = 2;
				}
				else if(self.AdjacentMineCount == 0){
					sx = 3;
					sy = 2;
				}
				else{
					var tempMineCount = self.AdjacentMineCount - 1;
					sx = (tempMineCount % 3) + 1;
					sy = Math.floor(tempMineCount / 3);
				}
			}
			
			ctx.drawImage(img, sx*cellSize, sy*cellSize, cellSize, cellSize, self.X*cellSize, self.Y*cellSize, cellSize, cellSize);
		}
		
		self.LeftClick = function(ctx, img, cells){
			if(!self.IsFlagged && !self.IsFlipped){
				self.IsFlipped = true;
				self.Draw(ctx, img);
				
				if(self.AdjacentMineCount == 0){
					for(var x = self.X-1; x <= self.X+1; x++){
						for(var y = self.Y-1; y <= self.Y+1; y++){
							if(x >= 0 && x < width && y >= 0 && y < height){
								cells[x][y].LeftClick(ctx, img, cells);
							}
						}
					}
				}
			}
		}
		
		self.RightClick = function(ctx, img, cells){
			if(!self.IsFlipped){
				self.IsFlagged = !self.IsFlagged;
				self.Draw(ctx, img);
			}
			else{
				var adjacentFlags = 0;
				for(var x = self.X-1; x <= self.X+1; x++){
					for(var y = self.Y-1; y <= self.Y+1; y++){
						if(x >= 0 && x < width && y >= 0 && y < height){
							if(cells[x][y].IsFlagged){ adjacentFlags += 1; } 
						}
					}
				}
				
				if(adjacentFlags == self.AdjacentMineCount){
					for(var x = self.X-1; x <= self.X+1; x++){
						for(var y = self.Y-1; y <= self.Y+1; y++){
							if(x >= 0 && x < width && y >= 0 && y < height){
								cells[x][y].LeftClick(ctx, img, cells);
							}
						}
					}
				}
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
		
    var canvas = document.getElementById("minesweeper-canvas");
	canvas.oncontextmenu = function (e) {
		e.preventDefault();
	};

    var ctx = canvas.getContext("2d");
	var imageObj = new Image();

    var width = 25;
	var height = 15;
	var mineCount = 80;
	var flaggedCount = 0;
	
	var cells = [];
	var minesInitialized = false;
	var isGameOver = false;
	
	function updateFlaggedCount(){
		var minecountElement = document.getElementById("minecount");
		minecountElement.innerText = "Mines Remaining: " + (mineCount - flaggedCount);
	}
	
	function newGame(){
		// reset stuff
		cells = [];
		flaggedCount = 0;
		minesInitialized = false;
		isGameOver = false;
		
		var endGameElement = document.getElementById("endgame");
		endGameElement.innerText = "";
		
		// initialize cells
		for(var x = 0; x < width; x++){
			var column = [];
			for(var y = 0; y < height; y++){
				var cell = new CellModel(x, y);
				column.push(cell);
				cell.Draw(ctx, imageObj);
			}
			cells.push(column);
		}
		
		updateFlaggedCount();
	}			
	
	function endGame(win){
		isGameOver = true;
		var endGameElement = document.getElementById("endgame");
		endGameElement.innerText = win ? "Congratulations, you won!" : "Sorry, you lost. Try again!";
	}
	
	function checkWin(){
		for(var x = 0; x < width; x++){
			for(var y = 0; y < height; y++){
				var curCell = cells[x][y];
				if(!curCell.IsFlipped && !curCell.IsFlagged){
					return false;
				}
			}
		}
		
		return true;
	}
	
	// initialize mines, but filtering out the clicked cells and all cells around it
	// this guarantees the first click to be an area clear
	function initializeMines(targetX, targetY){
		var tempCells = [];
		
		for(var x = 0; x < width; x++){
			for(var y = 0; y < height; y++){
				if(x >= targetX-1 && x <= targetX+1 && y >= targetY-1 && y <= targetY+1){
					continue;
				}
				tempCells.push(cells[x][y]);
			}
		}
		
		shuffle(tempCells);
		
		for(var i = 0; i < mineCount; i++){
			tempCells[i].IsMine = true;
			
			for(var x = tempCells[i].X-1; x <= tempCells[i].X+1; x++){
				for(var y = tempCells[i].Y-1; y <= tempCells[i].Y+1; y++){
					if(x >= 0 && x < width && y >= 0 && y < height){
						cells[x][y].AdjacentMineCount += 1;
					}
				}
			}
		}
		
		minesInitialized = true;
	}
	
	imageObj.onload = function(){
		newGame();
		
		canvas.addEventListener('mouseup', function(evt){
			if(isGameOver){ return; }
			
			var rect = canvas.getBoundingClientRect();
			var mouseX = Math.floor((evt.clientX - rect.left) / 32);
			var mouseY = Math.floor((evt.clientY - rect.top) / 32);
			
			var targetCell = cells[mouseX][mouseY];
			
			if(evt.button == 0){
				if(!minesInitialized){
					initializeMines(mouseX, mouseY);							
				}
				targetCell.LeftClick(ctx, imageObj, cells);
				
				if(targetCell.IsMine){
					endGame(false);
				}
				else if(checkWin()){
					endGame(true);
				}
			}
			else if(evt.button == 2){
				var wasFlagged = targetCell.IsFlagged;
				targetCell.RightClick(ctx, imageObj, cells);
				
				if(wasFlagged != targetCell.IsFlagged){
					if(wasFlagged){ flaggedCount--; }
					else{ flaggedCount++; }
					updateFlaggedCount();
				}
				
				if(checkWin()){
					endGame(true);
				}
			}
		});
	};
	imageObj.src = "Games/Minesweeper/MS_Sprite.png"
	
	document.getElementById("newgame").addEventListener('click', newGame);
})();