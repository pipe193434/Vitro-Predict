let bundle;
let activeCase = 0;

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

function treeProbability(tree, vector) {
  let node = 0;
  while (tree.children_left[node] !== -1) {
    node = vector[tree.feature[node]] <= tree.threshold[node]
      ? tree.children_left[node]
      : tree.children_right[node];
  }
  const counts = tree.value[node];
  const total = counts.reduce((a, b) => a + b, 0);
  return total ? counts[1] / total : 0;
}

function forestProbability(vector) {
  return bundle.arboles.reduce((sum, tree) => sum + treeProbability(tree, vector), 0) / bundle.arboles.length;
}

function renderCase(index) {
  activeCase = index;
  const c = bundle.casos[index];
  $('#case-title').textContent = c.id;
  $('#record-id').textContent = `ID ${c.registro_anonimo}`;
  $('#fields').innerHTML = Object.entries(c.campos_visibles)
    .map(([key, value]) => `<div><dt>${key}</dt><dd>${value}</dd></div>`).join('');
  $('#probability').textContent = '—';
  $('#gauge').style.setProperty('--p', '0deg');
  $('#decision').className = 'decision neutral';
  $('#decision').textContent = 'Esperando ejecución';
  $('#comparison').textContent = 'Pulse el botón para recorrer los 100 árboles del modelo.';
  $$('.case-tab').forEach((tab, i) => {
    tab.classList.toggle('active', i === index);
    tab.setAttribute('aria-selected', String(i === index));
  });
}

function predict() {
  const c = bundle.casos[activeCase];
  const p = forestProbability(c.vector);
  const high = p >= bundle.umbral;
  $('#gauge').style.setProperty('--p', `${p * 360}deg`);
  $('#probability').textContent = `${(p * 100).toFixed(1).replace('.', ',')} %`;
  $('#decision').className = `decision ${high ? 'high' : 'normal'}`;
  $('#decision').textContent = high ? 'Prioridad alta de seguimiento' : 'Seguimiento normal';
  const delta = Math.abs(p - c.probabilidad_esperada);
  $('#comparison').textContent = `Resultado real reservado: ${c.resultado_real}. Verificación técnica: diferencia frente a scikit-learn = ${delta.toExponential(1)}.`;
}

fetch('model_bundle.json')
  .then((r) => {
    if (!r.ok) throw new Error('No fue posible cargar el modelo.');
    return r.json();
  })
  .then((data) => {
    bundle = data;
    renderCase(0);
    $('#predict').addEventListener('click', predict);
    $$('.case-tab').forEach((tab) => tab.addEventListener('click', () => renderCase(Number(tab.dataset.case))));
  })
  .catch((error) => {
    $('#decision').textContent = error.message;
    $('#predict').disabled = true;
  });
