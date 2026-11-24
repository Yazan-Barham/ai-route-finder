function validateMapData(data) {
  if (!Array.isArray(data?.cities) || data.cities.length === 0) {
    throw new Error("The map must have at least one city.");
  }

  if (!Array.isArray(data.roads)) {
    throw new Error("The map must have a roads array.");
  }

  if (data.unit !== undefined && data.unit !== "km") {
    throw new Error('The map unit must be "km".');
  }

  const names = new Set();

  for (const [index, city] of data.cities.entries()) {
    if (typeof city?.name !== "string" || city.name.trim() === "") {
      throw new Error(`City ${index + 1} needs a name.`);
    }

    if (names.has(city.name)) {
      throw new Error(`Duplicate city name: ${city.name}.`);
    }

    if (!Number.isFinite(city.x) || !Number.isFinite(city.y)) {
      throw new Error(`City "${city.name}" needs numeric x and y coordinates.`);
    }

    names.add(city.name);
  }

  for (const [index, road] of data.roads.entries()) {
    if (!names.has(road?.from) || !names.has(road?.to)) {
      throw new Error(`Road ${index + 1} refers to a city outside the map.`);
    }

    if (!Number.isFinite(road.km) || road.km < 0) {
      throw new Error(`Road ${index + 1} needs a distance of zero or more.`);
    }
  }
}

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

  // نفس المفتاح للطريق بالاتجاهين.
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
  const compareButton = document.getElementById("compare");
  const comparisonTemplate = document.getElementById("comparison-template");
  const fileInput = document.getElementById("file");
  const results = document.getElementById("results");
  const message = document.getElementById("msg");

  const algorithms = {
    bfs: { label: "Breadth-First Search (BFS)", search: bfs },
    dfs: { label: "Depth-First Search (DFS)", search: dfs },
    ucs: { label: "Uniform-Cost Search (UCS)", search: ucs },
    greedy: { label: "Greedy Best-First", search: greedy },
    astar: { label: "A* Search", search: astar }
  };

  let mapData;
  let graph;
  let latestUpload = 0;

  runButton.disabled = true;
  compareButton.disabled = true;
  fileInput.disabled = true;
  results.setAttribute("aria-live", "polite");

  algorithmSelect.replaceChildren(
    ...Object.entries(algorithms).map(([id, algorithm]) =>
      new Option(algorithm.label, id)
    )
  );
  algorithmSelect.value = "astar";

  function installMap(nextMap, preferredStart, preferredGoal) {
    validateMapData(nextMap);
    const nextGraph = buildGraph(nextMap);

    const names = [...nextGraph.cities.keys()].sort((a, b) =>
      a.localeCompare(b, "en")
    );

    drawMap(nextMap);

    for (const select of [startSelect, goalSelect]) {
      const options = document.createDocumentFragment();

      for (const name of names) {
        options.append(new Option(name, name));
      }

      select.replaceChildren(options);
    }

    startSelect.value = names.includes(preferredStart) ? preferredStart : names[0];
    goalSelect.value = names.includes(preferredGoal)
      ? preferredGoal
      : names[names.length - 1];

    mapData = nextMap;
    graph = nextGraph;
    runButton.disabled = false;
    compareButton.disabled = false;
  }

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

  compareButton.addEventListener("click", () => {
    const start = startSelect.value;
    const goal = goalSelect.value;

    const comparisons = Object.values(algorithms).map(({ label, search }) => ({
      label,
      ...search(graph, start, goal)
    }));

    const costs = comparisons.map(result => result.costKm).filter(Number.isFinite);
    const minCost = costs.length > 0 ? Math.min(...costs) : null;

    const tableContent = comparisonTemplate.content.cloneNode(true);
    tableContent.querySelector("caption").textContent =
      `Comparing routes: ${start} → ${goal}`;

    const tbody = tableContent.querySelector("tbody");

    for (const { label, path, costKm, steps } of comparisons) {
      const hasCost = Number.isFinite(costKm);
      let isOptimal = false;

      if (hasCost && minCost !== null) {
        const tolerance = 32 * Number.EPSILON * Math.max(costKm, minCost);
        isOptimal = Math.abs(costKm - minCost) <= tolerance;
      }

      const row = tbody.insertRow();
      row.classList.toggle("optimal-row", isOptimal);

      const cells = [
        label,
        path.length > 0 ? path.join(" → ") : "No route found",
        hasCost ? `${costKm} km` : "—",
        steps,
        isOptimal ? "Optimal" : "—"
      ];

      for (const value of cells) {
        row.insertCell().textContent = String(value);
      }
    }

    results.replaceChildren(tableContent);
    drawMap(mapData);
  });

  for (const select of [startSelect, goalSelect, algorithmSelect]) {
    select.addEventListener("change", () => {
      if (!mapData) return;
      results.replaceChildren();
      drawMap(mapData);
    });
  }

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;

    const uploadId = ++latestUpload;
    fileInput.value = "";

    try {
      const text = await file.text();
      if (uploadId !== latestUpload) return;

      installMap(JSON.parse(text));
      results.replaceChildren();
      message.textContent = "";
      message.classList.remove("error");
    } catch (error) {
      if (uploadId !== latestUpload) return;

      message.textContent = error instanceof SyntaxError
        ? "Invalid JSON. Check the commas, quotes, and brackets in your file."
        : error.message;
      message.classList.add("error");
    }
  });

  try {
    const response = await fetch("./sample-map.json");

    if (!response.ok) {
      throw new Error(`Unable to open sample-map.json (HTTP ${response.status}).`);
    }

    installMap(await response.json(), "Jenin", "Hebron");
  } catch (error) {
    message.textContent = `Could not load the default map. ${error.message}`;
    message.classList.add("error");
  } finally {
    fileInput.disabled = false;
  }
}

initRouteSearch();