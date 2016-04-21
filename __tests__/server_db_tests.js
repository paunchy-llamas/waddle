// Require depedencies needed for testing
jest.unmock('request');
var request = require('request');

describe('Basic server functionality', () => {

  it('Should not accept and respond to GET requests at the non-existant endpoints', (done) => {
    request
      .get('http://127.0.0.1:8000/arglebargle')
      .on('response', function(response) {
        expect(response.statusCode).toEqual(404);
        done();
      })
      .on('error', function(error) {
        expect(true).toEqual(false);
        console.log('Error sending GET request to /arglebargle', error);
        done();
      });
  });
});

// Tests for database sign-in
describe('Basic sign-in/sign-up functionality', () => {
  it('Should be able to add new user to database and sign-in with that user', (done) => {
    var newUser = { email: 'test@test.com', username: 'test', password: 'test' };
    request({
      url: 'http://127.0.0.1:8000/signup',
      method: 'POST',
      json: newUser
    }, function(error, response, body) {
      if (error) {
        // Automatically failing if the request does not go through
        expect(true).toEqual(false);
        done();
      } else {
        request({
          url: 'http://127.0.0.1:8000/signin',
          method: 'POST',
          json: { email: newUser.email, password: newUser.password },
        }, function(error, response, body) {
          if (error) {
            // Automatically failing if the request does not go through
            expect(true).toEqual(false);
            done();
          } else {
            // TODO update the below based on your actual implementation of the sign-in request handler
            expect(response.statusCode).toEqual(200);
            done();
          }
        });
      }
    });
  });
});

// Tests for matching function/endpoint
describe('Matching algo functionality', () => {
  it('Should respond with a 400 if proper headers are not provided with GET request at /match', (done) => {
    request
      .get('http://127.0.0.1:8000/match')
      .on('response', function(response) {
        expect(response.statusCode).toEqual(400);
        done();
      })
      .on('error', function(error) {
        expect(true).toEqual(false);
        console.log('Error sending GET request to /match');
        done();
      });
  });
  it('Should not respond with a 401 if username does not exist', (done) => {
    var requestOptions = {
      url: 'http://127.0.0.1:8000/match',
      headers: {
        'longitude': 999,
        'latitude': 999,
        'username': 'arglebargle',
        'requesttype': 'request-match'
      }
    };
    request
      .get(requestOptions)
      .on('response', function(response) {
        expect(response.statusCode).toEqual(401);
        done();
      })
      .on('error', function(error) {
        expect(true).toEqual(false);
        console.log('Error sending GET request to /match');
        done();
      });
  });
  it('Should not respond with a 400 if requesttype incorrect', (done) => {
    var requestOptions = {
      url: 'http://127.0.0.1:8000/match',
      headers: {
        'longitude': 999,
        'latitude': 999,
        'username': 'test',
        'requesttype': 'arglebargle'
      }
    };
    request
      .get(requestOptions)
      .on('response', function(response) {
        expect(response.statusCode).toEqual(400);
        done();
      })
      .on('error', function(error) {
        expect(true).toEqual(false);
        console.log('Error sending GET request to /match');
        done();
      });
  });
  it('Should return a match object when GET request is made to /match endpoint with a requesttype of retrieve-match', (done) => {
    var requestOptions = {
      url: 'http://127.0.0.1:8000/match',
      headers: {
        'longitude': 999,
        'latitude': 999,
        'username': 'test',
        'requesttype': 'retrieve-match'
      }
    };
    request.get(requestOptions, function(error, response, body) {
      if(error) {
        expect(true).toEqual(false);
        console.log('Error sending GET request to /match', error);
        done();
      } else {
        body = JSON.parse(body);
        expect(body.restaurant).toBeDefined();
        expect(body.firstMatchedUser).toBeDefined();
        expect(body.secondMatchedUser).toBeDefined();
        done();
      }
    });
  });
  it('Should respond with 200 when GET request is made to /match with valid username and requesttype of request-match', (done) => {
    var requestOptions = {
      url: 'http://127.0.0.1:8000/match',
      headers: {
        'longitude': 999,
        'latitude': 999,
        'username': 'test',
        'requesttype': 'retrieve-match'
      }
    };
    request.get(requestOptions, function(error, response, body) {
      if(error) {
        expect(true).toEqual(false);
        console.log('Error sending GET request to /match', error);
        done();
      } else {
        body = JSON.parse(body);
        expect(response.statusCode).toEqual(200);
        done();
      }
    });
  });
});

describe('Username endpoint functionality', () => {
  it('Should respond to requests made to the /users/:email endpoint when the email is valid', (done) => {
    request.get('http://127.0.0.1:8000/email/test@test.com', (error, response, body) => {
      if(error) {
        expect(true).toEqual(false);
        console.log('Error sending GET request to /users/:email', error);
        done();
      } else {
        body = JSON.parse(body);
        expect(response.statusCode).toEqual(200);
        expect(body.username).toEqual('test');
        done();
      }
    });
  });
  it('Should not respond made to the /users/:email endpoint when the email is invalid', (done) => {
    request.get('http://127.0.0.1:8000/users/arglebargle@nonexistent.com', (error, response, body) => {
      if (error) {
        expect(true).toEqual(false);
        console.log('Error sending GET request to /users/:email', error);
        done();
      } else {
        expect(response.statusCode).toEqual(200);
        expect(body.username).toBeUndefined();
        done();
      }
    });
  });
});

describe('User rating functionality', () => {
  it('Should respond with a 400 if user does not exist', (done) => {
    var requestOptions = {
      url: 'http://127.0.0.1:8000/rate',
      json: true,
      body: {
        'username': 'arglebargle',
        'rating': 2
      }
    };
    request.post(requestOptions, function(error, response, body) {
      if(error) {
        expect(true).toEqual(false);
        console.log('Error sending POST request to /rate', error);
        done();
      } else {
        expect(response.statusCode).toEqual(400);
        done();
      }
    });
  });
  it('Should respond with a 201 when a new rating is provided for a valid user', (done) => {
    var requestOptions = {
      url: 'http://127.0.0.1:8000/rate',
      json: true,
      body: {
        'username': 'test',
        'rating': 2
      }
    };
    request.post(requestOptions, function(error, response, body) {
      if(error) {
        expect(true).toEqual(false);
        console.log('Error sending POST request to /rate', error);
        done();
      } else {
        expect(response.statusCode).toEqual(201);
        requestOptions.body = {
          'username': 'test',
          'rating': 3
        };
        request.post(requestOptions, function(error, response, body) {
          if(error) {
            expect(true).toEqual(false);
            console.log('Error sending POST request to /rate', error);
            done();
          } else {
            expect(response.statusCode).toEqual(201);
            done();
          }
        });
      }
    });
  });
  it('Should respond with an accurate user rating', (done) => {
    request.get('http://127.0.0.1:8000/users/test@test.com', function(error, response, body) {
      if(error) {
        expect(true).toEqual(false);
        console.log('Error sending POST request to /rate', error);
        done();
      } else {
        body = JSON.parse(body);
        expect(body.averageRating).toEqual(2.5);
        done();
      }
    });
  });
});



