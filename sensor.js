class Sensor{
	constructor(car){
		this.car = car;
		this.rayCount = 3;
		this.rayLength = 30;
		this.raySpread = Math.PI/4; // was /2
		
		this.rays = [];
		this.readings = [];
	}
	
	updateTest(){
		this.#castRays();
	}

	updateTest_findCollisions(allFigures){
		if(allFigures == undefined) return false;

		// only check yes/no

		let hasCollisions = false;
		//check against all others 
		for(let idx = 0; idx < allFigures.length; idx++){
			let other = allFigures[idx];
			if(this.car == other) continue; // ignore self

			if(other.goal == null) continue; // ignore already seated 

			let distanceToOther = distance({x:this.car.x, y:this.car.y}, {x:other.x, y:other.y});
			if(distanceToOther > this.rayLength) continue; // too far away
			

			let angleToOther = angle(this.car.x, this.car.y, other.x, other.y)
			if(this.car.viewAngle == angleToOther){
				return true; // not pointing towards other
			}
			
			
			


			//console.log("hit", this.car.viewAngle, angleToOther, "dist", distanceToOther)
		}

		return false;
	}

	update(roadBorders, traffic){
		this.#castRays();
		this.readings = [];
		for(let i = 0; i < this.rays.length; i++){
			this.readings.push(
				this.#getReading(
					this.rays[i], 
					 roadBorders,
					 traffic
				)
			);
		}
	}
	
	#getReading(ray, roadBorders, traffic){
		let touches = [];
		for(let i = 0; i < roadBorders.length; i++){
			const touch = getIntersection(
				ray[0],
				ray[1],
				roadBorders[i][0],
				roadBorders[i][1]
			);
			if(touch){
				touches.push(touch);
			}
		}
		
		for(let i = 0; i < traffic.length; i++){
			const poly = traffic[i].polygon;
			for(let j = 0; j < poly.length; j++){
				const touch = getIntersection(
					ray[0],
					ray[1],
					poly[j],
					poly[(j+1)%poly.length]
				);
				if(touch){
					touches.push(touch);
				}
			}
		}
		
		if(touches.length == 0){
			return null;
		} else {
			//touches are x,y,offset, get all offsets only
			const offsets = touches.map(e=>e.offset);
			const minOffset = Math.min(...offsets); // does not take array - therefore ...-operator
			return touches.find(e=>e.offset == minOffset); // return the touch with minimum offset
		}
	}
	
	#castRays(){
		// this expects radians, with up=0, right=pi/2, left=-pi/2, down=pi


		let TODO_radianAngle = (degree360To180SignedZeroUp(-1*this.car.viewAngle)*Math.PI)/180;
		
		/*
		console.log("base", this.car.viewAngle)
		console.log("180", degree360To180SignedZeroUp(this.car.viewAngle))
		console.log("rad", TODO_radianAngle)
		*/

		this.rays = [];
		for(let i = 0; i < this.rayCount; i++){
			const rayAngle = lerp(
				this.raySpread/2,
				-this.raySpread/2,
				this.rayCount==1?0.5:i/(this.rayCount-1)
			//) + this.car.viewAngle;
			) + TODO_radianAngle;
				
			const start = {x:this.car.x, y:this.car.y};
			const end = {
				x:this.car.x-
					Math.sin(rayAngle)*this.rayLength,
				y:this.car.y-
					Math.cos(rayAngle)*this.rayLength
			};
			this.rays.push([start, end]);
		}
	}
	
	draw(ctx){
		for(let i = 0; i < this.rayCount; i++){
			let end = this.rays[i][1];
			if(this.readings[i]){
				end = this.readings[i];
			}
			
			ctx.beginPath();
			ctx.lineWidth = 2;
			ctx.strokeStyle = "yellow";
			ctx.moveTo(
				this.rays[i][0].x,
				this.rays[i][0].y
			);
			ctx.lineTo(
				end.x,
				end.y
			);
			ctx.stroke();
			
			//draw rest of line in black - "reverse direction" from line above
			ctx.beginPath();
			ctx.lineWidth = 2;
			ctx.strokeStyle = "black";
			ctx.moveTo(
				this.rays[i][1].x,
				this.rays[i][1].y
			);
			ctx.lineTo(
				end.x,
				end.y
			);
			ctx.stroke();
		}
	}
}
