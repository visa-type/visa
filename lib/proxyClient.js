var http = require('http');
var _req = require('request');
var sets = require('simplesets');
var moment = require('moment');
var jwt = require('jwt-simple');
var config = require('./config');
var PROXY_CONFIG = require('./proxy');
var payloads = {};

var options = {
    protocol: PROXY_CONFIG.PROTOCOL,
    method: PROXY_CONFIG.PROXY_METHOD,
    host: PROXY_CONFIG.PROXY_URL,
    port: PROXY_CONFIG.PROXY_PORT,
    host_port: PROXY_CONFIG.HOST_PORT,
    add_path: PROXY_CONFIG.ADD_USER_PATH,
    update_timer_path: PROXY_CONFIG.UPDATE_TIMER_PATH,
    update_time_for_server_path: PROXY_CONFIG.UPDATE_TIMER_FOR_SERVER_PATH,
    remove_path: PROXY_CONFIG.REMOVE_USER_PATH,
    headers: {
        'Authorization': 'Bearer ' + createJWT(PROXY_CONFIG.PROXY_USERNAME + ':' + PROXY_CONFIG.PROXY_PASSWORD)
    }
};

function createJWT(user) {
    var payload = {
        sub: user,
        iat: moment().unix(),
        exp: moment().add(14, 'days').unix()
    };
    return jwt.encode(payload, config.TOKEN_SECRET);
}


function createUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function addToPayload(user, webToken) {
    if (!payloads.hasOwnProperty(user)) {
        payloads[user] = new sets.Set();
    }
    payloads[user].add(webToken);
}

function removePayload(user) {
    console.log('payloads----->' + JSON.stringify(payloads));
    delete payloads[user];
}

function getPayload(user, payload) {
    var found_tokens = null;
    if (payloads.hasOwnProperty(user)) {
        found_tokens = payloads[user].array();
    }
    if (found_tokens !== null) {
        return payload(found_tokens[0]);
    }
    else {
        return payload(0);
    }
}

exports.requestTimer = function (user, callback) {
    var webToken = createUUID();
    addToPayload(user, webToken);
    var req = _req.post({
            url: options.protocol + "://" + options.host + ":" + options.port + options.timer_path,
            json: true,
            headers: options.headers,
            form: {user: user, payload: webToken}
        },
        function (err, response, body) {
            if (err) {
                return callback(err);
            }
            try {
                getPayload(body.uuid, function (payload) {
                    if (response.statusCode == 200 && body.payload == payload) {
                        callback(body.timer);
                    }
                });

                req.end();
            } catch (ex) {
                req.end();
                console.log(ex);
                callback();
            }
        });
    callback();
};

exports.requestUpdateTimerForServer = function (user, time, callback) {
    var webToken = createUUID();
    addToPayload(user, webToken);
    var req = _req.post({
            url: options.protocol + "://" + options.host + ":" + options.host_port + options.update_time_for_server_path,
            json: true,
            headers: options.headers,
            form: {user: user, time: time, payload: webToken}
        },
        function (err, response, body) {
            if (err) {
                return callback(err);
            }
            try {
                //getPayload(body.uuid, function (payload) {
                if (response.statusCode == 200 /*&& body.payload == payload*/) {
                    //  removePayload(body.uuid);
                    callback('ok');
                }
                req.end();
                //});
            } catch (ex) {
                console.log(ex);
                req.end();
                callback('error in post return');
            }
        });
};

exports.requestUpdateTimer = function (user, time, callback) {
    var webToken = createUUID();
    addToPayload(user, webToken);
    var req = _req.post({
            url: options.protocol + "://" + options.host + ":" + options.port + options.update_timer_path,
            json: true,
            headers: options.headers,
            form: {user: user, time: time, payload: webToken}
        },
        function (err, response, body) {
            if (err) {
                return callback(err);
            }
            try {
                //getPayload(body.uuid, function (payload) {
                console.log(response.code);
                if (response.statusCode == 200 /*&& body.payload == payload*/) {
                    //      removePayload(user);
                    callback('ok');
                } else {
                    callback('response code from proxy server:' + response.statusCode);
                }
                req.end();
                //});
            } catch (ex) {
                console.log(ex);
                callback('error in post return');
                req.end();
            }
        });

};

exports.requestRemoveUser = function (uuid, callback) {
    var webToken = createUUID();
    addToPayload(uuid, webToken);
    var req = _req.post({
            url: options.protocol + "://" + options.host + ":" + options.port + options.remove_path,
            json: true,
            headers: options.headers,
            form: {user: uuid, payload: webToken}
        },
        function (err, response, body) {
            if (err) {
                return callback(err);
            }
            try {
                getPayload(body.uuid, function (payload) {
                    if (response.statusCode == 200 && body.payload == payload) {
                        removePayload(body.uuid);
                        callback('ok');
                    }
                });

                req.end();
            } catch (ex) {
                console.log(ex);
                req.end();
                callback();
            }
        });
};

exports.requestNewUser = function (user, time, callback) {
    var webToken = createUUID();
    addToPayload(user, webToken);
    var req = _req.post({
            url: options.protocol + "://" + options.host + ":" + options.port + options.add_path,
            json: true,
            headers: options.headers,
            form: {user: user, time: time, payload: webToken}
        },
        function (err, response, body) {
            if (err) {
                return callback(err);
            }
            try {
                getPayload(body.uuid, function (payload) {
                    if (response.statusCode == 200 && body.payload == payload) {
                        removePayload(body.uuid);
                        callback('ok');
                    } else {
                        callback('The returning code from the proxy is:' + response.code + ' or payload is wrong');
                    }
                });
            } catch (ex) {
                console.log(ex);
                callback(ex.toString());
            }
        });
    req.end();
};