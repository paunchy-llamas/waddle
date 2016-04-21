var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var userSchema = mongoose.Schema({
  firstName: String,
  email: String,
  username: String,
  password: String,
  funFact: String,
  profileImage: String,
  matches: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 }
});

var User = mongoose.model('User', userSchema);

User.comparePassword = Promise.promisify(bcrypt.compare);

// User.comparePassword = function(candidatePassword, savedPassword, cb) {
//   bcrypt.compare(candidatePassword, savedPassword, function(err, isMatch) {
//     if (err) { return cb(err); }
//     cb(null, isMatch);
//   });
// };

userSchema.pre('save', function(next) {
  var cipher = Promise.promisify(bcrypt.hash);
  return cipher(this.password, null, null).bind(this)
    .then(function(hash) {
      this.password = hash;
      next();
    });
});


module.exports = User;
