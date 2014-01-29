bookshelf.constant( 'apiKey', {
    //TODO 
    //should really be getting this from a server for security
    apiKey: 'AIzaSyA2PeMSRB6mfFhNOGMhv1UhqdiXtFcse84'
  });

bookshelf.config(function(TokenProvider, $routeProvider, $locationProvider) {

  // Bad: setting relative url
  //var baseUrl = 'http://bookshelfdev.christopherjbrown.net/';
  var baseUrl = 'http://127.0.0.1:8080/projects/Bookshelf/';

  //set Gapi settings
  TokenProvider.extendConfig({
    clientId: '220625573766.apps.googleusercontent.com',
    redirectUri: baseUrl + 'oauth2callback.html',
    scopes: ['https://www.googleapis.com/auth/books']
  });
});