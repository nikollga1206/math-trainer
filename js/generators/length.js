// Генератор темы 4: «Единицы длины» (мм, см, дм, м, км)
// Подтипы: convert (перевод), compare (сравнение > < =), calc (сложение/вычитание)
(function () {
  'use strict';

  window.Generators = window.Generators || {};

  var U = window.Utils;

  // Соотношения единиц в миллиметрах
  var UNITS = [
    { name: 'мм', factor: 1 },
    { name: 'см', factor: 10 },
    { name: 'дм', factor: 100 },
    { name: 'м', factor: 1000 },
    { name: 'км', factor: 1000000 }
  ];

  // Человеческое описание соотношения для пояснений
  function ratioText(from, to) {
    var f = from.factor / to.factor;
    if (f >= 1) return '1 ' + from.name + ' = ' + f + ' ' + to.name;
    return '1 ' + to.name + ' = ' + (to.factor / from.factor) + ' ' + from.name;
  }

  // Перевод: из крупной единицы в мелкую (реже наоборот, с целым результатом)
  // easyOnly — только соседние единицы с шагом 10 (мм↔см, см↔дм, дм↔м)
  function makeConvert(easyOnly) {
    var fromIdx, toIdx;
    if (easyOnly) {
      // Пары с шагом 10: (см,мм), (дм,см), (м,дм)
      fromIdx = U.randInt(1, 3);
      toIdx = fromIdx - 1;
    } else {
      // Берём соседние или близкие единицы, чтобы числа были разумными
      fromIdx = U.randInt(1, UNITS.length - 1);
      toIdx = U.randInt(0, fromIdx - 1);
    }
    var from = UNITS[fromIdx];
    var to = UNITS[toIdx];
    // Ограничиваем множитель, чтобы не получались гигантские числа
    var maxN = Math.max(2, Math.floor(2000 / (from.factor / to.factor)));
    var n = U.randInt(1, Math.min(9, maxN));
    var answer = n * (from.factor / to.factor);
    // Единица ответа всегда зафиксирована в условии («3 дм = _ см»),
    // выпадающего списка выбора единицы нет
    return {
      topicId: 'length',
      subtype: 'convert',
      text: n + ' ' + from.name + ' = _ ' + to.name,
      answer: answer,
      unit: to.name,
      explanation: ratioText(from, to) + ', значит ' + n + ' ' + from.name + ' = ' +
        n + ' × ' + (from.factor / to.factor) + ' = ' + answer + ' ' + to.name + '.'
    };
  }

  // Сравнение величин: X ед1 _ Y ед2
  function makeCompare() {
    var i1 = U.randInt(0, UNITS.length - 1);
    var i2 = U.randInt(0, UNITS.length - 1);
    var u1 = UNITS[i1];
    var u2 = UNITS[i2];
    var v1, v2;
    if (U.randInt(0, 3) === 0 && i1 !== i2) {
      // Иногда делаем равные величины (для ответа «=»)
      var base = U.randInt(1, 5);
      v1 = base * u2.factor / u1.factor;
      if (v1 % 1 !== 0 || v1 < 1) { v1 = U.randInt(1, 90); v2 = U.randInt(1, 90); }
      else { v2 = base; }
    } else {
      v1 = U.randInt(1, 90);
      v2 = U.randInt(1, 90);
    }
    var left = v1 * u1.factor;
    var right = v2 * u2.factor;
    var sign = left > right ? '>' : left < right ? '<' : '=';
    return {
      topicId: 'length',
      subtype: 'compare',
      text: v1 + ' ' + u1.name + ' _ ' + v2 + ' ' + u2.name,
      answer: sign,
      explanation: 'Переведём в одни единицы. ' + v1 + ' ' + u1.name + ' = ' + left + ' мм, ' +
        v2 + ' ' + u2.name + ' = ' + right + ' мм. ' + left + ' ' + sign + ' ' + right +
        ', значит ' + v1 + ' ' + u1.name + ' ' + sign + ' ' + v2 + ' ' + u2.name + '.'
    };
  }

  // Сложение/вычитание именованных чисел, ответ в мелкой единице
  function makeCalc() {
    var op = U.choice(['+', '−']);
    // Работаем в паре крупная+мелкая единица, например м и см
    var pairs = [[3, 1], [3, 0], [2, 1], [4, 3]]; // индексы UNITS: (м,см), (м,мм), (дм,см), (км,м)
    var pair = U.choice(pairs);
    var big = UNITS[pair[0]];
    var small = UNITS[pair[1]];
    var n1 = U.randInt(1, 5);
    var s1 = U.randInt(1, 9) * (small.factor >= 10 && big.factor / small.factor >= 100 ? 10 : 1);
    // Чтобы s1 было «красивой» частью крупной единицы, ограничим
    if (s1 * small.factor >= big.factor) s1 = Math.floor(big.factor / small.factor / 2);
    var total1 = n1 * big.factor + s1 * small.factor; // уменьшаемое/первое слагаемое в мм
    // При вычитании s2 не должно превышать total1, чтобы результат был неотрицательным
    var maxS2 = op === '+' ? 90 : Math.max(1, Math.floor(total1 / small.factor) - 1);
    var s2 = U.randInt(1, Math.min(90, maxS2));
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
      topicId: 'length',
      subtype: 'calc',
      text: text,
      answer: result / small.factor,
      unit: small.name,
      explanation: ratioText(big, small) + '. ' + explOp
    };
  }

  // Уровни: easy — перевод соседних единиц с шагом 10; medium — остальные
  // переводы и сравнение; hard — сложение/вычитание именованных чисел.
  window.Generators.length = function (level) {
    if (level === 'easy') return makeConvert(true);
    if (level === 'hard') return makeCalc();
    return U.choice([function () { return makeConvert(false); }, makeCompare])();
  };
})();
