var mongoose = require('mongoose');

var matchRequestSchema = mongoose.Schema({
  username: String,
  latitude: Number,
  longitude: Number,
  lunchOrCoffee: String,
  phone: String,
  timeStamp: { type: Date, default: Date.now }, // When did this user start looking for a match
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('MatchRequest', matchRequestSchema);
