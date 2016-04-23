// This scene displays the results of the server's matching algorithm. Shows a mapview of a restaurant that is convenient
// for both matches, as well as the name and address. There is also a button users can use to indicate that they've reached
// the restaurant. In the future, we may want to augment this with geofencing (e.g. disable the button until the user
// is close enough, or even automatically move on to the next screen).

var React = require('react-native');

var {
  Component,
  View,
  Text,
  MapView,
  TouchableHighlight,
  StyleSheet,
  Linking
} = React;


var TwilioKeys = {
  account_sid: 'AC343542f9430e1cd0f97f0b57cd4d44af',
  auth_token: 'bedd2a8a3c581bacee9a4be24c31835c'
}



var Match = require('./match');
var styles = require('./Styles');
var api = require('../utils/api');
var Messenger = require('./Messenger');
var Firebase = require('firebase');

class Results extends Component{
  constructor(props) {
    super(props);
    this.state = {
      onMyWay: true,
      coordinates: {
        latitude: this.props.restaurant.location.lat,
        longitude: this.props.restaurant.location.lng
      },
      match: this.props.match,
      userLeft: this.props.userLeft,
      userRight: this.props.userRight
    };

    setTimeout(() => {
      this.setState({
        onMyWay: false
      })
    }, 2000);
  }



  sendTwilioText(){
    console.log('you did it, you pushed the send Twilio text button');

    var twilioUrl = `https://${TwilioKeys.account_sid}:${TwilioKeys.auth_token}@api.twilio.com/2010-04-01/Accounts/${TwilioKeys.account_sid}/Messages.json`;
    var toPhone = '+18016913092'; // THE PHONE # WOULD HAVE TO BE FORM-VALIDATED, THEN CONCATTED WITH +1
    var dbFindUserUrl = `/users/${this.props.match.username}`;
    console.log('dbFindUserUrl is', dbFindUserUrl);

    fetch(dbFindUserUrl, {
      method: 'GET',
      headers: {  'Content-Type': 'application/json' }
    })
    .then(function(res) {

      console.log('Result of db lookup on match', res);




      fetch(twilioUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `To=${ toPhone }&From=+14353154197&Body=Whatever`
      })
        .then(function(res) {
          if (res.ok) {
            console.log("Perfect! Your settings are saved.");
          } else if (res.status === 401) {
            console.log("Oops! You are not authorized.");
          }
        }, function(e) {
          console.log("Error submitting form!");
        })
        .catch(function(err) {
          console.log('in sendTwilioText catch block');
        });



    }, function(err) {
      console.log("Error making db call");
    }.bind(this));



  }



  submitHandler(){
    this.sendTwilioText();
    this.props.navigator.push({
      title: 'Match made!',
      component: Match,
      passProps: this.props
    });
  }

  requestRide(){
    var url = `uber://?client_id=P8BnVQYOltkIsc4-gTwfZCW-Qju74Kj5&action=setPickup&dropoff[latitude]=${this.props.restaurant.location.lat}&dropoff[longitude]=${this.props.restaurant.location.lng}&dropoff[nickname]=${this.props.restaurant.name}&dropoff[formatted_address]=${this.props.restaurant.address}`
    Linking.openURL(url).catch(err => console.error('An error occurred', err));
  }

  chatHandler() {
    this.props.navigator.push({
      title: 'Chat',
      component: Messenger,
      passProps: {
        //userInfo: this.state.username // TODO: change to userLeft + find username in props...
        userLeft: this.state.userLeft,
        userRight: this.state.userRight.username,
        dbNameTimestamp: this.props.dbNameTimestamp
      }
    });
  }

  render() {
    console.log('here is the restaurant info from server: ', this.props.restaurant);
    return (
      <View style={styles.mapContainer}>
        <MapView
        showsUserLocation={true}
        // followUserLocation={true}
        // even though default is true, must manually set followUserLocation to get autozoom
        region={this.state.coordinates}
        maxDelta={0.15}
        style={styles.map}
        annotations={[this.state.coordinates]}
        >
        </MapView>
        <View style={styles.mainContainer}>
          <Text style={styles.title}>Here's the restaurant</Text>
          <Text style={styles.resultsText}>Restaurant: {this.props.restaurant.name}</Text>
          <Text style={styles.resultsText}>Address: {this.props.restaurant.location.address}</Text>
          <TouchableHighlight
            disabled={this.state.onMyWay}
            style={styles.button}
            underlayColor="#f9ecdf"
            onPress={this.requestRide.bind(this)}>
            <Text style={styles.buttonText}>Uber me</Text>
          </TouchableHighlight>
          <TouchableHighlight
            disabled={this.state.onMyWay}
            style={styles.button}
            underlayColor="#f9ecdf"
            onPress={this.submitHandler.bind(this)}>
            <Text style={styles.buttonText}>I'm here</Text>
          </TouchableHighlight>
          <TouchableHighlight
            style={styles.button}
            underlayColor="#f9ecdf"
            onPress={this.chatHandler.bind(this)}>
              <Text style={styles.buttonText}>Chat</Text>
          </TouchableHighlight>
        </View>
      </View>
    );
  }
}

module.exports = Results;