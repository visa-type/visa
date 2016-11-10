/**
 * Created by mehrdad on 9/27/16.
 */

var request = require('request');
var http = require('http');
var bodyParser = require('body-parser');
var logger = require('morgan');
var express = require('express');
var cheerio = require('cheerio');
var emailSystem = require('./lib/email');

var app = express();
var server = require('http').Server(app);
app.set('port', process.env.PORT || 3000);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var status = false;

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

var options = {
    url: 'https://ais.usvisa-info.com/en-ir',
    email: 'mehrdadallahkarami@gmail.com',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.110 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded'
    },
    timeSlice: 10000// 10 seconds
};

var oldTime = ["11 January, 2016", "11 January, 2016", "11 January, 2016"];

var dates = {
    convert: function (d) {
        return (
            d.constructor === Date ? d :
                d.constructor === Array ? new Date(d[0], d[1], d[2]) :
                    d.constructor === Number ? new Date(d) :
                        d.constructor === String ? new Date(d) :
                            typeof d === "object" ? new Date(d.year, d.month, d.date) :
                                NaN
        );
    },
    compare: function (a, b) {
        return (
            isFinite(a = this.convert(a).valueOf()) &&
            isFinite(b = this.convert(b).valueOf()) ?
            (a > b) - (a < b) :
                NaN
        );
    }
};

function readGet(cb) {
    //start reading data
    request.get({url: options.url, headers: options.headers}, function (error, body, response) {
        if (!error) {
            body = body.body;
            var $ = cheerio.load(body);
            var counter = 0;
            var availableTimes = [];
            var times = $('.ten>ul>li').each(function () {
                counter++;
            });
            times.each(function () {
                availableTimes.push($(this).text());
            });

            var value1 = availableTimes[1];
            var value2 = availableTimes[4];
            var value3 = availableTimes[7];
            if (value1 || value2 || value3) {
                var timeStr1 = value1.substr(value1.indexOf(':') + 2, value1.length).replace('\n', '');
                var timeStr2 = value2.substr(value2.indexOf(':') + 2, value2.length).replace('\n', '');
                var timeStr3 = value3.substr(value3.indexOf(':') + 2, value3.length).replace('\n', '');
                cb({data: {"Dubai": timeStr1, "Yerevan": timeStr2, "Turkey": timeStr3}});
            }
        } else {
            return cb({error: {"result": "failed"}});
        }
    });
}

var sendMail = function (index) {
    var data = "heroku=" + JSON.stringify(index);
    emailSystem.sendVerificationEmail(options.email, data, function (event) {
        console.log('email sent!');
    });
};


server.listen(app.get('port'), function () {
    setInterval(function () {
        readGet(function (callback) {
            if (callback.error) {
                console.log(callback.error);
                status = false;
            } else {
                var data = callback.data;
                if (data) {
                    status = true;
                    var time1 = Date.parse(data.Dubai);
                    var time2 = Date.parse(data.Yerevan);
                    var time3 = Date.parse(data.Turkey);
                    var pastTime1 = Date.parse(oldTime[0]);
                    var pastTime2 = Date.parse(oldTime[1]);
                    var pastTime3 = Date.parse(oldTime[2]);
                    console.log(data);
                    if (dates.compare(time1, pastTime1) > 0 || dates.compare(time1, pastTime1) < 0) {
                        console.log('\x1b[93mNew date updated! Dubai:' + data.Dubai + '\x1b[0m');
                        oldTime[0] = data.Dubai;
                        sendMail(data);
                    }
                    if (dates.compare(time2, pastTime2) > 0 || dates.compare(time2, pastTime2) < 0) {
                        console.log('\x1b[93mNew date updated! Yerevan:' + data.Yerevan + '\x1b[0m');
                        oldTime[1] = data.Yerevan;
                        sendMail(data);
                    }
                    if (dates.compare(time3, pastTime3) > 0 || dates.compare(time3, pastTime3) < 0) {
                        console.log('\x1b[93mNew date updated! Turkey:' + data.Turkey + '\x1b[0m');
                        oldTime[2] = data.Turkey;
                        sendMail(data);
                    }

                } else {
                    console.log('no data!');
                    status = false;
                }
            }
        });
    }, options.timeSlice);
});

app.get('/', function (req, res) {
    res.end('server status:' + status ? "server is working..." : "server is out of service...");
});




