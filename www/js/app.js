/* global angular, cordova, StatusBar */

(function() {
  'use strict';
// Ionic Starter App

function AppRun($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleLightContent();
    }
  });
}

function AppConfig($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  .state('games', {
    url: '/',
    templateUrl: 'js/views/games.html',
    controller: 'GamesListController as vm'
  })

  .state('game-detail', {
    url: '/game/:id',
    templateUrl: 'js/views/game.html',
    controller: 'GameViewController as vm',
    resolve: {
      game: ['Games', '$stateParams', function(Games, $stateParams) {
          return Games.findOne($stateParams.id);
      }]
    }
  })

  .state('carrinho', {
    url: '/carrinho',
    templateUrl: 'js/views/carrinho.html',
    controller: 'CarrinhoController as vm'
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/');

}
// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('hgApp', ['ionic', 'hgApp.controllers', 'hgApp.services'])
.run([
  '$ionicPlatform',
  AppRun
])
.config([
  '$stateProvider',
  '$urlRouterProvider',
  AppConfig
]);

angular.module('hgApp.services', [])

  .factory('$localstorage', ['$window', function($window) {
    return {
      set: function(key, value) {
        $window.localStorage[key] = value;
      },
      get: function(key, defaultValue) {
        return $window.localStorage[key] || defaultValue;
      },
      getArray: function(key) {
        return JSON.parse($window.localStorage[key]  || '[]');
      },
      setObject: function(key, value) {
        $window.localStorage[key] = JSON.stringify(value);
      },
      getObject: function(key) {
        return JSON.parse($window.localStorage[key] || '{}');
      }
    };
  }])
  .factory('Games', ['$q', '$http', function ($q, $http) {
    function findOne(id) {
      return $q(function(resolve, reject) {
        var request = $http.get('js/games.json');
        request.success(function (response) {
          var items = response.filter(function (item) {
            return item.id == id;
          });

          if (items.length) {
            resolve(items[0]);
          } else {
            resolve(false);
          }
        }).error(reject);
      });
    }

    function findAll() {
      return $q(function(resolve, reject) {
        var request = $http.get('js/games.json');
        request.success(function (response) {
          resolve(response);
        }).error(reject);
      });
    }

    return {
      findOne: findOne,
      findAll: findAll
    };
  }])
  .factory('Carrinho', ['$localstorage', '$rootScope', 'Games', function ($localstorage, $rootScope, Games) {

    function add(itemId) {
      Games.findOne(itemId).then(function (itemObj) {
        var carrinho = $localstorage.getArray('carrinho');
        carrinho.push(itemObj);
        $localstorage.setObject('carrinho', carrinho);
        $rootScope.$emit('carrinho.add', itemObj);
      });
    }

    function remove(itemId) {
      var carrinho = $localstorage.getArray('carrinho');
      var novoCarrinho = carrinho.filter(function (item) {
        return item.id != itemId;
      });

      $localstorage.setObject('carrinho', novoCarrinho);
      $rootScope.$emit('carrinho.remove', itemId);
    }

    function clean() {
      $localstorage.setObject('carrinho', []);
      $rootScope.$emit('carrinho.clean');
    }

    function get() {
      return $localstorage.getArray('carrinho');
    }

    return {
      add: add,
      remove: remove,
      clean: clean,
      get: get
    };
  }]);

angular.module('hgApp.controllers', [])
  .controller('CarrinhoController', ['$rootScope', 'Carrinho', function ($rootScope, Carrinho) {
    var vm = this;

    vm.total = 0;
    vm.remove = function (id) {
      Carrinho.remove(id);
    };

    var load = function () {
      var games = Carrinho.get();

      vm.carrinho = games;
      if (games.length > 1) {
        vm.total = games.reduce(function (a, b) { return a.price + b.price; });
      } else if (games.length === 1) {
        vm.total = games[0].price;
      } else {
        vm.total = 0;
      }
    };

    load();

    $rootScope.$on('carrinho.clean', function () {
      vm.carrinho = [];
    });

    $rootScope.$on('carrinho.add', load);
    $rootScope.$on('carrinho.remove', load);
  }])
  .controller('GamesListController', ['Games', '$state', function (Games, $state) {
    var vm = this;

    vm.games = [];
    Games.findAll().then(function (games) {
      vm.games = games;
    });

    vm.gameView = function (itemId) {
      $state.go('game-detail', { 'id': itemId });
    };

    vm.carrinho = function () {
      $state.go('carrinho');
    };
  }])

  .controller('GameViewController', ['game', 'Carrinho', '$ionicPopup', '$timeout', function (game, Carrinho, $ionicPopup, $timeout) {
    var vm = this;

    vm.game = game;
    vm.add = function () {
      Carrinho.add(game.id);
      var alert = $ionicPopup.alert({ title: 'Adicionado ao Carrinho' });
      $timeout(function () {
        alert.close();
      }, 2000);
    };
  }]);

}());
