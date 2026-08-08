// Генератор темы 1: «Таблица умножения»
// Уровни: easy (2,3,5), medium (вся таблица), hard (со скобкой и вторым действием)
(function () {
  'use strict';

  window.Generators = window.Generators || {};

  var U = window.Utils;

  // Пример на умножение: a × b = ?
  function makeMul(a, b) {
    return {
      topicId: 'multiplication',
      subtype: 'mul',
      text: a + ' × ' + b + ' = ?',
      answer: a * b,
      explanation: a + ' × ' + b + ' = ' + (a * b) + '. Вспомни таблицу умножения на ' + a + '.'
    };
  }

  // Пример на деление без остатка: c ÷ a = b (c = a*b)
  function makeDiv(a, b) {
    var c = a * b;
    return {
      topicId: 'multiplication',
      subtype: 'div',
      text: c + ' ÷ ' + a + ' = ?',
      answer: b,
      explanation: c + ' ÷ ' + a + ' = ' + b + ', потому что ' + a + ' × ' + b + ' = ' + c + '.'
    };
  }

  // Пример с пропуском: a × _ = c или _ × b = c
  function makeGap(a, b) {
    var c = a * b;
    var hideFirst = U.randInt(0, 1) === 0;
    var text = hideFirst ? '_ × ' + b + ' = ' + c : a + ' × _ = ' + c;
    var answer = hideFirst ? a : b;
    return {
      topicId: 'multiplication',
      subtype: 'gap',
      text: text,
      answer: answer,
      explanation: 'Нужно подобрать число: ' + c + ' ÷ ' + (hideFirst ? b : a) + ' = ' + answer +
        '. Проверка: ' + a + ' × ' + b + ' = ' + c + '.'
    };
  }

  // Сложный уровень: пример со скобкой и вторым действием
  function makeExpr() {
    var kind = U.randInt(0, 3);
    var a, b, c, answer, text, explanation;
    if (kind === 0) {
      // a × (b + c)
      a = U.randInt(2, 5); b = U.randInt(1, 9); c = U.randInt(1, 9);
      answer = a * (b + c);
      text = a + ' × (' + b + ' + ' + c + ') = ?';
      explanation = '1) Сначала скобки: ' + b + ' + ' + c + ' = ' + (b + c) +
        '; 2) ' + a + ' × ' + (b + c) + ' = ' + answer + '.';
    } else if (kind === 1) {
      // (a − b) × c, a > b
      a = U.randInt(3, 15); b = U.randInt(1, a - 1); c = U.randInt(2, 6);
      answer = (a - b) * c;
      text = '(' + a + ' − ' + b + ') × ' + c + ' = ?';
      explanation = '1) Сначала скобки: ' + a + ' − ' + b + ' = ' + (a - b) +
        '; 2) ' + (a - b) + ' × ' + c + ' = ' + answer + '.';
    } else if (kind === 2) {
      // c ÷ (a + b) — подбираем c = k * (a+b), деление без остатка
      a = U.randInt(1, 5); b = U.randInt(1, 5);
      var k = U.randInt(2, 9);
      c = k * (a + b);
      answer = k;
      text = c + ' ÷ (' + a + ' + ' + b + ') = ?';
      explanation = '1) Сначала скобки: ' + a + ' + ' + b + ' = ' + (a + b) +
        '; 2) ' + c + ' ÷ ' + (a + b) + ' = ' + answer + '.';
    } else {
      // a × b + c
      a = U.randInt(2, 9); b = U.randInt(2, 9); c = U.randInt(1, 30);
      answer = a * b + c;
      text = a + ' × ' + b + ' + ' + c + ' = ?';
      explanation = '1) Сначала умножение: ' + a + ' × ' + b + ' = ' + (a * b) +
        '; 2) ' + (a * b) + ' + ' + c + ' = ' + answer + '.';
    }
    return {
      topicId: 'multiplication',
      subtype: 'expr',
      text: text,
      answer: answer,
      explanation: explanation
    };
  }

  window.Generators.multiplication = function (level) {
    if (level === 'hard') {
      return makeExpr();
    }
    // Для easy множители только 2, 3, 5; для medium — вся таблица 2–9
    var base = level === 'easy' ? [2, 3, 5] : [2, 3, 4, 5, 6, 7, 8, 9];
    var a = U.choice(base);
    var b = U.randInt(2, 9);
    var kind = U.choice(['mul', 'div', 'gap']);
    if (kind === 'mul') return makeMul(a, b);
    if (kind === 'div') return makeDiv(a, b);
    return makeGap(a, b);
  };
})();
