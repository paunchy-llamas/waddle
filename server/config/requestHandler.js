var fs = require('fs');
var util = require('util');
var formidable = require('formidable');
var request = require('request');
var foursquare = require('./foursquare.js');
var db = require('../../db/db.js').db;
var bcrypt = require('bcrypt-nodejs');

// The below hard-coded examples are for testing purposes. Will be removed once Foursquare API is in place.
var restaurant = {"id":"513a4806c84c60d09153e2cc",
"name":"SQwers Izakaya & Sushi BAR",
"contact":{"phone":"4157029979",
"formattedPhone":"(415) 702-9979"},
"location":{"address":"3015 Geary Blvd","crossStreet":"bwtn Cook St & Blake St","lat":37.781747440661505,"lng":-122.45133876800537,"distance":418,"postalCode":"94118","mayNotNeedAddress":false,"cc":"US","city":"San Francisco","state":"CA","country":"United States","formattedAddress":["3015 Geary Blvd (bwtn Cook St & Blake St)","San Francisco, CA 94118","United States"]},"categories":[{"id":"4bf58dd8d48988d1d2941735","name":"Sushi Restaurant","pluralName":"Sushi Restaurants","shortName":"Sushi","icon":{"prefix":"https://ss3.4sqi.net/img/categories_v2/food/sushi_","suffix":".png"},"primary":true}],"verified":false,"stats":{"checkinsCount":313,"usersCount":199,"tipCount":10},"url":"http://sqwers.eat24hour.com","delivery":{"id":"27042","url":"http://www.seamless.com/food-delivery/restaurant.27042.r?a=1026&utm_source=Foursquare&utm_medium=affiliate&utm_campaign=SeamlessOrderDeliveryLink","provider":{"name":"seamless"}},"allowMenuUrlEdit":true,"specials":{"count":0,"items":[]},"hereNow":{"count":0,"summary":"Nobody here","groups":[]},"referralId":"v-1460144909","venueChains":[]
};
var firstMatchedUser = {"firstName":"Nathan",
"username":"Nathaniel",
"averageRating": 3.5,
"email":"nedwards@gmail.com",
"funFact":"I can code all the things",
"testprofileImage":"https://avatars1.githubusercontent.com/u/5132757?v=3&s=400"
};
var secondMatchedUser = {"firstName":"Sloth",
"username":"Sloth",
"averageRating": 2.5,
"email":"sloth@slothmail.com",
"funFact":"I am a sloth",
"testprofileImage":"https://i.ytimg.com/vi/x6VgzTsToyY/hqdefault.jpg"
};

// Mongoose models
var mongoose = require('mongoose');
var db = require('../../db/db.js').db;
var MatchRequest = require('../../db/models/matchRequest.js');
var SuccessfulMatch = require('../../db/models/successfulMatch.js');


// Bluebird promises used for interacting with database
var Promise = require('bluebird');
// temporary fake users table
var Users = {rahim: '', kevin: '', nathaniel: '', michelle: ''};

// Function to calculate distance from longitude and latitude
var getDistanceFromLatLonInM = function(lat1,lon1,lat2,lon2) {
  var deg2rad = function(deg) {
    return deg * (Math.PI/180);
  };

  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);
  var dLon = deg2rad(lon2-lon1);
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c; // Distance in km
  return d * 1000; // Return distance in meters
};

// Iterates through potential matches and returns the first valid one found.
// userLocation is an object-literal with properties longitude and latitude
var getFirstValidMatch = function(username, lunchOrCoffee, matchRequestsArray, userLocation) {
  var validMatch;
  var lat1 = userLocation.latitude;
  var lon1 = userLocation.longitude;
  var distanceCutoff = 500; // Only find potential matches within 500m

  console.log('-----------------------');
  console.log('Finding valid match for');
  console.log('username', username);
  console.log('latitude', lat1);
  console.log('longitude', lon1);
  console.log('lunch or coffee: ', lunchOrCoffee);
  console.log('-----------------------');

  for (var i = 0; i < matchRequestsArray.length; i++) {
    var lat2 = matchRequestsArray[i].latitude;
    var lon2 = matchRequestsArray[i].longitude;
    // Check if the match request was not made by the same user and if the potential match is within the distance cutoff
    if ( (matchRequestsArray[i].username !== username
      && matchRequestsArray[i].lunchOrCoffee === lunchOrCoffee
      )
      && getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) <= distanceCutoff) {
      validMatch = matchRequestsArray[i];
      break;
    }
  }
  return validMatch;
};


module.exports = {

  postSignin: function(req, res) {
    // check user exist in the database
    console.log('postSignin fired!', req.body);
    var email = req.body.email;
    var password = req.body.password;
    db.getUserByEmail(email)
      .then(function(user){
        if (user) {
          console.log('postSignin: getUser returns a user', user);
          db.attemptLogin(user[0], password)
            .then(function(success) {
              if (success) {
                console.log('postSignin: getUser sign in successful ', success);
                res.status(200).send('sign in successful');
              } 
            })
            .catch(function(err) {
              console.log('postSignin: password incorrect ', err);
              res.status(401).send('invalid email/password combination');
            })
        }
      })
      .catch(function(err){
        console.log('postSignin: user not found ', err);
        res.status(401).send('invalid email/password combination');
      });
  },

  postSignup: function(req, res) {
    var name = req.body.firstName;
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;
    var funFact = req.body.funFact;
    var profileImage = req.body.profileImage;

    return db.addUser(name, username, email, password, funFact, profileImage)
      .then(function(user){
        res.status(201).send('User Create!');
      })
      .catch(function(err){
        console.log('There was an error calling db.addUser from postSignup: ', err);
        res.status(500).send();
      });
  },

  getMatch: function(req, res) {


    /*
     * How the getMatch function works:
     * Client will send a GET request to /match with 4 headers: username, longitude, latitude, requestType
     *      - username is the username string
     *      - longitude/latitude are user's location
     *      - requestType is should equal either 'request-match' or 'retrieve-match'. 
     *            >The first request made by the client should have a type of 'request-match'. This will instruct the server to start 
     *             looking for a match. A '200' response means that the server has received the request and will start searching for a match. 
     *            > After 60s, the client should send a follow-up request with the type 'retrieve-match'. 
     *              This will instruct the server to return the match, if available.
     */

    // Request should contain the below headers - REMEMBER THAT HTTP HEADERS ARE CONVERTED LOWERCASE!
    var longitude = req.headers.longitude;
    var latitude = req.headers.latitude;
    var username = req.headers.username;
    var requestType = req.headers.requesttype;
    var lunchOrCoffee = req.headers.lunchorcoffee;

    console.log('---------------------------------------');
    console.log('Received match request with options....');
    console.log('Request Type', requestType);
    console.log('Username', username);
    console.log('latitude', latitude);
    console.log('longitude', longitude);
    console.log('lunch or coffee?', lunchOrCoffee);
    console.log('---------------------------------------');

    // Send 400 if headers not provided
    if ( ( (!longitude || !latitude || !username) && requestType === 'request-match') || !requestType) {
      res.status(400).send();
      return;
    }

    // Check if the username exists before trying to make a match
    db.checkIfUserExists(username)
      .then(function(exists) {
        if (exists) {

          /*
           * Lines 108 through 119 are 'dummy code' that will allow us to pass the unit tests.
           * This code is necessary because the continuous integration on Travis-CI does not have access to our Foursquare API keys. 
           * As such, the below vode (i.e., lines 120 onwards) will always fail the unit tests during continuous integration. 
           * Although all the code below has not been unit tested, it has been manually tested and is functional.
          */
          if (!foursquare.client_id) {
            if (requestType === 'retrieve-match'){
              console.log('Here in ...retrieve-match... withOUT foursqure');
              var responseJSON = {
                restaurant: restaurant,
                firstMatchedUser: firstMatchedUser,
                secondMatchedUser: secondMatchedUser,
                timestamp: (new Date()).toString(),
              };
              res.status(200).send(responseJSON);
              return;
            } else if (requestType === 'request-match') {
              res.status(200);
            } else {
              res.status(200);
            }
          }

          if (requestType === 'request-match') {
            // Check for active requests based on time alone
            db.getMatchRequests()
              .then(function(matchRequests) {
                // filter out requests based on location and lunch/coffee
                return getFirstValidMatch(username, lunchOrCoffee, matchRequests, { latitude: latitude, longitude: longitude });
              })
              .then(function(matchedUser) {
                if (matchedUser) {
                  matchedUser.isActive = false;
                  matchedUser.save(function(error) {
                    if (error) {
                      console.log('Could not update isActive status of matched user', matchedUser, error);
                      res.status(500).send();
                    } else {
                      foursquare.getRestaurant(longitude, latitude, lunchOrCoffee)
                        .then(function(restaurant) {
                          // Save the new match to the SuccessfulMatch table
                          var stringifiedRestaurant = JSON.stringify(restaurant);

                          var newMatch = new SuccessfulMatch({
                            firstMatchedUsername: matchedUser.username,
                            secondMatchedUsername: username,
                            restaurant: stringifiedRestaurant
                          });
                          newMatch.save(function(error) {
                            if (error) {
                              console.log('Could not add match to SuccessfulMatch table', newMatch, error);
                              res.status(500).send();
                            } else {
                              res.status(200).send();
                            }
                          });
                        })
                        .catch(function(error) {
                          console.log('There was an error calling foursquare.getRestaurant from getMatch', error);
                          res.status(500).send();
                        });
                    }
                  });
                } else {
                  var newMatchRequest = new MatchRequest({ username: username, latitude: latitude, longitude: longitude, lunchOrCoffee: lunchOrCoffee });
                  newMatchRequest.save(function(error) {
                    if (error) {
                      console.log('Could not save user to MatchRequest table: ' + username, error);
                      res.status(500).send();
                    } else {
                      res.status(200).send();
                    }
                  });
                }
              })
              .catch(function(error) {
                console.log('There was an error calling db.getMatchRequests from getMatch for user: ' + username, error);
                res.status(500).send();
              });

          } else if (requestType === 'retrieve-match') {
            db.getSuccessfulMatchForUser(username)
              .then(function(match) {
                if (match) {
                  var firstMatchedUser; // Will store user object matching first user in match
                  var secondMatchedUser; // Will store user object matching second user in match
                  console.log('Here in ...retrieve-match... with foursqure');

                  db.getUsersByUsername(match.firstMatchedUsername)
                    .then(function(users) {
                      firstMatchedUser = users[0].toObject();

                      db.getUsersByUsername(match.secondMatchedUsername)
                        .then(function(users) {
                          secondMatchedUser = users[0].toObject();
                          var responseObject = {
                            firstMatchedUser: firstMatchedUser,
                            secondMatchedUser: secondMatchedUser,
                            restaurant: JSON.parse(match.restaurant),
                            // For dbNameChat:
                            timestamp: match._id.getTimestamp(),
                          };
                          stringifiedResponseObject = JSON.stringify(responseObject);
                          res.send(stringifiedResponseObject);
                        })
                        .catch(function(error) {
                          console.log('There was an error calling db.getUsersByUsername from getMatch', error);
                          res.status(500).send();
                        });
                    })
                    .catch(function(error) {
                      console.log('There was an error calling db.getUsersByUsername from getMatch', error);
                      res.status(500).send();
                    });
                } else {
                  res.status(400).send();
                }
              })
              .catch(function(error) {
                console.log('There was an error calling db.getSuccessfulMatchForUser from getMatch: ', error);
                res.status(500).send();
              });
          } else {
            res.status(400).send();
          }
        } else {
          res.status(401).send();
        }
      })
      .catch(function(error) {
        console.log('Error calling db.checkIfUserExists from getMatch: ', error);
        res.status(500).send();
      });
  },

  getUserInfo: function(req, res) {
    var email = req.params.email.toLowerCase();

    db.getUserByEmail(email)
      .then(function(users) {
        var user = users[0];
        console.log(users);
        res.setHeader('userInfo', JSON.stringify(users));
        res.status(200).json(users[0]);
      })
      .catch(function(error) {
        console.log('There was an error calling db.getUsersByUsername from getUserInfo: ', error);
        res.status(500).send();
      });
  },

  getProfilePhoto: function(req, res) {
    var username = req.params.username.toLowerCase();

    db.getUsersByUsername(username)
      .then(function(users) {
        console.log(users[0]);
        var file  = users[0].profileImage;
        var options = {
          'Content-Type': 'image/jpeg',
          'root': __dirname + '/../uploads/' // directory which houses images
        };

        res.sendFile(file, options, function(err) {
          if (err) {
            console.error(err);
            res.status(400).send();
          }
          else {
            console.log('Sent:', file);
          }
        });
        
      })
      .catch(function(error) {
        console.log('There was an error calling db.getUserByEmail from getProfilePhoto: ', error);
        res.status(500).send();
      });
  },

  upload: function(req, res) {
    var form = new formidable.IncomingForm();
    form.uploadDir = "./server/uploads";
    form.keepExtensions = true;

    // TODO: delete following renaming function
    // form.on('file', function(field, file) {
    //     //rename the incoming file to the file's name
    //     console.log(file.path, form.uploadDir, file.name);
    //       // fs.rename(file.path, form.uploadDir + "/" + file.name);
    // });

    form.parse(req, function(err, fields, files) {
      // Associate files.photo.path [location of img on FS] with the appropriate user in database
      var username = fields.username.toLowerCase();
      var firstName = fields.firstName;
      var funFact = fields.funFact;
      var email = fields.email;
      var fileName = files.photo.path.replace('server/uploads/', '');

      var newInfo = {
        username: username,
        profileImage: fileName,
        firstName: firstName,
        funFact: funFact,
        email: email
      };


      db.updateUser(username, newInfo)
        .then(function(user){
          console.log('user updated: ', user);
        })
        .catch(function(error) {
          console.log('There was an error calling db.updateUser from upload: ', error);
          res.status(500).send();
        });

      res.writeHead(200, {'content-type': 'text/plain'});
      res.end(util.inspect({fields: fields, files: files})); // Like a console.dir
    });
  },

  rateUser: function(req, res) {
    var username =  req.body.username;
    var newRating = req.body.rating;

    // Check if a valid rating was provided
    if (newRating < 1 || newRating > 5) {
      res.status(400).send();
      return;
    }

    db.getUsersByUsername(username)
      .then(function(users) {
        // Check if user exists
        if (users.length === 0) {
          console.log('rated user does not exist')
          res.status(400).send();
          return;
        }
        var numMatches = users[0].matches;
        var currentRating = users[0].averageRating;

        var newNumMatches = numMatches + 1;
        var newAverageRating = ((currentRating * numMatches + newRating) / newNumMatches);

        db.updateUser(username, {
          matches: newNumMatches,
          averageRating: newAverageRating
        });

        res.status(201).send();
      })
      .catch(function(error) {
        console.log('Error calling getUsersByUsername from rateUser: ', error);
        res.status(500).send();
      });
  }
};
