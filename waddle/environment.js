// var env = 'production';
var env = require('./env.js');
console.log('Node environment is... ', env)

// this file specifies the address to the app server serving http requests
var _Environments = {
  development: {
      IP_address: 'http://localhost:8000'
  }, 
  production: {
      IP_address: 'https://waddlingllama.herokuapp.com'
  }
};

var getEnvironment = function() {
  var platform = env;
  return _Environments[platform];
};

var Environment = getEnvironment();
module.exports = Environment;