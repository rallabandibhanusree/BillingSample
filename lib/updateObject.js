/**
 * Created by hsingh008c on 2/13/17.
 */

'use strict';
var cloudmine = require('cloudmine');
var logger = require('./logger_module');
var config = require('config');
var local_cache = require("./cache");
var rest = require('restler');
var promise = require('promise');
var search_local = require('./search');
//
// Comcast Connected Health
// 2016
//

module.exports = {
    updateUserBehaviorObject: function(ws, req) {
        return new promise(function (resolve, reject) {
            function pushData(clmUrl, options_validate){
                rest.post(clmUrl, options_validate).on('success', function (validate_result, response) {
                    resolve(validate_result);
                }).on('error', function (error) {
                    logger.error(error);
                    reject({"message": error, "status": 401});
                }).on('timeout', function (ms) {
                    logger.error('Did not return within ' + ms + ' ms');
                    reject({"message": "Time out" + error, "status": 504});
                }).on('fail', function (error) {
                    logger.error(error);
                    reject({"message": error, "status": 401});
                });
            }
            var access_token = req.payload.session['session_token'];
            var _cch_id = local_cache.get(access_token + "cch_id");

            var uuid = local_cache.get(access_token + "uuid");
            var header = {
                'Content-Type': 'application/json',
                'X-CloudMine-ApiKey': req.payload.session.api_key,
                'X-CloudMine-SessionToken': local_cache.get(access_token)
            };
            var appid = req.payload.session.app_id;
            var clmUrl = "https://api.cloudmine.io/v1/app/" + appid + "/user/text?extended_responses=true";
            var payload = {};
            if(uuid === undefined) {
                var search_string = '[profile.cch_id = "' + _cch_id + '"]';
                search_local.getUserProfileBasedOnSearchString(ws, search_string).then(function (profileData) {
                    var object_key = Object.keys(profileData);
                    var profile_id = object_key[0];
                    local_cache.set(access_token + "uuid", profile_id);
                    payload[profile_id] = {};
                    payload[profile_id] = req.payload.request.body;
                    var options_validate = {
                        method: "post",
                        data: JSON.stringify(payload),
                        headers: header,
                        timeout: 10000
                    };
                    pushData(clmUrl,options_validate);
                }).catch(function (error) {
                    console.log(error);
                    reject({"message": error, "status": 400});
                });
            }else {
                payload[uuid] = {};
                payload[uuid]["user_behavior"] = req.payload.request.body;
                var options_validate = {
                    method: "post",
                    data: JSON.stringify(payload),
                    headers: header,
                    timeout: 10000
                };
                pushData(clmUrl,options_validate);
            }
        });
    }
};
