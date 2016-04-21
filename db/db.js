/*
 * The purpose of this file is to define a ste of functions that will act as an interface between the application and mongodb.
 * The mongodb server is configured in db/config.js
*/

var User = require('./models/user');
var MatchRequest = require('./models/matchRequest');
var SuccessfulMatch = require('./models/successfulMatch');
var Promise = require('bluebird');

exports.db = {
  getUser: function(email) {
    // Creates object to query database

    return new Promise(function(resolve, reject) {
      User.find({email: email}, function(error, user) {
        if (error) {
          console.log('ERROR calling getUsers function', error);
          reject(error);
        } 

        if (user.length === 0) {
          reject(user);
        } else {
          resolve(user);
        } 
      });
    });
  },

  attemptLogin: function(user, password) {
    return new Promise(function(resolve, reject) {
      User.comparePassword(password, user.password).bind(this)
      .then(function (foundUser) {
        if (foundUser) {
          resolve(foundUser);
        } else {
          reject('invalid email/password combination');
        }
      })
    });
  },

  checkIfUserExists: function(username) {
    return new Promise(function(resolve, reject) {
      if (!username) {
        resolve(false);
      } else {
        User.find({ username: username }, function(error, users) {
          if (error) {
            console.log('Unable to query for user with checkIfUserExists function', error);
            reject(error);
          } else if (users.length > 0) {
            resolve(true);
          } else {
            resolve(false);
          }
        });
      }
    });
  },

  addUser: function(firstName, email, password, funFact, profileImage) {
    var newDbEntry = {
      firstName: firstName,
      email: email,
      password: password,
      funFact: funFact,
      profileImage: profileImage
    };

    var  newUser = new User(newDbEntry);

    return new Promise(function(resolve, reject) {
      newUser.save(function(error, newUser) {
        if (error) {
          console.log('ERROR calling addUser function', error);
          reject(error);
        } else {
          resolve(newUser);
        }
      });
    });
  },

  getAllUsers: function() {
    return new Promise(function(resolve, reject) {
      User.find({}, function(error, users) {
        if (error) {
          console.log('ERROR calling getAll function', error);
          reject(error);
        } else {
          resolve(users);
        }
      });
    });
  },

  removeUser: function(username, email) {
    var dbQueryObject = {};
    if (username) {
      dbQueryObject.username = username;
    }
    if (email) {
      dbQueryObject.email = email;
    }

    return new Promise(function(resolve, reject) {
      User.remove(dbQueryObject, function(error) {
        if(error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  },

  getMatchRequests: function() {
    // Will only look for requests made in the last 2 minutes
    var requestTimeCutoff = new Date() - (45000); // = 45s
    return new Promise(function(resolve, reject) {
      MatchRequest.find({ isActive: true, timeStamp: { $gt: requestTimeCutoff } }, function(error, matchRequests) {
        if (error) {
          console.log('Could not retrieve active match requests', error);
          reject(error);
        } else {
          resolve(matchRequests);
        }
      });
    });
  },

  getSuccessfulMatchForUser: function(username) {
    // Will only look for matches made in the last 2 minutes
    var matchTimeCutoff = new Date() - (60 * 1000); // = 60s/min * 1000ms/s
    return new Promise(function(resolve, reject) {
      SuccessfulMatch.find( { $or: [{ firstMatchedUsername: username, matchTime: { $gt: matchTimeCutoff } }, { secondMatchedUsername: username, matchTime: { $gt: matchTimeCutoff } }] }, function(error, matches) {
        if (error) {
          console.log('There was an error querying the match table', error);
          reject(error);
        } else {
          // Gets latest match from array of results
          var latestMatch = matches[0];
          for (var i = 1; i < matches.length; i++) {
            if (matches[i].matchTime > latestMatch.matchTime) {
              latestMatch = matches[i];
            }
          }
          resolve(latestMatch);
        }
      });
    });
  },

  updateUser: function(username, newInfo) {
    return new Promise(function(resolve, reject) {
      User.update({username: username}, newInfo, function(error, resp) {
        if (error) {
          console.log('ERROR calling updateUser', error);
          reject(error);
        } else {
          resolve(resp);
        }
      });
    });
  }
};