// Displays a picture of the user's match once the user has indicated that they're at the restaurant. Also shows the
// match's name and fun fact. There is a button to indicate that you've found your match, which takes you
// to an icebreaker / enjoy your lunch screen.

//`${IP_address}/users/${this.props.match.username}/profilePhoto?$date={Date.now()}`;

// var imageLink = this.props.match.testProfileImage || `${IP_address}/users/${this.props.match.username}/profilePhoto?$date={Date.now()}`;
// console.log('match.js link to image: ', imageLink);
// console.log('match information: ', this.props.match);
  // <Image
  //   source={{uri: imageLink}}
  //   onLoadEnd={()=>{console.log('image actually loaded, so........')}}
  //   style={styles.image}
  //   />

// this.props.match.testProfileImage ||

var React = require('react-native');
var IP_address = require('../../environment.js').IP_address;
var Enjoy = require('./enjoy');
var styles = require('./Styles');

var {
  Component,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableHighlight
} = React;

class Match extends Component{
  constructor(props){
    super(props);
  }

  foundHandler(){
    this.props.navigator.push({
      title: 'Enjoy Your Lunch',
      component: Enjoy,
      passProps: this.props
    });
  }

  render(){

   //var imageLink = `${IP_address}/users/${this.props.match.username}/profilePhoto?$date={Date.now()}`;
   // console.log('match.js link to image: ', imageLink);
   console.log('match information: ', this.props.match);


    return (
      <View style={styles.mainContainer}>
        <Image
          source={{uri: "https://i.ytimg.com/vi/x6VgzTsToyY/hqdefault.jpg"}}
          onLoadEnd={()=>{console.log('image actually loaded, so........')}}
          style={styles.image}
         />
        <Text style={styles.title}>Heres your match!</Text>
        <Text style={styles.resultsText}>First Name: {this.props.match.firstName}</Text>
        <Text style={styles.resultsText}>Fun Fact: {this.props.match.funFact}</Text>
        <TouchableHighlight
          style={styles.button}
          onPress={this.foundHandler.bind(this)}
          underlayColor="#f9ecdf">
          <Text style={styles.buttonText}>I found them!</Text>
        </TouchableHighlight>
      </View>
    )
  }
}

module.exports = Match;
