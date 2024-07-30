class Sensor{
	constructor(figure){
		this.figure = figure;
		this.sensorLenght = 30;//*figure.radius;
		console.log(figure.radius)
	}

	checkCollision(allFigures){
		if(allFigures == undefined) return false;

		// only check yes/no

		let hasCollisions = false;
		//check against all others 
		for(let idx = 0; idx < allFigures.length; idx++){
			let other = allFigures[idx];
			if(this.figure == other) continue; // ignore self

			if(other.goal == null) continue; // ignore already seated 

			let distanceToOther = distance({x:this.figure.x, y:this.figure.y}, {x:other.x, y:other.y});
			if(distanceToOther > this.sensorLenght) continue; // too far away
			

			let angleToOther = angle(this.figure.x, this.figure.y, other.x, other.y)
			if(this.figure.viewAngle == angleToOther){
				return true; // not pointing towards other
			}

			//console.log("hit", this.car.viewAngle, angleToOther, "dist", distanceToOther)
		}

		return false;
	}
}
