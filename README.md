Inspired by [(Youtube) CGP Grey: "The Better Boarding Method Airlines Won't Use"](https://www.youtube.com/watch?v=oAHbLRjF0vo)

## Simulate Boarding of Airplanes
back to front, from door 1, 10 groups of 3 rows each

![boarding3](https://github.com/user-attachments/assets/eec7b5d4-931e-4f87-8b3d-271bd0637ef2)

from door 2, random order(1 group)
![boarding4](https://github.com/user-attachments/assets/6e5453aa-e14c-4bbf-a30d-c6cb6134396e)



* "Passengers" (Circles with cones showing heading) are created for each seat
* Passengers will move directly to their seat
  * before sitting down they will stay and block the aisle ("stow their baggage")
  * other passengers will wait for them to clear the way -> causing delays

<br>

* The Plane is divided into "boarding groups" with equal numbers of rows
  * Passengers will enter in order of their group
  * The order within a group order is random

## Usage
1. Select one of multiple airplane layouts (click button to apply selection)
2. Set which entrance to use
3. Set how many "boarding groups" to use 
4. Set whether to start seating at back or front
5. Start simulation
