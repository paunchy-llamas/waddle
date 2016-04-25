var React = require('react-native');
var styles = require('./Styles');
var IP_address = require('../../environment.js').IP_address;

var {
  Component,
  View,
  Text,
  Image,
  TouchableHighlight,
  TouchableOpacity
} = React;

class Rating extends Component{
  constructor(props) {
    super(props);
    this.state = {
      feeback: '',
      rated: false,
      starsTopOffset: props.match.averageRating * 2 * -40
    };
  }

  ratingHandler(rating){
    console.log('user gives this rating: ', rating);

    // update the stars displayed
    this.setState({rated: true, starsTopOffset: rating * 2 * -40 });

    //send the rating back to the server
    var url = `${IP_address}/rate`;

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: this.props.match.username,
        rating: rating
      })
    })
    .then(function(res){
      console.log('this is the response', res);
    }.bind(this));

    // display the rating feedback
    var response = ['','Sorry to hear that...', 'We\'ll do better!', 'Awesome!', ];
    this.setState({
      feedback: `\n${response[Math.ceil(rating * 3 / 5)]}\nThank you for your feedback!`
    })
  }

  goHome() {
    console.log('passed props ', this.props)
    var Welcome = require('./welcome.js');
    this.props.navigator.push({
      title: 'Welcome!',
      component: Welcome,
      passProps: this.props
    });
  }

  render(){
    var imageLinkMatch = this.props.match.testprofileImage || `${IP_address}/users/${this.props.match.username}/profilePhoto`;
    return (
      <View style={styles.mainContainer}>
        <View style={styles.avatarContainer}>
          <Image source={{uri: imageLinkMatch}} style={styles.image} />
        </View>
        <View style={styles.starbox}>
          {/* the image sprite with all the different ratings. adjusted by top position*/}
          <Image style={{position: 'absolute', top: this.state.starsTopOffset}} source={require('../assets/stars.png')} />
          {/*repeated, pressable views over each star*/}
          <View style={styles.starButtons}>
          {[0,1,2,3,4].map((index)=>{
            return <TouchableOpacity
              style={{
                position: 'absolute', 
                left: 44*index,
                width: 44,
                height: 40}}
              onPress={this.ratingHandler.bind(this, index + 1)}
              key={index} >
              </TouchableOpacity>
          })}
          </View>
        </View>

        <TouchableHighlight
          style={styles.button}
          onPress={this.goHome.bind(this)}
          underlayColor="#f9ecdf">
          <Text style={styles.buttonText}>Submit Rating</Text>
        </TouchableHighlight>

        <Text style={styles.feedbackText}>{this.state.feedback || '\n\n'}</Text>
      </View>
    )
  }
}

class Star extends Component {

}

module.exports = Rating;