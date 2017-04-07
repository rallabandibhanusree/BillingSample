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
var responseTimer = require('./responseTimer');
//
// Comcast Connected Health
// 2016
//
function returnResponse(reply, message, return_code){
    var response = reply({"message": message, "status": return_code});
    response.statusCode = return_code;
    return response;
}

function ping_logout(req){
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
module.exports = function(req, reply) {
    var handler = function () {
        return new Promise(function (resolve, reject) {
    local_validate.validate_req(req).then(function (result) {
        var access_token = req.payload.session['session_token'];
        var ws = localCache.get(access_token+"WS");

        if(ws !== undefined && ws !== "") {
            logger.info("Logout from CLM");
            ws.logout().on('success', function() {
                localCache.del([access_token, access_token+"WS", access_token + "cch_id", access_token + "external_id", access_token + "member_external_id"], function( err, count ){
                    if( !err ){
                        ping_logout(req).then(function(logout_result){
                            logger.info("Logout successful from CLM and PING");
                            resolve(logout_result);
                            return returnResponse(reply, logout_result.message, logout_result.status);
                        }).catch(function (logout_result_error){
                            logger.info("Logout Error from PING");
                            reject(logout_result_error);
                            return returnResponse(reply, logout_result_error.message, logout_result_error.status);
                        });

                    }else{
                        logger.error("Failed to logout from CLM" + err);
                        reject(logout_result_error);
                        return returnResponse(reply, "Failed to logout CLM", 400);
                    }
                });
            }).on('error', function (error){
                logger.info("Logout Error in CLM" + error);
                reject(logout_result_error);
                return returnResponse(reply, "Failed to logout from CLM" + error, 400);
            });
        } else {
            logger.info("There is nothing in CLM to logout");
            localCache.del([access_token, access_token + "WS", access_token + "cch_id", access_token + "external_id", access_token + "member_external_id"], function (err, count) {
                if (!err) {
                    logger.info("Logout successful In CLM");
                    ping_logout(req).then(function(logout_result){
                        logger.info("Logout successful from CLM and PING");
                        resolve(logout_result);
                        return returnResponse(reply, logout_result.message, logout_result.status);
                    }).catch(function (logout_result_error){
                        logger.info("Logout Error from PING");
                        reject(logout_result_error);
                        return returnResponse(reply, logout_result_error.message, logout_result_error.status);
                    });
                } else {
                    logger.error("Failed to logout" + err);
                    reject(err);
                    return returnResponse(reply, "Failed to logout", 400);
                }
            });
        }
    }).catch(function (error) {
        logger.error(error);
        return returnResponse(reply, error, 400);
    });
        }); //end of promise
    }; //end of delegate function

    var callback = function (durationTime, status) {
        logger.info(status + ' => ' + 'It took ' + durationTime + ' milliseconds for the ' + req.payload.request.method + ' call' + ' at this endpoint ' + req.path);
    }

    responseTimer.responseTimeLogger(handler, callback)();
};