// Генератор темы 7: «Периметр и площадь» (прямоугольник и квадрат)
// Подтипы: perimeter (найти P), area (найти S), side (найти сторону)
(function () {
  'use strict';

  window.Generators = window.Generators || {};

  var U = window.Utils;

  // Случайные стороны: для квадрата равные, для прямоугольника разные.
  // Стороны 2–9, чтобы S = a × b ≤ 81 и P = (a + b) × 2 ≤ 36
  // оставались в рамках таблицы умножения.
  function makeSides(forceSquare) {
    var square = forceSquare === true || (forceSquare !== false && U.randInt(0, 2) === 0);
    var a = U.randInt(2, 9);
    var b = square ? a : U.randInt(2, 9);
    return { a: a, b: b, square: square };
  }

  function shapeName(square) {
    return square ? 'квадрата' : 'прямоугольника';
  }

  function sidesText(s) {
    if (s.square) return 'Сторона квадрата ' + s.a + ' см.';
    return 'Длина прямоугольника ' + s.a + ' см, ширина ' + s.b + ' см.';
  }

  // Найти периметр. squareOnly — только квадраты, rectOnly — только прямоугольники
  function makePerimeter(squareOnly, rectOnly) {
    var s = makeSides(squareOnly ? true : rectOnly ? false : undefined);
    var p = s.square ? 4 * s.a : 2 * (s.a + s.b);
    var formula = s.square
      ? 'P = a × 4 = ' + s.a + ' × 4 = ' + p + ' см.'
      : 'P = (a + b) × 2 = (' + s.a + ' + ' + s.b + ') × 2 = ' + (s.a + s.b) + ' × 2 = ' + p + ' см.';
    return {
      topicId: 'geometry',
      subtype: 'perimeter',
      text: sidesText(s) + ' Найди периметр ' + shapeName(s.square) + '.',
      answer: p,
      unit: 'см',
      explanation: 'Периметр — сумма всех сторон. ' + formula
    };
  }

  // Найти площадь. squareOnly — только квадраты, rectOnly — только прямоугольники
  function makeArea(squareOnly, rectOnly) {
    var s = makeSides(squareOnly ? true : rectOnly ? false : undefined);
    var area = s.a * s.b;
    var formula = s.square
      ? 'S = a × a = ' + s.a + ' × ' + s.a + ' = ' + area + ' см².'
      : 'S = a × b = ' + s.a + ' × ' + s.b + ' = ' + area + ' см².';
    return {
      topicId: 'geometry',
      subtype: 'area',
      text: sidesText(s) + ' Найди площадь ' + shapeName(s.square) + '.',
      answer: area,
      unit: 'см²',
      explanation: 'Площадь ' + shapeName(s.square) + ': ' + formula
    };
  }

  // Найти сторону по известным P (или S) и второй стороне.
  // Генерируем от сторон, чтобы всё делилось нацело.
  function makeSide() {
    var s = makeSides();
    var byArea = U.randInt(0, 1) === 0;
    if (s.square) {
      // Для квадрата: по периметру найти сторону
      var p = 4 * s.a;
      return {
        topicId: 'geometry',
        subtype: 'side',
        text: 'Периметр квадрата ' + p + ' см. Найди сторону квадрата.',
        answer: s.a,
        unit: 'см',
        explanation: 'У квадрата 4 равные стороны: a = P ÷ 4 = ' + p + ' ÷ 4 = ' + s.a + ' см.'
      };
    }
    if (byArea) {
      var area = s.a * s.b;
      return {
        topicId: 'geometry',
        subtype: 'side',
        text: 'Площадь прямоугольника ' + area + ' см², длина ' + s.a + ' см. Найди ширину.',
        answer: s.b,
        unit: 'см',
        explanation: 'b = S ÷ a = ' + area + ' ÷ ' + s.a + ' = ' + s.b + ' см.'
      };
    }
    var per = 2 * (s.a + s.b);
    return {
      topicId: 'geometry',
      subtype: 'side',
      text: 'Периметр прямоугольника ' + per + ' см, длина ' + s.a + ' см. Найди ширину.',
      answer: s.b,
      unit: 'см',
      explanation: 'b = P ÷ 2 − a = ' + per + ' ÷ 2 − ' + s.a + ' = ' + (s.a + s.b) +
        ' − ' + s.a + ' = ' + s.b + ' см.'
    };
  }

  // Уровни: easy — P и S квадрата; medium — P и S прямоугольника;
  // hard — обратные задачи (найти сторону по P/S и второй стороне).
  window.Generators.geometry = function (level) {
    if (level === 'easy') {
      return U.choice([function () { return makePerimeter(true); },
        function () { return makeArea(true); }])();
    }
    if (level === 'hard') return makeSide();
    return U.choice([function () { return makePerimeter(false, true); },
      function () { return makeArea(false, true); }])();
  };
})();
