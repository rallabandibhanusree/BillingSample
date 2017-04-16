/**
 * Created by hsingh008c on 12/14/16.
 */

'use strict';
var cloudmine = require('cloudmine');
var rest = require('restler');
var config = require('config');
var local_validate = require('./local_validator');
var localCache = require("./cache");
var logger = require('./logger_module');
var domain = config.get('cch.domain');
var promise = require('promise');
var search_local = require('./search');
var adminUtility = require('./adminUtility');

// Comcast Connected Health
// 2016
//

function returnResponse(reply, message, return_code){
    var response = reply({"message": message, "status": return_code});
    response.statusCode = return_code;
    return response;
}
// After successful login call main function.
var main = function (req, ws, access_token) {
    return new promise(function (resolve, reject) {
        if (req.payload.request.method === 'POST') {
            //Search the record first then add, otherwise Update
            try {
                ws.search('[profile.external_id = "' + req.payload.request.body.external_id + '", __class__ = "user"]').on('success', function (searchData, response) {
                    if (JSON.stringify(searchData) === '{}') {
                        adminUtility.createUserAndProfile(ws, req, searchData, access_token).then(function (createResult) {
                            resolve({"message": createResult.message, "status": createResult.status});
                        }).catch(function (createResultError) {
                            reject({"message": createResultError.message, "status": createResultError.status});
                        });
                    } else {
                        logger.error("User profile already exist");
                        reject({"message": "User profile already exist", "status": 409});
                    }
                }).on("error", function (error) {
                    logger.error("Error searching external_id" + error);
                    reject({"message": "Error searching external_id", "status": 409});
                });
            } catch (error) {
                logger.error("Server Error" + error);
                reject({"message": "Server Error", "status": 500});
            }
        } else if (req.payload.request.method === 'GET') {
            search_local.getUserProfileBasedOnReq(ws, req, access_token).then(function (profileData) {
                resolve({"message": profileData, "status": 200});
            }).catch(function (error) {
                reject({"message": error.message, "status": error.status});
            });
        } else if (req.payload.request.method === 'PUT') {
            var rejectIfNotExist = false;
            var params_keys = Object.keys(req.payload.request.body);
            if (params_keys.indexOf("request_type") > -1) {
                if (req.payload.request.body["request_type"] == "status_update") {
                    rejectIfNotExist = true;
                }
            }
            ws.search('[profile.external_id = "' + req.payload.request.body.external_id + '", __class__ = "user"]').on('success', function (searchData, response) {
                if (JSON.stringify(searchData) === '{}') {
                    if (rejectIfNotExist) {
                        logger.error("Profile doesn't exist which trying to update");
                        reject({"message": "Profile doesn't exist", "status": 404});
                    } else {
                        adminUtility.createUserAndProfile(ws, req, searchData, access_token).then(function (createResult) {
                            resolve({"message": createResult.message, "status": createResult.status});
                        }).catch(function (createResultError) {
                            reject({"message": createResultError.message, "status": createResultError.status});
                        });
                    }
                } else {
                    adminUtility.updateProfileAndLdap(ws, req, searchData, access_token).then(function (updateResult) {
                        resolve({"message": updateResult.message, "status": updateResult.status});
                    }).catch(function (updateResultError) {
                        reject({"message": updateResultError.message, "status": updateResultError.status});
                    });
                }
            }).on('error', function (err) {
                logger.error(err);
                reject({"message": err, "status": 400});
            });
        }else {
            logger.error("Method isn't supported");
            reject({"message": "Not Implemented yet!", "status": 501});
        }
    });
};

module.exports = function(req, reply) {
    local_validate.validate_req(req)
        .then(function (result) {
            var login = require('./login');
            var access_token=req.payload.session['session_token'];
            var ws=localCache.get(access_token+"WS");
            if(ws !== undefined && ws !== "") {
                logger.info("No need to create WS object again");
                main(req, ws, access_token).then(function(result){
                    return returnResponse(reply, result.message, result.status);
                }).catch(function(error){
                    return returnResponse(reply, error.message, error.status);
                });
            }else{
                login.getWS(req).then(function (response_ws) {
                    main(req, response_ws, access_token).then(function(result){
                        return returnResponse(reply, result.message, result.status);
                    }).catch(function(error){
                        return returnResponse(reply, error.message, error.status);
                    });
                }).catch(function (error) {
                    return returnResponse(reply, error.message,error.status);
                });
            }
        }).catch(function (error) {
            logger.error(error);
            return returnResponse(reply, error,400);
        });
};