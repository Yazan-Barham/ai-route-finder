function bfs(graph, start, goal) {
  const frontier = [{ city: start, path: [start], costKm: 0 }];
  const expanded = new Set();
  let steps = 0;

  while (frontier.length > 0) {
    frontier.sort((a, b) =>
      a.path.length - b.path.length || a.city.localeCompare(b.city, "en")
    );

    const current = frontier.shift();
    if (expanded.has(current.city)) continue;

    expanded.add(current.city);
    steps += 1;

    if (current.city === goal) {
      return { path: current.path, costKm: current.costKm, steps };
    }

    for (const { city, km } of graph.neighbors.get(current.city)) {
      if (expanded.has(city)) continue;

      frontier.push({
        city,
        path: [...current.path, city],
        costKm: current.costKm + km
      });
    }
  }

  return { path: [], costKm: null, steps };
}

function dfs(graph, start, goal) {
  const frontier = [{ city: start, path: [start], costKm: 0 }];
  const expanded = new Set();
  let steps = 0;

  while (frontier.length > 0) {
    frontier.sort((a, b) =>
      b.path.length - a.path.length || a.city.localeCompare(b.city, "en")
    );

    const current = frontier.shift();
    if (expanded.has(current.city)) continue;

    expanded.add(current.city);
    steps += 1;

    if (current.city === goal) {
      return { path: current.path, costKm: current.costKm, steps };
    }

    for (const { city, km } of graph.neighbors.get(current.city)) {
      if (expanded.has(city)) continue;

      frontier.push({
        city,
        path: [...current.path, city],
        costKm: current.costKm + km
      });
    }
  }

  return { path: [], costKm: null, steps };
}

function ucs(graph, start, goal) {
  const frontier = [{ city: start, path: [start], costKm: 0 }];
  const bestCost = new Map([[start, 0]]);
  const expanded = new Set();
  let steps = 0;

  while (frontier.length > 0) {
    frontier.sort((a, b) =>
      a.costKm - b.costKm || a.city.localeCompare(b.city, "en")
    );

    const current = frontier.shift();

    if (expanded.has(current.city)) continue;
    if (current.costKm !== bestCost.get(current.city)) continue;

    expanded.add(current.city);
    steps += 1;

    if (current.city === goal) {
      return { path: current.path, costKm: current.costKm, steps };
    }

    for (const { city, km } of graph.neighbors.get(current.city)) {
      if (expanded.has(city)) continue;

      const costKm = current.costKm + km;
      if (costKm >= (bestCost.get(city) ?? Infinity)) continue;

      bestCost.set(city, costKm);
      frontier.push({
        city,
        path: [...current.path, city],
        costKm
      });
    }
  }

  return { path: [], costKm: null, steps };
}

function heuristic(city, goal) {
  return Math.floor(Math.hypot(city.x - goal.x, city.y - goal.y));
}

function greedy(graph, start, goal) {
  const goalCity = graph.cities.get(goal);
  const frontier = [{
    city: start,
    path: [start],
    costKm: 0,
    h: heuristic(graph.cities.get(start), goalCity)
  }];
  const expanded = new Set();
  let steps = 0;

  while (frontier.length > 0) {
    frontier.sort((a, b) =>
      a.h - b.h || a.city.localeCompare(b.city, "en")
    );

    const current = frontier.shift();
    if (expanded.has(current.city)) continue;

    expanded.add(current.city);
    steps += 1;

    if (current.city === goal) {
      return { path: current.path, costKm: current.costKm, steps };
    }

    for (const { city, km } of graph.neighbors.get(current.city)) {
      if (expanded.has(city)) continue;

      frontier.push({
        city,
        path: [...current.path, city],
        costKm: current.costKm + km,
        h: heuristic(graph.cities.get(city), goalCity)
      });
    }
  }

  return { path: [], costKm: null, steps };
}

function astar(graph, start, goal) {
  const goalCity = graph.cities.get(goal);
  const frontier = [{
    city: start,
    path: [start],
    costKm: 0,
    f: heuristic(graph.cities.get(start), goalCity)
  }];
  const bestCost = new Map([[start, 0]]);
  const expanded = new Set();
  let steps = 0;

  while (frontier.length > 0) {
    frontier.sort((a, b) =>
      a.f - b.f || a.city.localeCompare(b.city, "en")
    );

    const current = frontier.shift();
    if (expanded.has(current.city)) continue;
    if (current.costKm !== bestCost.get(current.city)) continue;

    expanded.add(current.city);
    steps += 1;

    if (current.city === goal) {
      return { path: current.path, costKm: current.costKm, steps };
    }

    for (const { city, km } of graph.neighbors.get(current.city)) {
      if (expanded.has(city)) continue;

      const costKm = current.costKm + km;
      if (costKm >= (bestCost.get(city) ?? Infinity)) continue;

      const h = heuristic(graph.cities.get(city), goalCity);
      bestCost.set(city, costKm);
      frontier.push({
        city,
        path: [...current.path, city],
        costKm,
        f: costKm + h
      });
    }
  }

  return { path: [], costKm: null, steps };
}