bookshelf.controller('VolumeCtrl', function(
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

  //get volumes on shelf
  var init = function(){
    $scope.loading = true;
    googleService.getVolumes($routeParams.shelfId).then(function(data){
      $scope.loading = false;
      $scope.totalItems = data.totalItems;
      $scope.volumes = data.volumes;
    });
  };

  init();

  //creates modal on clicking a volume
  $scope.bookModal = function (volume) {
    var modalInstance = $modal.open({
      templateUrl: 'views/volumeModal.html',
      controller: VolumeModalInstanceCtrl,
      resolve: {
        volume: function () {
          return volume;
        },
        publicShelves: function(){
          return googleService.getPublicShelves();
        }
      }
    });

    modalInstance.result.then(function (selectedItem) {
      init();
    }, function () {
      $log.info('Modal dismissed at: ' + new Date());
    });
  };

  var VolumeModalInstanceCtrl = function ($scope, $modalInstance, volume, publicShelves) {
    //check which volumes contain volume
    var init = function(){
      checkShelvesContainVolume();
    };

    var checkShelvesContainVolume = function(){
      angular.forEach(publicShelves, function(shelf, index){
        googleService.getVolumes(shelf.id).then(function(data){
          //sets shelf boolean to true to display check or not
          shelf.containsVolume = data.volumes.containsId(volume.id);
        });
      });
      $scope.publicShelves = publicShelves;
    };

    $scope.ok = function(){
      $modalInstance.close();
    };

    //adds volume to a shelf
    $scope.addVolume = function(shelfId){
      return googleService.addVolume(shelfId, volume.id).then(function(data){
        checkShelvesContainVolume()
      });
    };

    //removes volume from a shelf
    $scope.removeVolume = function(shelfId){
      return googleService.removeVolume(shelfId, volume.id).then(function(data){
        checkShelvesContainVolume()
      });
    };

    $scope.volume = volume;
    init();
  };
});