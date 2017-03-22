/**
 * Created by hsingh008c on 2/3/17.
 */
var cloudmine = require('cloudmine');
var rest = require('restler');
var config = require('config');
var adminUtility = require('./adminUtility');
var localCache = require("./cache");
var logger = require('./logger_module');
var domain = config.get('cch.domain');
var ENV = process.env.NODE_ENV;

var conf_app_id = config.get('cloudmine.app_id');
var conf_api_key = config.get('cloudmine.api_key');

module.exports = {
    getWS: function (req) {
        return new Promise(function (resolve, reject) {
            var session_token = "";
            var _cch_id = "";

            try {
                var access_token = req.payload.session['session_token'];
                session_token = localCache.get(req.payload.session['session_token']);
                _cch_id = localCache.get(req.payload.session['session_token'] + "cch_id");
            } catch (err) {
                logger.error(err);
                reject({"message": "server error" + err, "status": 500});
            }

            if (session_token !== undefined && session_token !== "") {
                logger.info("No need to login, resume existing session");
                var ws = new cloudmine.WebService({
                    appid: conf_app_id,
                    apikey: conf_api_key,
                    session_token: session_token,
                    shared: true,
                    appname: "UserAccount"
                });
                localCache.set(access_token+"WS", ws);
                resolve(ws);
            } else {
                var ws = new cloudmine.WebService({
                    appid: conf_app_id,
                    apikey: conf_api_key,
                    shared: true,
                    appname: "UserAccount"
                });

                var header = {
                    'content-type': 'application/x-www-form-urlencoded',
                    'Authorization': config.get('ping.authorization')
                };

                var payload_validate = {};
                payload_validate['grant_type'] = config.get('ping.grant_type');
                payload_validate['token'] = access_token;
                var options_validate = {
                    method: "post",
                    data: payload_validate,
                    headers: header,
                    timeout: 10000
                };

                rest.post(config.get('ping.validation_url'), options_validate).on('success', function (validate_result, response) {
                    var _uuid = validate_result["access_token"]["entryuuid"];
                    if (validate_result["access_token"]["secret"] !== undefined && validate_result["access_token"]["uid"] != "csr") {
                        var _secret = validate_result["access_token"]["secret"];
                    } else {
                        if(ENV == "development"){
                            var _secret = "-cch";
                        }else{
                            var _secret = validate_result["access_token"]["secret"];
                        }
                    }
                    if (validate_result["access_token"]["cch_id"] !== undefined && validate_result["access_token"]["cch_id"] != "") {
                        _cch_id = validate_result["access_token"]["cch_id"];
                        localCache.set(access_token + "cch_id", _cch_id);
                    }
                    ws.login(_uuid + "@" + domain, _uuid + _secret)
                        .on('success', function (data, response) {
                            logger.info("Login successful");
                            localCache.set(access_token, data['session_token']);
                            localCache.set(access_token+"WS", ws);
                            resolve(ws);
                        }).on('error', function (err) {
                        logger.error("login error" + err);
                        reject({"message": "login error" + err, "status": 401});
                    });
                }).on('timeout', function (ms) {
                    logger.error('Did not return within ' + ms + ' ms');
                    reject({"message": "Time out" + ms, "status": 504});
                }).on('fail', function (error) {
                    logger.error(error);
                    reject({"message": error, "status": 401});
                }).on('error', function (error) {
                    logger.error(error);
                    reject({"message": error, "status": 401});
                });
            }
        });
    }
};