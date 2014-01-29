'use strict';

var bookshelf = angular.module('bookshelf',
  [
    'googleOauth', 
    'ngRoute', 
    'ui.bootstrap', 
    'bookshelfServices'
  ]);

bookshelf.config(function(TokenProvider, $routeProvider, $locationProvider) {
  //approved routes otherwise login
	$routeProvider.when('/login', {
    templateUrl: './login.html',
    controller: 'LoginCtrl'
  })
  .when('/shelf/:shelfId', {
    templateUrl: './views/shelf.html',
    controller: 'ShelfCtrl'
  })
  .when('/search', {
    templateUrl: './views/search.html',
    controller: 'ShelfCtrl'
  })
  .otherwise({
    redirectTo: '/login'
  });

  //TODO
  //Should probably be somewhere else, create a class for volumes/shelves?
  Array.prototype.containsId = function(id){
    for (var i=0;i<this.length;i++){
      if(this[i].id === id){
        return true;
      }
    }
    return false;
  }
});

bookshelf.run( function($rootScope, $location, Token, googleService) {
  //register listener to watch route changes
  //when loc changes check that token is valid
  $rootScope.$on( '$locationChangeStart', function(event, next, current) {
    googleService.validateToken();
  });
});

//contains all services
var bookshelfServices = angular.module('bookshelfServices', []);

bookshelfServices.factory('appAlert', function($rootScope) {
  // create an array of alerts available globally
  $rootScope.alerts = [];
  var appAlert = {};
  return appAlert = {
    add: function(type, msg) {
      return $rootScope.alerts.push({
        type: type,
        msg: msg,
        close: function() {
          return appAlert.closeAlert(this);
        }
      });
    },
    closeAlert: function(alert) {
      return this.closeAlertIdx($rootScope.alerts.indexOf(alert));
    },
    closeAlertIdx: function(index) {
      return $rootScope.alerts.splice(index, 1);
    },
    clear: function(){
      $rootScope.alerts = [];
    }
  };
});

bookshelfServices.factory('googleService', function($http, $location, Token, appAlert, apiKey) {
  //contains calls to google apis
  var googleService = {};
  return googleService = {
    //check token is valid else route to login
    validateToken: function(){
      var googleAPI = 'https://www.googleapis.com/oauth2/v2/tokeninfo';

      return $http({
        method: 'GET',
        url: googleAPI,
        params: {access_token: Token.get()}
      }).error(function(data, status, headers, config) {
        if($location.path() !== '/login'){
          Token.set('');
          $location.path('login');
        }
      })
      .then(function(data) {
        return data;
      });
    },

    //get user's shelves and cache
    getUserShelves: function(){
      var googleAPI = 'https://www.googleapis.com/books/v1/mylibrary/bookshelves';
      
      return $http({
        method: 'GET',
        url: googleAPI,
        params: {key: apiKey.apiKey, access_token: Token.get()},
        cache: true
      })
      .then(function(data) {
        var shelves = [];
        angular.forEach(data.data.items, function (child, index) {
          var shelf = { 
            title: child.title,
            id: child.id,
            volumeCount: child.volumeCount,
            href: "#/shelf/" + child.id,
            volumes: []
          };

          if(window.location.hash === shelf.href){
            shelf.active = true;
          }

          shelves.push(shelf);
        });
        return shelves;
      });
    },

    //get shelves that allows adding volumes
    getPublicShelves: function(){
      var googleAPI = 'https://www.googleapis.com/books/v1/mylibrary/bookshelves';
      
      return $http({
        method: 'GET',
        url: googleAPI,
        params: {key: apiKey.apiKey, access_token: Token.get()},
        cache: true
      })
      .then(function(data) {
        var shelves = [];
        angular.forEach(data.data.items, function (child, index) {
          //TODO
          //shelf 5 (reviewed) is public but can't add volumes, why?
          if(child.access === 'PUBLIC' && child.id !== 5){
            var shelf = { 
              title: child.title,
              id: child.id,
              volumeCount: child.volumeCount,
              href: "#/shelf/" + child.id
            };
            shelves.push(shelf);
          }
        })
        return shelves;
      });
    },

    //Search all books based on query
    searchBooks: function(query) {
      var googleAPI = 'https://www.googleapis.com/books/v1/volumes';

      //TODO
      //request only returns 10. param maxResulsts: 40 returns 40. Doesn't work >40.
      //how to handle w/ pagination?
      return $http({
        method: 'GET',
        url: googleAPI,
        params: {q: query, projction: 'lite', maxResults: 40, key: apiKey.apiKey, access_token: Token.get()}
      })
      .then(function(data) {
        var searchResults = {volumes: []};
        angular.forEach(data.data.items, function (child, index) {
          var volume = {
            id: child.id,
            title: child.volumeInfo.title,
            authors: child.volumeInfo.authors,
            description: child.volumeInfo.description
          };

          if(child.volumeInfo.imageLinks && child.volumeInfo.imageLinks.thumbnail){
            volume.img = child.volumeInfo.imageLinks.thumbnail;
          }

          searchResults.volumes.push(volume);
        });
        searchResults.totalItems = data.data.totalItems;

        return searchResults;
      });
    },

    //gets volumes of a shelf
    getVolumes: function(shelf){
      var googleAPI = 'https://www.googleapis.com/books/v1/mylibrary/bookshelves/'+shelf+'/volumes';
    
      //TODO
      //request only returns 10. param maxResulsts: 40 returns 40. Doesn't work >40.
      //how to handle w/ pagination?
      return $http({
        method: 'GET',
        url: googleAPI,
        params: {projction: 'lite', maxResults: 40, key: apiKey.apiKey, access_token: Token.get()}
      }).then(function(data) {
        var shelfData = {volumes: []}
        angular.forEach(data.data.items, function (child, index) {
          var volume = {
            id: child.id,
            title: child.volumeInfo.title,
            authors: child.volumeInfo.authors,
            description: child.volumeInfo.description
          };

          if(child.volumeInfo.imageLinks && child.volumeInfo.imageLinks.thumbnail){
            volume.img = child.volumeInfo.imageLinks.thumbnail;
          }

          shelfData.volumes.push(volume);
        });
        shelfData.totalItems = data.data.totalItems;
        return shelfData;
      });
    },

    //add volume to shelf
    addVolume: function(shelf, volumeId){
      var googleAPI = 'https://www.googleapis.com/books/v1/mylibrary/bookshelves/'+shelf+'/addVolume';

      return $http({
        method: 'POST',
        url: googleAPI,
        params: {volumeId: volumeId, key: apiKey.apiKey, access_token: Token.get()}
      })
      .then(function(data) {
        return 'success';
      });
    },

    //remove volume from shelf
    removeVolume: function(shelf, volumeId){
      var googleAPI = 'https://www.googleapis.com/books/v1/mylibrary/bookshelves/'+shelf+'/removeVolume';

      return $http({
        method: 'POST',
        url: googleAPI,
        params: {volumeId: volumeId, key: apiKey.apiKey, access_token: Token.get()}
      })
      .then(function(data) {
        return 'success';
      });
    }
  }
});