/**
 * Created by hsingh008c on 2/9/17.
 */

'use strict';
var cloudmine = require('cloudmine');
var config = require('config');
var local_validate = require('./local_validator');
var rest = require('restler');
var localCache = require("./cache");
var logger = require('./logger_module');
var domain = config.get('cch.domain');
var revoke_token_url = config.get('ping.revoke_token');
//
// Comcast Connected Health
// 2016
//
module.exports = function(req, reply) {
    function returnResonse(message, return_code){
        var response = reply({"message": message, "status": return_code});
        response.statusCode = return_code;
        return response;
    }
    function ping_logout(){
        return new Promise(function (resolve, reject) {
            var access_token = req.payload.session['session_token'];
            var header = {
                'Authorization': config.get('ping.authorization')
            };

            var payload_validate = {};
            payload_validate['token_type_hint'] = config.get('ping.token_type');
            payload_validate['token'] = access_token;
            var options_validate = {
                method: "post",
                data: payload_validate,
                headers: header,
                timeout: 10000
            };
            rest.post(revoke_token_url, options_validate).on('success', function (logout_result, response) {
                resolve({"message": "logout successful" + logout_result, "status": 200});
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
        });
    }
    local_validate.validate_req(req).then(function (result) {
        var access_token = req.payload.session['session_token'];
        var ws = localCache.get(access_token+"WS");

        if(ws !== undefined && ws !== "") {
            logger.info("Logout from CLM");
            ws.logout().on('success', function() {
                //returnResonse("Logout successful", 200);
                localCache.del([access_token, access_token+"WS", access_token + "cch_id", access_token + "external_id", access_token + "member_external_id"], function( err, count ){
                    if( !err ){
                        //returnResonse("Logout successful", 200);
                        ping_logout().then(function(logout_result){
                            logger.info("Logout successful from CLM and PING");
                            returnResonse(logout_result.message, logout_result.status);
                        }).catch(function (logout_result_error){
                            logger.info("Logout Error from PING");
                            returnResonse(logout_result_error.message, logout_result_error.status);
                        });

                    }else{
                        logger.error("Failed to logout from CLM" + err);
                        returnResonse("Failed to logout CLM", 400);
                    }
                });
            }).on('error', function (error){
                logger.info("Logout Error in CLM" + error);
                returnResonse("Failed to logout from CLM" + error, 400);
            });
        }else {
            logger.info("There is nothing in CLM to logout");
            //returnResonse("Logout successful", 200);
            localCache.del([access_token, access_token + "WS", access_token + "cch_id", access_token + "external_id", access_token + "member_external_id"], function (err, count) {
                if (!err) {
                    logger.info("Logout successful In CLM");
                    //returnResonse("Logout successful", 200);
                    ping_logout().then(function(logout_result){
                        logger.info("Logout successful from CLM and PING");
                        returnResonse(logout_result.message, logout_result.status);
                    }).catch(function (logout_result_error){
                        logger.info("Logout Error from PING");
                        returnResonse(logout_result_error.message, logout_result_error.status);
                    });
                } else {
                    logger.error("Failed to logout" + err);
                    returnResonse("Failed to logout", 400);
                }
            });
        }
    }).catch(function (error) {
        logger.error(error);
        returnResonse(error, 400);
    });
};