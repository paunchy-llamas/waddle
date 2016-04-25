var React = require('react-native');
var styles = require('./Styles');
var api = require('../utils/api');
var Firebase = require('firebase');

var {
  View,
  Text,
  ListView,
  TextInput,
  StyleSheet,
  TouchableHighlight
} = React;


class Messenger extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dataSource: new ListView.DataSource({rowHasChanged: (row1, row2) => row1 !== row2}),
      message: '',
      error: '',
      db: new Firebase(`https://native-messenger.firebaseio.com/${this.props.dbNameTimestamp}`)
    };
  }

  listenForMessages(db) {
    db.on('value', (snap) => {
      var messages = [];
      snap.forEach((child) => {
        messages.push({
          username: child.val().username,
          message: child.val().message,
          _key: child.key()
        });
      });
      this.setState({
        dataSource: this.state.dataSource.cloneWithRows(messages)
      });
    });
  }

  componentDidMount() {
    this.listenForMessages(this.state.db);
  }

  handleChange(text){
    this.setState({message: text});
  }

  handleSubmit(){
    var message = this.state.message.trim();
    if (message) {
      api.addMessage(this.props.userLeft, message, this.state.db)
        
        .catch((err) => {
          console.log('Request failed', err);
          this.setState({error}) //same as {error: error} - ES6 thing
        });
    }
   
    this.setState({
      message: ''
    });
  }

  handleBack() {
    this.props.navigator.pop();
  }

  footer(){
    return (
      <View style={styles.footerContainer}>
        <TextInput
          style={styles.searchInput}
          value={this.state.message}
          onChangeText={this.handleChange.bind(this)}
          placeholder="New message"
          placeholderTextColor="#b6b6b6" />
        <TouchableHighlight
          style={styles.button}
          onPress={this.handleSubmit.bind(this)}
          underlayColor="white">
            <Text style={styles.buttonText}> Submit </Text>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.button}
          onPress={this.handleBack.bind(this)}
          underlayColor="white">
            <Text style={styles.buttonText}> Back </Text>
        </TouchableHighlight>
      </View>
    )
  }

  messageViewer(rowData) {
    if (rowData.username === this.props.userLeft.toLowerCase()) {
      return (
        <Text style={styles.messageTextLeft}>{rowData.message}</Text>
      )
    } else {
      return (
        <Text style={styles.messageTextRight}>{rowData.message}</Text>
      )
    }
  }

  render(){
    return (
      <View style={styles.mainContainer}>
        <View style={styles.messengerContainer}>
          <ListView
            dataSource={this.state.dataSource}
            renderRow={(rowData) => this.messageViewer(rowData)}
            enableEmptySections={true} />
          {this.footer()}
        </View>
      </View>
    )
  }
};

Messenger.propTypes = {
  userLeft: React.PropTypes.string.isRequired,
  // messages: React.PropTypes.string.isRequired
};

module.exports = Messenger;