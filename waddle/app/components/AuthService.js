var React = require('react-native');
var IP_address = require('../../environment.js').IP_address;
var AsyncStorage = require('react-native').AsyncStorage;
var _ = require('lodash');
// var buffer = require('buffer');
// var _ = require('lodash');
// var bcrypt = require('bcrypt');

const authKey = 'auth';
const userKey = 'user';

class AuthService {

    login(creds, cb){
        var url = `${IP_address}/signin`
        fetch(url,{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: creds.username,
              password: creds.password
            })
        })
        .then((res)=> {
            if(res.status >= 200 && res.status < 300){
                console.log('this is the res after login attempt: ', res);
                return res;
            }

            throw {
                badCredentials: res.status == 401,
                unknownError: res.status != 401
            }
        })
        .then((res)=> {
            return res.json();
        })
        .then((results)=> {
            AsyncStorage.multiSet([
                [authKey, encodedAuth],
                [userKey, JSON.stringify(results)]
            ], (err)=> {
                if(err){
                    throw err;
                }

                return cb({success: true});
            })
        })
        .catch((err)=> {
            return cb(err);
        });
    }
}

module.exports = new AuthService();