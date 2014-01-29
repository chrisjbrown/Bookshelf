bookshelf.controller('ShelfCtrl', function(
    $scope,
    $http,
    $log,
    $location,
    $routeParams,
    $modal,
    Token,
    apiKey,
    appAlert,
    googleService
  ){

  //get shelves
  var init = function(){
    googleService.getUserShelves().then(function(data){
      $scope.shelfTabs = data;
    });
  };

  //change url to match tab selected
  $scope.changeHash = function(href){ 
		window.location.hash = href;
  };

  init();
});