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

function createPassengerFigures(exitNum){
	// create order of seats
	//var indices = createBordingOrder_random(seatMap);
	let indices = createBordingOrder_groupsBackToFront(seatMap, 8, false);

	// all or only some of the seats might be full
	let manualMaxNumPassengers = 2000;
	let totalNoSeats = seatMap.seatDescs.length;
	numDrawnPassengers = Math.min(totalNoSeats, manualMaxNumPassengers)

	// create array with "passengers"
	let figures = Array()
	for(let i = 0; i < numDrawnPassengers; i++){
		figures.push(new Figure(seatMap, indices[i], figureRadius, exitNum))
	}

	return figures;
}

function loadSeatmapLayouts(){
	for(let map of seatMapLayouts){
		let newOption = document.createElement("option");
		newOption.setAttribute("value", map.name);
		newOption.innerHTML = map.name
		seatmapSelector.appendChild(newOption);

		nameToSeatmapDict[map.name] = map;
	} 
}

function getSelectedValueInDropdownList(dropdownEl){
	//var dropdownElement = document.getElementById("elementId");
	var value = dropdownEl.options[dropdownEl.selectedIndex].value;
	var text = dropdownEl.options[dropdownEl.selectedIndex].text;
	return {text: text, value: value};
}

function populateEntranceNumberDropdownList(count){
	entranceSelector.innerHTML = "";
	for(let i = 0; i < count; i++){
		let newOption = document.createElement("option");
		newOption.setAttribute("value", i);
		newOption.innerHTML = i+1
		entranceSelector.appendChild(newOption);
	}
}

function onSeatmapChanged(seatMapDesc=null){
	if(seatMapDesc == null){
		let seatMapName = getSelectedValueInDropdownList(seatmapSelector).text;
		seatMapDesc = nameToSeatmapDict[seatMapName];
	}
	
	// load seatmap object
	console.log("####################\n(TODO remove console prints)");
	console.log("loading seatmap\n    \"" + seatMapDesc.name + "\"");

	seatMap = new Seatmap(seatMapDesc.map, planeCanvas.width, planeCanvas.height); 
	seatMap.draw(planeCtx)
	figureRadius = Math.min(seatMap.seatW, seatMap.seatH)/2-2;

	console.log("####################");

	// populate list of possible entrances
	populateEntranceNumberDropdownList(seatMap.noExits);

	//set link to description
	seatmapLink.setAttribute("href", seatMapDesc.url);
	seatmapLink.innerHTML = seatMapDesc.url;
	
	passengerFigures = null; // create when start is called
}

function onStart(){
	if(runAnimation || passengerFigures == null){
		let entranceNr = Number(getSelectedValueInDropdownList(entranceSelector).value);
		console.log("using entrance ", entranceNr);
		passengerFigures = createPassengerFigures(entranceNr);
	}

	runAnimation = true;
	animate();
}

function onStop(){
	runAnimation = false;
}


//get canvas, set size
const planeCanvas = document.getElementById("canvas");
planeCanvas.height = 300;
planeCanvas.width = 1100;
const planeCtx = planeCanvas.getContext("2d");

const seatmapSelector = document.getElementById("seatmapSelector");
const entranceSelector = document.getElementById("entranceSelector");
const seatmapLink = document.getElementById("seatmapLink");
const nameToSeatmapDict = {};

let seatMap = null;
let figureRadius = -1; // based on seatmap, needed in figures
let passengerFigures = [];
let numDrawnPassengers; //TODO what?? - used for drawing
loadSeatmapLayouts();
onSeatmapChanged(seatMapLayouts[0]); // draw first map 


//TODO put these in start or similar
console.error("TODO correctly reset variables on restart")
var runAnimation = false;

let start, previousTimeStamp;
let done = false;

var drawnCnt = 0;
var ticks = 0;
var ticksSinceLastNewFigureDrawn = 0;
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
	
	// redraw seatmap(=background)
	seatMap.draw(planeCtx);

	if(ticksSinceLastNewFigureDrawn >= 10 
		&& drawnCnt < numDrawnPassengers
		&& (drawnCnt == 0 || passengerFigures[drawnCnt].y-(2*figureRadius) > passengerFigures[drawnCnt-1].y) // none drawn || last figure has "moved up into the plane"
	){
		// draw next figure
		drawnCnt++;
		ticksSinceLastNewFigureDrawn=0;
	} else {
		ticksSinceLastNewFigureDrawn++;
	}

	for(let i = 0; i < drawnCnt; i++){
		passengerFigures[i].update(timeStamp, passengerFigures);
		passengerFigures[i].draw(planeCtx)
	}

	drawTextInRect(planeCtx, planeCanvas.width-100, planeCanvas.height-30, 100, 30, ticks, tickDisplayFont, true, "white");

	//break if all have no goals
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
