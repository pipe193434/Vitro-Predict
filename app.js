const bundle = window.MODEL_BUNDLE;
let activeCase = 0;
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

function treeProbability(tree, vector) {
  let node = 0;
  while (tree.children_left[node] !== -1) {
    node = vector[tree.feature[node]] <= tree.threshold[node] ? tree.children_left[node] : tree.children_right[node];
  }
  const counts = tree.value[node];
  const total = counts.reduce((a, b) => a + b, 0);
  return total ? counts[1] / total : 0;
}

function forestProbability(vector) {
  return bundle.arboles.reduce((sum, tree) => sum + treeProbability(tree, vector), 0) / bundle.arboles.length;
}

function populateSelect(field) {
  const options = bundle.preprocesamiento.categoricas[field].options;
  $('#' + field).innerHTML = options.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
}

function optionFor(field, value) {
  const options = bundle.preprocesamiento.categoricas[field].options;
  return options.find(o => o.value === value) || options.at(-1);
}

function buildVector() {
  const prep = bundle.preprocesamiento;
  const categorical = new Array(prep.categorical_width).fill(0);
  ['cliente','plazo','vigencia','categoria_producto','tipo_documento'].forEach(field => {
    const meta = prep.categoricas[field];
    optionFor(field, $('#' + field).value).block.forEach((v, i) => categorical[meta.offset + i] = v);
  });
  const raw = [Math.log1p(Number($('#precio').value)), Number($('#precio_fue_imputado').value), Number($('#anio').value), Number($('#mes').value)];
  return categorical.concat(raw.map((v, i) => (v - prep.numericas.mean[i]) / prep.numericas.scale[i]));
}

function resetOutput() {
  $('#probability').textContent = '—';
  $('#gauge').style.setProperty('--p', '0deg');
  $('#decision').className = 'decision neutral';
  $('#decision').textContent = 'Esperando cálculo';
  $('#comparison').textContent = 'Modifique las X o use el ejemplo y calcule la Y.';
}

function loadCase(index) {
  activeCase = index;
  const c = bundle.casos[index];
  $('#case-title').textContent = c.id;
  $('#record-id').textContent = `ID ${c.registro_anonimo}`;
  Object.entries(c.inputs).forEach(([field, value]) => { if ($('#' + field)) $('#' + field).value = String(value); });
  resetOutput();
  $$('.case-tab').forEach((tab, i) => { tab.classList.toggle('active', i === index); tab.setAttribute('aria-selected', String(i === index)); });
}

function predict() {
  if (!$('#prediction-form').reportValidity()) return;
  const p = forestProbability(buildVector());
  const high = p >= bundle.umbral;
  $('#gauge').style.setProperty('--p', `${p * 360}deg`);
  $('#probability').textContent = `${(p * 100).toFixed(1).replace('.', ',')} %`;
  $('#decision').className = `decision ${high ? 'high' : 'normal'}`;
  $('#decision').textContent = high ? 'Y = 1 · Prioridad alta' : 'Y = 0 · Seguimiento normal';
  const original = bundle.casos[activeCase];
  const unchanged = Object.entries(original.inputs).every(([f,v]) => !$('#'+f) || $('#'+f).value === String(v));
  $('#comparison').textContent = unchanged ? `Ejemplo reservado: resultado real ${original.resultado_real}. Diferencia frente a scikit-learn: ${Math.abs(p-original.probabilidad_esperada).toExponential(1)}.` : 'Escenario modificado por el usuario. La salida es una predicción, no un resultado real observado.';
}

['cliente','plazo','vigencia','categoria_producto','tipo_documento'].forEach(populateSelect);
loadCase(0);
$('#predict').addEventListener('click', predict);
$$('.case-tab').forEach(tab => tab.addEventListener('click', () => loadCase(Number(tab.dataset.case))));
