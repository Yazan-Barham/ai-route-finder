function drawMap(mapData, path = []) {
  const svg = document.getElementById("map");
  const width = 720;
  const height = 520;
  const paddingX = 100;
  const paddingY = 45;

  function makeSvg(tag, attributes = {}, text = "") {
    const element = document.createElementNS("http://www.w3.org/2000/svg", tag);

    for (const [name, value] of Object.entries(attributes)) {
      element.setAttribute(name, String(value));
    }

    element.textContent = text;
    return element;
  }

  const xs = mapData.cities.map(city => city.x);
  const ys = mapData.cities.map(city => city.y);
  const minX = Math.min(...xs);
  const maxY = Math.max(...ys);
  const spanX = Math.max(...xs) - minX;
  const spanY = maxY - Math.min(...ys);

  const scale = Math.min(
    (width - 2 * paddingX) / Math.max(spanX, 1),
    (height - 2 * paddingY) / Math.max(spanY, 1)
  );

  const left = (width - spanX * scale) / 2;
  const top = (height - spanY * scale) / 2;
  const positions = new Map();

  for (const { name, x, y } of mapData.cities) {
    positions.set(name, {
      x: left + (x - minX) * scale,
      y: top + (maxY - y) * scale
    });
  }

  // نفس مفتاح الطريق سواء اتجهنا من A إلى B أو من B إلى A.
  const roadKey = (from, to) => JSON.stringify([from, to].sort());
  const routeRoads = new Set();
  const routeCities = new Set(path);

  for (let i = 1; i < path.length; i++) {
    routeRoads.add(roadKey(path[i - 1], path[i]));
  }

  const roads = makeSvg("g");
  const highlightedRoads = makeSvg("g");
  const distances = makeSvg("g");
  const cities = makeSvg("g");

  for (const { from, to, km } of mapData.roads) {
    const a = positions.get(from);
    const b = positions.get(to);
    const highlighted = routeRoads.has(roadKey(from, to));
    const layer = highlighted ? highlightedRoads : roads;

    layer.append(makeSvg("line", {
      x1: a.x,
      y1: a.y,
      x2: b.x,
      y2: b.y,
      class: highlighted ? "road hot" : "road"
    }));

    distances.append(makeSvg("text", {
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2 - 5,
      class: "km"
    }, `${km} km`));
  }

  for (const { name } of mapData.cities) {
    const { x, y } = positions.get(name);

    cities.append(
      makeSvg("circle", {
        cx: x,
        cy: y,
        r: 6,
        class: routeCities.has(name) ? "city hot" : "city"
      }),
      makeSvg("text", {
        x: x + 10,
        y: y + 5,
        class: "name"
      }, name)
    );
  }

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.replaceChildren(roads, highlightedRoads, distances, cities);
}

async function initRouteSearch() {
  const startSelect = document.getElementById("start");
  const goalSelect = document.getElementById("goal");
  const algorithmSelect = document.getElementById("algo");
  const runButton = document.getElementById("run");
  const results = document.getElementById("results");
  const message = document.getElementById("msg");

  const algorithms = {
    bfs: { label: "Breadth-First Search (BFS)", search: bfs },
    dfs: { label: "Depth-First Search (DFS)", search: dfs },
    ucs: { label: "Uniform-Cost Search (UCS)", search: ucs },
    greedy: { label: "Greedy Best-First", search: greedy },
    astar: { label: "A* Search", search: astar }
  };

  runButton.disabled = true;
  results.setAttribute("aria-live", "polite");

  let mapData;
  let graph;

  try {
    const response = await fetch("./sample-map.json");

    if (!response.ok) {
      throw new Error(`Unable to open sample-map.json (HTTP ${response.status}).`);
    }

    mapData = await response.json();
    graph = buildGraph(mapData);
    drawMap(mapData);
  } catch (error) {
    message.textContent = `Could not load the map. ${error.message}`;
    message.classList.add("error");
    return;
  }

  const cityNames = [...graph.cities.keys()].sort((a, b) =>
    a.localeCompare(b, "en")
  );

  for (const select of [startSelect, goalSelect]) {
    select.replaceChildren(...cityNames.map(name => new Option(name, name)));
  }

  algorithmSelect.replaceChildren(
    ...Object.entries(algorithms).map(([id, algorithm]) =>
      new Option(algorithm.label, id)
    )
  );

  startSelect.value = "Jenin";
  goalSelect.value = "Hebron";
  algorithmSelect.value = "astar";

  runButton.addEventListener("click", () => {
    const algorithm = algorithms[algorithmSelect.value];
    const { path, costKm, steps } = algorithm.search(
      graph,
      startSelect.value,
      goalSelect.value
    );

    drawMap(mapData, path);

    const lines = path.length > 0
      ? [`Route: ${path.join(" → ")}`, `Total distance: ${costKm} km`]
      : ["No route found between these cities."];

    lines.push(`Search steps: ${steps}`);

    results.replaceChildren(...lines.map(line => {
      const paragraph = document.createElement("p");
      paragraph.textContent = line;
      return paragraph;
    }));
  });

  for (const select of [startSelect, goalSelect, algorithmSelect]) {
    select.addEventListener("change", () => {
      results.replaceChildren();
      drawMap(mapData);
    });
  }

  runButton.disabled = false;
}

initRouteSearch();