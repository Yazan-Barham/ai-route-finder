# Pathwise – AI Route Finder

## Project Overview

Pathwise is a web app that finds routes between cities using five AI search algorithms. The default map contains 11 West Bank cities connected by 19 two-way roads.

**Find route** highlights the route on the map and shows the sequence of cities, total distance in kilometres, and number of search steps. **Compare all** runs the five algorithms for the same start and destination and marks every result tied for the lowest cost as **Optimal**.

The app also supports custom JSON maps. Each city has a name and x/y coordinates, and each road specifies two cities and the distance between them.

## Search Algorithms

| Algorithm | How it chooses the next city |
| --- | --- |
| BFS | Chooses the path with the fewest roads so far. |
| DFS | Chooses the deepest available path. |
| UCS | Chooses the path with the lowest total distance from the start. |
| Greedy Best-First | Chooses the city with the smallest estimated distance to the goal. |
| A* | Chooses the path with the smallest sum of distance travelled and estimated distance remaining. |

The estimate is the straight-line distance to the goal, rounded down. Ties are broken alphabetically. Each city is counted once when processed, including the goal if reached.

## How to run

1. Open the project folder in Visual Studio Code.
2. With the Live Server extension installed, open `index.html` and click **Go Live**.
3. In the browser, choose a start city, a destination, and an algorithm.
4. Click **Find route** to see one result or **Compare all** to compare all five algorithms.
5. To load a different road map, click **Choose JSON file** and select a map file.

## Example

On the default map, the minimum cost from Jenin to Hebron is **144 km**.

Jenin → Nablus → Ramallah → Jerusalem → Bethlehem → Hebron

## Group Members

| Full name | Student ID |
| --- | --- |
| waled fakhr-aldeen | 12427784 |
| yazan barham | 12400199 |
