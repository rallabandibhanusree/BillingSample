/**
 * Created by hsingh008c on 1/19/17.
 */

var winston = require('winston');
var fs = require('fs');
var env = process.env.NODE_ENV || 'development';
var logDir = 'logs';
if(!fs.existsSync(logDir)){
    fs.mkdirSync(logDir);
}

var tsFormat = function() {
    return new Date().toLocaleString();
};

module.exports = new winston.Logger({
    transports: [
        new winston.transports.File({
            name: "Info",
            timestamp: tsFormat,
            filename:'./logs/user_account_info.log',
            handleExceptions: true,
            json: true,
            maxsize: 5242880,
            colorize: false,
            level: 'info'
        }),
        new winston.transports.File({
            name: "error",
            timestamp: tsFormat,
            filename:'./logs/user_account_error.log',
            handleExceptions: true,
            json: true,
            maxsize: 5242880,
            colorize: false,
            level: 'error'
        }),
        new winston.transports.File({
            name: "debug",
            timestamp: tsFormat,
            filename:'./logs/user_account_debug.log',
            handleExceptions: true,
            json: true,
            maxsize: 5242880,
            colorize: false,
            level: 'debug'
        }),
        new winston.transports.Console({
            timestamp: tsFormat,
            level: env === 'development' ? 'info' : 'error',
            handleExceptions: true,
            json: false,
            colorize: true
        })
    ],
    exitOnError: false
});