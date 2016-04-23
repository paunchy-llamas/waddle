var requestHandler = require('./requestHandler.js');
var passport = require('passport');

module.exports = function (app, express) {

  app.post('/signin', requestHandler.postSignin);
  app.post('/signup', requestHandler.postSignup);
  app.get('/match', requestHandler.getMatch);
  app.get('/users/:username/profilePhoto', requestHandler.getProfilePhoto);
  // NOTE: Below route is deprecated - it isn't called -
  // Your code will fail if you use it unless you modify
  // requestHandler.getUserInfo to handle the :username case
  // app.get('/users/:username', requestHandler.getUserInfo);

  app.get('/users/:username', requestHandler.getUserInfoByUsername);

  // app.get('/users/:email', requestHandler.getUserInfo);
  app.post('/upload', requestHandler.upload);
  app.post('/rate', requestHandler.rateUser);

  // facebook authentication
  app.get('/auth/facebook',
    passport.authenticate('facebook'));

  app.get('/auth/facebook/return',
    passport.authenticate('facebook', { failureRedirect: '/signin' }),
    function(req, res) {
      // Successful authentication, redirect home.
      console.log('app.get /auth/facebook/callback res: ', res);
      res.redirect('/');
    });

};
