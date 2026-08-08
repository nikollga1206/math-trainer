// Генератор темы 5: «Единицы времени» (с, мин, ч, сутки, неделя, месяц, год)
// Подтипы: convert (перевод), compare (сравнение > < =), clock (время по циферблату)
// Уровни: easy — мин↔с и циферблат (ровные часы и половины);
// medium — остальные переводы, сравнение и четверти на циферблате;
// hard — составные переводы и циферблат с произвольными 5 минутами / «без N минут».
// Ограничение: умножения на некруглые коэффициенты (60, 24, 12, 7) — с малым n,
// чтобы произведение не превышало 9×9 = 81.
(function () {
  'use strict';

  window.Generators = window.Generators || {};

  var U = window.Utils;

  // Основная цепочка единиц в секундах (без месяца — он неоднозначен в сутках)
  var UNITS = [
    { name: 'с', factor: 1 },
    { name: 'мин', factor: 60 },
    { name: 'ч', factor: 3600 },
    { name: 'сутки', factor: 86400 },
    { name: 'неделя', factor: 604800 }
  ];
  // Отдельная пара: месяц и год (1 год = 12 месяцев)
  var MONTH_YEAR = [
    { name: 'мес.', factor: 1 },
    { name: 'год', factor: 12 }
  ];
  var UNIT_NAMES = ['с', 'мин', 'ч', 'сутки', 'неделя'];

  function ratioText(from, to) {
    var f = from.factor / to.factor;
    if (f >= 1) return '1 ' + from.name + ' = ' + f + ' ' + to.name;
    return '1 ' + to.name + ' = ' + (to.factor / from.factor) + ' ' + from.name;
  }

  // Максимальный множитель n для коэффициента перевода, чтобы произведение
  // оставалось в рамках таблицы умножения (≤ 81) для некруглых коэффициентов
  function maxNFor(ratio) {
    if (ratio === 60 || ratio === 24) return 3;
    if (ratio === 12) return 6;
    if (ratio === 7) return 9;
    return 9; // круглые коэффициенты (10, 100, 1000) — без ужесточения
  }

  // Перевод единиц
  // easyOnly — только пара мин↔с
  function makeConvert(easyOnly) {
    var useMonthYear = !easyOnly && U.randInt(0, 4) === 0; // иногда пара месяц/год
    var units = useMonthYear ? MONTH_YEAR : UNITS;
    var fromIdx, toIdx;
    if (easyOnly) {
      fromIdx = 1; // мин
      toIdx = 0;   // с
    } else {
      fromIdx = U.randInt(1, units.length - 1);
      toIdx = U.randInt(0, fromIdx - 1);
    }
    var from = units[fromIdx];
    var to = units[toIdx];
    var ratio = from.factor / to.factor;
    var maxN = Math.max(2, Math.floor(500 / ratio));
    var n = U.randInt(1, Math.min(maxNFor(ratio), maxN));
    var answer = n * ratio;
    var withOptions = !useMonthYear && U.randInt(0, 1) === 0;
    var task = {
      topicId: 'time',
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

  // Составной перевод (сложный уровень): 1 ч 20 мин = _ мин, 2 мин 30 с = _ с
  function makeConvertComposite() {
    var useHours = U.randInt(0, 1) === 0;
    var big, small, ratio, n, s;
    if (useHours) {
      big = 'ч'; small = 'мин'; ratio = 60;
      n = U.randInt(1, 2);            // 1–2 часа, чтобы n*60 ≤ 120 оставалось простым
      s = U.randInt(1, 11) * 5;       // 5–55 минут
    } else {
      big = 'мин'; small = 'с'; ratio = 60;
      n = U.randInt(1, 2);
      s = U.randInt(1, 11) * 5;       // 5–55 секунд
    }
    var answer = n * ratio + s;
    return {
      topicId: 'time',
      subtype: 'convert',
      text: n + ' ' + big + ' ' + s + ' ' + small + ' = _ ' + small,
      answer: answer,
      unit: small,
      explanation: '1 ' + big + ' = ' + ratio + ' ' + small + ', значит ' + n + ' ' + big +
        ' = ' + (n * ratio) + ' ' + small + '; ' + (n * ratio) + ' + ' + s + ' = ' +
        answer + ' ' + small + '.'
    };
  }

  // Сравнение величин
  function makeCompare() {
    var useMonthYear = U.randInt(0, 4) === 0;
    var units = useMonthYear ? MONTH_YEAR : UNITS;
    var i1 = U.randInt(0, units.length - 1);
    var i2 = U.randInt(0, units.length - 1);
    var u1 = units[i1];
    var u2 = units[i2];
    var v1 = U.randInt(1, 90);
    var v2 = U.randInt(1, 90);
    if (U.randInt(0, 3) === 0 && i1 !== i2) {
      // Иногда равные величины
      var base = U.randInt(1, 4);
      var cand = base * u2.factor / u1.factor;
      if (cand % 1 === 0 && cand >= 1 && cand <= 200) { v1 = cand; v2 = base; }
    }
    var left = v1 * u1.factor;
    var right = v2 * u2.factor;
    var sign = left > right ? '>' : left < right ? '<' : '=';
    return {
      topicId: 'time',
      subtype: 'compare',
      text: v1 + ' ' + u1.name + ' _ ' + v2 + ' ' + u2.name,
      answer: sign,
      explanation: 'Переведём в одни единицы: ' + v1 + ' ' + u1.name + ' = ' + left + ' ' +
        units[0].name + ', ' + v2 + ' ' + u2.name + ' = ' + right + ' ' + units[0].name +
        '. Значит ' + v1 + ' ' + u1.name + ' ' + sign + ' ' + v2 + ' ' + u2.name + '.'
    };
  }

  // --- Время по циферблату ---

  // Названия часов словами (для словесных формулировок)
  var HOUR_WORDS = ['двенадцать', 'один', 'два', 'три', 'четыре', 'пять', 'шесть',
    'семь', 'восемь', 'девять', 'десять', 'одиннадцать'];
  // Родительный падеж («половина третьего», «четверть девятого») — следующий час
  var HOUR_WORDS_GEN = ['двенадцатого', 'первого', 'второго', 'третьего', 'четвёртого',
    'пятого', 'шестого', 'седьмого', 'восьмого', 'девятого', 'десятого', 'одиннадцатого'];

  // SVG циферблата со стрелками на время h:m
  function clockSvg(h, m) {
    var cx = 60, cy = 60, r = 54;
    var parts = ['<svg viewBox="0 0 120 120" width="140" height="140" ' +
      'style="display:block;margin:8px auto" role="img" aria-label="Часы">'];
    parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + r +
      '" fill="#ffffff" stroke="#5a7a5a" stroke-width="3"/>');
    // Штрихи и цифры 1–12
    for (var i = 0; i < 12; i++) {
      var ang = i * 30 * Math.PI / 180;
      var x1 = cx + (r - 6) * Math.sin(ang), y1 = cy - (r - 6) * Math.cos(ang);
      var x2 = cx + (r - 1) * Math.sin(ang), y2 = cy - (r - 1) * Math.cos(ang);
      parts.push('<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) +
        '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) +
        '" stroke="#333333" stroke-width="2"/>');
      var num = i === 0 ? 12 : i;
      var tx = cx + (r - 14) * Math.sin(ang), ty = cy - (r - 14) * Math.cos(ang);
      parts.push('<text x="' + tx.toFixed(1) + '" y="' + (ty + 4).toFixed(1) +
        '" font-size="11" text-anchor="middle" fill="#333333" ' +
        'font-family="sans-serif">' + num + '</text>');
    }
    // Минутная стрелка
    var mAng = m * 6 * Math.PI / 180;
    parts.push('<line x1="' + cx + '" y1="' + cy +
      '" x2="' + (cx + 40 * Math.sin(mAng)).toFixed(1) +
      '" y2="' + (cy - 40 * Math.cos(mAng)).toFixed(1) +
      '" stroke="#333333" stroke-width="3" stroke-linecap="round"/>');
    // Часовая стрелка (с учётом минут)
    var hAng = ((h % 12) * 30 + m * 0.5) * Math.PI / 180;
    parts.push('<line x1="' + cx + '" y1="' + cy +
      '" x2="' + (cx + 26 * Math.sin(hAng)).toFixed(1) +
      '" y2="' + (cy - 26 * Math.cos(hAng)).toFixed(1) +
      '" stroke="#333333" stroke-width="4.5" stroke-linecap="round"/>');
    parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="3" fill="#333333"/>');
    parts.push('</svg>');
    return parts.join('');
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  // Допустимые строки ответа: 12- и 24-часовой формат
  function timeAnswers(h, m) {
    var h12 = h === 0 ? 12 : h;
    var alt = h === 0 ? 0 : h + 12; // тот же момент во втором формате
    return [h12 + ':' + pad2(m), alt + ':' + pad2(m)];
  }

  // Время словами. kind: 'exact' | 'half' | 'quarter' | 'to'
  function wordsText(h, m, kind) {
    if (kind === 'exact') {
      return 'На часах ровно ' + HOUR_WORDS[h % 12] +
        (h % 12 === 1 ? ' час' : (h % 12 >= 2 && h % 12 <= 4 ? ' часа' : ' часов')) +
        '. Впиши время цифрами (ЧЧ:ММ).';
    }
    if (kind === 'half') {
      return 'Сейчас половина ' + HOUR_WORDS_GEN[(h + 1) % 12] +
        '. Впиши время цифрами (ЧЧ:ММ).';
    }
    if (kind === 'quarter') {
      return 'Сейчас четверть ' + HOUR_WORDS_GEN[(h + 1) % 12] +
        '. Впиши время цифрами (ЧЧ:ММ).';
    }
    // «без N минут X» (или «без четверти X»)
    var next = HOUR_WORDS[(h + 1) % 12];
    if (m === 45) {
      return 'Сейчас без четверти ' + next + '. Впиши время цифрами (ЧЧ:ММ).';
    }
    return 'Сейчас без ' + (60 - m) + ' минут ' + next + '. Впиши время цифрами (ЧЧ:ММ).';
  }

  // Пояснение-разбор для словесных формулировок
  function wordsExplanation(h, m, kind) {
    var ans = (h === 0 ? 12 : h) + ':' + pad2(m);
    if (kind === 'exact') return 'Ровно ' + HOUR_WORDS[h % 12] + ' = ' + ans + '.';
    if (kind === 'half') {
      return 'Половина ' + HOUR_WORDS_GEN[(h + 1) % 12] + ' = ' + HOUR_WORDS[h % 12] +
        ' часов и 30 минут = ' + ans + '.';
    }
    if (kind === 'quarter') {
      return 'Четверть ' + HOUR_WORDS_GEN[(h + 1) % 12] + ' = ' + HOUR_WORDS[h % 12] +
        ' часов и 15 минут = ' + ans + '.';
    }
    var back = 60 - m;
    var nextH = (h + 1) % 12 === 0 ? 12 : (h + 1) % 12;
    return 'Без ' + (m === 45 ? 'четверти (15 минут)' : back + ' минут') + ' ' +
      HOUR_WORDS[(h + 1) % 12] + ' = ' + nextH + ':00 − ' + back + ' мин = ' + ans + '.';
  }

  // Задание подтипа clock по уровню
  function makeClock(level) {
    var h = U.randInt(0, 11); // 12-часовой циферблат
    var m, withWords, kind;
    if (level === 'easy') {
      m = U.choice([0, 30]);
      withWords = false; // лёгкий — только циферблат → цифры
      kind = m === 0 ? 'exact' : 'half';
    } else if (level === 'hard') {
      withWords = U.randInt(0, 1) === 0;
      if (withWords) {
        // «без N минут», N = 5, 10, 15, 20, 25
        m = U.choice([35, 40, 45, 50, 55]);
        kind = 'to';
      } else {
        m = U.randInt(0, 11) * 5; // произвольные 5 минут
        kind = m === 0 ? 'exact' : m === 30 ? 'half' : m === 15 ? 'quarter' : 'to';
      }
    } else { // medium — четверти
      m = U.choice([0, 15, 30, 45]);
      withWords = U.randInt(0, 1) === 0;
      kind = m === 0 ? 'exact' : m === 30 ? 'half' : m === 15 ? 'quarter' : 'to';
    }
    var answers = timeAnswers(h, m);
    if (withWords) {
      return {
        topicId: 'time',
        subtype: 'clock',
        text: wordsText(h, m, kind),
        answer: answers,
        inputColon: true,
        explanation: wordsExplanation(h, m, kind)
      };
    }
    return {
      topicId: 'time',
      subtype: 'clock',
      text: 'Который час показывают часы? Впиши время цифрами (ЧЧ:ММ).' + clockSvg(h, m),
      answer: answers,
      inputColon: true,
      explanation: 'Минутная стрелка на ' + (m === 0 ? 12 : m / 5) + ' — это ' + m +
        ' минут, часовая — на ' + HOUR_WORDS[h % 12] + '. Время: ' + answers[0] + '.'
    };
  }

  // Уровни: easy — мин↔с и циферблат (часы и половины); medium — остальные
  // переводы, сравнение и четверти; hard — составные переводы и циферблат
  // с произвольными 5 минутами / «без N минут».
  window.Generators.time = function (level) {
    if (level === 'easy') {
      return U.choice([function () { return makeConvert(true); },
        function () { return makeClock('easy'); }])();
    }
    if (level === 'hard') {
      return U.choice([makeConvertComposite,
        function () { return makeClock('hard'); }])();
    }
    return U.choice([function () { return makeConvert(false); }, makeCompare,
      function () { return makeClock('medium'); }])();
  };
})();
