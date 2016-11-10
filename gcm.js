/**
 * Created by mehrdad on 9/27/16.
 */
var gcm = require('node-gcm');

var message = new gcm.Message({
    data: {key1: 'msg1'}
});

// Set up the sender with you API key, prepare your recipients' registration tokens.
var sender = new gcm.Sender('AIzaSyB2QCXnL7VM0jvAskibr30WPxoTK9Ikd3M');
var regTokens = ['12345'];

sender.send(message, {registrationTokens: regTokens}, function (err, response) {
    if (err) console.error(err);
    else    console.log(response);
});
