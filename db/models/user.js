var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var Q = require('q');
var bluebird = require('bluebird');

var userSchema = mongoose.Schema({
  username: String,
  firstName: String,
  email: String,
  password: String,
  funFact: String,
  profileImage: String,
  matches: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 }
});

userSchema.methods.comparePasswords = function (candidatePassword) {
  var savedPassword = this.password;
  return Q.Promise(function (resolve, reject) {
    bcrypt.compare(candidatePassword, savedPassword, function (err, isMatch) {
      if (err) {
        reject(err);
      } else {
        resolve(isMatch);
      }
    });
  });
};


userSchema.pre('save', function(next) {
  var cipher = bluebird.promisify(bcrypt.hash);
  return cipher(this.password, null, null).bind(this)
    .then(function(hash) {
      this.password = hash;
      next();
    });
});


module.exports = mongoose.model('User', userSchema);
