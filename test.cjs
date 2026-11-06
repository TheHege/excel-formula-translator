const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const context = vm.createContext({});
vm.runInContext('const FUNCTIONS = ' + fs.readFileSync(path.join(__dirname,'dictionary.json'),'utf8') + ';' + fs.readFileSync(path.join(__dirname,'core.js'),'utf8'), context);
const translate = (input, options) => context.translateFormula(input, options);
const cases = [
  ['=count(A1:A20)', '=СЧЁТ(A1:A20)'],
  ['COUNT(A1,2)', '=СЧЁТ(A1;2)'],
  ['=IF(COUNTIF(A1:A10,"yes, no; maybe")>0,1.5,"COUNT stays here")', '=ЕСЛИ(СЧЁТЕСЛИ(A1:A10;"yes, no; maybe")>0;1,5;"COUNT stays here")'],
  ['=ROUND(STDEV.S(B2:B31)/SQRT(COUNT(B2:B31)),2)', '=ОКРУГЛ(СТАНДОТКЛОН.В(B2:B31)/КОРЕНЬ(СЧЁТ(B2:B31));2)'],
  ['=SUM({1.5,2;3,4})', '=СУММ({1,5\\2;3\\4})'],
  ['=SUM({"a,b",2.3;"c;d",4})', '=СУММ({"a,b"\\2,3;"c;d"\\4})'],
  ['=IF(A1="He said ""COUNT(1,2)""",TRUE,FALSE)', '=ЕСЛИ(A1="He said ""COUNT(1,2)""";ИСТИНА;ЛОЖЬ)'],
  ["=SUM('John''s, 1.5'!A1,'COUNT(1,2)'!B2)", "=СУММ('John''s, 1.5'!A1;'COUNT(1,2)'!B2)"],
  ['=SUM(Table1[[#Headers],[Price, 1.5]])', '=СУММ(Table1[[#Headers],[Price, 1.5]])'],
  ["=SUM(Table1[Price']and,1.5])", "=СУММ(Table1[Price']and,1.5])"],
  ['=IFERROR(INDEX(A1:A4,MATCH(B1,C1:C4,0)),"a,b")', '=ЕСЛИОШИБКА(ИНДЕКС(A1:A4;ПОИСКПОЗ(B1;C1:C4;0));"a,b")'],
  ['=SUM(-.5,1.25E-3,3.,25%)', '=СУММ(-,5;1,25E-3;3,;25%)'],
  ['=LOG10(100)+A1+A10+My_count', '=LOG10(100)+A1+A10+My_count'],
  ['=SUM(TRUE!A1,TRUE,FALSE())', '=СУММ(TRUE!A1;ИСТИНА;ЛОЖЬ())'],
  ['=IF(TRUE,#N/A,#VALUE!)', '=ЕСЛИ(ИСТИНА;#Н/Д;#ЗНАЧ!)'],
  ['=SUM(A1#,B2)', '=СУММ(A1#;B2)'],
  ['=_xlfn._xlws.FILTER(A1:A3,B1:B3>0)', '=_xlfn._xlws.ФИЛЬТР(A1:A3;B1:B3>0)'],
  ['=MyCustomFunction(A1,1.5)', '=MyCustomFunction(A1;1,5)'],
  ['=SUM(A1;2.5)', '=СУММ(A1;2,5)'],
  ['=SUM(\n A1,\n 2.5\n)', '=СУММ(\n A1;\n 2,5\n)'],
  ['', ''],
];
for (const [input, expected] of cases) assert.equal(translate(input).text, expected, input);
assert.equal(translate('=SUM(1.5,2)', {decimal:'.'}).text, '=СУММ(1.5;2)');
assert.ok(translate('=BOGUS(A1)').warnings.some(x=>x.includes('BOGUS')));
for (const formula of ['=SUM(A1', '=SUM(A1))', '=SUM("abc)', "=SUM('Sheet!A1)", '=SUM(Table1[A1)']) assert.ok(translate(formula).warnings.length, formula);
assert.equal(translate('=СЧЕТ(A1)').warnings.length,0);
assert.equal(translate('=COUNT(A1)').warnings.length,0);
assert.equal(translate('=SUM({1,2;3,4})').warnings.length,0);
assert.ok(translate('x'.repeat(200001)).warnings.length);
const reverse = (input, decimal = ',') => translate(input, {direction:'ru-en', decimal});
const reverseCases = [
  ['=счёт(A1:A20)', '=COUNT(A1:A20)'],
  ['=СЧЕТ(A1;2)', '=COUNT(A1,2)'],
  ['=ЕСЛИ(СЧЁТЕСЛИ(A1:A10;"yes, no; maybe")>0;1,5;"COUNT stays here")', '=IF(COUNTIF(A1:A10,"yes, no; maybe")>0,1.5,"COUNT stays here")'],
  ['=ОКРУГЛ(СТАНДОТКЛОН.В(B2:B31)/КОРЕНЬ(СЧЁТ(B2:B31));2)', '=ROUND(STDEV.S(B2:B31)/SQRT(COUNT(B2:B31)),2)'],
  ['=СУММ({1,5\\2;3\\4})', '=SUM({1.5,2;3,4})'],
  ['=СУММ({ИСТИНА\\ЛОЖЬ;1,2\\3,4})', '=SUM({TRUE,FALSE;1.2,3.4})'],
  ['=СУММ({"a,b"\\2,3;"c;d"\\4})', '=SUM({"a,b",2.3;"c;d",4})'],
  ['=ЕСЛИ(A1="Он сказал ""СЧЁТ(1;2)""";ИСТИНА;ЛОЖЬ())', '=IF(A1="Он сказал ""СЧЁТ(1;2)""",TRUE,FALSE())'],
  ["=СУММ('John''s; 1,5'!A1;'СЧЁТ(1;2)'!B2)", "=SUM('John''s; 1,5'!A1,'СЧЁТ(1;2)'!B2)"],
  ['=СУММ(Table1[[#Headers],[Price; 1,5]])', '=SUM(Table1[[#Headers],[Price; 1,5]])'],
  ['=СУММ(-,5;1,25E-3;3,;25%)', '=SUM(-.5,1.25E-3,3.,25%)'],
  ['=СУММ(ИСТИНА!A1;ИСТИНА;ЛОЖЬ)', '=SUM(ИСТИНА!A1,TRUE,FALSE)'],
  ['=ЕСЛИ(ИСТИНА;#Н/Д;#ЗНАЧ!)', '=IF(TRUE,#N/A,#VALUE!)'],
  ['=ЕСЛИОШИБКА(A1/B1;#ДЕЛ/0!)', '=IFERROR(A1/B1,#DIV/0!)'],
  ['=СУММ(A1#;B2)', '=SUM(A1#,B2)'],
  ['=_xlfn._xlws.ФИЛЬТР(A1:A3;B1:B3>0)', '=_xlfn._xlws.FILTER(A1:A3,B1:B3>0)'],
  ['=МояФункция(A1;1,5)', '=МояФункция(A1,1.5)'],
  ['', ''],
];
for (const [input, expected] of reverseCases) assert.equal(reverse(input).text, expected, input);
assert.equal(reverse('=СУММ(1.5;2)', '.').text, '=SUM(1.5,2)');
assert.equal(reverse('=СУММ({1.5\\2;3\\4})', '.').text, '=SUM({1.5,2;3,4})');
assert.equal(reverse('=COUNT(A1)').warnings.length, 0);
assert.ok(reverse('=МояФункция(A1)').warnings.some(x=>x.includes('МояФункция')));
for (const [en] of cases.slice(2, 17)) {
  // Canonical English formulas survive translation in both directions.
  assert.equal(reverse(translate(en).text).text, en, 'Round trip: ' + en);
}
// Every embedded dictionary key is a syntactically valid function token.
const dict=JSON.parse(fs.readFileSync(path.join(__dirname,'dictionary.json'),'utf8'));
for (const [en,ru] of Object.entries(dict)) {
  assert.match(en,/^[A-Z][A-Z0-9_.]*$/);
  assert.match(ru,/^[\p{L}\p{N}_.]+$/u);
  assert.equal(translate('='+en+'(A1)').text,'='+ru+'(A1)');
  assert.equal(reverse('='+ru+'(A1)').text,'='+en+'(A1)');
}
// Validate JavaScript in the delivered file, rather than just source fragments.
const html=fs.readFileSync(path.join(__dirname,'Переводчик формул.html'),'utf8');
new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
assert.ok(!/<script[^>]+src=|<link[^>]+href=|fetch\(|XMLHttpRequest/.test(html));
// Exercise the delivered app's event handlers and direction state without dependencies.
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size, ids.length, 'Unique element IDs');
function element() { return {
  value:'', textContent:'', checked:false, listeners:{},
  addEventListener(type,fn){this.listeners[type]=fn;},
  replaceChildren(...children){this.children=children;},
  focus(){}, select(){},
  fire(type){return this.listeners[type]?.();}
}; }
const elements=Object.fromEntries(ids.map(id=>[id,element()]));
elements.decimal.value=',';
const examples=[...html.matchAll(/data-example="([^"]+)"/g)].map(m=>Object.assign(element(),{dataset:{example:m[1]}}));
const document={
  getElementById(id){assert.ok(elements[id], 'Element exists: '+id);return elements[id];},
  createElement:element, querySelectorAll:()=>examples, addEventListener(){},
};
const ui=vm.createContext({document, navigator:{},setTimeout,clearTimeout});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],ui);
elements.input.value='=IF(A1>1.5,COUNT(B1:B5),"a,b; 1.2")';
elements.input.fire('input');
const original=elements.input.value;
const translated=elements.output.value;
assert.equal(translated,'=ЕСЛИ(A1>1,5;СЧЁТ(B1:B5);"a,b; 1.2")');
elements.swap.fire('click');
assert.equal(elements.input.value,translated);
assert.equal(elements.output.value,original);
assert.equal(elements.inputLang.textContent,'RU');
assert.equal(elements.outputLang.textContent,'EN');
assert.equal(elements.decimalLabel.textContent,'Дроби в исходной формуле');
elements.swap.fire('click');
assert.equal(elements.input.value,original);
assert.equal(elements.output.value,translated);
assert.equal(elements.inputLang.textContent,'EN');
assert.equal(elements.outputLang.textContent,'RU');
elements.decimal.value='.';
elements.decimal.fire('change');
assert.ok(elements.output.value.includes('>1.5;'));
elements.swap.fire('click');
assert.equal(elements.output.value,original);
elements.clear.fire('click');
assert.equal(elements.output.value,'');
assert.equal(elements.copy.disabled,true);
examples.find(e=>e.dataset.example==='array').fire('click');
assert.equal(elements.input.value,'=СУММ({1.5\\2;3\\4})');
assert.equal(elements.output.value,'=SUM({1.5,2;3,4})');
elements.decimal.value=',';
elements.decimal.fire('change');
elements.batch.checked=true;
elements.input.value='=СЧЕТ(A1)\n\n=СУММ(1,5;2)';
elements.batch.fire('change');
assert.equal(elements.output.value,'=COUNT(A1)\n\n=SUM(1.5,2)');
elements.swap.fire('click');
assert.equal(elements.output.value,'=СЧЁТ(A1)\n\n=СУММ(1,5;2)');
console.log(`Passed ${cases.length + reverseCases.length} formula cases, bidirectional decimal/array/quote checks, ${Object.keys(dict).length} dictionary round trips, swap/batch/example UI events, standalone syntax and offline checks.`);
