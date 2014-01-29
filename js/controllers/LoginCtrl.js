bookshelf.controller('LoginCtrl', function(
    $rootScope,
    $scope,
    $window,
    Token,
    $location,
    appAlert
  ){
  $scope.accessToken = Token.get();

  $scope.authenticate = function() {
    var extraParams = $scope.askApproval ? {approval_prompt: 'force'} : {};
    Token.getTokenByPopup(extraParams)
      .then(function(params) {
        // Verify the token before setting it, to avoid the confused deputy problem.
        Token.verifyAsync(params.access_token).
          then(function(data) {
            $rootScope.$apply(function() {
              $scope.accessToken = params.access_token;
              $scope.expiresIn = params.expires_in;

              Token.set(params.access_token);
            });
          }, function() {
            appAlert.add("danger", "Failed to verify token.");
          });

      }, function() {
        // Failure getting token from popup.
        appAlert.add("danger", "Failed to get token from popup.");
      });
  	};
});
