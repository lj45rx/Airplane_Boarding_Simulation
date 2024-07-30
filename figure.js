// wait, move, turn

const ActionType = {
	Move: 0,
	Wait: 1,
	Turn: 2
}

class MoveAction{
	constructor(goalX, goalY){
		this.type = ActionType.Move;
		this.goalX = goalX;
		this.goalY = goalY;
	}
}

class WaitAction{
	constructor(durationInTicks){
		this.type = ActionType.Wait;
		this.duration = durationInTicks;
	}
}

class TurnAction{
	constructor(goalAngle){
		this.type = ActionType.Turn;
		this.goalAngle = goalAngle;
	}
}


class Figure{
	constructor(seatMap, seatIdx, radius){
		this.x = 0;
		this.y = 0;
		this.speed = 3;
		this.viewAngle = 0;
		this.turnSpeedInDegrees = 45;
		this.color = "blue";
		this.sensor = new Sensor(this);
		this.path = Array();
		this.pIdx = 0;
		this.finished = false;
		this.checkCollisions = true;
		this.goal = null;
		this.isBlocked = false;

		this.codeFont = null;

		this.radius = radius;
		this.seatMap = seatMap
		this.seatIdx = seatIdx
		this.seatDesc = seatMap.seatDescs[seatIdx]

		this.sleepTicks = 0;

		this.currentAction = null;
		this.actionQueue = Array()
		this.actionQueueB = Array()


		this.testTurnDeg = 10;
		this.testGoalAngle = 0;

		this.createPath(0)
	}

	onResize(){

	}

	createPath(exitNum = 0){
		// set figure below given exit - "spawn"
		let exitX = this.seatMap.exitXValues[exitNum];
		this.x = exitX;
		this.y = 380; //TODO +from size

		//move up to "correct" aisle - closest to seat center-y
		let aisleY;
		let lastDist;
		for(let i = 0; i < this.seatMap.aisleYValues.length; i++){
			let ay = this.seatMap.aisleYValues[i]
			let aisleDist = distance({x:exitX, y:this.seatDesc.positionRect.center.y}, {x:exitX, y:ay});

			
			//console.log(lastDist, aisleDist, "----", lastDist>aisleDist)
			if(i == 0 || lastDist > aisleDist){
				//console.log("setting as", ay, aisleDist)
				lastDist = aisleDist;
				aisleY = ay;
			}
		}


		this.path.push({x:exitX, y:aisleY});
		this.actionQueue.push(["move", exitX, aisleY]);
		this.actionQueueB.push(new MoveAction(exitX, aisleY));

		// move along aisle to seat center-x
		this.path.push({x:this.seatDesc.positionRect.center.x, y:aisleY});
		
		this.actionQueueB.push(new MoveAction(this.seatDesc.positionRect.center.x, aisleY));



		// stow luggage, then sit down
		this.path.push([this.seatDesc.positionRect.center, 50, false]); //TODO experiment pos,waitTicks,checkcollisions

		// sit down		
		//this.path.push(this.seatDesc.position.center);


		//console.log(this.path)
		this.getNextGoal()
		//console.log(this.goal, this.x, this.y)
	}
	
	fixGoal(){
		this.goalX = this.goalX - this.radius;
		this.goalY = this.goalY - this.radius;
	}
	
	getNextGoal(){
		if( this.pIdx < this.path.length ){

			//TODO experiment - if len 2 sleep for some ticks
			let goal = this.path[this.pIdx++];

			this.checkCollisions = true;
			if(goal.length > 2){
				this.checkCollisions = goal[2];
			}

			if(goal.length > 1){
				this.sleepTicks = goal[1];
				goal = goal[0]; //TODO fix - this overwrites goal
			}
			


			this.goal = goal

			//this.goal = this.path[this.pIdx++];
			
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
		if(this.goal == null) return;

		//wait, turn or move
		// before move check collisions with other figures

		if(this.viewAngle != this.testGoalAngle){
			let diffDeg = findDifferenceBetweenAngles(this.viewAngle, this.testGoalAngle, this.testTurnDeg);
			this.viewAngle = (360+(this.viewAngle+diffDeg))%360;
			
			return;
		}

		if(this.sleepTicks > 0){
			this.sleepTicks--;
			return;
		}

		// start next goal if needed
		if(this.goal == null){
			return;
		}

		if( this.isAtGoalXY() ){
			this.getNextGoal();
			if(this.goal == null){
				this.viewAngle = 270;
				this.finished = true;
				return;
			}
			
			this.goalX = this.goal.x;
			this.goalY = this.goal.y;

			this.testGoalAngle = angle(this.x, this.y, this.goalX, this.goalY);
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
			//this.viewAngle = 0;
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
		
