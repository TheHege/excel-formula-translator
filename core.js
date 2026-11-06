/* A small lexer: quoted literals and reference labels are opaque tokens. */
const normalizeFunction = name => name.toUpperCase().replaceAll('Ё', 'Е');
const REVERSE_FUNCTIONS = Object.freeze(Object.fromEntries(
  Object.entries(FUNCTIONS).map(([en, ru]) => [normalizeFunction(ru), en])
));
const TARGET_FUNCTIONS = new Set(Object.values(FUNCTIONS).map(normalizeFunction));
const ERRORS = Object.freeze({'#DIV/0!':'#ДЕЛ/0!', '#VALUE!':'#ЗНАЧ!', '#REF!':'#ССЫЛКА!', '#NAME?':'#ИМЯ?', '#NUM!':'#ЧИСЛО!', '#N/A':'#Н/Д', '#NULL!':'#ПУСТО!', '#SPILL!':'#ПЕРЕНОС!', '#CALC!':'#ВЫЧИСЛ!'});
const REVERSE_ERRORS = Object.freeze(Object.fromEntries(Object.entries(ERRORS).map(([en, ru]) => [ru, en])));
function translateFormula(input, options = {}) {
  const reverse = options.direction === 'ru-en';
  const russianDecimal = options.decimal || ',';
  const inputDecimal = reverse ? russianDecimal : '.';
  const outputDecimal = reverse ? '.' : russianDecimal;
  const dictionary = reverse ? REVERSE_FUNCTIONS : FUNCTIONS;
  const warnings = new Set(), unknown = new Set(), changed = new Map();
  const stack = [];
  let text = input.trim(), out = '', i = 0, arrays = 0;
  if (!text) return { text: '', warnings: [], changed: [] };
  if (!text.startsWith('=')) text = '=' + text;
  if (text.length > 200000) return { text: '', warnings: ['Слишком длинная формула: максимум 200 000 символов.'], changed: [] };
  const record = (a, b) => { if (a !== b) changed.set(a, b); return b; };
  while (i < text.length) {
    const c = text[i];
    if (c === '"' || c === "'") {
      const start = i++, quote = c;
      let closed = false;
      while (i < text.length) {
        if (text[i++] === quote) {
          if (text[i] === quote) { i++; continue; }
          closed = true; break;
        }
      }
      if (!closed) warnings.add(quote === '"' ? 'Не закрыты двойные кавычки.' : 'Не закрыты кавычки в имени листа.');
      out += text.slice(start, i); continue;
    }
    if (c === '[') {
      const start = i++; let depth = 1;
      while (i < text.length && depth) {
        // Apostrophes escape special characters in structured references.
        if (text[i] === "'" && /[\[\]#'@]/.test(text[i + 1] || '')) { i += 2; continue; }
        if (text[i] === '[') depth++;
        if (text[i] === ']') depth--;
        i++;
      }
      if (depth) warnings.add('Не закрыта квадратная скобка в ссылке.');
      out += text.slice(start, i); continue;
    }
    if (c === '#') {
      const errors = reverse ? REVERSE_ERRORS : ERRORS;
      const error = Object.keys(errors).find(name => text.slice(i, i + name.length).toUpperCase() === name);
      if (error) {
        out += record(text.slice(i, i + error.length), errors[error]); i += error.length; continue;
      }
    }
    if (reverse && arrays && c === '\\') { out += ','; i++; continue; }
    if (/[\p{L}_\\]/u.test(c)) {
      const tokenPattern = reverse && arrays ? /^[\p{L}\p{N}_.?]+/u : /^[\p{L}\p{N}_.\\?]+/u;
      const token = text.slice(i).match(tokenPattern)[0];
      const tail = text.slice(i + token.length);
      const key = token.replace(/^(?:_xlfn\.|_xlws\.)+/i, '').toUpperCase();
      const prefix = token.slice(0, token.length - key.length);
      const lookupKey = reverse ? normalizeFunction(key) : key;
      if (/^\s*\(/.test(tail)) {
        if (Object.hasOwn(dictionary, lookupKey)) out += record(token, prefix + dictionary[lookupKey]);
        else {
          out += token;
          const knownTarget = reverse ? Object.hasOwn(FUNCTIONS, key) : TARGET_FUNCTIONS.has(normalizeFunction(key));
          if (!knownTarget) unknown.add(token);
        }
      } else if ((reverse ? lookupKey === 'ИСТИНА' || lookupKey === 'ЛОЖЬ' : key === 'TRUE' || key === 'FALSE') && !/^\s*[!\[:]/.test(tail)) out += record(token, dictionary[lookupKey]);
      else out += token;
      i += token.length; continue;
    }
    if (/\d/.test(c) || (c === inputDecimal && /\d/.test(text[i + 1] || ''))) {
      const numberPattern = inputDecimal === ',' ? /^(?:\d+(?:,\d*)?|,\d+)(?:[Ee][+-]?\d+)?/ : /^(?:\d+(?:\.\d*)?|\.\d+)(?:[Ee][+-]?\d+)?/;
      const n = text.slice(i).match(numberPattern)[0];
      out += n.replace(inputDecimal, outputDecimal); i += n.length; continue;
    }
    if (c === '{' || c === '(') { stack.push(c); if (c === '{') arrays++; }
    if (c === '}' || c === ')') {
      const expected = c === '}' ? '{' : '(';
      if (stack.at(-1) === expected) stack.pop();
      else warnings.add('Проверь скобки: есть лишняя или перепутанная закрывающая скобка.');
      if (c === '}') arrays = Math.max(0, arrays - 1);
    }
    if (reverse && c === ';') out += arrays ? ';' : ',';
    else if (!reverse && c === ',') out += arrays ? '\\' : ';';
    else out += c;
    i++;
  }
  if (stack.length) warnings.add('Проверь скобки: не все открывающие скобки закрыты.');
  if (unknown.size) warnings.add('Нет в словаре, оставлено как есть: ' + [...unknown].join(', ') + '.');
  return { text: out, warnings: [...warnings], changed: [...changed] };
}
