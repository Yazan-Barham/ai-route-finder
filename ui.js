const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
let graph = null, results = [];

function svgEl(tag, attrs, text) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (text !== undefined) e.textContent = text;
  return e;
}

function say(text, isError) {
  const m = $('msg');
  m.textContent = text;
  m.className = isError ? 'error' : '';
}

function loadMap(data) {
  const built = buildGraph(data);          // throws if the map is invalid
  graph = built.graph;
  for (const id of ['start', 'goal']) {
    const sel = $(id);
    sel.innerHTML = '';
    Object.keys(graph.cities).forEach(n => sel.add(new Option(n, n)));
  }
  $('goal').selectedIndex = Object.keys(graph.cities).length - 1;
  $('results').innerHTML = '';
  results = [];
  drawMap([]);
  say(built.warnings.length ? built.warnings.join(' ') : 'Map loaded. Pick a start, a goal and an algorithm.');
}

function drawMap(path) {
  const svg = $('map');
  svg.innerHTML = '';
  svg.setAttribute('viewBox', `0 0 ${graph.W} ${graph.H}`);
  const onPath = new Set();
  for (let i = 0; i < path.length - 1; i++) {
    onPath.add(path[i] + '|' + path[i + 1]);
    onPath.add(path[i + 1] + '|' + path[i]);
  }
  for (const r of graph.roads) {
    const a = graph.pos[r.from], b = graph.pos[r.to];
    const hot = onPath.has(r.from + '|' + r.to);
    svg.append(svgEl('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: hot ? 'road hot' : 'road' }));
    svg.append(svgEl('text', { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 4, class: 'km' }, r.km));
  }
  for (const n in graph.pos) {
    const p = graph.pos[n];
    const cls = path.includes(n) ? 'city hot' : 'city';
    svg.append(svgEl('circle', { cx: p.x, cy: p.y, r: 7, class: cls }));
    svg.append(svgEl('text', { x: p.x + 11, y: p.y + 4, class: 'name' }, n));
  }
}

function showResults() {
  const box = $('results');
  box.innerHTML = '';
  const table = document.createElement('table');
  table.innerHTML = '<tr><th>Algorithm</th><th>Path</th><th>Cost (km)</th><th>Steps</th><th>Expanded</th></tr>';
  const costs = results.filter(r => r.res).map(r => r.res.cost);
  const best = Math.min(...costs);
  results.forEach((r, i) => {
    const tr = document.createElement('tr');
    const cells = r.res
      ? [r.name, r.res.path.join(' → '), r.res.cost, r.res.steps, r.res.expanded]
      : [r.name, 'No route found', '-', '-', '-'];
    cells.forEach(c => { const td = document.createElement('td'); td.textContent = c; tr.append(td); });
    if (r.res && r.res.cost === best && results.length > 1) tr.classList.add('best');
    tr.onclick = () => select(i);
    table.append(tr);
  });
  box.append(table);
  select(0);
}

function select(i) {
  document.querySelectorAll('#results tr').forEach((tr, j) => tr.classList.toggle('active', j === i + 1));
  drawMap(results[i].res ? results[i].res.path : []);
}

function run() {
  const start = $('start').value, goal = $('goal').value, algo = $('algo').value;
  if (start === goal) return say('Start and goal are the same city.', true);
  const types = algo === 'all' ? Object.keys(ALGOS) : [algo];
  results = types.map(t => ({ name: ALGOS[t], res: search(graph, start, goal, t) }));
  say(results.every(r => !r.res) ? 'No route between these cities.' : 'Click a row to show its path on the map.');
  showResults();
}

$('algo').innerHTML = Object.entries(ALGOS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')
  + '<option value="all">Compare all</option>';
$('run').onclick = run;
$('file').onchange = e => {
  const f = e.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    try { loadMap(JSON.parse(reader.result)); }
    catch (err) { say('Could not load map: ' + err.message, true); }
  };
  reader.readAsText(f);
  e.target.value = '';
};

loadMap(DEFAULT_MAP);