function buildGraph(mapData) {
  const cities = new Map();
  const neighbors = new Map();

  for (const city of mapData.cities) {
    cities.set(city.name, city);
    neighbors.set(city.name, []);
  }

  for (const { from, to, km } of mapData.roads) {
    neighbors.get(from).push({ city: to, km });
    neighbors.get(to).push({ city: from, km });
  }

  return { cities, neighbors };
}