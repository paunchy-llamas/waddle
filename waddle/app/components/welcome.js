// The landing page after login / new user flow. Greets the user and lets them request a match.

var React = require('react-native');
var Loading = require('./loading');
var IP_address = require('../../environment.js').IP_address;
var styles = require('./Styles');

var {
  Text,
  View,
  Component,
  StyleSheet,
  TouchableHighlight,
  Image
} = React;

class Welcome extends Component{

  handleSubmit(){
    console.log('you did it, you pushed the lunch buddy button');
    // do stuff w/ navigator
    this.props.navigator.push({
      title: "Finding you a match",
      component: Loading,
      passProps: this.props
    });
  }

  takeProfilePic() {
    console.log('lets take a new profile pic')
    var Selfie = require('./selfie');
    this.props.navigator.push({
      title: "Take a selfie!",
      // leftButton: "Signup",
      component: Selfie,
      passProps: this.props
    });
  }

  render(){
    var imageLink = this.props.picture || `${IP_address}/users/${this.props.email}/profilePhoto?date=${Date.now()}`;
    console.log('match.js link to image: ', imageLink);
    return (
      <View style={styles.mainContainer}>
        <Text style={styles.welcomeText}>Welcome, { this.props.firstName || this.props.username}</Text>
        <Image 
          style={styles.avatar} 
          source={{uri: imageLink}} />
        <TouchableHighlight
          style={styles.button}
          onPress={this.handleSubmit.bind(this)}
          underlayColor="#f9ecdf">
          <Text style={styles.buttonText}>gimme a lunch buddy</Text>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.button}
          onPress={this.takeProfilePic.bind(this)}
          underlayColor="#f9ecdf">
          <Text style={styles.buttonText}>retake my picture</Text>
        </TouchableHighlight>
      </View>
    );
  }
};

module.exports = Welcome;
