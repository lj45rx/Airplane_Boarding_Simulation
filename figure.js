class Figure{
	constructor(seatMap, seatIdx, radius, exitNum){
		this.seatMap = seatMap
		this.seatIdx = seatIdx
		this.radius = radius;
		this.seatDesc = seatMap.seatDescs[seatIdx]

		this.x = 0;
		this.y = 0;
		this.speed = 3;
		this.viewAngle = 0;
		this.turnSpeedInDegrees = 45;
		this.color = "blue";
		this.sensor = new Sensor(this);
		this.path = Array();
		this.pathStepIdx = 0;
		this.finished = false;
		this.checkCollisions = true;
		this.goal = null;
		this.isBlocked = false;
		this.codeFont = null;
		this.sleepTicks = 0;

		this.turningSpeedInDegrees = 10;
		this.goalAngle = 0;

		//TODO maybe find better solution, create path when move called etc
		this.createPath(exitNum); 
	}

	createPath(exitNum = 0){
		// CAUTION all values pushed to path must be arrays
		// eg [{x:123, y:456}]

		// set figure below given exit - "spawn"
		let exitX = this.seatMap.exitXValues[exitNum];

		// set "spawn point"
		this.x = exitX;
		this.y = 380; //TODO get this from canvas size

		//find y of correct aisle - closest to seat center-y
		let aisleY;
		let lastDist;
		for(let i = 0; i < this.seatMap.aisleYValues.length; i++){
			let ay = this.seatMap.aisleYValues[i]
			let aisleDist = distance({x:exitX, y:this.seatDesc.positionRect.center.y}, {x:exitX, y:ay});

			if(i == 0 || lastDist > aisleDist){
				//console.log("setting as", ay, aisleDist)
				lastDist = aisleDist;
				aisleY = ay;
			}
		}

		//move up from "below" the plane to center-y of correct aisle
		this.path.push([{x:exitX, y:aisleY}]);

		// move along aisle to seat center-x
		this.path.push([{x:this.seatDesc.positionRect.center.x, y:aisleY}]);
	
		// stow luggage, then sit down
		// go to seat, but first wait ("stow luggage"), dont check for collisions
		this.path.push([this.seatDesc.positionRect.center, 50, false]);

		//console.log(this.path)
		this.getNextGoal()
	}
	
	fixGoal(){
		this.goalX = this.goalX - this.radius;
		this.goalY = this.goalY - this.radius;
	}
	
	getNextGoal(){
		if( this.pathStepIdx < this.path.length ){
			let goal = this.path[this.pathStepIdx++];

			// idx=2 stores if check for collisions is done
			// default is true
			this.checkCollisions = true;
			if(goal.length > 2){
				this.checkCollisions = goal[2];
			}

			// idx=1 stores how long to wait before moving
			if(goal.length > 1){
				this.sleepTicks = goal[1];
			}
			
			// idx=0 stores location to move to
			this.goal = goal[0];
			
			this.goalX = this.goal.x;
			this.goalY = this.goal.y;
		} else {
			this.goal = null;
		}
	}
	
	isAtGoalXY(){
		if( this.goal == null){
			return false;
		}
		return this.x == this.goal.x && this.y == this.goal.y;
	}
	
	update(time, allFigures){
		//turn, then wait, then move
		// before move check collisions with other figures

		//turn
		if(this.viewAngle != this.goalAngle){
			let diffDeg = findDifferenceBetweenAngles(this.viewAngle, this.goalAngle, this.turningSpeedInDegrees);
			this.viewAngle = (360+(this.viewAngle+diffDeg))%360;
			return;
		}

		// wait
		if(this.sleepTicks > 0){
			this.sleepTicks--;
			return;
		}

		//TODO check if needed here (or at beginning of fkt)
		if(this.goal == null){ 
			return;
		}

		// start next goal if needed
		if( this.isAtGoalXY() ){
			this.getNextGoal();
			if(this.goal == null){
				this.viewAngle = 270;
				this.finished = true;
				return;
			}
			
			this.goalX = this.goal.x;
			this.goalY = this.goal.y;

			this.goalAngle = angle(this.x, this.y, this.goalX, this.goalY);
			return; // TODO - dont move in first step
		}

		//check surroundings etc
		if(!this.checkCollisions || !this.sensor.checkCollision(allFigures)){
			this.#move()
			this.isBlocked = false;
		} else {
			this.isBlocked = true;
		}
	}
	
	#move(){
		// allow movement in both x and y

		if(this.x < this.goalX){
			//this.viewAngle = 90;
			this.x = Math.min(this.x+this.speed, this.goalX);
		} else if (this.x > this.goalX) {
			//console.log("going left", this.x, this.speed, this.goalX)
			//this.viewAngle = 270;
			this.x = Math.max(this.x-this.speed, this.goalX);
		}
		
		if(this.y < this.goalY){
			//this.viewAngle = 180;
			this.y = Math.min(this.y+this.speed, this.goalY);
		} else if (this.y > this.goalY) {
			//console.log("going up", this.y, this.speed, this.goalY)
			this.y = Math.max(this.y-this.speed, this.goalY);
		}
	}
	
	drawSightCone(ctx, centerAngle, widthRadius, length){
		// sightline
		// 0 = right; 90 = down; etc
		let startAngleDeg = (centerAngle-widthRadius)%360;
		let endAngleDeg = (centerAngle+widthRadius)%360;

		ctx.fillStyle = "rgba(255, 255, 0, 0.2)"; //(255,255,0)=yellow
		ctx.beginPath();
		ctx.moveTo(this.x, this.y);
		ctx.arc(this.x, this.y, length, degreeToRadian(startAngleDeg), degreeToRadian(endAngleDeg));
		ctx.moveTo(this.x, this.y);
		ctx.fill();
	}

	draw(ctx){
		if(this.codeFont == null){
			this.codeFont = findMaxFontSizeFromWidth(ctx, 2*this.radius);
		}

		if(this.goal != null){
			this.drawSightCone(ctx, this.viewAngle, 30, this.radius*10);
		}

		// draw figure
		ctx.fillStyle = this.color;
		if(this.isBlocked){
			ctx.fillStyle = "red";
		}
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
		ctx.fill();

		// draw seat number on figure
		let rad = this.radius;
		drawTextInRect(ctx, this.x-rad, this.y-rad, 2*this.radius, 2*this.radius, 
					this.seatDesc.code, this.codeFont, false, "white");
	}
}
		
