const bundle = window.MODEL_BUNDLE;
const $ = (selector) => document.querySelector(selector);

function treeProbability(tree, vector) {
  let node = 0;
  while (tree.children_left[node] !== -1) {
    node = vector[tree.feature[node]] <= tree.threshold[node]
      ? tree.children_left[node]
      : tree.children_right[node];
  }
  const counts = tree.value[node];
  return counts[1] / (counts[0] + counts[1]);
}

function forestProbability(vector) {
  const total = bundle.arboles.reduce((sum, tree) => sum + treeProbability(tree, vector), 0);
  return total / bundle.arboles.length;
}

function optionFor(field, value) {
  const options = bundle.preprocesamiento.categoricas[field].options;
  return options.find((option) => option.value === value) || options.at(-1);
}

function populateSelect(field) {
  const options = bundle.preprocesamiento.categoricas[field].options;
  $('#' + field).innerHTML = options
    .map((option) => `<option value="${option.value}">${option.label}</option>`)
    .join('');
}

function buildVector() {
  const prep = bundle.preprocesamiento;
  const categorical = new Array(prep.categorical_width).fill(0);

  ['cliente', 'plazo', 'vigencia', 'categoria_producto', 'tipo_documento'].forEach((field) => {
    const metadata = prep.categoricas[field];
    const value = field === 'tipo_documento' ? 'cotizacion' : $('#' + field).value;
    optionFor(field, value).block.forEach((encodedValue, index) => {
      categorical[metadata.offset + index] = encodedValue;
    });
  });

  const date = new Date($('#fecha').value + 'T12:00:00');
  const numeric = [Math.log1p(Number($('#precio').value)), 0, date.getFullYear(), date.getMonth() + 1];
  const scaled = numeric.map(
    (value, index) => (value - prep.numericas.mean[index]) / prep.numericas.scale[index]
  );
  return categorical.concat(scaled);
}

function resetResult() {
  $('#gauge').style.setProperty('--p', '0deg');
  $('#probability').textContent = '—';
  $('#decision').className = 'decision neutral';
  $('#decision').textContent = 'Esperando cálculo';
  $('#comparison').textContent = 'Ingrese la información y calcule la predicción.';
}

function predict() {
  if (!$('#prediction-form').reportValidity()) return;

  const probability = forestProbability(buildVector());
  const approved = probability >= bundle.umbral;
  const percentage = (probability * 100).toFixed(1).replace('.', ',');

  $('#gauge').style.setProperty('--p', `${probability * 360}deg`);
  $('#probability').textContent = `${percentage} %`;
  $('#decision').className = `decision ${approved ? 'high' : 'normal'}`;
  $('#decision').textContent = approved ? 'Predicción: Aprobada' : 'Predicción: Rechazada';
  $('#comparison').textContent = approved
    ? 'La probabilidad estimada alcanza o supera el umbral de aprobación del 38 %.'
    : 'La probabilidad estimada es inferior al umbral de aprobación del 38 %.';
}

['cliente', 'plazo', 'vigencia', 'categoria_producto'].forEach(populateSelect);

const defaultClient = bundle.preprocesamiento.categoricas.cliente.options
  .find((option) => option.value === 'cliente_nuevo');
if (defaultClient) $('#cliente').value = defaultClient.value;

$('#prediction-form').addEventListener('input', resetResult);
$('#predict').addEventListener('click', predict);
resetResult();
