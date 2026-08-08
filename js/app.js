// UI-логика приложения «Математический тренажёр»
(function () {
  'use strict';

  // --- Вспомогательные функции DOM ---
  function $(id) { return document.getElementById(id); }

  // Переключение экранов: активному экрану ставим класс .active
  function showScreen(id) {
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) screens[i].classList.remove('active');
    $(id).classList.add('active');
  }

  // Разбор строки времени «Ч:ММ» (ведущие нули допускаются).
  // Возвращает [часы, минуты] или null при неверном формате.
  function parseTime(str) {
    var m = str.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    var h = Number(m[1]), min = Number(m[2]);
    if (h > 23 || min > 59) return null;
    return [h, min];
  }

  // Случайные фразы похвалы
  var PRAISE = ['Отлично!', 'Ты молодец!', 'Супер!', 'Верно!', 'Здорово!', 'Так держать!', 'Умница!'];

  // Переключение состояния котёнка-маскота: neutral / happy / sad
  function setKitten(mood) {
    var k = $('kitten');
    if (!k) return;
    k.className = 'kitten';
    void k.offsetWidth; // перезапуск CSS-анимации при повторном состоянии
    k.classList.add('kitten-' + mood);
  }

  // --- Оверлей «Подсказка» со справочной таблицей соотношений мер ---
  function openHint() {
    var overlay = $('hint-overlay');
    if (overlay.style.display === 'none' || overlay.style.display === '') {
      // Показываем только таблицу текущей меры
      ['length', 'time', 'mass'].forEach(function (t) {
        $('hint-table-' + t).style.display = t === state.topicId ? '' : 'none';
      });
      overlay.style.display = 'flex';
      state.hintsUsed++;
    } else {
      closeHint();
    }
  }

  function closeHint() {
    $('hint-overlay').style.display = 'none';
  }

  // Названия уровней
  var LEVEL_NAMES = { easy: 'Лёгкий', medium: 'Средний', hard: 'Сложный' };
  var MODE_NAMES = { train: 'Тренировка', test: 'Контроль', review: 'Работа над ошибками' };

  // --- Состояние приложения ---
  var state = {
    topicId: null,      // текущая тема
    level: 'medium',    // выбранный уровень
    mode: 'train',      // train | test
    tasks: [],          // задания сессии
    index: 0,           // номер текущего задания
    correct: 0,         // количество верных ответов
    wrongInRow: 0,      // ошибок подряд (для подсказки)
    errors: [],         // ошибки сессии для разбора и статистики
    sessionCoins: 0,    // монетки, заработанные за текущую сессию
    hintsUsed: 0,       // подсказки (соотношения мер), использованные за сессию
    awaitingNext: false, // ждём нажатия «Дальше» после проверки (тренировка)
    timerId: null,      // интервал таймера (контроль)
    timeLeft: 0         // остаток секунд (контроль)
  };

  // --- Главный экран ---
  function renderHome() {
    var grid = $('topics-grid');
    grid.innerHTML = '';
    window.TOPICS.forEach(function (topic) {
      var stats = window.Storage.getTopicStats(topic.id);
      var card = document.createElement('button');
      card.className = 'topic-card module-' + topic.id;
      var stars = '';
      for (var i = 0; i < 3; i++) stars += i < stats.stars ? '★' : '☆';
      card.innerHTML =
        '<div class="topic-title">' + topic.title + '</div>' +
        '<div class="topic-stars">' + stars + '</div>' +
        '<div class="topic-acc">' + (stats.lastAccuracy > 0 ? 'Последняя точность: ' + stats.lastAccuracy + '%' : 'Ещё не проходили') + '</div>';
      card.addEventListener('click', function () { openSetup(topic); });
      grid.appendChild(card);
    });
    var streak = window.Storage.getStreak();
    $('streak-display').textContent = streak > 0 ? 'Серия: ' + streak + ' дн. подряд!' : 'Начни серию — займись сегодня!';
    // Баланс монеток
    $('coins-display').textContent = '🪙 ' + window.Storage.getCoins();
  }

  // --- Экран настройки (выбор уровня и режима) ---
  // Окрашиваем экраны настройки и задания в цвет модуля
  function setModuleTheme(topicId) {
    ['screen-task', 'screen-setup'].forEach(function (id) {
      var el = $(id);
      // Снимаем прежний модульный класс и ставим новый
      el.className = el.className.replace(/module-\S+/g, '').trim();
      el.classList.add('module-' + topicId);
    });
  }

  function openSetup(topic) {
    state.topicId = topic.id;
    state.level = topic.levels ? 'easy' : 'medium';
    setModuleTheme(topic.id);
    $('setup-topic-name').textContent = topic.title;
    var levelBox = $('level-select');
    levelBox.innerHTML = '';
    if (topic.levels) {
      ['easy', 'medium', 'hard'].forEach(function (lv) {
        var btn = document.createElement('button');
        btn.textContent = LEVEL_NAMES[lv];
        btn.dataset.level = lv;
        if (lv === state.level) btn.classList.add('selected');
        btn.addEventListener('click', function () {
          state.level = lv;
          var all = levelBox.querySelectorAll('button');
          for (var i = 0; i < all.length; i++) all[i].classList.remove('selected');
          btn.classList.add('selected');
        });
        levelBox.appendChild(btn);
      });
    }
    showScreen('screen-setup');
  }

  // --- Запуск сессии ---
  function startSession(mode, tasksOverride) {
    state.mode = mode;
    setModuleTheme(state.topicId); // цвет фона модуля (в т.ч. «Работа над ошибками»)
    state.tasks = tasksOverride || window.Tasks.makeSet(state.topicId, state.level, mode === 'test' ? 15 : 10);
    state.index = 0;
    state.correct = 0;
    state.wrongInRow = 0;
    state.errors = [];
    state.sessionCoins = 0;
    state.hintsUsed = 0;
    state.awaitingNext = false;

    // Таймер для контроля: 10 минут
    if (mode === 'test') {
      state.timeLeft = 10 * 60;
      $('task-timer').style.display = '';
      updateTimer();
      state.timerId = setInterval(function () {
        state.timeLeft--;
        updateTimer();
        if (state.timeLeft <= 0) finishSession();
      }, 1000);
    } else {
      $('task-timer').style.display = 'none';
    }

    showScreen('screen-task');
    renderTask();
  }

  function updateTimer() {
    var m = Math.floor(state.timeLeft / 60);
    var s = state.timeLeft % 60;
    $('task-timer').textContent = '⏱ ' + m + ':' + String(s).padStart(2, '0');
  }

  // --- Отображение задания ---
  function currentTask() { return state.tasks[state.index]; }

  function renderTask() {
    var task = currentTask();
    $('task-progress').textContent = (state.index + 1) + ' из ' + state.tasks.length;
    $('task-text').innerHTML = task.text;
    $('feedback').textContent = '';
    $('hint-area').textContent = '';
    $('hint-area').style.display = 'none';
    $('btn-check').textContent = 'Проверить';
    state.awaitingNext = false;
    setKitten('neutral'); // в ожидании ответа котёнок нейтрален

    // Кнопка «Подсказка» — только в модулях единиц длины/времени/массы
    var hintTopics = ['length', 'time', 'mass'];
    $('btn-hint').style.display = hintTopics.indexOf(state.topicId) >= 0 ? '' : 'none';
    closeHint();

    // Кнопка «:» на экранной клавиатуре — только для заданий со временем
    $('key-colon').style.display = task.inputColon ? '' : 'none';

    var isSignTask = typeof task.answer === 'string';
    $('sign-buttons').style.display = isSignTask ? '' : 'none';
    $('answer-input').style.display = isSignTask ? 'none' : '';
    $('keypad').style.display = isSignTask ? 'none' : '';
    $('answer-input').value = '';

    // Единицы измерения: список выбора или фиксированная подпись
    var unitSelect = $('unit-select');
    var unitLabel = $('unit-label');
    if (task.unitOptions) {
      unitSelect.innerHTML = '';
      task.unitOptions.forEach(function (u) {
        var opt = document.createElement('option');
        opt.value = u;
        opt.textContent = u;
        unitSelect.appendChild(opt);
      });
      unitSelect.style.display = '';
      unitLabel.style.display = 'none';
    } else {
      unitSelect.style.display = 'none';
      if (task.unit) {
        unitLabel.textContent = task.unit;
        unitLabel.style.display = '';
      } else {
        unitLabel.style.display = 'none';
      }
    }
  }

  // --- Проверка ответа ---
  function checkAnswer(signAnswer) {
    var task = currentTask();

    // Если ждём перехода к следующему заданию — переходим
    if (state.awaitingNext) {
      nextTask();
      return;
    }

    var userAnswer;
    var ok;
    if (Array.isArray(task.answer)) {
      // Задание со временем: ответ — массив допустимых строк «Ч:ММ».
      // Сравниваем численно (ведущие нули допускаются).
      var rawTime = $('answer-input').value.trim();
      if (rawTime === '') return; // пустой ответ не проверяем
      userAnswer = rawTime;
      var parsed = parseTime(rawTime);
      ok = parsed !== null && task.answer.some(function (a) {
        var pa = parseTime(a);
        return pa !== null && pa[0] === parsed[0] && pa[1] === parsed[1];
      });
    } else if (typeof task.answer === 'string') {
      // Задание-сравнение: ответ приходит с кнопки знака
      if (!signAnswer) return;
      userAnswer = signAnswer;
      ok = signAnswer === task.answer;
    } else {
      var raw = $('answer-input').value.trim();
      if (raw === '') return; // пустой ответ не проверяем
      userAnswer = raw;
      ok = Number(raw) === task.answer;
      // Если есть выбор единицы — проверяем и её
      if (ok && task.unitOptions) {
        ok = $('unit-select').value === task.answerUnit;
      }
      if (task.unitOptions) userAnswer += ' ' + $('unit-select').value;
    }

    // Правильный ответ текстом (для вывода)
    var correctText = Array.isArray(task.answer)
      ? task.answer[0]
      : typeof task.answer === 'string'
      ? task.answer
      : task.answer + (task.unitOptions ? ' ' + task.answerUnit : task.unit ? ' ' + task.unit : '');

    var card = $('task-card');

    if (ok) {
      state.correct++;
      state.wrongInRow = 0;
      // Начисляем монетки: 1 за ответ, в режиме «Контроль» — 2
      var award = state.mode === 'test' ? 2 : 1;
      state.sessionCoins += award;
      window.Storage.addCoins(award);
      // Анимация, похвала и радостный котёнок
      card.classList.remove('correct-flash');
      void card.offsetWidth; // перезапуск анимации
      card.classList.add('correct-flash');
      setKitten('happy');
      $('feedback').textContent = window.Utils.choice(PRAISE) + ' +' + award + ' 🪙';
      $('feedback').className = 'feedback-good';
    } else {
      state.wrongInRow++;
      card.classList.remove('wrong-shake');
      void card.offsetWidth;
      card.classList.add('wrong-shake');
      setKitten('sad');
      state.errors.push({
        text: task.text,
        userAnswer: String(userAnswer),
        correctAnswer: correctText,
        explanation: task.explanation,
        subtype: task.subtype
      });
      if (state.mode === 'train') {
        $('feedback').textContent = 'Неверно. Правильный ответ: ' + correctText;
        $('feedback').className = 'feedback-bad';
        // После 2 ошибок подряд — подсказка с пояснением
        if (state.wrongInRow >= 2) {
          $('hint-area').textContent = 'Подсказка: ' + task.explanation;
          $('hint-area').style.display = '';
        }
      }
    }

    if (state.mode === 'train') {
      // В тренировке ждём нажатия «Дальше»
      state.awaitingNext = true;
      $('btn-check').textContent = 'Дальше';
    } else {
      // В контроле сразу следующий вопрос
      nextTask();
    }
  }

  function nextTask() {
    state.index++;
    if (state.index >= state.tasks.length) {
      finishSession();
    } else {
      renderTask();
    }
  }

  // --- Завершение сессии ---
  function finishSession() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
    var answered = state.index; // сколько заданий реально показано
    var total = state.mode === 'test' && answered < state.tasks.length ? answered : state.tasks.length;
    if (total === 0) { goHome(); return; }

    var accuracy = Math.round(state.correct / total * 100);

    // Сохраняем сессию
    window.Storage.saveSession({
      topicId: state.topicId,
      total: total,
      correct: state.correct,
      mode: state.mode,
      hintsUsed: state.hintsUsed,
      errors: state.errors.map(function (e) { return { subtype: e.subtype }; }),
      date: new Date().toISOString()
    });

    // Оценка (в контроле) и звёзды
    var grade;
    if (accuracy >= 90) grade = '5';
    else if (accuracy >= 75) grade = '4';
    else if (accuracy >= 50) grade = '3';
    else grade = 'надо повторить';

    var stars = accuracy >= 90 ? 3 : accuracy >= 75 ? 2 : accuracy >= 50 ? 1 : 0;
    var starsHtml = '';
    for (var i = 0; i < 3; i++) starsHtml += i < stars ? '★' : '☆';

    $('result-grade').textContent = state.mode === 'test'
      ? 'Оценка: ' + grade
      : MODE_NAMES[state.mode] + ' завершена!';
    $('result-stars').textContent = starsHtml;
    $('result-summary').textContent = 'Правильно ' + state.correct + ' из ' + total +
      ' (' + accuracy + '%)';
    // Сколько монеток заработано за сессию
    $('result-coins').textContent = state.sessionCoins > 0
      ? 'Заработано монеток: 🪙 ' + state.sessionCoins
      : 'Монеток не заработано — попробуй ещё раз!';

    // Перечень ошибок с пояснениями
    var box = $('result-errors');
    box.innerHTML = '';
    if (state.errors.length === 0) {
      box.innerHTML = '<div class="no-errors">Ни одной ошибки — блестяще!</div>';
    } else {
      var title = document.createElement('h3');
      title.textContent = 'Разбор ошибок:';
      box.appendChild(title);
      state.errors.forEach(function (e) {
        var div = document.createElement('div');
        div.className = 'error-item';
        div.innerHTML = '<div class="error-task">' + e.text + '</div>' +
          '<div>Твой ответ: <b>' + e.userAnswer + '</b> · Правильно: <b>' + e.correctAnswer + '</b></div>' +
          '<div class="error-expl">' + e.explanation + '</div>';
        box.appendChild(div);
      });
    }

    showScreen('screen-result');
  }

  function goHome() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
    renderHome();
    showScreen('screen-home');
  }

  // --- Экран статистики (для родителя) ---
  function renderStats() {
    // Точность по темам
    var topicsBox = $('stats-topics');
    topicsBox.innerHTML = '';
    window.TOPICS.forEach(function (topic) {
      var stats = window.Storage.getTopicStats(topic.id);
      var row = document.createElement('div');
      row.className = 'stats-row';
      row.innerHTML = '<span>' + topic.title + '</span><b>' + stats.accuracy + '%</b>';
      topicsBox.appendChild(row);
    });

    // История последних сессий
    var histBox = $('stats-history');
    histBox.innerHTML = '';
    var history = window.Storage.getHistory(10);
    if (history.length === 0) {
      histBox.innerHTML = '<div>Пока нет сыгранных сессий.</div>';
    } else {
      history.forEach(function (s) {
        var topic = window.TOPICS.find(function (t) { return t.id === s.topicId; });
        var name = topic ? topic.title : 'Работа над ошибками';
        var acc = s.total > 0 ? Math.round(s.correct / s.total * 100) : 0;
        var row = document.createElement('div');
        row.className = 'stats-row';
        row.innerHTML = '<span>' + s.date + ' · ' + name + ' · ' +
          (MODE_NAMES[s.mode] || s.mode) +
          (s.hintsUsed > 0 ? ' · 💡 ' + s.hintsUsed : '') + '</span><b>' +
          s.correct + '/' + s.total + ' (' + acc + '%)</b>';
        histBox.appendChild(row);
      });
    }

    $('stats-streak').textContent = 'Серия дней подряд: ' + window.Storage.getStreak();
  }

  // --- Инициализация ---
  document.addEventListener('DOMContentLoaded', function () {
    renderHome();

    // Главная → настройка темы обрабатывается в renderHome

    // Кнопки экрана настройки
    $('btn-mode-train').addEventListener('click', function () { startSession('train'); });
    $('btn-mode-test').addEventListener('click', function () { startSession('test'); });
    $('btn-setup-back').addEventListener('click', goHome);

    // Кнопка «Проверить» / «Дальше»
    $('btn-check').addEventListener('click', function () { checkAnswer(); });

    // Кнопка «Подсказка» и закрытие оверлея (крестик или клик по фону)
    $('btn-hint').addEventListener('click', openHint);
    $('hint-close').addEventListener('click', closeHint);
    $('hint-overlay').addEventListener('click', function (e) {
      if (e.target === this) closeHint();
    });

    // Выход из сессии
    $('btn-quit').addEventListener('click', function () {
      if (confirm('Выйти? Прогресс этой сессии не сохранится.')) goHome();
    });

    // Кнопки знаков > < =
    var signBtns = $('sign-buttons').querySelectorAll('button');
    for (var i = 0; i < signBtns.length; i++) {
      (function (btn) {
        btn.addEventListener('click', function () { checkAnswer(btn.dataset.sign); });
      })(signBtns[i]);
    }

    // Экранная клавиатура
    var keys = $('keypad').querySelectorAll('button');
    for (var j = 0; j < keys.length; j++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          var input = $('answer-input');
          if (state.awaitingNext) return;
          if (btn.dataset.key === 'backspace') {
            input.value = input.value.slice(0, -1);
          } else if (input.value.length < 8) {
            input.value += btn.dataset.key;
          }
        });
      })(keys[j]);
    }

    // Физическая клавиатура
    document.addEventListener('keydown', function (e) {
      if (!$('screen-task').classList.contains('active')) return;
      var input = $('answer-input');
      if (state.awaitingNext) {
        if (e.key === 'Enter') checkAnswer();
        return;
      }
      if (e.key >= '0' && e.key <= '9') {
        if (input.value.length < 8) input.value += e.key;
      } else if ((e.key === ':' || e.key === ';') && currentTask().inputColon) {
        // Двоеточие для ввода времени (ЧЧ:ММ); «;» — та же клавиша в русской раскладке
        if (input.value.length < 8 && input.value.indexOf(':') === -1) input.value += ':';
      } else if (e.key === 'Backspace') {
        input.value = input.value.slice(0, -1);
      } else if (e.key === 'Enter') {
        checkAnswer();
      }
    });

    // Работа над ошибками
    $('btn-error-review').addEventListener('click', function () {
      var set = window.Tasks.makeErrorReviewSet(10);
      if (set.length === 0) {
        alert('Пока нет ошибок для повторения. Отлично!');
        return;
      }
      state.topicId = 'review';
      startSession('train', set);
    });

    // Результат → главная
    $('btn-result-home').addEventListener('click', goHome);

    // Статистика
    $('btn-stats').addEventListener('click', function () {
      renderStats();
      showScreen('screen-stats');
    });
    $('btn-stats-home').addEventListener('click', goHome);
    $('btn-reset').addEventListener('click', function () {
      if (confirm('Точно сбросить весь прогресс? Это действие нельзя отменить.')) {
        window.Storage.resetAll();
        renderStats();
        renderHome();
      }
    });
  });

  window.App = { showScreen: showScreen };
})();
