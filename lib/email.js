var nodemailer = require('nodemailer');

var isPositiveInteger = function (x) {
    return ((parseInt(x, 10) === x) && (x >= 0));
};

var createOptionError = function (optionName, optionValue, expectedType) {
    return new TypeError('Expected ' + optionName + ' to be a ' + expectedType + ', got ' + typeof optionValue);
};

/**
 * Retrieve a nested value of an object given a string, using dot notation.
 *
 * @func getNestedValue
 * @param {object} obj - object to retrieve the value from
 * @param {string} path - path to value
 * @param {string} def - default value to return if not found
 */
var getNestedValue = function (obj, path, def) {
    var i, len;

    for (i = 0, path = path.split('.'), len = path.length; i < len; i++) {
        if (!obj || typeof obj !== 'object') {
            return def;
        }
        obj = obj[path[i]];
    }

    if (obj === undefined) {
        return def;
    }
    return obj;
};


// default options
var options = {
    verificationURL: 'http://example.com/email-verification/${URL}',
    URLLength: 48,

    // mongo-stuff
    persistentUserModel: null,
    tempUserModel: null,
    tempUserCollection: 'temporary_users',
    emailFieldName: 'email',
    passwordFieldName: 'password',
    URLFieldName: 'GENERATED_VERIFYING_URL',
    expirationTime: 86400,

    // emailing options
    transportOptions: {
        service: 'Gmail',
        auth: {
            user: 'user@gmail.com',
            pass: 'password'
        }
    },
    verifyMailOptions: {
        from: 'AVESTY <noreply@avesty.com>',
        subject: 'Date changed!',
        html: '<p>The dates has changed as follows "${URL}"</p>',
        text: 'The time has changed as follows ${URL}'
    },
    shouldSendConfirmation: true,
    confirmMailOptions: {
        from: 'AVESTY <noreply@avesty.com>',
        subject: 'Successfully verified!',
        html: '<p>Your account has been successfully verified.</p>',
        text: 'Your account has been successfully verified.'
    },

    hashingFunction: null,
};


var transporter;

/**
 * Modify the default configuration.
 *
 * @func configure
 * @param {object} o - options to be changed
 */
exports.configure = function (optionsToConfigure, callback) {
    for (var key in optionsToConfigure) {
        if (optionsToConfigure.hasOwnProperty(key)) {
            options[key] = optionsToConfigure[key];
        }
    }
    transporter = nodemailer.createTransport('smtps://studiometao%40gmail.com:%23Mehrdad85918591@smtp.gmail.com');

    var err;

    if (typeof options.verificationURL !== 'string') {
        err = err || createOptionError('verificationURL', options.verificationURL, 'string');
    } else if (options.verificationURL.indexOf('${URL}') === -1) {
        err = err || new Error('Verification URL does not contain ${URL}');
    }

    if (typeof options.URLLength !== 'number') {
        err = err || createOptionError('URLLength', options.URLLength, 'number');
    } else if (!isPositiveInteger(options.URLLength)) {
        err = err || new Error('URLLength must be a positive integer');
    }

    if (typeof options.tempUserCollection !== 'string') {
        err = err || createOptionError('tempUserCollection', options.tempUserCollection, 'string');
    }

    if (typeof options.emailFieldName !== 'string') {
        err = err || createOptionError('emailFieldName', options.emailFieldName, 'string');
    }

    if (typeof options.passwordFieldName !== 'string') {
        err = err || createOptionError('passwordFieldName', options.passwordFieldName, 'string');
    }

    if (typeof options.URLFieldName !== 'string') {
        err = err || createOptionError('URLFieldName', options.URLFieldName, 'string');
    }

    if (typeof options.expirationTime !== 'number') {
        err = err || createOptionError('expirationTime', options.expirationTime, 'number');
    } else if (!isPositiveInteger(options.expirationTime)) {
        err = err || new Error('expirationTime must be a positive integer');
    }

    if (err) {
        return callback(err, null);
    }

    return callback(null, options);
};


/**
 * Send an email to the user requesting confirmation.
 *
 * @func sendVerificationEmail
 * @param {string} email - the user's email address.
 * @param {string} url - the unique url generated for the user.
 * @param {function} callback - the callback to pass to Nodemailer's transporter
 */
exports.sendVerificationEmail = function (email, url, callback) {
    var mailOptions = {};
    mailOptions.to = email;
    mailOptions.html = url;
    mailOptions.subject = 'New Date changing update!';
    mailOptions.text = url;
    transporter.sendMail(mailOptions, callback);
};

/**
 * Send an email to the user requesting confirmation.
 *
 * @func sendConfirmationEmail
 * @param {string} email - the user's email address.
 * @param {function} callback - the callback to pass to Nodemailer's transporter
 */
exports.sendConfirmationEmail = function (email, callback) {
    var mailOptions = JSON.parse(JSON.stringify(options.confirmMailOptions));
    mailOptions.to = email;
    transporter.sendMail(mailOptions, callback);
};


/**
 * Resend the verification email to the user given only their email.
 *
 * @func resendVerificationEmail
 * @param {object} email - the user's email address
 */
exports.resendVerificationEmail = function (email, callback) {
    var query = {};
    query[options.emailFieldName] = email;

    this.sendVerificationEmail(getNestedValue(tempUser, options.emailFieldName), tempUser[options.URLFieldName], function (err) {
        if (err) {
            return callback(err, null);
        }
        return callback(null, true);
    });

};