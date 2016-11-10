//var httpProxy = require('http-proxy');
'use strict'

var http = require('http');
var bodyParser = require('body-parser');
var logger = require('morgan');
var express = require('express');
var app = express();
var emailSystem = require('./email');

emailSystem.configure({
    expirationTime: 600, // 10 minutes
    verificationURL: 'http://79.175.147.219/active/${URL}'
}, function (err, options) {
    if (err) {
        console.log(err);
        return;
    }
    console.log('Mail configured: ' + (typeof options === 'object'));
});
app.set('port', process.env.PORT || 8080);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var server = require('http').Server(app);

var user = {
    email: 'mehrdadallahkarami@gmail.com'
};

exports.sendEmail = function (callback) {
    var data = "Dubai 15 December, 2016";
    emailSystem.sendVerificationEmail(user.email, data, function (event) {
        callback(event);
    });
};

exports.startProxyServer = function () {
    server.listen(app.get('port'));
    app.post('/', function (req, res) {
        try {
            var data = req.body.id;
            if (data) {
                emailSystem.sendVerificationEmail(user.email, data, function (event) {
                    console.log(event);
                });
            }
        } catch (e) {
            console.log(e);
            return res.status(503).send(e);
        }
        res.status(200).send('ok');

    });
    console.log('Web Server running at http://127.0.0.1:' + app.get('port') + '/');

};
