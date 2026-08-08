// Модуль хранения статистики в localStorage (ключ mathTrainer.v1)
(function () {
  'use strict';

  var KEY = 'mathTrainer.v1';

  // Структура данных по умолчанию
  function defaultData() {
    return {
      sessions: [],        // история сессий: {topicId, total, correct, mode, errors:[{subtype}], hintsUsed, date}
      stars: {},           // накопленные звёзды по темам: {topicId: 0..3}
      streak: 0,           // серия дней подряд
      lastActivityDate: '', // дата последней активности YYYY-MM-DD
      coins: 0             // игровая валюта — монетки (не сгорают между сессиями)
    };
  }

  // Чтение данных с защитой от битого JSON
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return defaultData();
      var data = JSON.parse(raw);
      var def = defaultData();
      // Дополняем недостающие поля значениями по умолчанию
      for (var k in def) {
        if (!(k in data)) data[k] = def[k];
      }
      return data;
    } catch (e) {
      return defaultData();
    }
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  // Дата в формате YYYY-MM-DD
  function dateStr(d) {
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  // Звёзды за сессию по точности
  function starsFor(accuracy) {
    if (accuracy >= 90) return 3;
    if (accuracy >= 75) return 2;
    if (accuracy >= 50) return 1;
    return 0;
  }

  window.Storage = {
    // Сохранить сессию и обновить звёзды/серию дней
    saveSession: function (session) {
      var data = load();
      var today = dateStr(new Date());
      data.sessions.push({
        topicId: session.topicId,
        total: session.total,
        correct: session.correct,
        mode: session.mode,
        errors: session.errors || [],
        hintsUsed: session.hintsUsed || 0, // использованные подсказки (соотношения мер)
        date: today
      });

      // Звёзды темы — берём максимум (для 'review' звёзды не считаем)
      if (session.topicId !== 'review') {
        var acc = session.total > 0 ? Math.round(session.correct / session.total * 100) : 0;
        var earned = starsFor(acc);
        var current = data.stars[session.topicId] || 0;
        data.stars[session.topicId] = Math.max(current, earned);
      }

      // Серия дней: вчера +1, сегодня — без изменений, иначе заново
      if (data.lastActivityDate !== today) {
        var yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (data.lastActivityDate === dateStr(yesterday)) {
          data.streak += 1;
        } else {
          data.streak = 1;
        }
        data.lastActivityDate = today;
      }

      save(data);
    },

    // Статистика по теме: суммарная точность, звёзды, точность последней сессии
    getTopicStats: function (topicId) {
      var data = load();
      var sessions = data.sessions.filter(function (s) { return s.topicId === topicId; });
      var total = 0;
      var correct = 0;
      var lastAccuracy = 0;
      sessions.forEach(function (s) {
        total += s.total;
        correct += s.correct;
      });
      if (sessions.length > 0) {
        var last = sessions[sessions.length - 1];
        lastAccuracy = last.total > 0 ? Math.round(last.correct / last.total * 100) : 0;
      }
      return {
        accuracy: total > 0 ? Math.round(correct / total * 100) : 0,
        stars: data.stars[topicId] || 0,
        lastAccuracy: lastAccuracy
      };
    },

    // Подтипы заданий, где были ошибки за последние days дней
    getWeakSubtypes: function (days) {
      days = days || 7;
      var data = load();
      var cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      var cutoffStr = dateStr(cutoff);
      var seen = {};
      var result = [];
      data.sessions.forEach(function (s) {
        if (s.date < cutoffStr) return;
        (s.errors || []).forEach(function (err) {
          // Для сессий 'review' topicId неизвестен — пропускаем
          if (s.topicId === 'review') return;
          var key = s.topicId + '|' + err.subtype;
          if (!seen[key]) {
            seen[key] = true;
            result.push({ topicId: s.topicId, subtype: err.subtype });
          }
        });
      });
      return result;
    },

    // История последних n сессий (новые первыми)
    getHistory: function (n) {
      n = n || 10;
      var data = load();
      return data.sessions.slice(-n).reverse();
    },

    // Текущая серия дней подряд
    getStreak: function () {
      var data = load();
      // Если последняя активность была не сегодня и не вчера — серия прервана
      var today = dateStr(new Date());
      var yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (data.lastActivityDate === today || data.lastActivityDate === dateStr(yesterday)) {
        return data.streak;
      }
      return 0;
    },

    // Начислить монетки за правильные ответы
    addCoins: function (n) {
      var data = load();
      data.coins = (data.coins || 0) + n;
      save(data);
    },

    // Текущий баланс монеток
    getCoins: function () {
      return load().coins || 0;
    },

    // Полный сброс прогресса
    resetAll: function () {
      localStorage.removeItem(KEY);
    }
  };
})();
