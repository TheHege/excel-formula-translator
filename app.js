const $ = id => document.getElementById(id);
const examples = {
  count: '=COUNT(A1:A20)',
  stats: '=ROUND(STDEV.S(B2:B31)/SQRT(COUNT(B2:B31)),2)',
  quotes: '=IF(COUNTIF(A1:A10,"yes, no; maybe")>0,1.5,"COUNT stays here")',
  array: '=SUM({1.5,2;3,4})'
};
let copyTimer, direction = 'en-ru';
function updateDirection() {
  const reverse = direction === 'ru-en';
  $('sourceLanguage').textContent = reverse ? 'Русский' : 'Английский';
  $('targetLanguage').textContent = reverse ? 'Английский' : 'Русский';
  $('inputLang').textContent = reverse ? 'RU' : 'EN';
  $('outputLang').textContent = reverse ? 'EN' : 'RU';
  $('outputTitle').textContent = reverse ? 'Для английского Excel' : 'Для русского Excel';
  $('eyebrow').textContent = reverse ? 'EXCEL · RU → EN' : 'EXCEL · EN → RU';
  $('decimalLabel').textContent = reverse ? 'Дроби в исходной формуле' : 'Дроби в результате';
  $('inputHint').textContent = reverse ? 'Русская формула · Знак = добавится сам' : 'Дробные числа на входе: через точку · Знак = добавится сам';
  $('outputHint').textContent = reverse ? 'Аргументы: запятая , · Дробные числа: через точку' : 'Разделитель аргументов: точка с запятой ;';
  const en = '=IF(COUNT(A1:A10)>0,1.5,"no data")';
  const ru = translateFormula(en, {decimal:$('decimal').value}).text;
  $('input').placeholder = reverse ? ru : en;
  $('output').placeholder = reverse ? en : ru;
}
function update() {
  updateDirection();
  const input = $('input').value;
  const chunks = $('batch').checked ? input.split(/\r?\n/) : [input];
  const results = chunks.map(text => translateFormula(text, { decimal: $('decimal').value, direction }));
  $('output').value = results.map(r => r.text).join('\n');
  const warnings = [...new Set(results.flatMap(r => r.warnings))];
  $('warnings').replaceChildren(...warnings.map(text => {
    const p = document.createElement('p'); p.textContent = text; return p;
  }));
  $('warnings').hidden = !warnings.length;
  $('copy').disabled = !$('output').value;
  $('copy').textContent = 'Копировать формулу';
  const changes = new Map(results.flatMap(r => r.changed));
  $('changes').replaceChildren(...[...changes].map(([a,b]) => {
    const el = document.createElement('span'); el.textContent = a + ' → ' + b; return el;
  }));
  $('status').textContent = !input.trim() ? 'Жду формулу' : warnings.length ? 'Есть замечания' : 'Готово к вставке';
  $('status').className = warnings.length ? 'status warn' : 'status';
}
async function copy() {
  if (!$('output').value) return;
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText($('output').value);
    else throw new Error('fallback');
  } catch {
    $('output').focus(); $('output').select();
    if (!document.execCommand('copy')) {
      $('copy').textContent = 'Текст выделен — нажми Ctrl+C'; return;
    }
  }
  $('copy').textContent = 'Скопировано ✓';
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => $('copy').textContent = 'Копировать формулу', 1800);
}
$('input').addEventListener('input', update);
$('batch').addEventListener('change', update);
$('decimal').addEventListener('change', update);
$('swap').addEventListener('click', () => {
  // Carry the translated result over, just like the swap button in a translator.
  const translated = $('output').value;
  if (translated) $('input').value = translated;
  direction = direction === 'en-ru' ? 'ru-en' : 'en-ru';
  update();
});
$('copy').addEventListener('click', copy);
$('clear').addEventListener('click', () => { $('input').value = ''; update(); $('input').focus(); });
document.querySelectorAll('[data-example]').forEach(button => button.addEventListener('click', () => {
  const example = examples[button.dataset.example];
  $('input').value = direction === 'ru-en' ? translateFormula(example, {decimal:$('decimal').value}).text : example;
  update(); $('input').focus();
}));
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); copy(); }
});
$('functionCount').textContent = Object.keys(FUNCTIONS).length;
update();
