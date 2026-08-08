// Генератор темы 6: «Единицы массы» (г, кг, ц, т)
// Подтипы: convert (перевод), compare (сравнение > < =),
// calc (сложение/вычитание именованных чисел — сложный уровень)
(function () {
  'use strict';

  window.Generators = window.Generators || {};

  var U = window.Utils;

  // Соотношения единиц в граммах
  var UNITS = [
    { name: 'г', factor: 1 },
    { name: 'кг', factor: 1000 },
    { name: 'ц', factor: 100000 },
    { name: 'т', factor: 1000000 }
  ];
  var UNIT_NAMES = UNITS.map(function (u) { return u.name; });

  function ratioText(from, to) {
    var f = from.factor / to.factor;
    if (f >= 1) return '1 ' + from.name + ' = ' + f + ' ' + to.name;
    return '1 ' + to.name + ' = ' + (to.factor / from.factor) + ' ' + from.name;
  }

  // Перевод единиц
  // easyOnly — только пара кг↔г
  function makeConvert(easyOnly) {
    var fromIdx, toIdx;
    if (easyOnly) {
      fromIdx = 1; // кг
      toIdx = 0;   // г
    } else {
      fromIdx = U.randInt(1, UNITS.length - 1);
      toIdx = U.randInt(0, fromIdx - 1);
    }
    var from = UNITS[fromIdx];
    var to = UNITS[toIdx];
    var maxN = Math.max(2, Math.floor(9000 / (from.factor / to.factor)));
    var n = U.randInt(1, Math.min(9, maxN));
    var answer = n * (from.factor / to.factor);
    var withOptions = U.randInt(0, 1) === 0;
    var task = {
      topicId: 'mass',
      subtype: 'convert',
      text: n + ' ' + from.name + ' = _ ' + (withOptions ? '?' : to.name),
      answer: answer,
      explanation: ratioText(from, to) + ', значит ' + n + ' ' + from.name + ' = ' +
        answer + ' ' + to.name + '.'
    };
    if (withOptions) {
      task.unitOptions = UNIT_NAMES;
      task.answerUnit = to.name;
    } else {
      task.unit = to.name;
    }
    return task;
  }

  // Сравнение величин
  function makeCompare() {
    var i1 = U.randInt(0, UNITS.length - 1);
    var i2 = U.randInt(0, UNITS.length - 1);
    var u1 = UNITS[i1];
    var u2 = UNITS[i2];
    var v1 = U.randInt(1, 900);
    var v2 = U.randInt(1, 900);
    if (U.randInt(0, 3) === 0 && i1 !== i2) {
      // Иногда равные величины
      var base = U.randInt(1, 5);
      var cand = base * u2.factor / u1.factor;
      if (cand % 1 === 0 && cand >= 1 && cand <= 9000) { v1 = cand; v2 = base; }
    }
    var left = v1 * u1.factor;
    var right = v2 * u2.factor;
    var sign = left > right ? '>' : left < right ? '<' : '=';
    return {
      topicId: 'mass',
      subtype: 'compare',
      text: v1 + ' ' + u1.name + ' _ ' + v2 + ' ' + u2.name,
      answer: sign,
      explanation: 'Переведём в граммы: ' + v1 + ' ' + u1.name + ' = ' + left + ' г, ' +
        v2 + ' ' + u2.name + ' = ' + right + ' г. Значит ' + v1 + ' ' + u1.name + ' ' +
        sign + ' ' + v2 + ' ' + u2.name + '.'
    };
  }

  // Сложение/вычитание именованных чисел (составные), ответ в мелкой единице.
  // Пример: 2 кг 300 г + 450 г = _ г
  function makeCalc() {
    var op = U.choice(['+', '−']);
    // Пары (крупная, мелкая): кг/г, ц/кг, т/ц, т/кг
    var pairs = [[1, 0], [2, 1], [3, 2], [3, 1]];
    var pair = U.choice(pairs);
    var big = UNITS[pair[0]];
    var small = UNITS[pair[1]];
    var ratio = big.factor / small.factor;
    var n1 = U.randInt(1, 5);
    // «Красивая» часть крупной единицы: s1 * small.factor < big.factor
    var maxS1 = Math.min(9 * (ratio >= 100 ? 10 : 1), Math.floor(ratio / 2));
    var s1 = U.randInt(1, maxS1) * (ratio >= 100 ? 10 : 1);
    if (s1 * small.factor >= big.factor) s1 = Math.floor(ratio / 2);
    var total1 = n1 * big.factor + s1 * small.factor; // в мелких единицах
    // При вычитании результат должен остаться неотрицательным
    var maxS2 = op === '+' ? 900 : Math.max(1, Math.floor(total1 / small.factor) - 1);
    var s2 = U.randInt(1, Math.min(900, maxS2));
    var total2 = s2 * small.factor;
    var result, text, explOp;
    if (op === '+') {
      result = total1 + total2;
      text = n1 + ' ' + big.name + ' ' + s1 + ' ' + small.name + ' + ' + s2 + ' ' + small.name + ' = _ ' + small.name;
      explOp = n1 + ' ' + big.name + ' ' + s1 + ' ' + small.name + ' = ' + total1 + ' ' + small.name +
        '; ' + total1 + ' + ' + s2 + ' = ' + result + ' ' + small.name + '.';
    } else {
      result = total1 - total2;
      text = n1 + ' ' + big.name + ' ' + s1 + ' ' + small.name + ' − ' + s2 + ' ' + small.name + ' = _ ' + small.name;
      explOp = n1 + ' ' + big.name + ' ' + s1 + ' ' + small.name + ' = ' + total1 + ' ' + small.name +
        '; ' + total1 + ' − ' + s2 + ' = ' + result + ' ' + small.name + '.';
    }
    return {
      topicId: 'mass',
      subtype: 'calc',
      text: text,
      answer: result / small.factor,
      unit: small.name,
      explanation: ratioText(big, small) + '. ' + explOp
    };
  }

  // Уровни: easy — перевод кг↔г; medium — остальные переводы и сравнение;
  // hard — составные задачи (сложение/вычитание именованных чисел).
  window.Generators.mass = function (level) {
    if (level === 'easy') return makeConvert(true);
    if (level === 'hard') return makeCalc();
    return U.choice([function () { return makeConvert(false); }, makeCompare])();
  };
})();
