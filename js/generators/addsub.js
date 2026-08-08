// Генератор темы 2: «Сложение и вычитание»
// Уровни: easy (до 100 без перехода через десяток), medium (до 100 с переходом),
// hard (до 1000: круглые числа и любые). Результат никогда не отрицательный.
(function () {
  'use strict';

  window.Generators = window.Generators || {};

  var U = window.Utils;

  // Проверка: есть ли переход через десяток при сложении
  function addHasCarry(a, b) {
    return (a % 10) + (b % 10) >= 10;
  }

  // Проверка: есть ли переход через десяток при вычитании
  function subHasBorrow(a, b) {
    return (a % 10) < (b % 10);
  }

  // Пояснение сложения по разрядам
  function explainAdd(a, b) {
    var bTens = Math.floor(b / 10) * 10;
    var bOnes = b % 10;
    if (bTens > 0 && bOnes > 0) {
      return a + ' + ' + b + ' = ' + a + ' + ' + bTens + ' + ' + bOnes + ' = ' + (a + bTens) +
        ' + ' + bOnes + ' = ' + (a + b) + '.';
    }
    return a + ' + ' + b + ' = ' + (a + b) + '.';
  }

  // Пояснение вычитания по разрядам
  function explainSub(a, b) {
    var bTens = Math.floor(b / 10) * 10;
    var bOnes = b % 10;
    if (bTens > 0 && bOnes > 0) {
      return a + ' − ' + b + ' = ' + a + ' − ' + bTens + ' − ' + bOnes + ' = ' + (a - bTens) +
        ' − ' + bOnes + ' = ' + (a - b) + '.';
    }
    return a + ' − ' + b + ' = ' + (a - b) + '.';
  }

  function makeTask(a, b, op) {
    if (op === 'add') {
      return {
        topicId: 'addsub',
        subtype: 'add',
        text: a + ' + ' + b + ' = ?',
        answer: a + b,
        explanation: explainAdd(a, b)
      };
    }
    return {
      topicId: 'addsub',
      subtype: 'sub',
      text: a + ' − ' + b + ' = ?',
      answer: a - b,
      explanation: explainSub(a, b)
    };
  }

  // Подбор пары чисел с заданными условиями (несколько попыток)
  function pickPair(minA, maxA, minB, maxB, cond) {
    for (var i = 0; i < 100; i++) {
      var a = U.randInt(minA, maxA);
      var b = U.randInt(minB, maxB);
      if (cond(a, b)) return [a, b];
    }
    return null;
  }

  window.Generators.addsub = function (level) {
    var op = U.choice(['add', 'sub']);
    var pair;

    if (level === 'easy') {
      // До 100, без перехода через десяток
      if (op === 'add') {
        pair = pickPair(11, 88, 11, 88, function (a, b) {
          return a + b <= 100 && !addHasCarry(a, b);
        });
      } else {
        pair = pickPair(21, 99, 11, 88, function (a, b) {
          return a - b >= 0 && !subHasBorrow(a, b);
        });
      }
    } else if (level === 'medium') {
      // До 100, с переходом через десяток
      if (op === 'add') {
        pair = pickPair(15, 89, 6, 89, function (a, b) {
          return a + b <= 100 && addHasCarry(a, b);
        });
      } else {
        pair = pickPair(21, 99, 6, 89, function (a, b) {
          return a - b >= 0 && subHasBorrow(a, b);
        });
      }
    } else {
      // hard: до 1000. Чаще круглые числа, иногда любые
      var round = U.randInt(0, 2) > 0; // ~2/3 заданий — круглые
      if (op === 'add') {
        if (round) {
          pair = pickPair(100, 800, 50, 700, function (a, b) {
            return a % 50 === 0 && b % 50 === 0 && a + b <= 1000;
          });
        } else {
          pair = pickPair(100, 800, 50, 700, function (a, b) { return a + b <= 1000; });
        }
      } else {
        if (round) {
          pair = pickPair(200, 1000, 50, 900, function (a, b) {
            return a % 50 === 0 && b % 50 === 0 && a - b >= 0;
          });
        } else {
          pair = pickPair(200, 1000, 50, 900, function (a, b) { return a - b >= 0; });
        }
      }
    }

    // Страховка от неподобранной пары (практически недостижимо)
    if (!pair) {
      pair = op === 'add' ? [20, 30] : [50, 20];
    }
    return makeTask(pair[0], pair[1], op);
  };
})();
