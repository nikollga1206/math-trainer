// Генератор темы 3: «Порядок действий»
// Выражения из 2–3 действий со скобками и без. Деление без остатка,
// промежуточные значения целые и неотрицательные.
// Стратегия: строим выражение «от значений», чтобы корректность была гарантирована.
// Уровни: easy — 2 действия без скобок; medium — скобки и деление;
// hard — 3 действия. Все умножения — в рамках таблицы (произведение ≤ 9×9 = 81).
(function () {
  'use strict';

  window.Generators = window.Generators || {};

  var U = window.Utils;

  // a + b × c
  function makeAddMul() {
    var a = U.randInt(2, 50), b = U.randInt(2, 9), c = U.randInt(2, 9);
    var answer = a + b * c;
    return {
      topicId: 'order',
      subtype: 'order',
      text: a + ' + ' + b + ' × ' + c + ' = ?',
      answer: answer,
      explanation: 'Порядок действий: 1) Сначала умножение: ' + b + ' × ' + c + ' = ' + (b * c) +
        '; 2) ' + a + ' + ' + (b * c) + ' = ' + answer + '.'
    };
  }

  // a × b − c, результат неотрицательный
  function makeMulSub() {
    var a = U.randInt(3, 9), b = U.randInt(3, 9);
    var c = U.randInt(1, a * b);
    var answer = a * b - c;
    return {
      topicId: 'order',
      subtype: 'order',
      text: a + ' × ' + b + ' − ' + c + ' = ?',
      answer: answer,
      explanation: 'Порядок действий: 1) Сначала умножение: ' + a + ' × ' + b + ' = ' + (a * b) +
        '; 2) ' + (a * b) + ' − ' + c + ' = ' + answer + '.'
    };
  }

  // (a + b) × c, произведение ≤ 81: сначала выбираем c, затем сумму a + b ≤ 81/c
  function makeParenAddMul() {
    var c = U.randInt(2, 9);
    var maxSum = Math.floor(81 / c);
    var sum = U.randInt(4, maxSum); // минимум 2 + 2
    var a = U.randInt(2, sum - 2);
    var b = sum - a;
    var answer = sum * c;
    return {
      topicId: 'order',
      subtype: 'order',
      text: '(' + a + ' + ' + b + ') × ' + c + ' = ?',
      answer: answer,
      explanation: 'Порядок действий: 1) Сначала скобки: ' + a + ' + ' + b + ' = ' + sum +
        '; 2) ' + sum + ' × ' + c + ' = ' + answer + '.'
    };
  }

  // a − b ÷ c: выбираем частное q, делимое b = c*q, a ≥ q
  function makeSubDiv() {
    var c = U.randInt(2, 9), q = U.randInt(2, 9);
    var b = c * q;
    var a = U.randInt(q, q + 50);
    var answer = a - q;
    return {
      topicId: 'order',
      subtype: 'order',
      text: a + ' − ' + b + ' ÷ ' + c + ' = ?',
      answer: answer,
      explanation: 'Порядок действий: 1) Сначала деление: ' + b + ' ÷ ' + c + ' = ' + q +
        '; 2) ' + a + ' − ' + q + ' = ' + answer + '.'
    };
  }

  // (a − b) ÷ c: выбираем частное q, a = b + c*q
  function makeParenSubDiv() {
    var c = U.randInt(2, 9), q = U.randInt(2, 9);
    var b = U.randInt(1, 20);
    var a = b + c * q;
    return {
      topicId: 'order',
      subtype: 'order',
      text: '(' + a + ' − ' + b + ') ÷ ' + c + ' = ?',
      answer: q,
      explanation: 'Порядок действий: 1) Сначала скобки: ' + a + ' − ' + b + ' = ' + (a - b) +
        '; 2) ' + (a - b) + ' ÷ ' + c + ' = ' + q + '.'
    };
  }

  // a × b + c × d (3 действия), все множители однозначные
  function makeMulAddMul() {
    var a = U.randInt(2, 9), b = U.randInt(2, 9), c = U.randInt(2, 9), d = U.randInt(2, 9);
    var answer = a * b + c * d;
    return {
      topicId: 'order',
      subtype: 'order',
      text: a + ' × ' + b + ' + ' + c + ' × ' + d + ' = ?',
      answer: answer,
      explanation: 'Порядок действий: 1) ' + a + ' × ' + b + ' = ' + (a * b) +
        '; 2) ' + c + ' × ' + d + ' = ' + (c * d) +
        '; 3) ' + (a * b) + ' + ' + (c * d) + ' = ' + answer + '.'
    };
  }

  // a × b − c × d (3 действия), результат неотрицательный: c*d < a*b
  function makeMulSubMul() {
    var a = U.randInt(3, 9), b = U.randInt(3, 9);
    var p1 = a * b;
    // Подбираем второе произведение строго меньше первого
    var c, d, p2;
    do {
      c = U.randInt(2, 9); d = U.randInt(2, 9);
      p2 = c * d;
    } while (p2 >= p1);
    var answer = p1 - p2;
    return {
      topicId: 'order',
      subtype: 'order',
      text: a + ' × ' + b + ' − ' + c + ' × ' + d + ' = ?',
      answer: answer,
      explanation: 'Порядок действий: 1) ' + a + ' × ' + b + ' = ' + p1 +
        '; 2) ' + c + ' × ' + d + ' = ' + p2 +
        '; 3) ' + p1 + ' − ' + p2 + ' = ' + answer + '.'
    };
  }

  var BY_LEVEL = {
    easy: [makeAddMul, makeMulSub],
    medium: [makeParenAddMul, makeSubDiv, makeParenSubDiv],
    hard: [makeMulAddMul, makeMulSubMul]
  };

  window.Generators.order = function (level) {
    var makers = BY_LEVEL[level] || BY_LEVEL.medium;
    return U.choice(makers)();
  };
})();
