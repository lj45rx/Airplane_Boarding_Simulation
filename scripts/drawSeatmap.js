let WIDTH_FACTOR = 1.25 // seat height is 1, seat width might be wider

//TODO put colors here?
//const C_PLANE_BORDER = "black"
//const C_PLANE_FLOOR = "gray"

// TODO unused
// use as central point for all dimensions
// or remove
class Sizes{
	constructor(){
		this.canvasW;
		this.canvasH;

		this.seatW;
		this.seatH;

		this.figureRadius;
		
	}
}

class Segment{
	constructor(numRows, descString, colNum, rowNum){
		//console.log(descString, numRows);
		//console.log(descString.split("-"), numRows);
		
		this.rows = numRows;
		this.layoutString = descString;
		this.firstRowNum = rowNum;
		this.firstRowCol = colNum;
		
		this.seatsPerRow = 0;	// how many are used
		this.maxSeatsPerRow = 0; //how many could fit if fully used
		this.seatLetters = Array();
		this.spaceLayout = Array(); // eg [3,3] even if not all seats exist
		
		// layout 
		let layoutSplit = descString.split("-");
		
		for(let i = 0; i < layoutSplit.length; i++){
			let split = layoutSplit[i];
			
			//console.log(split);
			
			this.spaceLayout.push(split.length)
			
			for(let j = 0; j < split.length; j++){
				let letter = split[j];
				
				this.seatLetters.push(letter)
				//console.log(letter)
				
				// seat only exists if letter is not undescore
				if(letter !== "_"){
					this.seatsPerRow++;
				}
			}
		}
		
		this.maxSeatsPerRow = this.seatLetters.length;
		
		//console.log("c", this.firstRowCol, "r", this.firstRowNum, "l", this.rows);
		//console.log(this.spaceLayout, this.seatsPerRow);
		
		this.x;
		this.y = Array();
	}
	
	findPositions(horPadding, verticalBounds, seatH, seatW){
		this.x = horPadding + seatW*this.firstRowCol;
		
		//arrange variable number of seats in fixed area
		for(let i = 0; i < this.spaceLayout.length; i++){
			let seatsBeforeAisle = this.spaceLayout[i];
			
			let height = verticalBounds[i].bottom - verticalBounds[i].top
			let padding = height - seatsBeforeAisle * seatH; // height not "filled"
			padding = padding / (seatsBeforeAisle+1)
			
			
			let tmpY = verticalBounds[i].top + padding;
			
			//console.log("h", height, "p", padding, tmpY)
			
			for(let j = 0; j < seatsBeforeAisle; j++){
				this.y.push(tmpY)
				tmpY += (padding + seatH)
			}
		}
		
		//reverse to have A,B,C from bottom up
		this.y = this.y.reverse()
	}
}

class Rect{
	constructor(x,y,w,h){
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;

		this.center = {x: x+w/2, y: y+h/2};
	}
}

class SeatDesc{
	constructor(row, letter, positionRect, font, isFirstInRow){
		this.rowNumber = row;
		this.letter = letter;
		this.code = row + letter;

		this.positionRect = positionRect;
		this.font = font;
		//this.aisleNumber = aisleNumber;
		
		
		this.isFirstRowInSegment = isFirstInRow;
		this.isWindowSeat = false;
		this.isAisleSeat = false;
	}

	draw(ctx){
		var tx = this.positionRect.x;
		var ty = this.positionRect.y;
		var tw = this.positionRect.w;
		var th = this.positionRect.h;

		ctx.fillStyle = "gray";
		ctx.fillRect(tx,ty,tw,th);
		
		//draw second smaller square over first
		ctx.fillStyle = "darkgray";
		let offs = tw-th
		ctx.fillRect(tx+1,ty+1,tw-2-offs,th-2);
		
		// if first row in column write letters
		if(this.isFirstRowInSegment){
			//this.drawTextInRect(ctx,tx,ty,tw,th, letter, font, false, "white")
			drawTextInRect(ctx,tx+1,ty+1,tw-2-offs,th-2, this.letter, this.font, false, "white")
		}
	}
}

class Seatmap{
	constructor(seatmap, width, height){
		this.seatmap = seatmap;
		this.width = width;
		this.height = height;

		// TODO unused
		// idea was to show error message in draw()
		// use or delete (here and in draw())
		this.error = ""; 

		// settings
		this.horPaddingRowCnt = 2; // total 2 for 1 per side
		// settings end
		
		this.segments = Array();
		this.exitCols = Array();
		this.noRows = 0;
		this.noExits = 0;
		this.#loadSegments();
		
		this.noAisles;
		this.maxSeatsPerRow;
		this.densestAisleLayout;
		this.#findDensestLayout()
		
		console.log("densest", this.densestAisleLayout, this.noAisles)
		
		this.seatW = 0;
		this.seatH = 0;
		this.verticalBounds;
		this.planeBorderRect;
		this.aisleYValues = Array();
		this.exitXValues = Array();
		this.#findSizes();
		
		this.initialized = false;

		// different containers holding seatDescs 
		this.noSeats = 0;
		
		this.seatDescs = Array()
		this.seatNumbers = new Set()
		this.seatsDescsByRow = Array();

		this.mapSeatCodeToIndex = {};

		// create buffer canvas - draw individual elements once, then copy from buffer
		// init in first draw
		this.bufferCanvas = null;
        this.bufCtx = null;
		
		
		//TODO unused
		this.left = 0;
		this.right = width;
		this.top = 0;
		this.bottom = height;
		

	}
	
	#loadSegments(){
		this.noExits = 0;
		let colNum = 0; //count rows and exits
		let rowNum = 0; //count rows only
		for(let i = 0; i < this.seatmap.length; i++){
			let segStr = this.seatmap[i][1]
			let segRows = this.seatmap[i][0]
			
			if( ["ex", "eex"].includes(segStr) ){
				//console.log("dajsdkash", segStr)
				this.exitCols.push(colNum);
				this.noExits++;
			} else {
				this.segments.push(new Segment(segRows, segStr, colNum, rowNum))
				rowNum += segRows;
			}
			
			//new Segment(map[i][0], map[i][1]);
			colNum += segRows;
		}
		this.noRows = colNum - this.noExits;
		
		console.log("total rows and exits", colNum);
	}
	
	#findDensestLayout(){
		//check all segments have same number of aisles
		//find densenst layout (for aisle y-value)
		
		this.noAisles = this.segments[0].spaceLayout.length-1;
		this.densestAisleLayout = structuredClone(this.segments[0].spaceLayout);
		
		for(let s = 1; s < this.segments.length; s++){
			let segLayout = this.segments[s].spaceLayout;
			
			//error is differenc aisleCnt in segment
			if(0 < s && segLayout.length-1 != this.noAisles){
				// set error val; set variable; will show error in draw
				console.error("ERROR: number of aisles dont match");
				this.error = "number of aisles in given map do not match";
				return false;
			}
			
			// densest layout 
			for(let i = 0; i <= this.noAisles; i++){
				if(this.densestAisleLayout[i] < segLayout[i]){
					this.densestAisleLayout[i] = segLayout[i];
				}
			}
		}
		
		this.maxSeatsPerRow = 0;
		for(let i = 0; i < this.densestAisleLayout.length; i++){
			this.maxSeatsPerRow += this.densestAisleLayout[i];
		}
	}
	
	#findBestSeatSize(){
		// find size to fill screen, assuming every seat gets a square
		console.log("rows", this.noRows, "exits", this.noExits)
		console.log("max seats", this.maxSeatsPerRow, "asiles", this.noAisles)
		
		let cols = this.noRows + this.noExits+this.horPaddingRowCnt;
		let rows = this.maxSeatsPerRow + this.noAisles;
		rows += 3; // 2 on top 1 on the bottom
		
		let sizeFromWidth = this.width / (WIDTH_FACTOR*(cols));
		let sizeFromHeight = this.height / rows;
		
		this.seatH = Math.min(sizeFromHeight, sizeFromWidth)
		this.seatW = this.seatH*WIDTH_FACTOR

		console.log("w", sizeFromWidth, "h", sizeFromHeight)
		console.log(this.seatW, this.seatH)
	}
	
	#findVertivalBounds(){		
		let yTop = 2*this.seatH;
		let yBottom = 0;
		this.verticalBounds = Array()
		for(let i = 0; i <= this.noAisles; i++){
			yBottom = yTop + this.densestAisleLayout[i]*this.seatH
			
			// center of aisle in the middle
			if(i < this.noAisles){
				this.aisleYValues.push(yBottom+this.seatH/2)
			}
			
			this.verticalBounds.push( {top:yTop, bottom:yBottom} )
			
			yTop = yBottom+this.seatH; // skip 1seat height for aisle
		}
	}
	
	#findPlaneBorderSize(horPadding){
		var x = horPadding;
		var y = this.verticalBounds[0].top;
		
		var w = this.width-2*horPadding;
		var h = this.verticalBounds[ this.verticalBounds.length-1 ].bottom - y;
		
		this.planeBorderRect = new Rect(x,y,w,h);
		
		console.log(this.planeBorderRect)
		console.log(this.verticalBounds)
	}
	
	#findSizes(){
		// seat sizes (->seat x-values)
		this.#findBestSeatSize()
		
		// aisle y-positions 
		this.#findVertivalBounds()
		
		// find offset in x (how far to the middle if width not fully used)
		let horPadding = this.width - this.seatW*( this.noRows + this.noExits )
		horPadding /= 2;
		
		this.#findPlaneBorderSize(horPadding);
		
		// exitRow x values
		for(let i = 0; i < this.noExits; i++){
			let x = horPadding + (this.exitCols[i] + 0.5)*this.seatW;
			this.exitXValues.push(x)
		}
		
		console.log("hor pad", horPadding)
		
		console.log(horPadding, this.width-horPadding)
		
		// seat y-values from aisle positions
		for(let s = 0; s < this.segments.length; s++){
			//console.log("seg", s)
			this.segments[s].findPositions(horPadding, this.verticalBounds, this.seatH, this.seatW)
		}
	}

	#initializeSeatsDescs(ctx){
		let font = findMaxFontSizeFromWidth(ctx, this.seatW-2);
		for(let s = 0; s < this.segments.length; s++){
			let seg = this.segments[s]	
			for(let r = 0; r < seg.rows; r++){
				let seatsDescsCurrentRow = Array();

				let x = seg.x + this.seatW*r;
				let rowNum = 1+seg.firstRowNum+r;
				
				for(let i = 0; i < seg.maxSeatsPerRow; i++){
					let letter = seg.seatLetters[i]
					if(letter == "_") continue; // skip "empty" positions

					let fullSeatNumber = rowNum + letter;
					
					var tx = x;
					var ty = seg.y[i]+1;
					var tw = this.seatW-2;
					var th = this.seatH-2;

					let isFirstInSegment = r==0;

					this.seatNumbers.add(fullSeatNumber)
					let seatRect = new Rect(tx,ty,tw,th)
					
					let desc = new SeatDesc(rowNum, letter, seatRect, font, isFirstInSegment);
					this.seatDescs.push(desc);
					
					// add to code->idx map
					let arrayPos = this.seatDescs.length-1
					this.mapSeatCodeToIndex[desc.code] = arrayPos;

					// add to array by row
					seatsDescsCurrentRow.push(desc);
				}
				this.seatsDescsByRow.push(seatsDescsCurrentRow);
			}
		}
	}
	
	#drawPlaneOuterFrame(ctx){
		var borderX = this.seatW/4;
		var borderY = this.seatH/4;
		ctx.fillStyle = "black"
		ctx.fillRect(this.planeBorderRect.x - borderX,
						this.planeBorderRect.y - borderY,
						this.planeBorderRect.w + 2*borderX,
						this.planeBorderRect.h + 2*borderY);
					
		
		ctx.fillStyle = "#cccccc"		
		ctx.fillRect(this.planeBorderRect.x,this.planeBorderRect.y,
						this.planeBorderRect.w,this.planeBorderRect.h);
	}

	#drawAisles(ctx){
		ctx.strokeStyle = "blue";
		for(let i = 0; i < this.noAisles; i++){
			ctx.lineWidth = 1;
			var tx = this.planeBorderRect.x + this.seatW/2;
			var ty = this.aisleYValues[i];
			var tw = this.planeBorderRect.w - this.seatW;
			var th = 0;
			ctx.strokeRect(tx, ty, tw, th);
		}
	}

	#drawExits(ctx){
		ctx.strokeStyle = "green";
		for(let i = 0; i < this.noExits; i++){
			var tx = this.exitXValues[i]
			var ty = this.planeBorderRect.y;
			var tw = 0;
			var th = this.planeBorderRect.h;
			ctx.strokeRect(tx, ty, tw, th);
		}
	}

	#drawRowNumbers(ctx){
		let font = findMaxFontSizeFromWidth(ctx, this.seatW-2);
		for(let segIdx = 0; segIdx < this.segments.length; segIdx++){
			for(let rowIdx = 0; rowIdx < this.segments[segIdx].rows; rowIdx++){
				let x = this.segments[segIdx].x + this.seatW*rowIdx;
				let rowNum = 1+this.segments[segIdx].firstRowNum+rowIdx;
				
				drawTextInRect(ctx,x,this.seatH/2, this.seatW-2, this.seatH-2, 
								rowNum, font, true, "black", "lightblue");
			}
		}
	}

	#drawInitial(){
		// fill background 
		this.bufCtx.fillStyle = "#444444";
		this.bufCtx.fillRect(0, 0, this.right, this.bottom)
		
		// airplane "frame"
		this.#drawPlaneOuterFrame(this.bufCtx);
		
		// draw row numbers on top
		this.#drawRowNumbers(this.bufCtx);

		//draw seats
		for(let seatIdx = 0; seatIdx < this.seatDescs.length; seatIdx++){
			this.seatDescs[seatIdx].draw(this.bufCtx);
		}
		
		// draw aisles
		this.#drawAisles(this.bufCtx);
		
		// draw exits
		this.#drawExits(this.bufCtx);
	}

	draw(ctx){
		//if error show red screen and message
		if(this.error != ""){
			ctx.fillStyle = "red";
			ctx.fillRect(0, 0, this.right, this.bottom);
			
			ctx.fillStyle = "black";
			ctx.font = "24px serif";
			//TODO not sure how fillText coordinates work
			ctx.fillText(this.error, 400, this.bottom/2, this.width-400);
			console.log("exiting draw with error")
			return false;
		}

		if(this.initialized){
			// drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) // with s=start, d=destination
			ctx.drawImage(this.bufferCanvas, 0, 0, this.width, this.height);
		} else {
			// create buffer canvas
			this.bufferCanvas = document.createElement('canvas');
			this.bufferCanvas.width = this.width;
			this.bufferCanvas.height = this.height;
			this.bufCtx = this.bufferCanvas.getContext('2d');

			// initialize seats 
			this.#initializeSeatsDescs(ctx)

			// draw on bufferCanvas
			this.#drawInitial();

			this.initialized = true;
			this.draw(ctx); // call again, with initialized=true
		}
	}
}
