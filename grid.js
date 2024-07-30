
class Tile{
	
}

class Grid{
	constructor(seatMap){
		this.seatMap = seatMap;
		
		/*
		console.log(seatMap.noRows);
		console.log(seatMap.exitCols);
		console.log(seatMap.maxSeatsPerRow);
		*/
	}

	draw(ctx){
		return;
		ctx.fillStyle = "red";
		ctx.fillRect(0, 0, 20, 20)
		
		//for
		
	}
}



/*
tile is aisle, seat, skip


*/

/*
enter plane 
move up until correct aisle
move left or right 
continue until correct row

"enden" von reihen -> von links setzen etwas schwerer


*/