function createBordingOrder_random(seatMap){
	var totalNoSeats = seatMap.seatDescs.length;
	var indices = [...Array(totalNoSeats).keys()];
	shuffleArray(indices);
	return indices;
}

// split seatmap into equaly sized groups, output in order of groups, shuffle inside groups
function createBordingOrder_groupsBackToFront(seatMap, groups=8, frontToBack=false){
	let totalRows = seatMap.noRows;
	let groupSizes = splitSizeIntoGroups(totalRows, groups);
	
	let resultIndices = Array();

	let rowIdx = totalRows;
	for(let groupIdx = 0; groupIdx < groups; groupIdx++){		
		let indicesInCurrentGroup = Array();

		// find indices in group, shuffle, then append group to full list
		for(let r = 0; r < groupSizes[groupIdx]; r++){
			rowIdx--; // decrement before use
			let numSeatsInRow = seatMap.seatsDescsByRow[rowIdx]

			for(let i = 0; i < numSeatsInRow.length; i++){
				let code = numSeatsInRow[i].code;
				indicesInCurrentGroup.push( seatMap.mapSeatCodeToIndex[code] );
			}
		}

		// shuffle group, then add to output
		shuffleArray(indicesInCurrentGroup);
		resultIndices = resultIndices.concat(indicesInCurrentGroup);
	}

	if(frontToBack){
		resultIndices.reverse();
	}

	return resultIndices;
}

//get canvas, set size
const planeCanvas = document.getElementById("carCanvas");
planeCanvas.height = 300;
planeCanvas.width = 1100;
const planeCtx = planeCanvas.getContext("2d");

const seatMap = new Seatmap(planeCanvas.width, planeCanvas.height); 
seatMap.draw(planeCtx)

// based on seatmap, needed in figures
let figureRadius = Math.min(seatMap.seatW, seatMap.seatH)/2-2;

// create order of seats
	//var indices = createBordingOrder_random(seatMap);
let indices = createBordingOrder_groupsBackToFront(seatMap, 8, false);

// all or only some of the seats might be full
var manualMaxNumPassengers = 2000;
var totalNoSeats = seatMap.seatDescs.length;
let numDrawnPassengers = Math.min(totalNoSeats, manualMaxNumPassengers)

// create array with "passengers"
var passengerFigures = Array()
for(let i = 0; i < numDrawnPassengers; i++){
	passengerFigures.push(new Figure(seatMap, indices[i], figureRadius))
}

console.log("manually creating figures");


var figure;
var runAnimation = false;


function onStart(){
	let randInt = getRandomInt(seatMap.seatDescs.length);

	figure = new Figure(seatMap, randInt, figureRadius);
	figure.draw(planeCtx)

	runAnimation = true;
	animate();
}

function onStop(){
	runAnimation = false;
}

function save(){}
function discard(){}


let start, previousTimeStamp;
let done = false;

var drawnCnt = 0;
var ticks = 0;
var ticksSinceLastDraw = 0;
var tickDisplayFont = findMaxFontSizeFromWidth(planeCtx, 100, "99999");
function animate(timeStamp){
	if(0 < ticks && ticks % 500 == 0){
		console.log(ticks, "animation running...");
	}

	if (start === undefined) {
		start = timeStamp;
	}
	const elapsed = timeStamp - start;
	const elapsedSinceLastFrame = timeStamp-previousTimeStamp
	
	//console.log("time:", timeStamp, elapsedSinceLastFrame, elapsed)
	
	seatMap.draw(planeCtx) //TODO maybe reduce cost for redraw - remember values where possible
	figure.update(timeStamp)
	figure.draw(planeCtx)



	if(ticksSinceLastDraw >= 10 
		&& drawnCnt < numDrawnPassengers
		&& (drawnCnt == 0 || passengerFigures[drawnCnt].y > passengerFigures[drawnCnt-1].y)
	){
		// draw next figure - if last has moved up "into airplane"
		drawnCnt++;
		ticksSinceLastDraw= 0;
	} else {
		ticksSinceLastDraw++;
	}

	for(let i = 0; i < drawnCnt; i++){
		passengerFigures[i].update(timeStamp, passengerFigures);
		passengerFigures[i].draw(planeCtx)
	}

	drawTextInRect(planeCtx, planeCanvas.width-100, planeCanvas.height-30, 100, 30, ticks, tickDisplayFont, true, "white");

	//TODO testing only - break if all have no goals
	if(drawnCnt == numDrawnPassengers){
		let allStopped = true;
		for(let i = 0; i < numDrawnPassengers && allStopped; i++){
			if(passengerFigures[i].goal != null){
				allStopped = false;
			}
		}

		if(allStopped){
			console.log("automatic stop");
			runAnimation = false;
		}
	}
	
	ticks++;
    previousTimeStamp = timeStamp;
	if(runAnimation){
		requestAnimationFrame(animate)
	} else {
		console.log("animation stopped");
	}
}
