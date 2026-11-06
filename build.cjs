const fs = require('node:fs');
const path = require('node:path');
const dir = __dirname;
const dict = JSON.parse(fs.readFileSync(path.join(dir, 'functions.json'), 'utf8'));
for (const name of Object.keys(dict)) if (!/^[A-Z][A-Z0-9_.]*$/.test(name)) delete dict[name];
Object.assign(dict, {
  'CEILING.MATH':'ОКРВВЕРХ.МАТ', CEILING:'ОКРВВЕРХ', FLOOR:'ОКРВНИЗ',
  DOLLAR:'РУБЛЬ', FIND:'НАЙТИ', FINDB:'НАЙТИБ', LEFT:'ЛЕВСИМВ', LEFTB:'ЛЕВБ',
  LEN:'ДЛСТР', LENB:'ДЛИНБ', MID:'ПСТР', MIDB:'ПСТРБ', REPLACE:'ЗАМЕНИТЬ', REPLACEB:'ЗАМЕНИТЬБ',
  RIGHT:'ПРАВСИМВ', RIGHTB:'ПРАВБ', SEARCH:'ПОИСК', SEARCHB:'ПОИСКБ', DVAR:'БДДИСП',
  IFERROR:'ЕСЛИОШИБКА', IFNA:'ЕСНД', IFS:'ЕСЛИМН', SWITCH:'ПЕРЕКЛЮЧ',
  INDEX:'ИНДЕКС', INDIRECT:'ДВССЫЛ', OFFSET:'СМЕЩ', ROW:'СТРОКА', COLUMN:'СТОЛБЕЦ',
  ADDRESS:'АДРЕС', TRANSPOSE:'ТРАНСП', FORMULATEXT:'Ф.ТЕКСТ', GETPIVOTDATA:'ПОЛУЧИТЬ.ДАННЫЕ.СВОДНОЙ.ТАБЛИЦЫ',
  ISBLANK:'ЕПУСТО', ISERROR:'ЕОШИБКА', ISERR:'ЕОШ', ISNA:'ЕНД', ISNUMBER:'ЕЧИСЛО',
  ISLOGICAL:'ЕЛОГИЧ', ISREF:'ЕССЫЛКА', ISNONTEXT:'ЕНЕТЕКСТ', ISODD:'ЕНЕЧЁТ',
  STDEV:'СТАНДОТКЛОН', STDEVP:'СТАНДОТКЛОНП', VAR:'ДИСП', VARP:'ДИСПР',
  CORREL:'КОРРЕЛ', COVAR:'КОВАР', 'COVARIANCE.P':'КОВАРИАЦИЯ.Г', 'COVARIANCE.S':'КОВАРИАЦИЯ.В',
  MODE:'МОДА', 'MODE.SNGL':'МОДА.ОДН', 'MODE.MULT':'МОДА.НСК',
  PERCENTILE:'ПЕРСЕНТИЛЬ', PERCENTRANK:'ПРОЦЕНТРАНГ', QUARTILE:'КВАРТИЛЬ', RANK:'РАНГ',
  FREQUENCY:'ЧАСТОТА', LINEST:'ЛИНЕЙН', LOGEST:'ЛГРФПРИБЛ', TREND:'ТЕНДЕНЦИЯ', GROWTH:'РОСТ',
  FORECAST:'ПРЕДСКАЗ', 'FORECAST.LINEAR':'ПРЕДСКАЗ.ЛИНЕЙН', SLOPE:'НАКЛОН', INTERCEPT:'ОТРЕЗОК',
  RSQ:'КВПИРСОН', PEARSON:'ПИРСОН', STEYX:'СТОШYX', SUMPRODUCT:'СУММПРОИЗВ',
  SUMX2MY2:'СУММРАЗНКВ', SUMX2PY2:'СУММСУММКВ', SUMXMY2:'СУММКВРАЗН',
  AGGREGATE:'АГРЕГАТ', MDETERM:'МОПРЕД', MINVERSE:'МОБР', MMULT:'МУМНОЖ', MUNIT:'МЕДИН',
  CONCAT:'СЦЕП', TEXTJOIN:'ОБЪЕДИНИТЬ', MAXIFS:'МАКСЕСЛИМН', MINIFS:'МИНЕСЛИМН',
  XLOOKUP:'ПРОСМОТРX', XMATCH:'ПОИСКПОЗX', FILTER:'ФИЛЬТР', SORT:'СОРТ', SORTBY:'СОРТПО',
  UNIQUE:'УНИК', SEQUENCE:'ПОСЛЕД', RANDARRAY:'СЛУЧМАССИВ', LET:'LET', LAMBDA:'LAMBDA',
  TEXTSPLIT:'ТЕКСТРАЗД', TEXTBEFORE:'ТЕКСТДО', TEXTAFTER:'ТЕКСТПОСЛЕ',
  NORMDIST:'НОРМРАСП', NORMINV:'НОРМОБР', NORMSDIST:'НОРМСТРАСП', NORMSINV:'НОРМСТОБР',
  TDIST:'СТЬЮДРАСП', TINV:'СТЬЮДРАСПОБР', TTEST:'ТТЕСТ', 'T.TEST':'СТЬЮДЕНТ.ТЕСТ',
  FTEST:'ФТЕСТ', 'F.TEST':'F.ТЕСТ', CHITEST:'ХИ2ТЕСТ', 'CHISQ.TEST':'ХИ2.ТЕСТ',
  CONFIDENCE:'ДОВЕРИТ', POISSON:'ПУАССОН', WEIBULL:'ВЕЙБУЛЛ', ZTEST:'ZТЕСТ',
  DATEDIF:'РАЗНДАТ', CELL:'ЯЧЕЙКА', INFO:'ИНФОРМ', HYPGEOMDIST:'ГИПЕРГЕОМЕТ',
  BINOMDIST:'БИНОМРАСП', EXPONDIST:'ЭКСПРАСП', GAMMADIST:'ГАММАРАСП', GAMMAINV:'ГАММАОБР'
});
const core = fs.readFileSync(path.join(dir, 'core.js'), 'utf8');
const app = fs.readFileSync(path.join(dir, 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(dir, 'template.html'), 'utf8')
  .replace('/* DICTIONARY */', 'const FUNCTIONS = Object.freeze(' + JSON.stringify(dict) + ');')
  .replace('/* CORE */', () => core).replace('/* APP */', () => app);
fs.writeFileSync(path.join(dir, 'Переводчик формул.html'), html);
fs.writeFileSync(path.join(dir, 'index.html'), html);
fs.writeFileSync(path.join(dir, 'dictionary.json'), JSON.stringify(dict, null, 2));
console.log(`Built standalone HTML; ${Object.keys(dict).length} function names.`);
