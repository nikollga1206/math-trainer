// Фасад над генераторами: наборы заданий без повторов и «работа над ошибками»
(function () {
  'use strict';

  // Ключ задания для проверки повторов внутри сессии
  function taskKey(task) {
    return task.text + '|' + task.answer + '|' + (task.answerUnit || '');
  }

  window.Tasks = {
    // Сгенерировать count заданий по теме без повторов
    makeSet: function (topicId, level, count) {
      var gen = window.Generators[topicId];
      var set = [];
      var used = {};
      for (var i = 0; i < count; i++) {
        var task = null;
        // До 50 попыток найти уникальное задание, потом допускаем повтор
        for (var attempt = 0; attempt < 50; attempt++) {
          var candidate = gen(level);
          if (!used[taskKey(candidate)]) {
            task = candidate;
            break;
          }
        }
        if (!task) task = gen(level);
        used[taskKey(task)] = true;
        set.push(task);
      }
      return set;
    },

    // Задания по подтипам, где были ошибки за последние 7 дней
    makeErrorReviewSet: function (count) {
      var weak = window.Storage.getWeakSubtypes(7);
      if (weak.length === 0) return [];

      var set = [];
      var used = {};
      var perSubtype = Math.ceil(count / weak.length);

      weak.forEach(function (w) {
        var gen = window.Generators[w.topicId];
        if (!gen) return;
        var added = 0;
        // У тем с уровнями берём средний уровень
        for (var attempt = 0; attempt < 100 && added < perSubtype; attempt++) {
          var task = gen('medium');
          if (task.subtype !== w.subtype) continue;
          if (used[taskKey(task)]) continue;
          used[taskKey(task)] = true;
          set.push(task);
          added++;
        }
      });

      // Перемешиваем и обрезаем до нужного количества
      return window.Utils.shuffle(set).slice(0, count);
    }
  };
})();
