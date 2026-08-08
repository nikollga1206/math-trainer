// Утилиты и общие константы приложения «Математический тренажёр»
(function () {
  'use strict';

  // Случайное целое число от min до max включительно
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Случайный элемент массива
  function choice(arr) {
    return arr[randInt(0, arr.length - 1)];
  }

  // Перемешанная копия массива (тасование Фишера — Йейтса)
  function shuffle(arr) {
    var copy = arr.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = randInt(0, i);
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  window.Utils = {
    randInt: randInt,
    choice: choice,
    shuffle: shuffle
  };

  // Список учебных тем. levels: true — у темы есть выбор уровня сложности
  window.TOPICS = [
    { id: 'multiplication', title: 'Таблица умножения', levels: true },
    { id: 'addsub', title: 'Сложение и вычитание', levels: true },
    { id: 'order', title: 'Порядок действий', levels: true },
    { id: 'length', title: 'Единицы длины', levels: true },
    { id: 'time', title: 'Единицы времени', levels: true },
    { id: 'mass', title: 'Единицы массы', levels: true },
    { id: 'geometry', title: 'Периметр и площадь', levels: true }
  ];
})();
