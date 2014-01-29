bookshelf.controller('SearchCtrl', function(
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

  //search for books by query
  $scope.bookSearch = function(query){
    if(query){
      googleService.searchBooks(query).then(function(data){
        $scope.searchResults = data.volumes;
        $scope.totalItems = data.totalItems;
      });
    }
  };

  //create modal for volume
  $scope.volumeResultModal = function (volume) {
    var modalInstance = $modal.open({
      templateUrl: 'views/volumeSearchModal.html',
      controller: VolumeSearchModalInstanceCtrl,
      resolve: {
        volume: function(){
          return volume;
        },
        publicShelves: function(){
          return googleService.getPublicShelves();
        }
      }
    });
  };

  var VolumeSearchModalInstanceCtrl = function ($scope, $modalInstance, volume, publicShelves, googleService) {

    var init = function(){
      checkShelvesContainVolume();
    };

    var checkShelvesContainVolume = function(){
      angular.forEach(publicShelves, function(shelf, index){
        googleService.getVolumes(shelf.id).then(function(data){
          shelf.containsVolume = data.volumes.containsId(volume.id);
        });
      });
      $scope.publicShelves = publicShelves;
    };

    $scope.ok = function(){
      $modalInstance.close();
    };

    $scope.addVolume = function(shelfId){
      return googleService.addVolume(shelfId, volume.id).then(function(data){
        checkShelvesContainVolume()
      });
    };

    $scope.removeVolume = function(shelfId){
      return googleService.removeVolume(shelfId, volume.id).then(function(data){
        checkShelvesContainVolume()
      });
    };

    $scope.volume = volume;
    init();
  };

});