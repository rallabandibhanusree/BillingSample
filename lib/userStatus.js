/**
 * Created by makere001c on 4/7/17.
 */
'use strict';
var cloudmine = require('cloudmine');
var rest = require('restler');
var config = require('config');
var local_validate = require('./local_validator');
var search_local = require('./search');
var adminUtility = require('./adminUtility');
var localCache = require("./cache");
var logger = require('./logger_module');
var domain = config.get('cch.domain');
var login = require('./login');
var promise = require('promise');
var responseTimer = require('./responseTimer');


function returnResponse(reply, message, return_code){
    var response = reply({"message": message, "status": return_code});
    response.statusCode = return_code;
    return response;
}

var main = function (req, ws, access_token) {
    return new promise(function (resolve, reject) {
        if (req.payload.request.method === 'PUT') {
            var rejectIfNotExist = false;
            var params_keys = Object.keys(req.payload.request.body);
            if (params_keys.indexOf("request_type") > -1) {
                if (req.payload.request.body["request_type"] == "status_update") {
                    rejectIfNotExist = true;
                }
            }
            //ws.search('[profile.external_id = "' + req.payload.request.body.external_id + '", __class__ = "user"]').on('success', function (searchData) {
         ws.search('[profile.cch_id = "' + req.payload.request.body.cch_id + '" or profile.external_id = "' + req.payload.request.body.external_id + '"]' ).on('success', function (searchData) {
                if (JSON.stringify(searchData) === '{}') {
                    if (rejectIfNotExist) {
                        logger.error("Profile doesn't exist which trying to update");
                        reject({"message": "Profile doesn't exist", "status": 404});
                    }
                } else
                {
                    adminUtility.updateProfileAndLdap(ws, req, searchData, access_token).then(function (updateResult) {
                        resolve({"message": updateResult.message, "status": updateResult.status});
                    }).catch(function (updateResultError) {
                        reject({"message": updateResultError.message, "status": updateResultError.status});
                    })
                }

            }).on('error', function (err) {
                    logger.error(err);
                    reject({"message": err, "status": 400});
                });
        }else if (req.payload.request.method === 'GET') {
            search_local.getUserProfileBasedOnReq(ws, req, access_token).then(function (profileData) {
                var statusObject = {};
                var object_key = Object.keys(profileData);
                var profile_id = object_key[0];
                statusObject = profileData[profile_id]["profile"]["status"];
                resolve({"message": statusObject, "status": 200});
            }).catch(function (error) {
                reject({"message": error.message, "status": error.status});
            });
        }else {
           // logger.error("Method isn't supported");
           // reject({"message": "Not Implemented yet!", "status": 501});
            logger.error("Method Not Allowed");
            reject({"message": "Method Not Allowed", "status": 405});
        }
    });
};

module.exports = function(req, reply) {
    var handler = function () {
        return new Promise(function (resolve, reject) {
            local_validate.validate_req(req) //possibly create your own validator and pass in what you want
                .then(function (result) {
                    var access_token=req.payload.session['session_token'];
                    var ws=localCache.get(access_token+"WS");
                    if(ws !== undefined && ws !== "") {
                        logger.info("No need to create WS object again");
                        main(req, ws, access_token).then(function(result){
                            resolve(result);
                            return returnResponse(reply, result.message, result.status);
                        }).catch(function(error){
                            reject(error);
                            return returnResponse(reply, error.message, error.status);
                        });
                    }else{
                        login.getWS(req).then(function (response_ws) {
                            main(req, response_ws, access_token).then(function(result){
                                resolve(result);
                                return returnResponse(reply, result.message, result.status);
                            }).catch(function(error){
                                reject(error);
                                return returnResponse(reply, error.message, error.status);
                            });
                        }).catch(function (error) {
                            //reject(error);
                            return returnResponse(reply, error.message,error.status);
                        });
                    }
                }).catch(function (error) {
                logger.error(error);
                return returnResponse(reply, error,400);
            });

        }); //end of promise
    }; //end of delegate function

    var callback = function (durationTime, status) {
        logger.info(status + ' => ' + 'It took ' + durationTime + ' milliseconds for the ' + req.payload.request.method + ' call' + ' at this endpoint ' + req.path);
    };
    responseTimer.responseTimeLogger(handler, callback)();
};

