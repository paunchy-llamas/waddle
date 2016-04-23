var env = require('./env.js');

var _Environments = {
  development: {
      // IP_address: 'http://192.168.0.104:8000'
      IP_address: 'http://localhost:8000'
  },
  production: {
      IP_address: 'http://159.203.254.178:8000'
  }
};

var getEnvironment = function() {
  var platform = env;
  return _Environments[platform];
};

var Environment = getEnvironment();
module.exports = Environment;